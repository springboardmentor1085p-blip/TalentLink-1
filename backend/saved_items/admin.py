# backend/saved_items/admin.py
from django.contrib import admin
from .models import SavedProject, SavedJob


@admin.register(SavedProject)
class SavedProjectAdmin(admin.ModelAdmin):
    list_display = ['user', 'project', 'saved_at']
    list_filter = ['saved_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'project__title']
    readonly_fields = ['saved_at']
    ordering = ['-saved_at']
    list_per_page = 50

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'project')


@admin.register(SavedJob)
class SavedJobAdmin(admin.ModelAdmin):
    list_display = ['user', 'job', 'saved_at']
    list_filter = ['saved_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'job__title']
    readonly_fields = ['saved_at']
    ordering = ['-saved_at']
    list_per_page = 50

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'job')