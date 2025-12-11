from django.urls import path
from .views import HelpCentreChatView

urlpatterns = [
    path("chat/", HelpCentreChatView.as_view(), name="helpcentre-chat"),
]
