# backend/projects/models.py

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from users.models import Skill

User = get_user_model()


class Project(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    DURATION_CHOICES = (
        ('less_1_month', 'Less than 1 month'),
        ('1_3_months', '1 - 3 months'),
        ('3_6_months', '3 - 6 months'),
        ('6_plus_months', '6+ months'),
    )

    HOURS_PER_WEEK_CHOICES = (
        ('less_10', 'Less than 10 hrs/week'),
        ('10_30', '10—30 hrs/week'),
        ('more_30', 'More than 30 hrs/week'),
    )


    JOB_TYPE_CHOICES = (
        ('hourly', 'Hourly'),
        ('fixed', 'Fixed Price'),
    )

    EXPERIENCE_LEVEL_CHOICES = (
        ('entry', 'Entry Level'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
    )

    LOCATION_TYPE_CHOICES = (
        ('remote', 'Remote'),
        ('hybrid', 'Hybrid'),
        ('onsite', 'Onsite'),
    )

    # ============================================================
    # MAIN PROJECT FIELDS
    # ============================================================
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects_posted')
    title = models.CharField(max_length=200)
    description = models.TextField()
    skills_required = models.ManyToManyField(Skill, blank=True)

    # FIX: Changed to IntegerField to avoid decimal precision issues
    budget_min = models.IntegerField(validators=[MinValueValidator(0)])
    budget_max = models.IntegerField(validators=[MinValueValidator(0)])

    # Duration fields
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES, default='less_1_month')
    duration_estimate = models.CharField(max_length=100, blank=True, null=True)

    hours_per_week = models.CharField(max_length=20, choices=HOURS_PER_WEEK_CHOICES, default='less_30')
    job_type = models.CharField(max_length=10, choices=JOB_TYPE_CHOICES, default='fixed')

    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, default='intermediate')
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPE_CHOICES, default='remote')
    client_location = models.CharField(max_length=200, blank=True, null=True)

    # FIX: Changed payment fields to IntegerField
    fixed_payment = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    hourly_min = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    hourly_max = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])

    # Status and visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    visibility = models.CharField(
        max_length=20,
        choices=[('public', 'Public'), ('private', 'Private')],
        default='public'
    )

    # Attachments
    attachments = models.JSONField(default=list, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


# ============================================================
# PROJECT ATTACHMENT MODEL
# ============================================================
class ProjectAttachment(models.Model):
    """
    Files attached to a Project (downloadable by freelancers).
    """
    project = models.ForeignKey(Project, related_name='file_attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='project_attachments/%Y/%m/%d/')
    original_name = models.CharField(max_length=255, blank=True)
    size = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def filename(self):
        return self.original_name or (self.file.name.split('/')[-1] if self.file else '')

    def __str__(self):
        return f"{self.project_id} - {self.filename()}"