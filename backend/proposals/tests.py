# backend/proposals/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from projects.models import Project
from .models import Proposal

User = get_user_model()

class ProposalModelTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='pass123',
            role='client'
        )
        self.freelancer = User.objects.create_user(
            email='freelancer@example.com',
            username='freelancer',
            password='pass123',
            role='freelancer'
        )
        self.project = Project.objects.create(
            client=self.client_user,
            title='Test Project',
            description='Description',
            budget_min=1000,
            budget_max=2000,
            duration_estimate='1_month'
        )
    
    def test_proposal_creation(self):
        proposal = Proposal.objects.create(
            project=self.project,
            freelancer=self.freelancer,
            cover_letter='I am interested',
            bid_amount=1500,
            estimated_time='2 weeks'
        )
        self.assertEqual(proposal.project, self.project)
        self.assertEqual(proposal.freelancer, self.freelancer)
        self.assertEqual(proposal.status, 'pending')