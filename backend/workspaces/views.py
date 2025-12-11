# backend/workspaces/views.py
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import (
    Workspace, WorkspaceTask, TaskComment,
    PaymentTransaction, PaymentRequest
)
from .serializers import (
    WorkspaceSerializer, WorkspaceTaskSerializer,
    TaskCommentSerializer, PaymentTransactionSerializer,
    PaymentRequestSerializer, WorkspaceTaskCreateSerializer,
    PaymentTransactionCreateSerializer
)
from notifications.models import Notification


class WorkspaceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Workspace management
    """
    serializer_class = WorkspaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Workspace.objects.filter(
            Q(contract__client=user) | Q(contract__freelancer=user)
        ).select_related(
            'contract', 'contract__client', 'contract__freelancer',
            'contract__proposal', 'contract__job_application'
        ).prefetch_related('tasks', 'payments')

    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """
        Mark workspace (project OR job) as complete from user's side
        """
        workspace = self.get_object()
        user = request.user

        if user == workspace.contract.client:
            if workspace.client_marked_complete:
                return Response(
                    {'detail': 'You have already marked this as complete.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            workspace.client_marked_complete = True
            marker = 'Client'
        elif user == workspace.contract.freelancer:
            if workspace.freelancer_marked_complete:
                return Response(
                    {'detail': 'You have already marked this as complete.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            workspace.freelancer_marked_complete = True
            marker = 'Freelancer'
        else:
            return Response(
                {'detail': 'You are not authorized.'},
                status=status.HTTP_403_FORBIDDEN
            )

        workspace.save()
        workspace.check_and_complete()

        # Notify other party (generic wording, works for jobs and projects)
        other_party = (
            workspace.contract.freelancer if user == workspace.contract.client
            else workspace.contract.client
        )

        Notification.objects.create(
            user=other_party,
            type='WORKSPACE',
            title='Workspace Completion Confirmation',
            message=f'{marker} has marked this engagement as complete.',
            metadata={'workspace_id': workspace.id}
        )

        if workspace.is_fully_completed:
            # Notify both parties once engagement is fully done
            for u in [workspace.contract.client, workspace.contract.freelancer]:
                Notification.objects.create(
                    user=u,
                    type='WORKSPACE',
                    title='Workspace Completed!',
                    message='Both parties confirmed completion of this engagement.',
                    metadata={'workspace_id': workspace.id}
                )

        return Response({
            'detail': f'{marker} marked as complete successfully.',
            'workspace': WorkspaceSerializer(workspace, context={'request': request}).data
        })

    @action(detail=True, methods=['get'])
    def payment_stats(self, request, pk=None):
        """
        Get payment statistics for charts.
        """
        workspace = self.get_object()

        serializer = WorkspaceSerializer(workspace, context={'request': request})
        total = serializer.get_total_amount(workspace)
        paid = serializer.get_paid_amount(workspace)
        remaining = serializer.get_remaining_amount(workspace)

        payments = workspace.payments.filter(status='confirmed').order_by('created_at')

        timeline = []
        cumulative = 0.0
        for payment in payments:
            amount = float(payment.amount)
            cumulative += amount
            timeline.append({
                'date': payment.created_at.strftime('%Y-%m-%d'),
                'amount': amount,
                'cumulative': cumulative,
                'description': payment.description
            })

        return Response({
            'total_amount': total,
            'paid_amount': paid,
            'remaining_amount': remaining,
            'payment_percentage': round((paid / total * 100) if total > 0 else 0, 2),
            'payment_count': payments.count(),
            'timeline': timeline
        })

class WorkspaceTaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for WorkspaceTask management
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return WorkspaceTaskCreateSerializer
        return WorkspaceTaskSerializer

    def get_queryset(self):
        """Return tasks from workspaces where user is involved"""
        user = self.request.user
        workspace_id = self.request.query_params.get('workspace')

        queryset = WorkspaceTask.objects.filter(
            Q(workspace__contract__client=user) |
            Q(workspace__contract__freelancer=user)
        ).select_related(
            'workspace', 'created_by', 'assigned_to'
        ).prefetch_related('comments')

        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        return queryset

    def perform_create(self, serializer):
        """
        Set created_by to current user and ALWAYS assign the task
        to the freelancer on that contract (client or freelancer may
        create the task, but the work is done by freelancer).
        """
        workspace = serializer.validated_data['workspace']
        freelancer = workspace.contract.freelancer

        task = serializer.save(
            created_by=self.request.user,
            assigned_to=freelancer
        )

        # Notify assigned user (freelancer)
        if task.assigned_to and task.assigned_to != self.request.user:
            Notification.objects.create(
                user=task.assigned_to,
                type='WORKSPACE',
                title='New Task Assigned',
                message=f'You have been assigned: {task.title}',
                metadata={'task_id': task.id, 'workspace_id': task.workspace.id}
            )


    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update task status.
        Only the freelancer on this contract is allowed to change status.
        """
        task = self.get_object()
        new_status = request.data.get('status')

        # Permission: only freelancer can log progress
        if request.user != task.workspace.contract.freelancer:
            return Response(
                {'detail': 'Only the freelancer can update task status.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if new_status not in dict(WorkspaceTask.STATUS_CHOICES).keys():
            return Response(
                {'detail': 'Invalid status.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = task.status
        task.status = new_status
        task.save()

        # Notify relevant party when completed
        if new_status == 'completed':
            other_user = (
                task.workspace.contract.client
                if request.user == task.workspace.contract.freelancer
                else task.workspace.contract.freelancer
            )
            Notification.objects.create(
                user=other_user,
                type='WORKSPACE',
                title='Task Completed',
                message=f'Task "{task.title}" has been marked as completed.',
                metadata={'task_id': task.id, 'workspace_id': task.workspace.id}
            )

        return Response({
            'detail': 'Status updated successfully.',
            'task': WorkspaceTaskSerializer(task).data
        })


    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        """
        Add comment to task
        """
        task = self.get_object()
        comment_text = request.data.get('comment')

        if not comment_text:
            return Response(
                {'detail': 'Comment text is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        comment = TaskComment.objects.create(
            task=task,
            user=request.user,
            comment=comment_text
        )

        # Notify other party
        other_user = (
            task.workspace.contract.client
            if request.user == task.workspace.contract.freelancer
            else task.workspace.contract.freelancer
        )

        if other_user != request.user:
            Notification.objects.create(
                user=other_user,
                type='WORKSPACE',
                title='New Comment on Task',
                message=f'{request.user.get_full_name()} commented on "{task.title}"',
                metadata={'task_id': task.id, 'workspace_id': task.workspace.id}
            )

        return Response(
            TaskCommentSerializer(comment, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class PaymentTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payment Transaction management
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentTransactionCreateSerializer
        return PaymentTransactionSerializer

    def get_queryset(self):
        """Return payments from user's workspaces"""
        user = self.request.user
        workspace_id = self.request.query_params.get('workspace')

        queryset = PaymentTransaction.objects.filter(
            Q(workspace__contract__client=user) |
            Q(workspace__contract__freelancer=user)
        ).select_related('workspace', 'paid_by', 'received_by')

        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        return queryset

    def perform_create(self, serializer):
        """Create payment transaction (client only)"""
        workspace = serializer.validated_data['workspace']
        serializer.save(
            paid_by=self.request.user,
            received_by=workspace.contract.freelancer
        )

        # Notify freelancer
        Notification.objects.create(
            user=workspace.contract.freelancer,
            type='PAYMENT',
            title='Payment Logged',
            message=f'Client logged a payment of ₹{serializer.instance.amount}. Please confirm.',
            metadata={'payment_id': serializer.instance.id, 'workspace_id': workspace.id}
        )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """
        Freelancer confirms payment received
        """
        payment = self.get_object()

        if request.user != payment.received_by:
            return Response(
                {'detail': 'Only the recipient can confirm payment.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if payment.freelancer_confirmed:
            return Response(
                {'detail': 'Payment already confirmed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment.confirm_payment()

        # Notify client
        Notification.objects.create(
            user=payment.paid_by,
            type='PAYMENT',
            title='Payment Confirmed',
            message=f'Freelancer confirmed receipt of ₹{payment.amount}.',
            metadata={'payment_id': payment.id}
        )

        return Response({
            'detail': 'Payment confirmed successfully.',
            'payment': PaymentTransactionSerializer(payment).data
        })


class PaymentRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payment Request management
    """
    serializer_class = PaymentRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return payment requests from user's workspaces"""
        user = self.request.user
        return PaymentRequest.objects.filter(
            Q(workspace__contract__client=user) |
            Q(workspace__contract__freelancer=user)
        ).select_related('workspace', 'freelancer', 'transaction')

    def perform_create(self, serializer):
        """Create payment request (freelancer only)"""
        workspace = serializer.validated_data['workspace']

        if self.request.user != workspace.contract.freelancer:
            return Response(
                {'detail': 'Only freelancer can request payment.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer.save(freelancer=self.request.user)

        # Notify client
        Notification.objects.create(
            user=workspace.contract.client,
            type='PAYMENT',
            title='Payment Request',
            message=f'Freelancer requested payment of ₹{serializer.instance.amount}.',
            metadata={'payment_request_id': serializer.instance.id, 'workspace_id': workspace.id}
        )

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Client approves payment request
        """
        payment_request = self.get_object()

        if request.user != payment_request.workspace.contract.client:
            return Response(
                {'detail': 'Only client can approve payment requests.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if payment_request.status != 'pending':
            return Response(
                {'detail': 'Request already processed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_request.status = 'approved'
        payment_request.save()

        # Notify freelancer
        Notification.objects.create(
            user=payment_request.freelancer,
            type='PAYMENT',
            title='Payment Request Approved',
            message=f'Your payment request of ₹{payment_request.amount} was approved.',
            metadata={'payment_request_id': payment_request.id}
        )

        return Response({
            'detail': 'Payment request approved.',
            'request': PaymentRequestSerializer(payment_request).data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Client rejects payment request
        """
        payment_request = self.get_object()

        if request.user != payment_request.workspace.contract.client:
            return Response(
                {'detail': 'Only client can reject payment requests.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if payment_request.status != 'pending':
            return Response(
                {'detail': 'Request already processed.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_request.status = 'rejected'
        payment_request.save()

        reason = request.data.get('reason', '')

        # Notify freelancer
        Notification.objects.create(
            user=payment_request.freelancer,
            type='PAYMENT',
            title='Payment Request Rejected',
            message=f'Your payment request was rejected. {reason}',
            metadata={'payment_request_id': payment_request.id}
        )

        return Response({
            'detail': 'Payment request rejected.',
            'request': PaymentRequestSerializer(payment_request).data
        })