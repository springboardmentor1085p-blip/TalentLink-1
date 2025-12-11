from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Project
from users.models import ClientProfile

User = get_user_model()


def _recalculate_client_project_counts(client: User):
    if not client:
        return
    try:
        profile = client.client_profile
    except ClientProfile.DoesNotExist:
        return

    total = Project.objects.filter(client=client).count()
    active = Project.objects.filter(
        client=client,
        status__in=['open', 'in_progress']
    ).count()
    completed = Project.objects.filter(
        client=client,
        status='completed'
    ).count()

    ClientProfile.objects.filter(pk=profile.pk).update(
        projects_posted=total,
        active_projects=active,
        completed_projects=completed,
    )


@receiver(post_save, sender=Project)
def project_post_save(sender, instance, **kwargs):
    if instance.client_id:
        _recalculate_client_project_counts(instance.client)


@receiver(post_delete, sender=Project)
def project_post_delete(sender, instance, **kwargs):
    if instance.client_id:
        _recalculate_client_project_counts(instance.client)
