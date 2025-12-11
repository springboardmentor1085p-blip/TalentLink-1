# backend/talentlink/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import (
    UserViewSet,
    FreelancerProfileViewSet,
    ClientProfileViewSet,
    SkillViewSet,
    EmailTokenObtainPairView,
    ContactMessageView,
)
from projects.views import ProjectViewSet
from proposals.views import ProposalViewSet
from contracts.views import ContractViewSet, ReviewViewSet, ReviewStatsView
from messaging.views import MessageViewSet
from notifications.views import NotificationViewSet
from jobs.views import JobViewSet, JobApplicationViewSet
from workspaces.views import (
    WorkspaceViewSet,
    WorkspaceTaskViewSet,
    PaymentTransactionViewSet,
    PaymentRequestViewSet,
)


def api_root(request):
    return JsonResponse(
        {
            "message": "Welcome to TalentLink API 🚀",
            "version": "1.0",
            "endpoints": {
                "admin": "/admin/",
                "api": "/api/",
                "token": "/api/token/",
                "token_refresh": "/api/token/refresh/",
                "register": "/api/users/register/",
            },
        }
    )


router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"profiles/freelancer", FreelancerProfileViewSet, basename="freelancer-profile")
router.register(r"profiles/client", ClientProfileViewSet, basename="client-profile")
router.register(r"skills", SkillViewSet, basename="skill")
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"proposals", ProposalViewSet, basename="proposal")
router.register(r"contracts", ContractViewSet, basename="contract")
router.register(r"reviews", ReviewViewSet, basename="review")
router.register(r"review-stats", ReviewStatsView, basename="review-stats")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"notifications", NotificationViewSet, basename="notification")
router.register(r"jobs", JobViewSet, basename="job")
router.register(r"job-applications", JobApplicationViewSet, basename="job-application")
router.register(r"workspaces", WorkspaceViewSet, basename="workspace")
router.register(r"tasks", WorkspaceTaskViewSet, basename="workspace-task")
router.register(r"payments", PaymentTransactionViewSet, basename="payment-transaction")
router.register(r"payment-requests", PaymentRequestViewSet, basename="payment-request")

urlpatterns = [
    path("", api_root, name="api-root"),
    path("admin/", admin.site.urls),

    # Router-based endpoints
    path("api/", include(router.urls)),

    # JWT
    path("api/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # App-specific URLs
    path("api/messages/", include("messaging.urls")),
    path("api/jobs/", include("jobs.urls")),
    path("api/saved-items/", include("saved_items.urls")),
    path("api/", include("workspaces.urls")),

    # Contact form
    path("api/contact/", ContactMessageView.as_view(), name="contact-message"),

    # Help centre bot
    path("api/helpcentre/", include("helpcentre.urls")),

    # Forgot / reset password
    path(
        "api/users/forgot-password/",
        UserViewSet.as_view({"post": "forgot_password"}),
        name="forgot-password",
    ),
    path(
        "api/users/reset-password/",
        UserViewSet.as_view({"post": "reset_password"}),
        name="reset-password",
    ),

    # ✅ NEW: explicit delete-account endpoint
    path(
        "api/users/delete-account/",
        UserViewSet.as_view({"delete": "delete_account"}),
        name="delete-account",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
