# Register your models here.
from django.contrib import admin
from .models import (
    Workspace, WorkspaceTask, TaskComment,
    PaymentTransaction, PaymentRequest
)


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'contract', 'client_marked_complete',
        'freelancer_marked_complete', 'completed_at', 'created_at'
    ]
    list_filter = ['client_marked_complete', 'freelancer_marked_complete', 'created_at']
    search_fields = ['contract__id']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']


@admin.register(WorkspaceTask)
class WorkspaceTaskAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'title', 'workspace', 'status', 'priority',
        'assigned_to', 'deadline', 'created_at'
    ]
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'task', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['comment', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'workspace', 'amount', 'paid_by',
        'received_by', 'status', 'freelancer_confirmed', 'created_at'
    ]
    list_filter = ['status', 'freelancer_confirmed', 'created_at']
    search_fields = ['description', 'transaction_id']
    readonly_fields = ['created_at', 'confirmed_at']


@admin.register(PaymentRequest)
class PaymentRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'workspace', 'freelancer', 'amount',
        'status', 'created_at'
    ]
    list_filter = ['status', 'created_at']
    search_fields = ['message']
    readonly_fields = ['created_at', 'updated_at']