from rest_framework import serializers
from .models import Message, Conversation

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'recipient', 'recipient_name', 
                  'content', 'file_attachment', 'file_url', 'attachments', 'read', 'created_at']
        read_only_fields = ['sender', 'created_at', 'conversation']
    
    def get_file_url(self, obj):
        if obj.file_attachment:
            return obj.file_attachment.url
        return None

class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.StringRelatedField(many=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'last_message', 'created_at', 'updated_at']
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None