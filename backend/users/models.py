# backend/users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    ROLE_CHOICES = (('client', 'Client'), ('freelancer', 'Freelancer'))
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='freelancer')
    email = models.EmailField(unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=32, blank=True)
    birthdate = models.DateField(null=True, blank=True)

    rating_avg = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notifications_enabled = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.get_username()


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    is_custom = models.BooleanField(default=False)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class FreelancerProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='freelancer_profile'
    )
    hourly_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    skills = models.ManyToManyField('Skill', blank=True)
    availability = models.CharField(
        max_length=50,
        choices=[
            ('full-time', 'Full-time'),
            ('part-time', 'Part-time'),
            ('contract', 'Contract')
        ],
        default='part-time'
    )
    resume_file = models.FileField(upload_to='resumes/', null=True, blank=True)
    portfolio = models.TextField(blank=True, help_text="Portfolio description or URLs")
    intro_video_url = models.URLField(blank=True)
    social_links = models.JSONField(default=dict, blank=True)

    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    projects_completed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    # Onboarding fields
    category = models.CharField(max_length=64, blank=True)
    custom_category = models.CharField(max_length=128, blank=True)
    role_title = models.CharField(max_length=128, blank=True)
    languages = models.JSONField(default=list, blank=True)
    experiences = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - Freelancer"


class PortfolioFile(models.Model):
    freelancer_profile = models.ForeignKey(
        FreelancerProfile,
        on_delete=models.CASCADE,
        related_name='portfolio_files'
    )
    file = models.FileField(upload_to='portfolio_files/')
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()  # in bytes
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.freelancer_profile.user.username} - {self.file_name}"


class ClientProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='client_profile'
    )
    company_name = models.CharField(max_length=200, blank=True)
    company_website = models.URLField(blank=True)
    id_document = models.FileField(upload_to='client_ids/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_submitted_at = models.DateTimeField(null=True, blank=True)

    # Project counters
    projects_posted = models.IntegerField(default=0)
    active_projects = models.IntegerField(default=0)
    completed_projects = models.IntegerField(default=0)

    # Job counters
    jobs_posted = models.IntegerField(default=0)
    active_jobs = models.IntegerField(default=0)
    completed_jobs = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # Keeping this as-is to avoid changing existing behaviour
        return f"{self.user.get_full_name()} - Freelancer"


# ✅ NEW: model used by ContactMessageSerializer / ContactMessageView
class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} <{self.email}>"
