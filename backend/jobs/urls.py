# backend/jobs/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JobViewSet

router = DefaultRouter()
router.register(r'', JobViewSet, basename='job')

urlpatterns = router.urls