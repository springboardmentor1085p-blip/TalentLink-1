# backend/saved_items/serializers.py
from rest_framework import serializers
from .models import SavedProject, SavedJob


class SavedProjectSerializer(serializers.ModelSerializer):
    # Import project serializer dynamically to avoid circular imports
    project = serializers.SerializerMethodField()
    project_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = SavedProject
        fields = ['id', 'project', 'project_id', 'saved_at']
        read_only_fields = ['saved_at']

    def get_project(self, obj):
        from projects.serializers import ProjectSerializer
        return ProjectSerializer(obj.project).data

    def create(self, validated_data):
        user = self.context['request'].user
        project_id = validated_data.pop('project_id')
        
        # Check if already saved
        saved_project, created = SavedProject.objects.get_or_create(
            user=user,
            project_id=project_id
        )
        
        return saved_project


class SavedJobSerializer(serializers.ModelSerializer):
    # Import job serializer dynamically to avoid circular imports
    job = serializers.SerializerMethodField()
    job_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = SavedJob
        fields = ['id', 'job', 'job_id', 'saved_at']
        read_only_fields = ['saved_at']

    def get_job(self, obj):
        from jobs.serializers import JobSerializer
        return JobSerializer(obj.job).data

    def create(self, validated_data):
        user = self.context['request'].user
        job_id = validated_data.pop('job_id')
        
        # Check if already saved
        saved_job, created = SavedJob.objects.get_or_create(
            user=user,
            job_id=job_id
        )
        
        return saved_job