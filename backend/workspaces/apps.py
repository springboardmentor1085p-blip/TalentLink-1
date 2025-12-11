# backend/workspaces/apps.py
from django.apps import AppConfig


class WorkspacesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'workspaces'
    verbose_name = 'Workspaces'

    def ready(self):
        """Import signals when app is ready"""
        import workspaces.signals