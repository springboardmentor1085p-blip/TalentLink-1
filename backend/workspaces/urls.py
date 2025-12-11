from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkspaceViewSet, WorkspaceTaskViewSet,
    PaymentTransactionViewSet, PaymentRequestViewSet
)

router = DefaultRouter()
router.register(r'workspaces', WorkspaceViewSet, basename='workspace')
router.register(r'tasks', WorkspaceTaskViewSet, basename='workspace-task')
router.register(r'payments', PaymentTransactionViewSet, basename='payment-transaction')
router.register(r'payment-requests', PaymentRequestViewSet, basename='payment-request')

urlpatterns = router.urls