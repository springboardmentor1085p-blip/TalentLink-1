# backend/saved_items/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SavedProjectViewSet, SavedJobViewSet

router = DefaultRouter()
router.register(r'projects', SavedProjectViewSet, basename='saved-projects')
router.register(r'jobs', SavedJobViewSet, basename='saved-jobs')

urlpatterns = [
    path('', include(router.urls)),
]