from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Contract, Review, ReviewResponse
import secrets
from django.utils import timezone

User = get_user_model()


class ContractSerializer(serializers.ModelSerializer):
    # ============================================================
    # DYNAMIC READ-ONLY FIELDS (job + proposal support)
    # ============================================================
    job_title = serializers.SerializerMethodField()
    project_title = serializers.SerializerMethodField()
    client_name = serializers.SerializerMethodField()
    freelancer_name = serializers.SerializerMethodField()
    has_client_reviewed = serializers.SerializerMethodField()
    has_freelancer_reviewed = serializers.SerializerMethodField()
    client_can_review = serializers.SerializerMethodField()
    freelancer_can_review = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = [
            'id',
            'client',
            'freelancer',
            'proposal',
            'job_application',
            'job_title',
            'project_title',
            'client_name',
            'freelancer_name',
            'client_signed',
            'freelancer_signed',
            'start_date',
            'end_date',
            'status',
            'terms',
            'payment_terms',
            'attachment',      # ✅ NEW: attachment exposed
            'created_at',
            'has_client_reviewed',
            'has_freelancer_reviewed',
            'client_can_review',
            'freelancer_can_review'
        ]
        read_only_fields = ['client', 'freelancer', 'created_at']

    def get_job_title(self, obj):
        """Return job title if contract is from a job application"""
        if obj.job_application and obj.job_application.job:
            return obj.job_application.job.title
        return None

    def get_project_title(self, obj):
        """Return project title if contract is from a proposal"""
        if obj.proposal and obj.proposal.project:
            return obj.proposal.project.title
        return None

    def get_client_name(self, obj):
        """Return client name for both job or project contracts"""
        try:
            if obj.client:
                return obj.client.get_full_name() or obj.client.username
        except Exception:
            pass
        return None

    def get_freelancer_name(self, obj):
        """Return freelancer name for both job or project contracts"""
        try:
            if obj.freelancer:
                return obj.freelancer.get_full_name() or obj.freelancer.username
        except Exception:
            pass
        return None

    def _has_user_reviewed(self, obj, user_id):
        if not user_id:
            return False

        prefetched = getattr(obj, '_prefetched_objects_cache', {}).get('reviews')
        if prefetched is not None:
            return any(
                review.review_type == 'platform' and review.reviewer_id == user_id
                for review in prefetched
            )

        return obj.reviews.filter(
            reviewer_id=user_id,
            review_type='platform'
        ).exists()

    def get_has_client_reviewed(self, obj):
        return self._has_user_reviewed(obj, obj.client_id)

    def get_has_freelancer_reviewed(self, obj):
        return self._has_user_reviewed(obj, obj.freelancer_id)

    def get_client_can_review(self, obj):
        return (
            obj.status == 'completed'
            and obj.client_id
            and obj.freelancer_id
            and not self.get_has_client_reviewed(obj)
        )

    def get_freelancer_can_review(self, obj):
        return (
            obj.status == 'completed'
            and obj.client_id
            and obj.freelancer_id
            and not self.get_has_freelancer_reviewed(obj)
        )

    def update(self, instance, validated_data):
        """
        Prevent users from changing status / signatures via generic update.
        Status changes & signing are handled only via dedicated actions.
        """
        validated_data.pop('status', None)
        validated_data.pop('client_signed', None)
        validated_data.pop('freelancer_signed', None)
        return super().update(instance, validated_data)


