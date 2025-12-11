# from django.db import models
# from django.contrib.auth import get_user_model
# from projects.models import Project
# from django.core.validators import MinValueValidator, MaxValueValidator

# User = get_user_model()

# class Proposal(models.Model):
#     STATUS_CHOICES = (
#         ('pending', 'Pending'),
#         ('accepted', 'Accepted'),
#         ('rejected', 'Rejected'),
#         ('withdrawn', 'Withdrawn'),
#     )
    
#     project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='proposals')
#     freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='proposals_sent')
#     cover_letter = models.TextField()
#     bid_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
#     estimated_time = models.CharField(max_length=100)
#     attachments = models.JSONField(default=list, blank=True)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         unique_together = ('project', 'freelancer')
#         ordering = ['-created_at']

#     def __str__(self):
#         return f"Proposal by {self.freelancer} for {self.project}"

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from projects.models import Project
from users.models import Skill  # 🔥 use Skill from users.models

User = get_user_model()


class Proposal(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='proposals'
    )
    freelancer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='proposals_sent'
    )

    # existing core fields
    cover_letter = models.TextField()
    bid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    estimated_time = models.CharField(max_length=100)

    # ✅ NEW FIELDS - Enhanced proposal info
    proposed_solution = models.TextField(
        blank=True,
        null=True,
        help_text="Detailed explanation of how the freelancer will approach the project"
    )
    portfolio_links = models.TextField(
        blank=True,
        null=True,
        help_text="Portfolio URLs (one per line or comma-separated)"
    )
    availability = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Availability selected in the proposal (e.g., 10–30 hrs/week)"
    )
    relevant_skills = models.ManyToManyField(
        Skill,
        blank=True,
        related_name='proposals',
        help_text="Skills specifically highlighted for this proposal"
    )

    # keep this if you already used it earlier
    attachments = models.JSONField(default=list, blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('project', 'freelancer')
        ordering = ['-created_at']

    def __str__(self):
        return f"Proposal by {self.freelancer} for {self.project}"

    def save(self, *args, **kwargs):
        """
        Preserve existing logic: when proposal is accepted, move project to in_progress.
        """
        if self.pk:
            old = Proposal.objects.get(pk=self.pk)
            old_status = old.status
        else:
            old_status = None

        # When proposal is accepted (and was not accepted before), update project
        if self.status == 'accepted' and old_status != 'accepted':
            self.project.status = 'in_progress'
            self.project.save()

        super().save(*args, **kwargs)


class ProposalAttachment(models.Model):
    """
    Resume + portfolio files attached to a proposal.
    """
    proposal = models.ForeignKey(
        Proposal,
        on_delete=models.CASCADE,
        related_name='file_attachments'
    )
    file = models.FileField(upload_to='proposal_attachments/')
    original_name = models.CharField(max_length=255, blank=True)
    is_resume = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.original_name or self.file.name

