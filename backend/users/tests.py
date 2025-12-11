# backend/users/tests.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import FreelancerProfile, Skill

User = get_user_model()

class UserModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            role='freelancer'
        )
    
    def test_user_creation(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.role, 'freelancer')
        self.assertTrue(self.user.check_password('testpass123'))
    
    def test_freelancer_profile_creation(self):
        profile = FreelancerProfile.objects.create(
            user=self.user,
            hourly_rate=50.00
        )
        self.assertEqual(profile.user, self.user)
        self.assertEqual(float(profile.hourly_rate), 50.00)


class SkillModelTests(TestCase):
    def test_skill_creation(self):
        skill = Skill.objects.create(name='Python', slug='python')
        self.assertEqual(skill.name, 'Python')
        self.assertEqual(skill.slug, 'python')