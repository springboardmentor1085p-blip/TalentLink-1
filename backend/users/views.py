from rest_framework import viewsets, permissions, parsers, response, status, filters, serializers  # ✅ added serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView  # ✅ added
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from .models import FreelancerProfile, Skill, ClientProfile, PortfolioFile, ContactMessage  # ✅ added ContactMessage
from .serializers import (
    UserSerializer, FreelancerProfileSerializer, UserRegistrationSerializer, 
    SkillSerializer, EmailTokenObtainSerializer, ClientProfileSerializer, PortfolioFileSerializer
)

from django.db import transaction

from projects.models import Project
from proposals.models import Proposal
from contracts.models import Contract, Review
from jobs.models import Job, JobAttachment, JobApplication, JobApplicationAttachment
from messaging.models import Message
 

from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator as token_generator
from django.conf import settings

from .models import User  # or your AUTH_USER_MODEL import if different


User = get_user_model()

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
   
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        """
        Filter users based on query parameters.
        Supports role, search, location, and min_rating filters.
        """
        queryset = User.objects.all()
        
        # Filter by role (e.g., role=client)
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        
        # Search by name, email, or bio
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(bio__icontains=search)
            )
        
        # Filter by location
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            try:
                queryset = queryset.filter(rating_avg__gte=float(min_rating))
            except ValueError:
                pass
        
        # Filter verified clients only
        verified = self.request.query_params.get('verified')
        if verified == 'true':
            queryset = queryset.filter(
                role='client',
                client_profile__is_verified=True
            )
        
        # Filter by minimum projects for clients
        min_projects = self.request.query_params.get('min_projects')
        if min_projects:
            try:
                queryset = queryset.filter(
                    role='client',
                    client_profile__projects_posted__gte=int(min_projects)
                )
            except ValueError:
                pass
        
        return queryset.distinct()

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def upload_resume(self, request):
        try:
            profile = request.user.freelancer_profile
            if 'resume' in request.FILES:
                profile.resume_file = request.FILES['resume']
                profile.save()
                return Response({'detail': 'Resume uploaded successfully.'}, status=status.HTTP_200_OK)
        except FreelancerProfile.DoesNotExist:
            return Response({'detail': 'Freelancer profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response({'detail': 'No resume file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        url_path='forgot-password'
    )


    def forgot_password(self, request):
        """
        Step 1: User submits email, we send a reset link with uid+token.
        """
        email = request.data.get('email')

        if not email:
            return Response({"error": "Email is required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # For security you *could* return generic message,
            # but following your teammate we return explicit error.
            return Response({"error": "No user found with this email"}, status=404)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)

        reset_link = f"http://localhost:5173/reset-password?uid={uid}&token={token}"
        # if you prefer to use a configurable URL:
        # frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        # reset_link = f"{frontend_url}/reset-password?uid={uid}&token={token}"

        send_mail(
            subject="Reset your TalentLink password",
            message=f"Click this link to reset your password: {reset_link}",
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@talentlink.com"),
            recipient_list=[email],
            fail_silently=True,
        )

        return Response({"message": "Password reset link sent"}, status=200)

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[AllowAny],
        url_path='reset-password'
    )
    def reset_password(self, request):
        """
        Step 2: User posts uid, token, and new_password to actually reset.
        NOTE: Token validation is skipped (as in your teammate’s flow).
        """
        uid = request.data.get("uid")
        token = request.data.get("token")  # currently unused, included for future validation
        new_password = request.data.get("new_password")

        if not uid:
            return Response({"error": "UID is required"}, status=400)
        if not new_password:
            return Response({"error": "New password is required"}, status=400)

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"error": "Invalid UID"}, status=400)

        # 🔐 No token validation for now, exactly like your teammate's code.
        user.set_password(new_password)
        user.save()

        return Response({"message": "Password reset successful"}, status=200)
    
    @action(
        detail=False,
        methods=['delete'],
        permission_classes=[IsAuthenticated],
        url_path='delete-account'
    )
    def delete_account(self, request):
        """
        Permanently delete the authenticated user's account and all related data.
        """
        user = request.user

        with transaction.atomic():
            # ----------------------
            # Freelancer profile and portfolio files
            # ----------------------
            if hasattr(user, 'freelancer_profile'):
                profile = user.freelancer_profile
                profile.portfolio_files.all().delete()
                profile.delete()

            # ----------------------
            # Client profile
            # ----------------------
            if hasattr(user, 'client_profile'):
                user.client_profile.delete()

            # ----------------------
            # Projects (if client)
            # ----------------------
            Project.objects.filter(client=user).delete()

            # ----------------------
            # Proposals (if freelancer)
            # ----------------------
            Proposal.objects.filter(freelancer=user).delete()

            # ----------------------
            # Contracts and reviews
            # ----------------------
            Contract.objects.filter(proposal__freelancer=user).delete()
            Review.objects.filter(reviewer=user).delete()
            Review.objects.filter(reviewee=user).delete()

            # ----------------------
            # Jobs posted (client) and applications (freelancer)
            # ----------------------
            JobAttachment.objects.filter(job__client=user).delete()
            Job.objects.filter(client=user).delete()

            JobApplicationAttachment.objects.filter(application__freelancer=user).delete()
            JobApplication.objects.filter(freelancer=user).delete()

            # ----------------------
            # Messages and Conversations
            # ----------------------
            Message.objects.filter(sender=user).delete()
            Message.objects.filter(recipient=user).delete()

            # Delete conversations that only have this user left
            for convo in user.conversations.all():
                if convo.participants.count() <= 1:
                    convo.delete()

            # ----------------------
            # Notifications (reverse relation)
            # ----------------------
            user.notifications.all().delete()

            # ----------------------
            # Finally delete the user
            # ----------------------
            user.delete()

        return Response(
            {"message": "Your account and all associated data have been deleted successfully."},
            status=status.HTTP_200_OK
        )

