
# backend/proposals/admin.py
from django.contrib import admin
from .models import Proposal

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['project', 'freelancer', 'bid_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['project__title', 'freelancer__email', 'cover_letter']
    readonly_fields = ['created_at', 'updated_at']