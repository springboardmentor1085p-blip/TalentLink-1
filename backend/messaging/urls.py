# backend/messaging/urls.py (NEW FILE - CREATE THIS)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, get_or_create_thread

router = DefaultRouter()
router.register(r'', MessageViewSet, basename='message')

urlpatterns = [
    path('thread/create/', get_or_create_thread, name='get-or-create-thread'),
    path('', include(router.urls)),
]