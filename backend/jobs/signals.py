from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import Job
from users.models import ClientProfile

User = get_user_model()


def _recalculate_client_job_counts(client: User):
    if not client:
        return
    try:
        profile = client.client_profile
    except ClientProfile.DoesNotExist:
        return

    total = Job.objects.filter(client=client).count()
    active = Job.objects.filter(
        client=client,
        status__in=['open', 'in_progress']
    ).count()
    completed = Job.objects.filter(
        client=client,
        status='completed'
    ).count()

    ClientProfile.objects.filter(pk=profile.pk).update(
        jobs_posted=total,
        active_jobs=active,
        completed_jobs=completed,
    )


@receiver(post_save, sender=Job)
def job_post_save(sender, instance, **kwargs):
    if instance.client_id:
        _recalculate_client_job_counts(instance.client)


@receiver(post_delete, sender=Job)
def job_post_delete(sender, instance, **kwargs):
    if instance.client_id:
        _recalculate_client_job_counts(instance.client)
