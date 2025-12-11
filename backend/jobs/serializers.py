# backend/jobs/serializers.py
from rest_framework import serializers
from .models import Job, JobAttachment
from .models import JobApplication, JobApplicationAttachment


class JobAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = JobAttachment
        fields = ('id', 'file_url', 'original_name', 'size', 'uploaded_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj or not getattr(obj, "file", None):
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class JobSerializer(serializers.ModelSerializer):
    """
    Accept file uploads under 'attachments' key (max 2).
    """
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    file_attachments = JobAttachmentSerializer(source='attachments', many=True, read_only=True)

    class Meta:
        model = Job
        fields = [
            'id', 'client', 'client_name',
            'title', 'description', 'job_type',
            'experience_level', 'location_type', 'location',
            'hourly_min', 'hourly_max', 'fixed_amount',
            'status', 'visibility', 'created_at', 'updated_at',
            'file_attachments',
        ]
        read_only_fields = ['client', 'created_at', 'updated_at', 'status']

    def validate(self, attrs):
        job_type = attrs.get('job_type', getattr(self.instance, 'job_type', 'hourly'))

        # FIX: Ensure integer conversion and validate
        if job_type == 'hourly':
            hourly_min = attrs.get('hourly_min', getattr(self.instance, 'hourly_min', None))
            hourly_max = attrs.get('hourly_max', getattr(self.instance, 'hourly_max', None))
            
            if hourly_min is not None:
                hourly_min = int(hourly_min)
                attrs['hourly_min'] = hourly_min
            if hourly_max is not None:
                hourly_max = int(hourly_max)
                attrs['hourly_max'] = hourly_max
                
            if not hourly_min or not hourly_max:
                raise serializers.ValidationError({
                    'hourly_rate': 'Both minimum and maximum hourly rates are required for hourly jobs'
                })
            if hourly_min >= hourly_max:
                raise serializers.ValidationError({
                    'hourly_rate': 'Maximum hourly rate must be greater than minimum'
                })
                
        elif job_type == 'fixed':
            fixed_amount = attrs.get('fixed_amount', getattr(self.instance, 'fixed_amount', None))
            if fixed_amount is not None:
                fixed_amount = int(fixed_amount)
                attrs['fixed_amount'] = fixed_amount
                
            if not fixed_amount or fixed_amount <= 0:
                raise serializers.ValidationError({
                    'fixed_amount': 'A valid fixed amount is required for fixed price jobs'
                })

        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        job = Job.objects.create(**validated_data)

        files = request.FILES.getlist('attachments') if request else []
        for f in files[:2]:
            JobAttachment.objects.create(
                job=job,
                file=f,
                original_name=getattr(f, 'name', ''),
                size=getattr(f, 'size', 0)
            )
        return job

    def update(self, instance, validated_data):
        request = self.context.get('request')

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        files = request.FILES.getlist('attachments') if request else []
        for f in files[:2]:
            JobAttachment.objects.create(
                job=instance,
                file=f,
                original_name=getattr(f, 'name', ''),
                size=getattr(f, 'size', 0)
            )
        return instance


class JobApplicationAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = JobApplicationAttachment
        fields = ('id', 'file_url', 'original_name', 'size', 'uploaded_at')

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj or not getattr(obj, "file", None):
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class JobApplicationSerializer(serializers.ModelSerializer):
    freelancer_name = serializers.CharField(source='freelancer.get_full_name', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_id = serializers.IntegerField(source='job.id', read_only=True)
    client_name = serializers.SerializerMethodField()

    freelancer = serializers.SerializerMethodField()
    freelancer_id = serializers.IntegerField(source='freelancer.id', read_only=True)
    file_attachments = JobApplicationAttachmentSerializer(source='attachments', many=True, read_only=True)

    class Meta:
        model = JobApplication
        fields = [
            'id', 'job', 'job_id', 'job_title',
            'freelancer', 'freelancer_id', 'freelancer_name', 'client_name',
            'cover_letter', 'bid_amount', 'estimated_time',
            'status', 'created_at', 'updated_at', 'file_attachments'
        ]
        read_only_fields = ['freelancer', 'created_at', 'updated_at']
        extra_kwargs = {
            'estimated_time': {'required': False, 'allow_blank': True}
        }

    def validate(self, attrs):
        #  FIX: Ensure integer conversion for bid_amount
        if 'bid_amount' in attrs:
            attrs['bid_amount'] = int(attrs['bid_amount'])
        return attrs

    def get_client_name(self, obj):
        try:
            return obj.job.client.get_full_name() if obj.job and obj.job.client else 'Unknown'
        except Exception:
            return 'Unknown'

    def get_freelancer(self, obj):
        """
        Return complete freelancer details matching what FreelancerCard expects
        """
        if not obj.freelancer:
            return None

        user = obj.freelancer
        request = self.context.get('request')
        
        # Get freelancer profile
        try:
            profile = user.freelancer_profile
        except:
            profile = None

        # Build avatar URL
        avatar_url = None
        if hasattr(user, 'avatar') and user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url) if request else user.avatar.url

        # Build freelancer data structure matching FreelancerCard expectations
        freelancer_data = {
            'id': user.id,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'name': user.get_full_name() or user.username,
            'email': user.email,
            'avatar': avatar_url,
            'bio': getattr(user, 'bio', ''),
            'location': getattr(user, 'location', ''),
            'rating_avg': getattr(user, 'rating_avg', 0.0),
            'projects_completed': 0,
            'hourly_rate': 0,
            'availability': None,
            'skills': [],
            'portfolio': '',
            'portfolio_files': [],
            'role_title': '',
            'social_links': {},
            'languages': [],
            'experiences': [],
            'education': [],
            'total_earnings': 0,
        }

        # Add profile data if available
        if profile:
            freelancer_data.update({
                'projects_completed': getattr(profile, 'projects_completed', 0),
                'hourly_rate': float(getattr(profile, 'hourly_rate', 0)),
                'availability': getattr(profile, 'availability', None),
                'portfolio': getattr(profile, 'portfolio', ''),
                'role_title': getattr(profile, 'role_title', ''),
                'social_links': getattr(profile, 'social_links', {}),
                'languages': getattr(profile, 'languages', []),
                'experiences': getattr(profile, 'experiences', []),
                'education': getattr(profile, 'education', []),
                'total_earnings': float(getattr(profile, 'total_earnings', 0)),
            })

            # Get skills
            skills = []
            try:
                for skill in profile.skills.all():
                    skills.append({
                        'id': skill.id,
                        'name': skill.name,
                    })
            except:
                pass
            freelancer_data['skills'] = skills

            # Get portfolio files
            portfolio_files = []
            try:
                for pf in profile.portfolio_files.all():
                    file_url = request.build_absolute_uri(pf.file.url) if request and pf.file else None
                    portfolio_files.append({
                        'id': pf.id,
                        'file_name': pf.file_name,
                        'file_size': pf.file_size,
                        'file_url': file_url,
                        'file': file_url,
                    })
            except:
                pass
            freelancer_data['portfolio_files'] = portfolio_files

        return freelancer_data