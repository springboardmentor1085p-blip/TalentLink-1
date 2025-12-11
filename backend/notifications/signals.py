# backend/notifications/signals.py
# ADD THIS FUNCTION at the top (after imports, before any @receiver)

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from messaging.models import Message
from proposals.models import Proposal
from contracts.models import Contract
from notifications.models import Notification


# ✅ ADD THIS HELPER FUNCTION
def should_notify(user):
    """Check if user has notifications enabled"""
    return getattr(user, 'notifications_enabled', True)


# ========== 1) MESSAGE NOTIFICATIONS ==========
@receiver(post_save, sender=Message)
def notify_new_message(sender, instance, created, **kwargs):
    if not created:
        return

    sender_user = instance.sender
    recipient = instance.recipient

    if not recipient or not sender_user or recipient == sender_user:
        return

    # ✅ ADD THIS CHECK
    if not should_notify(recipient):
        return

    metadata = {
        "conversation_user_id": sender_user.id,
        "sender_name": sender_user.get_full_name() or sender_user.email,
    }

    Notification.objects.create(
        user=recipient,
        type=Notification.TYPE_MESSAGE,
        title="New message received",
        message=f"New message from {sender_user.get_full_name() or sender_user.email}",
        metadata=metadata,
    )


# Store previous status for comparison
_proposal_previous_status = {}

@receiver(pre_save, sender=Proposal)
def track_proposal_status(sender, instance, **kwargs):
    """Track the previous status before save"""
    if instance.pk:
        try:
            old_instance = Proposal.objects.get(pk=instance.pk)
            _proposal_previous_status[instance.pk] = old_instance.status
        except Proposal.DoesNotExist:
            pass


# ========== 2) PROPOSAL NOTIFICATIONS ==========
@receiver(post_save, sender=Proposal)
def notify_proposal_events(sender, instance, created, **kwargs):
    project = instance.project
    freelancer = instance.freelancer
    client = project.client if project else None

    # ---- (a) New proposal submitted → notify client ----
    if created:
        if client and freelancer:
            # ✅ ADD THIS CHECK
            if should_notify(client):
                Notification.objects.create(
                    user=client,
                    type=Notification.TYPE_PROPOSAL,
                    title="New proposal received",
                    message=(
                        f"{freelancer.get_full_name() or freelancer.email} "
                        f"submitted a proposal for \"{project.title}\"."
                    ),
                    metadata={
                        "proposal_id": instance.id,
                        "project_id": project.id,
                        "freelancer_id": freelancer.id,
                        "freelancer_name": freelancer.get_full_name() or freelancer.email,
                    },
                )
        return

    # ---- (b) Proposal status changed → notify freelancer ----
    previous_status = _proposal_previous_status.get(instance.pk)
    current_status = instance.status
    
    if previous_status and previous_status != current_status:
        if current_status in ["accepted", "rejected"] and freelancer and project:
            # ✅ ADD THIS CHECK
            if should_notify(freelancer):
                status_text = "accepted" if current_status == "accepted" else "rejected"
                Notification.objects.create(
                    user=freelancer,
                    type=Notification.TYPE_PROPOSAL,
                    title=f"Proposal {status_text}",
                    message=f"Your proposal for \"{project.title}\" was {status_text}.",
                    metadata={
                        "proposal_id": instance.id,
                        "project_id": project.id,
                        "status": current_status,
                    },
                )
    
    if instance.pk in _proposal_previous_status:
        del _proposal_previous_status[instance.pk]


# ========== 3) CONTRACT NOTIFICATIONS ==========
@receiver(post_save, sender=Contract)
def notify_contract_created(sender, instance, created, **kwargs):
    if not created:
        return

    proposal = instance.proposal
    if not proposal:
        return

    project = proposal.project
    freelancer = proposal.freelancer
    client = project.client if project else None

    title = (
        f"New contract for \"{project.title}\""
        if project else "New contract created"
    )
    message = "A new contract has been created. Please sign it to proceed."

    metadata = {
        "contract_id": instance.id,
        "proposal_id": proposal.id,
    }
    if project:
        metadata["project_id"] = project.id
        metadata["project_title"] = project.title

    # Notify client
    if client:
        # ✅ ADD THIS CHECK
        if should_notify(client):
            Notification.objects.create(
                user=client,
                type=Notification.TYPE_CONTRACT,
                title=title,
                message=message,
                metadata=metadata,
            )

    # Notify freelancer
    if freelancer:
        # ✅ ADD THIS CHECK
        if should_notify(freelancer):
            Notification.objects.create(
                user=freelancer,
                type=Notification.TYPE_CONTRACT,
                title=title,
                message=message,
                metadata=metadata,
            )