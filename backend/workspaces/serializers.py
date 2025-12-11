# from rest_framework import serializers
# from django.contrib.auth import get_user_model
# from .models import (
#     Workspace, WorkspaceTask, TaskComment,
#     PaymentTransaction, PaymentRequest
# )
# from contracts.models import Contract

# User = get_user_model()


# class WorkspaceSerializer(serializers.ModelSerializer):
#     # Contract info
#     contract_id = serializers.IntegerField(source='contract.id', read_only=True)
#     contract_title = serializers.SerializerMethodField()
#     contract_status = serializers.CharField(source='contract.status', read_only=True)

#     # Parties
#     client_id = serializers.IntegerField(source='contract.client.id', read_only=True)
#     client_name = serializers.SerializerMethodField()
#     freelancer_id = serializers.IntegerField(source='contract.freelancer.id', read_only=True)
#     freelancer_name = serializers.SerializerMethodField()

#     # Stats
#     total_tasks = serializers.SerializerMethodField()
#     completed_tasks = serializers.SerializerMethodField()
#     pending_tasks = serializers.SerializerMethodField()
#     overdue_tasks = serializers.SerializerMethodField()

#     # Payment stats
#     total_amount = serializers.SerializerMethodField()
#     paid_amount = serializers.SerializerMethodField()
#     remaining_amount = serializers.SerializerMethodField()

#     class Meta:
#         model = Workspace
#         fields = [
#             'id', 'contract_id', 'contract_title', 'contract_status',
#             'client_id', 'client_name', 'freelancer_id', 'freelancer_name',
#             'client_marked_complete', 'freelancer_marked_complete',
#             'completed_at', 'is_fully_completed',
#             'total_tasks', 'completed_tasks', 'pending_tasks', 'overdue_tasks',
#             'total_amount', 'paid_amount', 'remaining_amount',
#             'created_at', 'updated_at'
#         ]
#         read_only_fields = ['created_at', 'updated_at', 'completed_at']

#     def get_contract_title(self, obj):
#         contract = obj.contract

#         # Job contract
#         if contract.job_application and contract.job_application.job:
#             return contract.job_application.job.title

#         # Project contract
#         if contract.proposal and contract.proposal.project:
#             return contract.proposal.project.title

#         # Fallback
#         return f"Contract #{contract.id}"

#     def get_client_name(self, obj):
#         if obj.contract.client:
#             return obj.contract.client.get_full_name() or obj.contract.client.username
#         return None

#     def get_freelancer_name(self, obj):
#         if obj.contract.freelancer:
#             return obj.contract.freelancer.get_full_name() or obj.contract.freelancer.username
#         return None

#     def get_total_tasks(self, obj):
#         return obj.tasks.count()

#     def get_completed_tasks(self, obj):
#         return obj.tasks.filter(status='completed').count()

#     def get_pending_tasks(self, obj):
#         return obj.tasks.filter(status__in=['todo', 'in_progress']).count()

#     def get_overdue_tasks(self, obj):
#         return obj.tasks.filter(status='overdue').count()

#     def get_total_amount(self, obj):
#         """Get contract total amount"""
#         contract = obj.contract
#         # Try to get from proposal or job_application
#         if contract.proposal:
#             return float(contract.proposal.bid_amount or 0)
#         elif contract.job_application:
#             return float(contract.job_application.bid_amount or 0)
#         return 0.0

#     def get_paid_amount(self, obj):
#         """Sum of confirmed payments (same logic as payment_stats)"""
#         confirmed = obj.payments.filter(status='confirmed')
#         return float(sum(p.amount for p in confirmed))

#     def get_remaining_amount(self, obj):
#         """Remaining amount to be paid"""
#         total = self.get_total_amount(obj)
#         paid = self.get_paid_amount(obj)
#         return max(0, total - paid)


# class TaskCommentSerializer(serializers.ModelSerializer):
#     user_name = serializers.SerializerMethodField()
#     user_avatar = serializers.SerializerMethodField()

