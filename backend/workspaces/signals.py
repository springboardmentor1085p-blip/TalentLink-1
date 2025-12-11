from django.db.models.signals import post_save
from django.dispatch import receiver
from contracts.models import Contract
from .models import Workspace
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Contract)
def create_workspace_on_contract_update(sender, instance, created, **kwargs):
    """
    Create workspace when contract becomes fully signed AND active.
    
    This runs on EVERY contract save, checking if conditions are met.
    """
    try:
        # Check if workspace already exists
        if hasattr(instance, 'workspace'):
            logger.info(f"Workspace already exists for contract #{instance.id}")
            return
        
        # Check if contract is fully signed
        if not instance.is_fully_signed:
            logger.info(f"Contract #{instance.id} not fully signed yet (client: {instance.client_signed}, freelancer: {instance.freelancer_signed})")
            return
        
        # Check if contract is active
        if instance.status != 'active':
            logger.info(f"Contract #{instance.id} status is '{instance.status}', not 'active'")
            return
        
        # All conditions met - create workspace
        workspace = Workspace.objects.create(contract=instance)
        logger.info(f"âœ… Workspace created successfully for contract #{instance.id} (ID: {workspace.id})")
        
        # Send notification to both parties
        from notifications.models import Notification
        
        # Get contract title
        if instance.job_application and hasattr(instance.job_application, 'job'):
            title = instance.job_application.job.title
        elif instance.proposal and hasattr(instance.proposal, 'project'):
            title = instance.proposal.project.title
        else:
            title = f"Contract #{instance.id}"
        
        # Notify client
        if instance.client:
            Notification.objects.create(
                user=instance.client,
                type='WORKSPACE',
                title='Workspace Created',
                message=f'A workspace has been created for "{title}". You can now manage tasks and payments.',
                metadata={'workspace_id': workspace.id, 'contract_id': instance.id}
            )
        
        # Notify freelancer
        if instance.freelancer:
            Notification.objects.create(
                user=instance.freelancer,
                type='WORKSPACE',
                title='Workspace Created',
                message=f'A workspace has been created for "{title}". You can now manage tasks and payments.',
                metadata={'workspace_id': workspace.id, 'contract_id': instance.id}
            )
        
    except Exception as e:
        logger.error(f"âŒ Error creating workspace for contract #{instance.id}: {str(e)}", exc_info=True)