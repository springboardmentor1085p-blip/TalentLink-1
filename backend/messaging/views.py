# backend/messaging/views.py 
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Message, Conversation
from .serializers import MessageSerializer, ConversationSerializer

User = get_user_model()

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(recipient=user))

    def create(self, request, *args, **kwargs):
        recipient_id = request.data.get('recipient')
        content = request.data.get('content')
        file_attachment = request.FILES.get('file_attachment')
        
        try:
            recipient = User.objects.get(id=recipient_id)
        except User.DoesNotExist:
            return Response({'detail': 'Recipient not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get or create conversation
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=recipient
        ).first()
        
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, recipient)
        
        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            recipient=recipient,
            content=content,
            file_attachment=file_attachment
        )
        
        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get all users the current user has conversations with"""
        user = request.user
        messages = self.get_queryset()
        users_in_conversation = set()
        
        for msg in messages:
            if msg.sender != user:
                users_in_conversation.add(msg.sender)
            else:
                users_in_conversation.add(msg.recipient)
        
        from users.serializers import UserSerializer
        return Response(UserSerializer(list(users_in_conversation), many=True).data)

    @action(detail=False, methods=['get'], url_path='with/(?P<user_id>[^/.]+)')
    def with_user(self, request, user_id=None):
        """Get messages with a specific user"""
        messages = self.get_queryset().filter(
            Q(sender_id=user_id, recipient=request.user) |
            Q(sender=request.user, recipient_id=user_id)
        ).order_by('created_at')
        
        # Mark messages as read
        messages.filter(recipient=request.user, read=False).update(read=True)
        
        serializer = self.get_serializer(messages, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search_users(self, request):
        """Search for users to message"""
        query = request.query_params.get('q', '')
        
        if len(query) < 2:
            return Response({'detail': 'Query too short. Minimum 2 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(username__icontains=query)
        ).exclude(id=request.user.id)[:20]  # Limit to 20 results
        
        from users.serializers import UserSerializer
        return Response(UserSerializer(users, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_or_create_thread(request):
    """Get or create a thread with a specific user"""
    other_user_id = request.data.get('user_id')
    
    if not other_user_id:
        return Response({'error': 'user_id required'}, status=400)
    
    try:
        other_user = User.objects.get(id=other_user_id)
        
        # Get or create conversation
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants=other_user
        ).first()
        
        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
        
        return Response({
            'id': other_user.id,
            'thread': {
                'id': other_user.id,
                'conversation_id': conversation.id
            }
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)