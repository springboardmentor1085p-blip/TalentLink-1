from rest_framework import serializers
from .models import Project, ProjectAttachment
from users.models import Skill
from users.serializers import SkillSerializer

class ProjectAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectAttachment
        fields = ("id", "file_url", "original_name", "size", "uploaded_at")

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    skills_required = SkillSerializer(many=True, read_only=True)
    skill_ids = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(),
        write_only=True,
        many=True,
        source='skills_required',
        required=False
    )
    proposal_count = serializers.SerializerMethodField()

    duration_estimate = serializers.CharField(write_only=True, required=False, allow_blank=True)
    file_attachments = ProjectAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'client', 'client_name', 'title', 'description', 'skills_required',
            'skill_ids', 'budget_min', 'budget_max',
            'duration', 'duration_estimate', 'hours_per_week', 'job_type',
            'fixed_payment', 'hourly_min', 'hourly_max',
            'experience_level', 'location_type', 'client_location',
            'status', 'visibility', 'attachments', 'category',
            'file_attachments',
            'proposal_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['client', 'created_at', 'updated_at', 'status', 'proposal_count']
        extra_kwargs = {'attachments': {'read_only': True}}

    def get_proposal_count(self, obj):
        return obj.proposals.count()

    def validate(self, attrs):
        de = attrs.pop('duration_estimate', None)
        if de:
            attrs['duration'] = de
        
        # FIX: Ensure integer conversion for budget fields
        if 'budget_min' in attrs:
            attrs['budget_min'] = int(attrs['budget_min'])
        if 'budget_max' in attrs:
            attrs['budget_max'] = int(attrs['budget_max'])
        if 'fixed_payment' in attrs and attrs['fixed_payment'] is not None:
            attrs['fixed_payment'] = int(attrs['fixed_payment'])
        if 'hourly_min' in attrs and attrs['hourly_min'] is not None:
            attrs['hourly_min'] = int(attrs['hourly_min'])
        if 'hourly_max' in attrs and attrs['hourly_max'] is not None:
            attrs['hourly_max'] = int(attrs['hourly_max'])
            
        return super().validate(attrs)

    def _validate_files(self, request, project_instance=None):
        files = request.FILES.getlist('attachments') if request else []
        if not files:
            return files
        existing = project_instance.file_attachments.count() if project_instance is not None else 0
        if existing + len(files) > 2:
            raise serializers.ValidationError({"attachments": "You can attach a maximum of 2 files per project."})
        return files

    def create(self, validated_data):
        request = self.context.get('request')
        skill_objs = validated_data.pop('skills_required', [])

        project = Project.objects.create(**validated_data)
        if skill_objs:
            project.skills_required.set(skill_objs)

        files = self._validate_files(request)
        for f in files:
            ProjectAttachment.objects.create(
                project=project,
                file=f,
                original_name=getattr(f, 'name', ''),
                size=getattr(f, 'size', 0)
            )
        return project

    def update(self, instance, validated_data):
        request = self.context.get('request')
        skill_objs = validated_data.pop('skills_required', None)

        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if skill_objs is not None:
            instance.skills_required.set(skill_objs)

        files = self._validate_files(request, instance)
        for f in files:
            ProjectAttachment.objects.create(
                project=instance,
                file=f,
                original_name=getattr(f, 'name', ''),
                size=getattr(f, 'size', 0)
            )
        return instance