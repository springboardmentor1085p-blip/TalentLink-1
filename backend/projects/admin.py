from django.contrib import admin
from .models import Project, ProjectAttachment


class ProjectAttachmentInline(admin.TabularInline):
    model = ProjectAttachment
    extra = 0
    readonly_fields = ('uploaded_at', 'size')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'client', 'category', 'status', 'duration',
        'hours_per_week', 'job_type', 'fixed_payment', 'hourly_min',
        'hourly_max', 'budget_min', 'budget_max',
        'experience_level', 'location_type', 'client_location',
        'created_at'
    ]
    list_filter = [
        'category', 'status', 'duration', 'hours_per_week',
        'job_type', 'experience_level', 'location_type', 'created_at'
    ]
    search_fields = ['title', 'description', 'client__email', 'category']
    filter_horizontal = ['skills_required']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProjectAttachmentInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('client', 'title', 'description', 'skills_required', 'category')
        }),
        ('Budget', {
            'fields': ('budget_min', 'budget_max')
        }),
        ('Project Details', {
            'fields': ('duration', 'hours_per_week', 'job_type',
                       'experience_level', 'location_type', 'client_location')
        }),
        ('Payment Details', {
            'fields': ('fixed_payment', 'hourly_min', 'hourly_max')
        }),
        ('Status & Visibility', {
            'fields': ('status', 'visibility', 'attachments')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
