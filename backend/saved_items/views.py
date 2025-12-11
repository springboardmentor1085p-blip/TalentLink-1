from django.shortcuts import render

# backend/saved_items/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SavedProject, SavedJob
from .serializers import SavedProjectSerializer, SavedJobSerializer


class SavedProjectViewSet(viewsets.ModelViewSet):
    """ViewSet for managing saved projects"""
    serializer_class = SavedProjectSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return SavedProject.objects.filter(
            user=self.request.user
        ).select_related('project', 'project__client')

    def create(self, request, *args, **kwargs):
        """Save a project"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        saved_project = serializer.save()
        
        return Response(
            SavedProjectSerializer(saved_project).data,
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        """Unsave a project by project ID"""
        project_id = kwargs.get('pk')
        try:
            saved_project = SavedProject.objects.get(
                user=request.user,
                project_id=project_id
            )
            saved_project.delete()
            return Response(
                {'detail': 'Project removed from saved items'},
                status=status.HTTP_200_OK
            )
        except SavedProject.DoesNotExist:
            return Response(
                {'detail': 'Project not found in saved items'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def check(self, request, pk=None):
        """Check if a project is saved"""
        is_saved = SavedProject.objects.filter(
            user=request.user,
            project_id=pk
        ).exists()
        
        return Response({'is_saved': is_saved})


class SavedJobViewSet(viewsets.ModelViewSet):
    """ViewSet for managing saved jobs"""
    serializer_class = SavedJobSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return SavedJob.objects.filter(
            user=self.request.user
        ).select_related('job', 'job__client')

    def create(self, request, *args, **kwargs):
        """Save a job"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        saved_job = serializer.save()
        
        return Response(
            SavedJobSerializer(saved_job).data,
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        """Unsave a job by job ID"""
        job_id = kwargs.get('pk')
        try:
            saved_job = SavedJob.objects.get(
                user=request.user,
                job_id=job_id
            )
            saved_job.delete()
            return Response(
                {'detail': 'Job removed from saved items'},
                status=status.HTTP_200_OK
            )
        except SavedJob.DoesNotExist:
            return Response(
                {'detail': 'Job not found in saved items'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def check(self, request, pk=None):
        """Check if a job is saved"""
        is_saved = SavedJob.objects.filter(
            user=request.user,
            job_id=pk
        ).exists()
        
        return Response({'is_saved': is_saved})