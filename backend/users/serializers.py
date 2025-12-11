from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.exceptions import AuthenticationFailed
from .models import FreelancerProfile, Skill, ClientProfile, PortfolioFile


User = get_user_model()

class EmailTokenObtainSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD 
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Replace username field with email field
        self.fields['email'] = serializers.EmailField(required=True)
        self.fields['password'] = serializers.CharField(write_only=True, required=True)
        # Remove username field if it exists
        self.fields.pop('username', None)

    @classmethod
    def get_token(cls, user):
        return super().get_token(user)

    def validate(self, attrs):
        # Get email and password from the request
        email = attrs.get('email')
        password = attrs.get('password')

        if not email:
            raise AuthenticationFailed('Email is required.')
        
        if not password:
            raise AuthenticationFailed('Password is required.')

        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed('No account found with this email. Please register first.')

        # Verify password
        if not user.check_password(password):
            raise AuthenticationFailed('Invalid password. Please try again.')

        # Check if user is active
        if not user.is_active:
            raise AuthenticationFailed('This account has been disabled.')

        # Generate refresh and access tokens
        refresh = self.get_token(user)

        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }

        return data


# Rest of serializers...
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'slug']

class ClientProfileStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = (
            'company_name',
            'is_verified',
            'projects_posted',
            'active_projects',
            'completed_projects',
            'jobs_posted',
            'active_jobs',
            'completed_jobs',
        )

class UserSerializer(serializers.ModelSerializer):
    profile_complete = serializers.SerializerMethodField()
    client_profile = ClientProfileStatsSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'role',
            'avatar', 'bio', 'location', 'phone', 'birthdate',
            'rating_avg', 'created_at', 'profile_complete', 'client_profile',  
            'notifications_enabled', 
        ]
        read_only_fields = ['id', 'created_at', 'rating_avg']

    def get_profile_complete(self, obj):
        if obj.role == 'freelancer':
            try:
                profile = obj.freelancer_profile
                has_skills = profile.skills.count() > 0
                has_rate = profile.hourly_rate > 0
                has_bio = bool(obj.bio)
                has_portfolio = bool(profile.portfolio)
                return has_skills and has_rate and has_bio and has_portfolio
            except:
                return False
        return True


class PortfolioFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PortfolioFile
        fields = ['id', 'file', 'file_name', 'file_size', 'file_url', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at', 'file_url']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None


class FreelancerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        write_only=True,
        many=True,
        source='skills',
        required=False
    )
    portfolio_files = PortfolioFileSerializer(many=True, read_only=True)

    class Meta:
        model = FreelancerProfile
        fields = [
            'user', 'hourly_rate', 'skills', 'skill_ids', 'availability',
            'resume_file', 'portfolio', 'intro_video_url', 'social_links',
            'total_earnings', 'projects_completed', 'created_at',
            'category', 'custom_category', 'role_title', 'languages', 
            'experiences', 'education', 'portfolio_files'
        ]
    # NOTE: read_only_fields kept same as before
        read_only_fields = ['created_at', 'total_earnings', 'projects_completed', 'portfolio_files']


class ClientProfileMeSerializer(serializers.ModelSerializer):
    """
    Extended client profile serializer that also exposes and updates
    basic User fields so the frontend can hit /profiles/client/me/
    once and send everything.
    """
    # ---- User-related fields (from the linked User model) ----
    first_name = serializers.CharField(
        source='user.first_name', required=False, allow_blank=True
    )
    last_name = serializers.CharField(
        source='user.last_name', required=False, allow_blank=True
    )
    email = serializers.EmailField(
        source='user.email', read_only=True
    )
    avatar = serializers.ImageField(
        source='user.avatar', required=False, allow_null=True
    )
    bio = serializers.CharField(
        source='user.bio', required=False, allow_blank=True
    )
    location = serializers.CharField(
        source='user.location', required=False, allow_blank=True
    )
    phone = serializers.CharField(
        source='user.phone', required=False, allow_blank=True
    )
    birthdate = serializers.DateField(
        source='user.birthdate', required=False, allow_null=True
    )

    # ---- Existing client-profile-specific bits ----
    id_document_url = serializers.SerializerMethodField()

    class Meta:
        model = ClientProfile
        fields = (
            # user-level fields
            "first_name", "last_name", "email", "avatar",
            "bio", "location", "phone", "birthdate",
            # client-profile fields
            "company_name", "company_website", "id_document",
            "id_document_url", "is_verified", "verification_submitted_at",
            "projects_posted", "active_projects","completed_projects",
            "jobs_posted", "active_jobs", "completed_jobs",
        )
        read_only_fields = (
            "email", "is_verified", "verification_submitted_at",
            "projects_posted", "active_projects", "completed_projects",
            "jobs_posted", "active_jobs", "completed_jobs",
        )

    def get_id_document_url(self, obj):
        request = self.context.get('request')
        if obj.id_document:
            return request.build_absolute_uri(obj.id_document.url) if request else obj.id_document.url
        return None

    def update(self, instance, validated_data):
        """
        Handle updates for both the related User object and the ClientProfile.
        validated_data will look like:
        {
            'user': {
                'first_name': '...',
                'last_name': '...',
                'avatar': <InMemoryUploadedFile or None>,
                'bio': '...',
                'location': '...',
                'phone': '...',
                'birthdate': date or None,
            },
            'company_name': '...',
            'company_website': '...',
            'id_document': <InMemoryUploadedFile or None>,
            ...
        }
        """
        # Extract nested user data if present
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Apply user field updates
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()

        # Keep your existing ID document stamping logic
        if 'id_document' in validated_data and validated_data['id_document'] is not None:
            instance.verification_submitted_at = timezone.now()
            instance.is_verified = False  # stays pending until admin approves

        # Let ModelSerializer handle the rest of ClientProfile fields
        return super().update(instance, validated_data)


# Keep alias as before
ClientProfileSerializer = ClientProfileMeSerializer


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password2', 'role']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate(self, data):
        if data.get('password') != data.get('password2'):
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        # Auto-create profile based on role
        if user.role == 'freelancer':
            FreelancerProfile.objects.create(user=user, hourly_rate=0)
        elif user.role == 'client':
            ClientProfile.objects.create(user=user)
        
        return user
