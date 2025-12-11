from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from datetime import datetime, timedelta

from .models import Job, JobApplication, JobApplicationAttachment
from .serializers import JobSerializer, JobApplicationSerializer


# ============================================================
# JOB VIEWSET
# ============================================================
class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    queryset = Job.objects.all().select_related('client').prefetch_related('attachments')

    def get_permissions(self):
        """Allow unauthenticated users to list/retrieve jobs, require auth for write actions."""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    def get_queryset(self):
        params = self.request.query_params
        
        # FIX: Check if this is a "my_jobs" request from dashboard
        my_jobs = params.get('my_jobs', '').lower() == 'true'
        
        if my_jobs and self.request.user and self.request.user.is_authenticated:
            # Return ALL jobs for this client (no visibility or status filter)
            qs = Job.objects.filter(client=self.request.user)
            print(f"\n✅ MY_JOBS MODE: Returning {qs.count()} jobs for user {self.request.user.id}")
            return qs
        
        # Normal public listing
        qs = Job.objects.filter(visibility='public')

        # Filters
        status_param = params.get('status', '').strip()
        if status_param:
            qs = qs.filter(status=status_param)

        job_types = params.get('job_type', '').strip()
        if job_types:
            job_type_list = [j.strip() for j in job_types.split(',') if j.strip()]
            qs = qs.filter(job_type__in=job_type_list)

        experience = params.get('experience_level', '').strip()
        if experience:
            exp_list = [e.strip() for e in experience.split(',') if e.strip()]
            qs = qs.filter(experience_level__in=exp_list)

        posted_time = params.get('posted_time', '').strip()
        if posted_time:
            now = datetime.now()
            if posted_time == '24h':
                qs = qs.filter(created_at__gte=now - timedelta(hours=24))
            elif posted_time == 'week':
                qs = qs.filter(created_at__gte=now - timedelta(days=7))
            elif posted_time == 'month':
                qs = qs.filter(created_at__gte=now - timedelta(days=30))

        min_rate = params.get('hourly_min', '').strip()
        max_rate = params.get('hourly_max', '').strip()
        if min_rate:
            qs = qs.filter(hourly_min__gte=float(min_rate))
        if max_rate:
            qs = qs.filter(hourly_max__lte=float(max_rate))

        location = params.get('location', '').strip()
        if location:
            qs = qs.filter(location__icontains=location)

        location_type = params.get('location_type', '').strip()
        if location_type:
            loc_list = [l.strip() for l in location_type.split(',') if l.strip()]
            qs = qs.filter(location_type__in=loc_list)

        search = params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search)).distinct()

        return qs

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()
        if job.client != request.user:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


# ============================================================
# JOB APPLICATION VIEWSET
# ============================================================
class JobApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = JobApplicationSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        user = self.request.user
        queryset = JobApplication.objects.none()

        if getattr(user, 'role', None) == 'freelancer':
            queryset = JobApplication.objects.filter(freelancer=user)
        elif getattr(user, 'role', None) == 'client':
            queryset = JobApplication.objects.filter(job__client=user)

        job_id = self.request.query_params.get('job', None)
        if job_id:
            queryset = queryset.filter(job_id=job_id)

        return queryset.select_related('job', 'freelancer').prefetch_related('attachments').order_by('-created_at')

    def create(self, request, *args, **kwargs):
        job_id = request.data.get('job')
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            return Response({'detail': 'Job not found.'}, status=status.HTTP_404_NOT_FOUND)

        if job.status != 'open':
            return Response({'detail': 'This job is no longer accepting applications.'}, status=status.HTTP_400_BAD_REQUEST)

        existing_application = JobApplication.objects.filter(job=job, freelancer=request.user).first()
        if existing_application:
            return Response({'detail': 'You have already submitted an application for this job.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={
            'job': job.id,
            'cover_letter': request.data.get('cover_letter'),
            'bid_amount': request.data.get('bid_amount'),
            'estimated_time': request.data.get('estimated_time'),
        })

        if serializer.is_valid():
            application = serializer.save(freelancer=request.user)

            files = request.FILES.getlist('attachments')
            for f in files[:3]:
                JobApplicationAttachment.objects.create(
                    application=application,
                    file=f,
                    original_name=getattr(f, 'name', ''),
                    size=getattr(f, 'size', 0)
                )

            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user=job.client,
                    type='job_application',
                    title='New Job Application',
                    message=f'{request.user.get_full_name()} applied for your job: {job.title}',
                    metadata={'job_id': job.id, 'application_id': application.id}
                )
            except Exception:
                pass

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        application = self.get_object()
        job = application.job

        if job.client != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        JobApplication.objects.filter(job=job, status='pending').exclude(id=application.id).update(status='rejected')

        application.status = 'accepted'
        application.save()

        job.status = 'in_progress'
        job.save()

        try:
            from contracts.models import Contract

            payment_terms = (
                f"Hourly rate: ₹{job.hourly_min} - ₹{job.hourly_max}/hour"
                if job.job_type == 'hourly'
                else f"Fixed payment: ₹{job.fixed_amount or application.bid_amount}"
            )

            terms = f"""
            CONTRACT AGREEMENT
            ------------------
            Job Title: {job.title}
            Description: {job.description}
            Client: {job.client.get_full_name() or job.client.username}
            Freelancer: {application.freelancer.get_full_name() or application.freelancer.username}
            Cover Letter: {application.cover_letter or 'N/A'}
            Bid Amount: ₹{application.bid_amount or 'N/A'}
            Estimated Time: {application.estimated_time or 'N/A'}
            """

            contract = Contract.objects.create(
                job_application=application,
                client=job.client,
                freelancer=application.freelancer,
                terms=terms.strip(),
                payment_terms=payment_terms,
                status='pending',
                client_signed=False,
                freelancer_signed=False
            )

            try:
                from notifications.models import Notification
                Notification.objects.create(
                    user=application.freelancer,
                    type='contract',
                    title='Application Accepted ✅',
                    message=f'Your application for "{job.title}" has been accepted. A contract has been created and awaits signing.',
                    metadata={'contract_id': contract.id, 'job_id': job.id}
                )
            except Exception:
                pass

            return Response({
                'detail': 'Application accepted. Contract created successfully.',
                'application_id': application.id,
                'contract_id': contract.id,
                'job_status': job.status
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'detail': 'Application accepted, but contract creation failed.',
                'error': str(e)
            }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        application = self.get_object()
        if application.job.client != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        application.status = 'rejected'
        application.save()

        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=application.freelancer,
                type='job_application',
                title='Application Rejected',
                message=f'Your application for "{application.job.title}" was not accepted.',
                metadata={'job_id': application.job.id, 'application_id': application.id}
            )
        except Exception:
            pass

        return Response({'detail': 'Application rejected.'}, status=status.HTTP_200_OK)