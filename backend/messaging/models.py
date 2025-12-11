from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Conversation(models.Model):
    """Track conversations between two users"""
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        users = self.participants.all()
        return f"Conversation: {', '.join([u.get_full_name() for u in users])}"

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages', null=True)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_sent')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages_received')
    content = models.TextField()
    file_attachment = models.FileField(upload_to='message_attachments/', null=True, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    read = models.BooleanField(default=False)
    is_encrypted = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message from {self.sender} to {self.recipient}"