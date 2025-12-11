from django.db.models import Q, Avg
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import filters
from rest_framework.exceptions import PermissionDenied, ValidationError  # ✅ NEW
from .models import Contract, Review, ReviewResponse
from .serializers import (
    ContractSerializer, 
    ReviewSerializer, 
    PlatformReviewCreateSerializer,
    ExternalReviewCreateSerializer,
    ReviewResponseSerializer
)
from notifications.models import Notification


class ContractViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Contracts between clients and freelancers.
    Supports signing, activating, and completing contracts.
    """
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Contract.objects.filter(
            Q(client=user) | Q(freelancer=user)
        ).select_related(
            'proposal', 'proposal__project',
            'job_application', 'job_application__job',
            'client', 'freelancer'
        ).prefetch_related(
            'reviews', 'reviews__reviewer'
        ).order_by('-created_at')

        print(f"[Contracts] User: {user.email}, Count: {queryset.count()}")
        return queryset

    # ✅ NEW: centralised edit permission checks
    def _check_edit_permissions(self, request, contract):
        """
        Only the client can edit contract terms/payment/attachment,
        and only while the contract is still unsigned by both parties.
        """
        user = request.user
        if user != contract.client:
            raise PermissionDenied("Only the client can update contract terms.")
        if contract.client_signed or contract.freelancer_signed:
            raise ValidationError("Contract can no longer be edited after it has been signed.")

    # ✅ apply checks for both PUT and PATCH
    def update(self, request, *args, **kwargs):
        contract = self.get_object()
        self._check_edit_permissions(request, contract)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        contract = self.get_object()
        self._check_edit_permissions(request, contract)
        return super().partial_update(request, *args, **kwargs)

    # ============================================================
    # SIGN CONTRACT
    # ============================================================
    @action(detail=True, methods=['post'])
    def sign(self, request, pk=None):
        """
        Allow client or freelancer to sign a contract.
        Automatically activates once both sign.
        """
        contract = self.get_object()
        user = request.user

        # Determine if user is client or freelancer
        if user == contract.client:
            if contract.client_signed:
                return Response({'detail': 'Client already signed.'}, status=status.HTTP_400_BAD_REQUEST)
            contract.client_signed = True
            signer_role = 'Client'
        elif user == contract.freelancer:
            if contract.freelancer_signed:
                return Response({'detail': 'Freelancer already signed.'}, status=status.HTTP_400_BAD_REQUEST)
            contract.freelancer_signed = True
            signer_role = 'Freelancer'
        else:
            return Response({'detail': 'You are not authorized to sign this contract.'},
                            status=status.HTTP_403_FORBIDDEN)

        contract.save()
        contract.activate_if_signed()

        # Notify other party
        other_party = contract.freelancer if user == contract.client else contract.client
        Notification.objects.create(
            user=other_party,
            type='CONTRACT',
            title='Contract Signed',
            message=f'{signer_role} has signed the contract for "{contract}".',
            metadata={'contract_id': contract.id}
        )

        if contract.status == 'active':
            Notification.objects.create(
                user=contract.client,
                type='CONTRACT',
                title='Contract Active',
                message=f'Contract "{contract}" is now active!'
            )
            Notification.objects.create(
                user=contract.freelancer,
                type='CONTRACT',
                title='Contract Active',
                message=f'Contract "{contract}" is now active! You can start working.'
            )

        return Response({
            'detail': f'{signer_role} signed successfully.',
            'contract': ContractSerializer(contract).data
        }, status=status.HTTP_200_OK)

    # ============================================================
    # COMPLETE CONTRACT
    # ============================================================
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Client marks the contract as completed.
        Automatically updates related project/job.
        """
        contract = self.get_object()
        user = request.user

        if user != contract.client:
            return Response({'detail': 'Only the client can complete the contract.'},
                            status=status.HTTP_403_FORBIDDEN)

        if contract.status == 'completed':
            return Response({'detail': 'Contract already completed.'},
                            status=status.HTTP_400_BAD_REQUEST)

        contract.status = 'completed'
        contract.save()

        # Update related entities
        if contract.proposal and contract.proposal.project:
            project = contract.proposal.project
            project.status = 'completed'
            project.save()
        elif contract.job_application and contract.job_application.job:
            job = contract.job_application.job
            job.status = 'completed'
            job.save()

        # Notify freelancer
        Notification.objects.create(
            user=contract.freelancer,
            type='CONTRACT',
            title='Contract Completed',
            message=f'The contract "{contract}" has been marked as completed by the client.',
            metadata={'contract_id': contract.id}
        )

        return Response({'detail': 'Contract marked as completed successfully.'},
                        status=status.HTTP_200_OK)

