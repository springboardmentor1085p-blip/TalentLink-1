
# backend/jobs/admin.py
from django.contrib import admin
from .models import Job, JobAttachment, JobApplication, JobApplicationAttachment

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'job_type', 'status', 'created_at')
    list_filter = ('job_type', 'status', 'experience_level', 'location_type')
    search_fields = ('title', 'description')
    date_hierarchy = 'created_at'

@admin.register(JobAttachment)
class JobAttachmentAdmin(admin.ModelAdmin):
    list_display = ('job', 'original_name', 'size', 'uploaded_at')
    date_hierarchy = 'uploaded_at'

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('id', 'freelancer', 'job', 'bid_amount', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('freelancer__email', 'freelancer__first_name', 'freelancer__last_name', 'job__title', 'cover_letter')
    date_hierarchy = 'created_at'
    raw_id_fields = ('job', 'freelancer')

@admin.register(JobApplicationAttachment)
class JobApplicationAttachmentAdmin(admin.ModelAdmin):
    list_display = ('application', 'original_name', 'size', 'uploaded_at')
    date_hierarchy = 'uploaded_at'
    raw_id_fields = ('application',)