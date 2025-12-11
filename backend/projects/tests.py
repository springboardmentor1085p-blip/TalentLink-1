# backend/projects/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Project
from users.models import Skill

User = get_user_model()

class ProjectModelTests(TestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(
            email='client@example.com',
            username='client',
            password='pass123',
            role='client'
        )
        self.skill = Skill.objects.create(name='Python', slug='python')
    
    def test_project_creation(self):
        project = Project.objects.create(
            client=self.client_user,
            title='Test Project',
            description='Test Description',
            budget_min=1000,
            budget_max=2000,
            duration_estimate='1_month'
        )
        project.skills_required.add(self.skill)
        
        self.assertEqual(project.title, 'Test Project')
        self.assertEqual(project.client, self.client_user)
        self.assertEqual(project.skills_required.count(), 1)