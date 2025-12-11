from django.core.management.base import BaseCommand
from contracts.models import Contract
from workspaces.models import Workspace
from notifications.models import Notification


class Command(BaseCommand):
    help = 'Create workspaces for existing signed and active contracts that don\'t have one'

    def handle(self, *args, **kwargs):
        """
        Find all contracts that are:
        1. Fully signed (both client_signed and freelancer_signed)
        2. Active status
        3. Don't have a workspace
        
        Then create workspaces for them.
        """
        self.stdout.write(self.style.NOTICE('🔍 Searching for contracts missing workspaces...'))
        
        # Find contracts without workspaces
        contracts_without_workspace = Contract.objects.filter(
            client_signed=True,
            freelancer_signed=True,
            status='active'
        ).exclude(
            workspace__isnull=False
        ).select_related('client', 'freelancer', 'proposal', 'job_application')
        
        count = contracts_without_workspace.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('✅ All active contracts already have workspaces!'))
            return
        
        self.stdout.write(self.style.WARNING(f'Found {count} contract(s) without workspaces'))
        
        created_count = 0
        error_count = 0
        
        for contract in contracts_without_workspace:
            try:
                # Create workspace
                workspace = Workspace.objects.create(contract=contract)
                created_count += 1
                
                # Get title for notifications
                if contract.job_application and hasattr(contract.job_application, 'job'):
                    title = contract.job_application.job.title
                elif contract.proposal and hasattr(contract.proposal, 'project'):
                    title = contract.proposal.project.title
                else:
                    title = f"Contract #{contract.id}"
                
                # Notify both parties
                if contract.client:
                    Notification.objects.create(
                        user=contract.client,
                        type='WORKSPACE',
                        title='Workspace Created',
                        message=f'A workspace has been created for "{title}".',
                        metadata={'workspace_id': workspace.id, 'contract_id': contract.id}
                    )
                
                if contract.freelancer:
                    Notification.objects.create(
                        user=contract.freelancer,
                        type='WORKSPACE',
                        title='Workspace Created',
                        message=f'A workspace has been created for "{title}".',
                        metadata={'workspace_id': workspace.id, 'contract_id': contract.id}
                    )
                
                self.stdout.write(self.style.SUCCESS(f'  ✅ Created workspace for contract #{contract.id} (Workspace ID: {workspace.id})'))
                
            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(f'  ❌ Error creating workspace for contract #{contract.id}: {str(e)}'))
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.NOTICE('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
        self.stdout.write(self.style.SUCCESS(f'✅ Successfully created: {created_count}'))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'❌ Errors: {error_count}'))
        self.stdout.write(self.style.NOTICE('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))