#     class Meta:
#         model = TaskComment
#         fields = [
#             'id', 'task', 'user', 'user_name', 'user_avatar',
#             'comment', 'created_at', 'updated_at'
#         ]
#         read_only_fields = ['user', 'created_at', 'updated_at']

#     def get_user_name(self, obj):
#         return obj.user.get_full_name() or obj.user.username

#     def get_user_avatar(self, obj):
#         if obj.user.avatar:
#             request = self.context.get('request')
#             if request:
#                 return request.build_absolute_uri(obj.user.avatar.url)
#             return obj.user.avatar.url
#         return None


# class WorkspaceTaskSerializer(serializers.ModelSerializer):
#     created_by_name = serializers.SerializerMethodField()
#     assigned_to_name = serializers.SerializerMethodField()
#     comments_count = serializers.SerializerMethodField()
#     comments = TaskCommentSerializer(many=True, read_only=True)
#     is_overdue = serializers.SerializerMethodField()

#     class Meta:
#         model = WorkspaceTask
#         fields = [
#             'id', 'workspace', 'title', 'description',
#             'created_by', 'created_by_name',
#             'assigned_to', 'assigned_to_name',
#             'status', 'priority', 'deadline',
#             'attachments', 'comments_count', 'comments',
#             'is_overdue', 'created_at', 'updated_at', 'completed_at'
#         ]
#         read_only_fields = ['created_by', 'created_at', 'updated_at', 'completed_at']

#     def get_created_by_name(self, obj):
#         return obj.created_by.get_full_name() or obj.created_by.username

#     def get_assigned_to_name(self, obj):
#         if obj.assigned_to:
#             return obj.assigned_to.get_full_name() or obj.assigned_to.username
#         return None

#     def get_comments_count(self, obj):
#         return obj.comments.count()

#     def get_is_overdue(self, obj):
#         from django.utils import timezone
#         if obj.deadline and obj.status != 'completed':
#             return timezone.now() > obj.deadline
#         return False


# class PaymentTransactionSerializer(serializers.ModelSerializer):
#     paid_by_name = serializers.SerializerMethodField()
#     received_by_name = serializers.SerializerMethodField()

#     class Meta:
#         model = PaymentTransaction
#         fields = [
#             'id', 'workspace', 'amount', 'description',
#             'paid_by', 'paid_by_name',
#             'received_by', 'received_by_name',
#             'status', 'freelancer_confirmed',
#             'payment_method', 'transaction_id',
#             'created_at', 'confirmed_at'
#         ]
#         read_only_fields = ['paid_by', 'status', 'created_at', 'confirmed_at']

#     def get_paid_by_name(self, obj):
#         return obj.paid_by.get_full_name() or obj.paid_by.username

#     def get_received_by_name(self, obj):
#         return obj.received_by.get_full_name() or obj.received_by.username


# class PaymentRequestSerializer(serializers.ModelSerializer):
#     freelancer_name = serializers.SerializerMethodField()
#     transaction_details = PaymentTransactionSerializer(source='transaction', read_only=True)

#     class Meta:
#         model = PaymentRequest
#         fields = [
#             'id', 'workspace', 'freelancer', 'freelancer_name',
#             'amount', 'message', 'status',
#             'transaction', 'transaction_details',
#             'created_at', 'updated_at'
#         ]
#         read_only_fields = ['freelancer', 'status', 'transaction', 'created_at', 'updated_at']

#     def get_freelancer_name(self, obj):
#         return obj.freelancer.get_full_name() or obj.freelancer.username


# class WorkspaceTaskCreateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = WorkspaceTask
#         fields = [
#             'workspace', 'title', 'description',
#             'assigned_to', 'status', 'priority', 'deadline'
#         ]
#         # 🔹 Make optional fields explicitly non-required to avoid 400s
#         extra_kwargs = {
#             'assigned_to': {'required': False, 'allow_null': True},
#             'status': {'required': False},
#             'priority': {'required': False},
#             'deadline': {'required': False, 'allow_null': True},
#         }

