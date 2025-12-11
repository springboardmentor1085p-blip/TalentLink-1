from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('proposals', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('jobs', '0002_jobapplication_jobapplicationattachment'),
        ('contracts', '0002_contract_job_application'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='review',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddField(
            model_name='contract',
            name='client',
            field=models.ForeignKey(
                help_text='Client who created the job/project.',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='contracts_as_client',
                to=settings.AUTH_USER_MODEL,
                null=True,
                blank=True,
            ),
        ),
        migrations.AddField(
            model_name='contract',
            name='freelancer',
            field=models.ForeignKey(
                help_text='Freelancer hired for this contract.',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='contracts_as_freelancer',
                to=settings.AUTH_USER_MODEL,
                null=True,
                blank=True,
            ),
        ),
        migrations.AlterField(
            model_name='contract',
            name='job_application',
            field=models.OneToOneField(
                blank=True,
                help_text='Linked job application (if created from a job post).',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='contract',
                to='jobs.jobapplication',
            ),
        ),
        migrations.AlterField(
            model_name='contract',
            name='payment_terms',
            field=models.TextField(help_text='Payment terms or milestones.'),
        ),
        migrations.AlterField(
            model_name='contract',
            name='proposal',
            field=models.OneToOneField(
                blank=True,
                help_text='Linked proposal (if created from a project proposal).',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='contract',
                to='proposals.proposal',
            ),
        ),
        migrations.AlterField(
            model_name='contract',
            name='terms',
            field=models.TextField(help_text='Full agreement or scope of work terms.'),
        ),
    ]
