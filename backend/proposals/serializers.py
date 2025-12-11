from rest_framework import serializers
from .models import Proposal, ProposalAttachment
from users.models import Skill
from users.serializers import UserSerializer, FreelancerProfileSerializer


class ProposalAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProposalAttachment
        fields = ['id', 'file', 'original_name', 'is_resume', 'uploaded_at']


class SimpleSkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name']


class ProposalSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_id = serializers.IntegerField(source='project.id', read_only=True)
    freelancer_id = serializers.IntegerField(source='freelancer.id', read_only=True)

    freelancer = serializers.SerializerMethodField()

    # ✅ NEW: relevant skills (read + write)
    relevant_skills = SimpleSkillSerializer(many=True, read_only=True)
    relevant_skills_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        write_only=True,
        source='relevant_skills',
        queryset=Skill.objects.all()
    )

    # ✅ NEW: attached files
    file_attachments = ProposalAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id',
            'project',
            'project_id',
            'project_title',

            'freelancer',
            'freelancer_id',

            'cover_letter',
            'bid_amount',
            'estimated_time',

            # 🔥 NEW FIELDS
            'proposed_solution',
            'portfolio_links',
            'availability',
            'relevant_skills',      # read
            'relevant_skills_ids',  # write
            'file_attachments',

            'attachments',          # old JSON field, kept for compatibility
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def get_freelancer(self, obj):
        """
        Return full freelancer data including profile, skills, portfolio, etc.
        Mirrors your existing logic; just grouped a bit.
        """
        freelancer_user = obj.freelancer
        user_data = UserSerializer(freelancer_user, context=self.context).data

        try:
            profile = freelancer_user.freelancer_profile
            profile_data = FreelancerProfileSerializer(profile, context=self.context).data

            result = {
                'id': freelancer_user.id,
                'first_name': freelancer_user.first_name,
                'last_name': freelancer_user.last_name,
                'email': freelancer_user.email,
                'avatar': user_data.get('avatar'),
                'bio': freelancer_user.bio,
                'location': freelancer_user.location,
                'rating_avg': freelancer_user.rating_avg,
                'is_top_rated': freelancer_user.rating_avg >= 4.5,

                'hourly_rate': profile_data.get('hourly_rate'),
                'skills': profile_data.get('skills', []),
                'availability': profile_data.get('availability'),
                'portfolio': profile_data.get('portfolio'),
                'portfolio_files': profile_data.get('portfolio_files', []),
                'role_title': profile_data.get('role_title'),
                'social_links': profile_data.get('social_links', {}),
                'languages': profile_data.get('languages', []),
                'experiences': profile_data.get('experiences', []),
                'education': profile_data.get('education', []),
                'projects_completed': profile_data.get('projects_completed', 0),
                'total_earnings': profile_data.get('total_earnings', 0),
            }
            return result

        except Exception as e:
            print(f"Error getting freelancer profile: {e}")
            # Fallback to basic user data
            return {
                'id': freelancer_user.id,
                'first_name': freelancer_user.first_name,
                'last_name': freelancer_user.last_name,
                'email': freelancer_user.email,
                'avatar': user_data.get('avatar'),
                'bio': freelancer_user.bio,
                'location': freelancer_user.location,
                'rating_avg': freelancer_user.rating_avg,
                'is_top_rated': freelancer_user.rating_avg >= 4.5,
                'projects_completed': 0,
            }