#     def validate_workspace(self, value):
#         """Ensure user is part of this workspace"""
#         request = self.context.get('request')
#         if not request or not request.user:
#             raise serializers.ValidationError("Authentication required")

#         contract = value.contract
#         if request.user != contract.client and request.user != contract.freelancer:
#             raise serializers.ValidationError("You are not part of this workspace")

#         return value


# class PaymentTransactionCreateSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PaymentTransaction
#         fields = [
#             'workspace', 'amount', 'description',
#             # 🔹 received_by is set in the view, not required from frontend
#             'payment_method', 'transaction_id'
#         ]

#     def validate_workspace(self, value):
#         """Ensure only client can create payment"""
#         request = self.context.get('request')
#         if not request or not request.user:
#             raise serializers.ValidationError("Authentication required")

#         if request.user != value.contract.client:
#             raise serializers.ValidationError("Only client can log payments")

#         return value
# backend/workspaces/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Workspace, WorkspaceTask, TaskComment,
    PaymentTransaction, PaymentRequest
)
from contracts.models import Contract

User = get_user_model()


class WorkspaceSerializer(serializers.ModelSerializer):
    # Contract info
    contract_id = serializers.IntegerField(source='contract.id', read_only=True)
    contract_title = serializers.SerializerMethodField()
    contract_status = serializers.CharField(source='contract.status', read_only=True)

    # NEW: project vs job
    workspace_type = serializers.SerializerMethodField()

    # Parties
    client_id = serializers.IntegerField(source='contract.client.id', read_only=True)
    client_name = serializers.SerializerMethodField()
    freelancer_id = serializers.IntegerField(source='contract.freelancer.id', read_only=True)
    freelancer_name = serializers.SerializerMethodField()

    # Stats
    total_tasks = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    pending_tasks = serializers.SerializerMethodField()
    overdue_tasks = serializers.SerializerMethodField()

    # Payment stats
    total_amount = serializers.SerializerMethodField()
    paid_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Workspace
        fields = [
            'id',
            'contract_id', 'contract_title', 'contract_status', 'workspace_type',
            'client_id', 'client_name', 'freelancer_id', 'freelancer_name',
            'client_marked_complete', 'freelancer_marked_complete',
            'completed_at', 'is_fully_completed',
            'total_tasks', 'completed_tasks', 'pending_tasks', 'overdue_tasks',
            'total_amount', 'paid_amount', 'remaining_amount',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'completed_at']

    def get_workspace_type(self, obj):
        """
        Distinguish between a project workspace and a job workspace
        based on which relationship the contract uses.
        """
        contract = obj.contract
        if getattr(contract, 'job_application_id', None):
            return 'job'
        if getattr(contract, 'proposal_id', None):
            return 'project'
        return 'general'

    def get_contract_title(self, obj):
        contract = obj.contract

        # Job contract
        if contract.job_application and contract.job_application.job:
            return contract.job_application.job.title

        # Project contract
        if contract.proposal and contract.proposal.project:
            return contract.proposal.project.title

        # Fallback
        return f"Contract #{contract.id}"

    def get_client_name(self, obj):
        if obj.contract.client:
            return obj.contract.client.get_full_name() or obj.contract.client.username
        return None

    def get_freelancer_name(self, obj):
        if obj.contract.freelancer:
            return obj.contract.freelancer.get_full_name() or obj.contract.freelancer.username
        return None

    def get_total_tasks(self, obj):
        return obj.tasks.count()

    def get_completed_tasks(self, obj):
        return obj.tasks.filter(status='completed').count()

    def get_pending_tasks(self, obj):
        return obj.tasks.filter(status__in=['todo', 'in_progress']).count()

    def get_overdue_tasks(self, obj):
        return obj.tasks.filter(status='overdue').count()

    def get_total_amount(self, obj):
        """Get contract total amount"""
        contract = obj.contract
        if contract.proposal:
            return float(contract.proposal.bid_amount or 0)
        elif contract.job_application:
            return float(contract.job_application.bid_amount or 0)
        return 0.0

    def get_paid_amount(self, obj):
        """Sum of confirmed payments"""
        confirmed = obj.payments.filter(status='confirmed')
        return float(sum(p.amount for p in confirmed))

    def get_remaining_amount(self, obj):
        """Remaining amount to be paid"""
        total = self.get_total_amount(obj)
        paid = self.get_paid_amount(obj)
        return max(0, total - paid)


class TaskCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = [
            'id', 'task', 'user', 'user_name', 'user_avatar',
            'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_user_avatar(self, obj):
        if obj.user.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.user.avatar.url)
            return obj.user.avatar.url
        return None


class WorkspaceTaskSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()
    comments = TaskCommentSerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = WorkspaceTask
        fields = [
            'id', 'workspace', 'title', 'description',
            'created_by', 'created_by_name',
            'assigned_to', 'assigned_to_name',
            'status', 'priority', 'deadline',
            'attachments', 'comments_count', 'comments',
            'is_overdue', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'completed_at']

    def get_created_by_name(self, obj):
        return obj.created_by.get_full_name() or obj.created_by.username

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_comments_count(self, obj):
        return obj.comments.count()

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.deadline and obj.status != 'completed':
            return timezone.now() > obj.deadline
        return False


class PaymentTransactionSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'workspace', 'amount', 'description',
            'paid_by', 'paid_by_name',
            'received_by', 'received_by_name',
            'status', 'freelancer_confirmed',
            'payment_method', 'transaction_id',
            'created_at', 'confirmed_at'
        ]
    read_only_fields = ['paid_by', 'status', 'created_at', 'confirmed_at']

    def get_paid_by_name(self, obj):
        user = getattr(obj, "paid_by", None)
        if not user:
            return None  # or "" if you prefer empty string in UI
        full_name = user.get_full_name()
        return full_name or user.username

    def get_received_by_name(self, obj):
        user = getattr(obj, "received_by", None)
        if not user:
            return None  # or "Pending" / "" etc.
        full_name = user.get_full_name()
        return full_name or user.username


class PaymentRequestSerializer(serializers.ModelSerializer):
    freelancer_name = serializers.SerializerMethodField()
    transaction_details = PaymentTransactionSerializer(source='transaction', read_only=True)

    class Meta:
        model = PaymentRequest
        fields = [
            'id', 'workspace', 'freelancer', 'freelancer_name',
            'amount', 'message', 'status',
            'transaction', 'transaction_details',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['freelancer', 'status', 'transaction', 'created_at', 'updated_at']

    def get_freelancer_name(self, obj):
        return obj.freelancer.get_full_name() or obj.freelancer.username


class WorkspaceTaskCreateSerializer(serializers.ModelSerializer):
  class Meta:
      model = WorkspaceTask
      fields = [
          'workspace', 'title', 'description',
          'assigned_to', 'status', 'priority', 'deadline'
      ]
      extra_kwargs = {
          'assigned_to': {'required': False, 'allow_null': True},
          'status': {'required': False},
          'priority': {'required': False},
          'deadline': {'required': False, 'allow_null': True},
      }

  def validate_workspace(self, value):
      request = self.context.get('request')
      if not request or not request.user:
          raise serializers.ValidationError("Authentication required")

      contract = value.contract
      if request.user != contract.client and request.user != contract.freelancer:
          raise serializers.ValidationError("You are not part of this workspace")

      return value


class PaymentTransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            'workspace', 'amount', 'description',
            'payment_method', 'transaction_id'
        ]

    def validate_workspace(self, value):
        request = self.context.get('request')
        if not request or not request.user:
            raise serializers.ValidationError("Authentication required")

        if request.user != value.contract.client:
            raise serializers.ValidationError("Only client can log payments")

        return value