class FreelancerProfileViewSet(viewsets.ModelViewSet):
    queryset = FreelancerProfile.objects.all()
    serializer_class = FreelancerProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['availability']
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'skills__name', 'role_title', 'portfolio']
    ordering_fields = ['user__rating_avg', 'hourly_rate', 'user__created_at', 'projects_completed']
    ordering = ['-user__rating_avg', '-user__created_at']
    
    def get_permissions(self):
        """Allow public access to list action, require auth for others"""
        if self.action == 'list':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Enhanced filtering for freelancer profiles"""
        queryset = FreelancerProfile.objects.select_related('user').prefetch_related('skills').all()
        
        # Location filter
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(user__location__icontains=location)
        
        # Rating filters
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            try:
                min_rating = float(min_rating)
                queryset = queryset.filter(user__rating_avg__gte=min_rating)
            except ValueError:
                pass
        
        # Top rated filter (4.5+)
        top_rated = self.request.query_params.get('top_rated', None)
        if top_rated == 'true':
            queryset = queryset.filter(user__rating_avg__gte=4.5)
        
        # Rising talent (new users with projects)
        rising_talent = self.request.query_params.get('rising_talent', None)
        if rising_talent == 'true':
            queryset = queryset.filter(projects_completed__lte=5, projects_completed__gt=0)
        
        # Hourly rate filters
        min_rate = self.request.query_params.get('min_rate', None)
        max_rate = self.request.query_params.get('max_rate', None)
        if min_rate:
            try:
                min_rate = float(min_rate)
                queryset = queryset.filter(hourly_rate__gte=min_rate)
            except ValueError:
                pass
        if max_rate:
            try:
                max_rate = float(max_rate)
                queryset = queryset.filter(hourly_rate__lte=max_rate)
            except ValueError:
                pass
        
        # Experience level (based on projects completed)
        experience_level = self.request.query_params.get('experience_level', None)
        if experience_level == 'entry':
            queryset = queryset.filter(projects_completed__lt=5)
        elif experience_level == 'intermediate':
            queryset = queryset.filter(projects_completed__gte=5, projects_completed__lt=20)
        elif experience_level == 'expert':
            queryset = queryset.filter(projects_completed__gte=20)
        
        # Skill filter
        skill_id = self.request.query_params.get('skill', None)
        if skill_id:
            queryset = queryset.filter(skills__id=skill_id)
        
        # Project success rate (using rating as proxy)
        success_rate = self.request.query_params.get('success_rate', None)
        if success_rate:
            try:
                rate = float(success_rate)
                # Convert percentage to rating (e.g., 90% = 4.5 stars)
                min_rating_from_success = (rate / 100) * 5
                queryset = queryset.filter(user__rating_avg__gte=min_rating_from_success)
            except ValueError:
                pass
        
        return queryset.distinct()

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        try:
            profile = request.user.freelancer_profile
        except FreelancerProfile.DoesNotExist:
            return Response(
                {'detail': 'Freelancer profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if request.method in ['PUT', 'PATCH']:
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='me/upload-portfolio-files')
    def upload_portfolio_files(self, request):
        """
        Upload multiple portfolio files (max 5 total)
        Accepts files as: portfolio_file_0, portfolio_file_1, etc.
        """
        try:
            profile = request.user.freelancer_profile
        except FreelancerProfile.DoesNotExist:
            return Response(
                {'detail': 'Freelancer profile not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check current file count
        current_count = profile.portfolio_files.count()
        if current_count >= 5:
            return Response(
                {'detail': 'Maximum 5 portfolio files allowed. Please delete some files first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_files = []
        errors = []
        
        # Process files from request
        for key in request.FILES:
            if current_count + len(uploaded_files) >= 5:
                errors.append(f'Skipping {key}: Maximum 5 files limit reached')
                continue
            
            file = request.FILES[key]
            
            # Validate file size (10MB limit)
            if file.size > 10 * 1024 * 1024:
                errors.append(f'{file.name}: File size exceeds 10MB')
                continue
            
            # Create portfolio file
            portfolio_file = PortfolioFile.objects.create(
                freelancer_profile=profile,
                file=file,
                file_name=file.name,
                file_size=file.size
            )
            uploaded_files.append(portfolio_file)
        
        if not uploaded_files and errors:
            return Response(
                {'detail': 'No files uploaded', 'errors': errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = PortfolioFileSerializer(
            uploaded_files, 
            many=True, 
            context={'request': request}
        )
        
        response_data = {
            'uploaded': serializer.data,
            'count': len(uploaded_files)
        }
        
        if errors:
            response_data['warnings'] = errors
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['delete'], url_path='me/delete-portfolio-file/(?P<file_id>[^/.]+)')
    def delete_portfolio_file(self, request, file_id=None):
        """Delete a specific portfolio file"""
        try:
            profile = request.user.freelancer_profile
            portfolio_file = PortfolioFile.objects.get(
                id=file_id, 
                freelancer_profile=profile
            )
            portfolio_file.file.delete()  # Delete actual file
            portfolio_file.delete()  # Delete database record
            return Response(
                {'detail': 'File deleted successfully'},
                status=status.HTTP_200_OK
            )
        except PortfolioFile.DoesNotExist:
            return Response(
                {'detail': 'File not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
class ClientProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ClientProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_queryset(self):
        # Only my profile
        return ClientProfile.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request, *args, **kwargs):
        obj = ClientProfile.objects.get(user=request.user)
        if request.method.lower() == 'get':
            return response.Response(self.get_serializer(obj).data)
        serializer = self.get_serializer(obj, data=request.data, partial=(request.method.lower() == 'patch'))
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request, *args, **kwargs):
        return self.me(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        return self.me(request, *args, **kwargs)
class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'message', 'created_at']

# API View
class ContactMessageView(APIView):
    permission_classes = [permissions.AllowAny]  # <--- Allow public access

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            contact = serializer.save()

            # Send email to company
            try:
                send_mail(
                    subject=f"New Contact Message from {contact.name}",
                    message=f"Name: {contact.name}\nEmail: {contact.email}\n\nMessage:\n{contact.message}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.DEFAULT_FROM_EMAIL],  # TalentLink email
                    fail_silently=False,
                )
            except Exception as e:
                return Response(
                    {"error": f"Message saved but failed to send email: {str(e)}"},
                    status=500
                )

            return Response(
                {"message": "Contact message sent successfully."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Skill.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset.order_by('name')
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_custom(self, request):
        """Allow users to create custom skills if they don't exist"""
        skill_name = request.data.get('name', '').strip()
        
        if not skill_name:
            return Response(
                {'detail': 'Skill name is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(skill_name) < 2:
            return Response(
                {'detail': 'Skill name must be at least 2 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(skill_name) > 50:
            return Response(
                {'detail': 'Skill name must be less than 50 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        existing_skill = Skill.objects.filter(name__iexact=skill_name).first()
        if existing_skill:
            return Response(
                SkillSerializer(existing_skill).data,
                status=status.HTTP_200_OK
            )
        
        # Create new skill
        slug = slugify(skill_name)
        
        # Ensure unique slug
        base_slug = slug
        counter = 1
        while Skill.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        skill = Skill.objects.create(name=skill_name, slug=slug)
        
        return Response(
            SkillSerializer(skill).data,
            status=status.HTTP_201_CREATED
        )