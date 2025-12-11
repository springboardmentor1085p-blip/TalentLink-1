# backend/contracts/admin.py
from django.contrib import admin
from .models import Contract, Review, ReviewResponse

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['id', 'project_title_display', 'freelancer', 'client', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['freelancer__email', 'client__email']
    readonly_fields = ['created_at', 'updated_at']

    def project_title_display(self, obj):
        """Display project title safely"""
        if hasattr(obj, 'proposal') and obj.proposal:
            if hasattr(obj.proposal, 'project') and obj.proposal.project:
                return obj.proposal.project.title
            elif hasattr(obj.proposal, 'job') and obj.proposal.job:
                return obj.proposal.job.title
        return "N/A"
    
    project_title_display.short_description = 'Project'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'reviewer_name', 'reviewee_name', 'rating', 'review_type', 'is_verified', 'created_at']
    list_filter = ['review_type', 'is_verified', 'rating', 'created_at']
    search_fields = ['reviewer__email', 'reviewee_email', 'comment']
    readonly_fields = ['created_at']

    def reviewer_name(self, obj):
        return obj.reviewer.get_full_name() if obj.reviewer else obj.reviewer_name_display
    
    def reviewee_name(self, obj):
        return obj.reviewee.get_full_name() if obj.reviewee else obj.reviewee_email
    
    reviewer_name.short_description = 'Reviewer'
    reviewee_name.short_description = 'Reviewee'


@admin.register(ReviewResponse)
class ReviewResponseAdmin(admin.ModelAdmin):
    list_display = ['id', 'review', 'response_text_preview', 'created_at']
    readonly_fields = ['created_at']
    
    def response_text_preview(self, obj):
        return obj.response_text[:50] + '...' if len(obj.response_text) > 50 else obj.response_text
    
    response_text_preview.short_description = 'Response'