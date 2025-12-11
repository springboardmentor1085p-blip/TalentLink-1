# backend/messaging/admin.py
from django.contrib import admin
from .models import Message

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient', 'content_preview', 'read', 'created_at']
    list_filter = ['read', 'created_at']
    search_fields = ['content', 'sender__email', 'recipient__email']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'