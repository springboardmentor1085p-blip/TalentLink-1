# backend/jobs/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator

User = get_user_model()


class Job(models.Model):
    """
    Separate model for hourly/contract jobs (different from fixed-price projects)
    """
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

    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='jobs_posted')
    title = models.CharField(max_length=200)
    description = models.TextField()

    job_type = models.CharField(max_length=10, choices=JOB_TYPE_CHOICES, default='hourly')
    experience_level = models.CharField(max_length=20, choices=EXPERIENCE_LEVEL_CHOICES, default='intermediate')
    location_type = models.CharField(max_length=20, choices=LOCATION_TYPE_CHOICES, default='remote')
    location = models.CharField(max_length=200, blank=True, null=True)

    # FIX: Changed to IntegerField for hourly jobs
    hourly_min = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])
    hourly_max = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])

    # FIX: Changed to IntegerField for fixed price jobs
    fixed_amount = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(0)])

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    visibility = models.CharField(max_length=20,
                                  choices=[('public', 'Public'), ('private', 'Private')],
                                  default='public')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class JobAttachment(models.Model):
    job = models.ForeignKey(Job, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='job_attachments/%Y/%m/%d/')
    original_name = models.CharField(max_length=255, blank=True)
    size = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.job_id} - {self.original_name}"


class JobApplication(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    )

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='job_applications_sent')
    cover_letter = models.TextField()
    
    # FIX: Changed to IntegerField for bid amount
    bid_amount = models.IntegerField(validators=[MinValueValidator(0)])

    # NOW OPTIONAL: estimated time should not be forced for jobs like receptionist
    estimated_time = models.CharField(max_length=100, blank=True, null=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('job', 'freelancer')
        ordering = ['-created_at']

    def __str__(self):
        return f"Application by {self.freelancer} for {self.job}"

    def save(self, *args, **kwargs):
        """
        When an application transitions to accepted, mark the job as in_progress.
        """
        if self.pk and self.status == 'accepted':
            old_status = JobApplication.objects.get(pk=self.pk).status
            if old_status != 'accepted':
                self.job.status = 'in_progress'
                self.job.save()
        super().save(*args, **kwargs)


class JobApplicationAttachment(models.Model):
    application = models.ForeignKey(JobApplication, related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='job_application_attachments/%Y/%m/%d/')
    original_name = models.CharField(max_length=255, blank=True)
    size = models.PositiveIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.application_id} - {self.original_name}"