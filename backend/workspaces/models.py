from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from contracts.models import Contract

User = get_user_model()


class Workspace(models.Model):
    """
    Workspace for a contract (project or job).
    Automatically created when a contract becomes active.
    """
    contract = models.OneToOneField(
        Contract,
        on_delete=models.CASCADE,
        related_name='workspace'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Completion tracking
    client_marked_complete = models.BooleanField(default=False)
    freelancer_marked_complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Workspace"
        verbose_name_plural = "Workspaces"

    def __str__(self):
        contract = self.contract
        if contract.job_application and getattr(contract.job_application, 'job', None):
            title = contract.job_application.job.title
        elif contract.proposal and getattr(contract.proposal, 'project', None):
            title = contract.proposal.project.title
        else:
            title = f"Contract #{contract.id}"
        return f"Workspace - {title}"

    @property
    def is_fully_completed(self):
        """Return True if both parties confirmed completion."""
        return self.client_marked_complete and self.freelancer_marked_complete

    def check_and_complete(self):
        """
        Complete workspace if both parties agreed.

        Even if completed_at was already set earlier, we still update
        contract and project/job status so everything stays in sync.
        """
        from django.utils import timezone

        # Only do anything if both parties have marked complete
        if not self.is_fully_completed:
            return

        # Ensure completed_at is set once
        if not self.completed_at:
            self.completed_at = timezone.now()
            self.save(update_fields=['completed_at'])

        contract = self.contract

        # 1) Update contract status
        if contract.status != 'completed':
            contract.status = 'completed'
            contract.save(update_fields=['status'])

        # 2) Update related project (if this contract came from a project proposal)
        project = None
        if getattr(contract, 'proposal_id', None):
            project = contract.proposal.project

        if project and getattr(project, 'status', None) != 'completed':
            project.status = 'completed'
            project.save(update_fields=['status'])

        # 3) Update related job (if this contract came from a job application)
        job = None
        if getattr(contract, 'job_application_id', None):
            job = contract.job_application.job

        if job and getattr(job, 'status', None) != 'completed':
            job.status = 'completed'
            job.save(update_fields=['status'])



class WorkspaceTask(models.Model):
    """Individual tasks within a workspace."""
    STATUS_CHOICES = (
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)

    # Assignment
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tasks_created'
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks_assigned'
    )

    # Status & Priority
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='todo'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium'
    )

    # Deadlines
    deadline = models.DateTimeField(null=True, blank=True)

    # Attachments
    attachments = models.JSONField(default=list, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['deadline']),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"

    def save(self, *args, **kwargs):
        # Auto-set completed_at when status changes to completed
        from django.utils import timezone

        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != 'completed':
            self.completed_at = None

        # Check if overdue
        if self.deadline and timezone.now() > self.deadline and self.status != 'completed':
            self.status = 'overdue'

        super().save(*args, **kwargs)


class TaskComment(models.Model):
    """Comments on workspace tasks."""
    task = models.ForeignKey(
        WorkspaceTask,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='task_comments'
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user.get_full_name()} on {self.task.title}"


class PaymentTransaction(models.Model):
    """Payment logging system for workspace."""
    STATUS_CHOICES = (
        ('pending', 'Pending Confirmation'),
        ('confirmed', 'Confirmed'),
        ('disputed', 'Disputed'),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='payments'
    )

    # Payment details
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    description = models.TextField(blank=True)

    # Who initiated and received
    paid_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments_made'
    )
    received_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payments_received',
        null=True,
        blank=True,
    )

    # Confirmation
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    freelancer_confirmed = models.BooleanField(default=False)

    # Payment method (optional)
    payment_method = models.CharField(max_length=100, blank=True)
    transaction_id = models.CharField(max_length=200, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"â‚¹{self.amount} - {self.status}"

    def confirm_payment(self):
        """Confirm payment by freelancer"""
        from django.utils import timezone

        if not self.freelancer_confirmed:
            self.freelancer_confirmed = True
            self.status = 'confirmed'
            self.confirmed_at = timezone.now()
            self.save(update_fields=['freelancer_confirmed', 'status', 'confirmed_at'])


class PaymentRequest(models.Model):
    """Freelancer can request payment."""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='payment_requests'
    )
    freelancer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='payment_requests_sent'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    # Linked transaction when paid
    transaction = models.ForeignKey(
        PaymentTransaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='request'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Request â‚¹{self.amount} - {self.status}"