# ============================================================
# REVIEW RESPONSE SERIALIZER
# ============================================================
class ReviewResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewResponse
        fields = ['id', 'response_text', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


# ============================================================
# REVIEW SERIALIZER (Enhanced)
# ============================================================
class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name_display = serializers.SerializerMethodField()
    reviewee_name = serializers.CharField(source='reviewee.get_full_name', read_only=True)
    reviewee_email = serializers.EmailField(source='reviewee.email', read_only=True)
    reviewee_avatar = serializers.SerializerMethodField()
    contract_title = serializers.SerializerMethodField()
    response = ReviewResponseSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'contract',
            'contract_title',
            'reviewer',
            'reviewer_name_display',
            'reviewee',
            'reviewee_name',
            'reviewee_email',
            'reviewee_avatar',
            'reviewer_name',
            'reviewer_email',
            'reviewer_company',
            'review_type',
            'rating',
            'comment',
            'project_title',
            'work_period',
            'is_verified',
            'verified_at',
            'response',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['reviewer', 'created_at', 'updated_at', 'is_verified', 'verified_at']

    def get_reviewer_name_display(self, obj):
        """Return reviewer name (either user's name or external name)"""
        if obj.reviewer:
            return obj.reviewer.get_full_name() or obj.reviewer.username
        return obj.reviewer_name or 'Anonymous'

    def get_reviewee_avatar(self, obj):
        """Return reviewee's avatar URL"""
        if obj.reviewee and obj.reviewee.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.reviewee.avatar.url)
            return obj.reviewee.avatar.url
        return None

    def get_contract_title(self, obj):
        """Show human-friendly title for review"""
        if obj.contract:
            if obj.contract.job_application and obj.contract.job_application.job:
                return obj.contract.job_application.job.title
            elif obj.contract.proposal and obj.contract.proposal.project:
                return obj.contract.proposal.project.title
            return f"Contract #{obj.contract.id}"
        return obj.project_title or "External Project"


# ============================================================
# EXTERNAL REVIEW CREATE SERIALIZER
# ============================================================
class ExternalReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating external reviews"""
    reviewee_email = serializers.EmailField(write_only=True, help_text="Email of the person to review")

    class Meta:
        model = Review
        fields = [
            'reviewee_email',
            'reviewer_name',
            'reviewer_email',
            'reviewer_company',
            'rating',
            'comment',
            'project_title',
            'work_period'
        ]

    def validate_reviewee_email(self, value):
        """Check if reviewee exists"""
        try:
            User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address.")
        return value

    def validate_rating(self, value):
        """Validate rating is between 1-5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def create(self, validated_data):
        reviewee_email = validated_data.pop('reviewee_email')
        reviewee = User.objects.get(email=reviewee_email)

        verification_token = secrets.token_urlsafe(32)

        review = Review.objects.create(
            reviewee=reviewee,
            review_type='external',
            verification_token=verification_token,
            is_verified=True,              # ✅ show immediately
            verified_at=timezone.now(),    # ✅ set timestamp
            **validated_data
        )
        return review


# ============================================================
# PLATFORM REVIEW CREATE SERIALIZER
# ============================================================
class PlatformReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating platform reviews after contract completion"""
    
    class Meta:
        model = Review
        fields = ['contract', 'rating', 'comment']

    def validate_contract(self, value):
        """Validate contract is completed and user is part of it"""
        if value.status != 'completed':
            raise serializers.ValidationError("You can only review completed contracts.")
        return value

    def validate(self, data):
        """Additional validation"""
        contract = data['contract']
        request = self.context.get('request')
        
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required.")

        user = request.user

        # Check if user is part of the contract
        if user != contract.client and user != contract.freelancer:
            raise serializers.ValidationError("You are not part of this contract.")

        # Check if user already reviewed
        if Review.objects.filter(contract=contract, reviewer=user).exists():
            raise serializers.ValidationError("You have already reviewed this contract.")

        return data

    def create(self, validated_data):
        """Create platform review"""
        request = self.context.get('request')
        data = validated_data.copy()
        contract = data.pop('contract')
        
        # Determine reviewee
        if request.user == contract.client:
            reviewee = contract.freelancer
        else:
            reviewee = contract.client

        review = Review.objects.create(
            contract=contract,
            reviewer=request.user,
            reviewee=reviewee,
            review_type='platform',
            is_verified=True,  # Platform reviews are auto-verified
            **data
        )

        return review
