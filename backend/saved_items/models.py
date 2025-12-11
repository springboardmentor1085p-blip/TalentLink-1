# backend/saved_items/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class SavedProject(models.Model):
    """Tracks projects saved by freelancers"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='saved_projects'
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'project')
        ordering = ['-saved_at']
        verbose_name = 'Saved Project'
        verbose_name_plural = 'Saved Projects'

    def __str__(self):
        return f"{self.user.email} saved {self.project.title}"


class SavedJob(models.Model):
    """Tracks jobs saved by freelancers"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='saved_jobs'
    )
    job = models.ForeignKey(
        'jobs.Job',
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'job')
        ordering = ['-saved_at']
        verbose_name = 'Saved Job'
        verbose_name_plural = 'Saved Jobs'

    def __str__(self):
        return f"{self.user.email} saved {self.job.title}"