# ============================================================
# REVIEW VIEWSET (Enhanced)
# ============================================================
class ReviewViewSet(viewsets.ModelViewSet):
    """
    Handles creation and viewing of reviews.
    Supports both platform reviews (from contracts) and external reviews.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            # Determine review type from request data
            review_type = self.request.data.get('review_type', 'platform')
            if review_type == 'external':
                return ExternalReviewCreateSerializer
            return PlatformReviewCreateSerializer
        return ReviewSerializer

    def get_queryset(self):
        """Return reviews given or received by the user"""
        user = self.request.user
        queryset = Review.objects.filter(
            Q(reviewer=user) | Q(reviewee=user)
        ).select_related('contract', 'reviewer', 'reviewee', 'response')

        # Filter by review type
        review_type = self.request.query_params.get('review_type')
        if review_type:
            queryset = queryset.filter(review_type=review_type)

        # Filter by verification status
        verified = self.request.query_params.get('verified')
        if verified is not None:
            queryset = queryset.filter(is_verified=verified.lower() == 'true')

        return queryset

    def create(self, request, *args, **kwargs):
        """Create a review (platform or external)"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        # Send notification for platform reviews
        if review.review_type == 'platform' and review.reviewee:
            Notification.objects.create(
                user=review.reviewee,
                type='REVIEW',
                title='New Review Received',
                message=f'You received a {review.rating}-star review from {review.reviewer.get_full_name() or review.reviewer.username}.',
                metadata={'review_id': review.id}
            )
            # ✅ Recalculate the reviewee's main rating from platform reviews
            review.update_reviewee_rating()
        
        # For external reviews, send verification email
        elif review.review_type == 'external':
            # TODO: Send verification email
            pass

        return Response(
            ReviewSerializer(review, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def for_user(self, request):
        """Get all verified reviews for a specific user (public endpoint)"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'detail': 'user_id parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # 🔹 NEW: optional filter by review_type = 'platform' / 'external'
        review_type = request.query_params.get('review_type')
        
        reviews = Review.objects.filter(
            reviewee=user,
            is_verified=True
        ).select_related('reviewer', 'reviewee', 'response').order_by('-created_at')

        if review_type in ['platform', 'external']:
            reviews = reviews.filter(review_type=review_type)

        # Pagination
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = ReviewSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Add a response to a review (only reviewee can respond)"""
        review = self.get_object()
        
        if review.reviewee != request.user:
            return Response(
                {'detail': 'Only the reviewee can respond to this review.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if response already exists
        if hasattr(review, 'response'):
            return Response(
                {'detail': 'You have already responded to this review.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = ReviewResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response = serializer.save(review=review)

        return Response(
            ReviewResponseSerializer(response).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def verify(self, request, pk=None):
        """Verify an external review using the verification token"""
        review = self.get_object()
        
        if review.review_type != 'external':
            return Response(
                {'detail': 'Only external reviews need verification.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if review.is_verified:
            return Response(
                {'detail': 'Review is already verified.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = request.data.get('token')
        if not token or token != review.verification_token:
            return Response(
                {'detail': 'Invalid verification token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        review.is_verified = True
        review.verified_at = timezone.now()
        review.save()

        # Update reviewee's rating
        review.update_reviewee_rating()

        # Notify reviewee
        Notification.objects.create(
            user=review.reviewee,
            type='REVIEW',
            title='External Review Verified',
            message=f'A {review.rating}-star external review from {review.reviewer_name} has been verified.',
            metadata={'review_id': review.id}
        )

        return Response({
            'detail': 'Review verified successfully.',
            'review': ReviewSerializer(review, context={'request': request}).data
        }, status=status.HTTP_200_OK)


# ============================================================
# REVIEW STATISTICS
# ============================================================
class ReviewStatsView(viewsets.ViewSet):
    """Get review statistics for a user"""
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'])
    def for_user(self, request):
        """Get review stats for a specific user"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {'detail': 'user_id parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Only platform reviews contribute to main rating & distribution
        platform_reviews = Review.objects.filter(
            reviewee=user,
            is_verified=True,
            review_type='platform',
        )

        # ✅ Count external reviews separately (they're testimonials / marketing only)
        external_reviews = Review.objects.filter(
            reviewee=user,
            is_verified=True,
            review_type='external',
        )

        # ✅ Compute average directly from platform reviews
        avg_data = platform_reviews.aggregate(avg_rating=Avg('rating'))
        average_rating = avg_data['avg_rating'] or 0.0

        # Optional: keep user.rating_avg in sync if the field exists
        if hasattr(user, 'rating_avg'):
            if user.rating_avg != average_rating:
                user.rating_avg = average_rating
                user.save(update_fields=['rating_avg'])

        stats = {
            'total_reviews': platform_reviews.count(),
            'average_rating': average_rating,
            'rating_distribution': {
                '5': platform_reviews.filter(rating=5).count(),
                '4': platform_reviews.filter(rating=4).count(),
                '3': platform_reviews.filter(rating=3).count(),
                '2': platform_reviews.filter(rating=2).count(),
                '1': platform_reviews.filter(rating=1).count(),
            },
            'platform_reviews': platform_reviews.count(),
            'external_reviews': external_reviews.count(),
        }

        return Response(stats)
