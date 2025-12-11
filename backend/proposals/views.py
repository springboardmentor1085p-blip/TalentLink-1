from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Proposal, ProposalAttachment
from .serializers import ProposalSerializer
from projects.models import Project


class ProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ProposalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'freelancer':
            queryset = Proposal.objects.filter(freelancer=user)
        elif user.role == 'client':
            queryset = Proposal.objects.filter(project__client=user)
        else:
            queryset = Proposal.objects.none()

        print(f"[Proposals] User: {user.email}, Role: {user.role}, Count: {queryset.count()}")

        return (
            queryset
            .select_related(
                'project',
                'freelancer',
                'freelancer__freelancer_profile',
            )
            .prefetch_related(
                'freelancer__freelancer_profile__skills',
                'freelancer__freelancer_profile__portfolio_files',
                'relevant_skills',
                'file_attachments',
            )
            .order_by('-created_at')
        )

    def create(self, request, *args, **kwargs):
        """
        Create a proposal, enforcing:
        - project must exist and be open
        - freelancer can submit only one proposal per project
        - handles extra fields + file uploads
        """
        project_id = request.data.get('project')
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({'detail': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)

        if project.status != 'open':
            return Response(
                {'detail': 'This project is no longer accepting proposals.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_proposal = Proposal.objects.filter(
            project=project,
            freelancer=request.user
        ).first()

        if existing_proposal:
            return Response(
                {'detail': 'You have already submitted a proposal for this project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data.copy()
        data['project'] = project.id

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            proposal = serializer.save(freelancer=request.user, project=project)

            # ✅ Files
            resume_file = request.FILES.get('resume')
            portfolio_files = request.FILES.getlist('portfolio_files')

            if resume_file:
                ProposalAttachment.objects.create(
                    proposal=proposal,
                    file=resume_file,
                    original_name=resume_file.name,
                    is_resume=True,
                )

            for f in portfolio_files[:5]:
                ProposalAttachment.objects.create(
                    proposal=proposal,
                    file=f,
                    original_name=f.name,
                    is_resume=False,
                )

            # return enriched data with file_attachments + relevant_skills
            out = self.get_serializer(proposal)
            return Response(out.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        proposal = self.get_object()
        if proposal.project.client != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
        
        # ✅ Reject all other pending proposals for this project
        Proposal.objects.filter(
            project=proposal.project,
            status='pending'
        ).exclude(id=proposal.id).update(status='rejected')
        
        # ✅ Mark this proposal as accepted
        proposal.status = 'accepted'
        proposal.save()
        
        # ✅ Create (or get) the contract linked to this proposal
        from contracts.models import Contract
        Contract.objects.get_or_create(
            proposal=proposal,
            defaults={
                'client': proposal.project.client,
                'freelancer': proposal.freelancer,
                'status': 'pending',
                'client_signed': False,
                'freelancer_signed': False,
                'terms': 'Project terms as discussed',
                'payment_terms': 'Payment on completion',
            }
        )

        return Response(
            {'detail': 'Proposal accepted. Contract created.'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Client rejects a proposal.
        """
        proposal = self.get_object()
        if proposal.project.client != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        proposal.status = 'rejected'
        proposal.save()
        return Response({'detail': 'Proposal rejected.'}, status=status.HTTP_200_OK)
