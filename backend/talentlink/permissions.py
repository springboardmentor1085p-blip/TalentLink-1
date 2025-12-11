# backend/talentlink/permissions.py
from rest_framework import permissions

class IsClient(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'

class IsFreelancer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'freelancer'

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'client'):
            return obj.client == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False