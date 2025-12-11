from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, FreelancerProfile, Skill, ClientProfile, PortfolioFile

# -------------------------
# User
# -------------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 'role', 'rating_avg', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'avatar', 'bio', 'location', 'rating_avg', 'phone', 'birthdate')}),
    )

# -------------------------
# Portfolio file helpers
# -------------------------
class PortfolioFileInline(admin.TabularInline):
    """
    Shows portfolio files right on the FreelancerProfile admin page,
    with a clickable link and a small image preview when applicable.
    """
    model = PortfolioFile
    extra = 0
    fields = ('file_name', 'file_size_kb', 'file_link', 'image_preview', 'uploaded_at')
    readonly_fields = ('file_size_kb', 'file_link', 'image_preview', 'uploaded_at')

    def file_link(self, obj):
        return format_html('<a href="{}" target="_blank">Open</a>', obj.file.url) if obj.file else '—'
    file_link.short_description = 'Open'

    def image_preview(self, obj):
        if obj.file:
            name = str(obj.file.name).lower()
            if name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                return format_html('<img src="{}" style="max-height:120px;border-radius:6px;" />', obj.file.url)
        return '—'
    image_preview.short_description = 'Preview'

    def file_size_kb(self, obj):
        size = getattr(obj, 'file_size', None) or (obj.file.size if obj.file else 0)
        return f"{(size or 0)/1024:.1f} KB"
    file_size_kb.short_description = 'Size'

# -------------------------
# Freelancer profile
# -------------------------
@admin.register(FreelancerProfile)
class FreelancerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role_title', 'hourly_rate', 'availability', 'total_earnings', 'projects_completed']
    list_filter = ['availability', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'role_title']
    filter_horizontal = ['skills']
    inlines = [PortfolioFileInline]

    readonly_fields = ['user_location']

    fieldsets = (
        (None, {
            'fields': ('user', 'role_title', 'hourly_rate', 'availability', 'user_location')
        }),
        ('Skills & Portfolio', {
            'fields': ('skills', 'portfolio')
        }),
        ('Links & Details', {
            'fields': ('social_links', 'languages', 'experiences', 'education')
        }),
        ('Stats', {
            'fields': ('total_earnings', 'projects_completed')
        }),
    )

    def user_location(self, obj):
        return obj.user.location
    user_location.short_description = "Location (from User)"

# -------------------------
# Skills
# -------------------------
@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_per_page = 50
    ordering = ['name']

    def created_at(self, obj):
        return "N/A"

# -------------------------
# Client profile
# -------------------------

@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'company_name', 'is_verified',
        'verification_submitted_at', 'id_document_link',
        'projects_posted', 'active_projects', 'completed_projects',
        'jobs_posted', 'active_jobs', 'completed_jobs',
        'created_at',
    ]
    list_filter = ['is_verified', 'created_at', 'verification_submitted_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'company_name']
    readonly_fields = ['verification_submitted_at', 'id_document_preview']

    fieldsets = (
        (None, {'fields': ('user', 'company_name', 'company_website')}),
        ('Verification', {
            'fields': ('id_document', 'id_document_preview', 'is_verified', 'verification_submitted_at')
        }),
        ('Stats', {
            'fields': (
                'projects_posted', 'active_projects', 'completed_projects',
                'jobs_posted', 'active_jobs', 'completed_jobs',
            )
        }),
    )

    actions = ['approve_verification', 'revoke_verification']

    def id_document_link(self, obj):
        if obj.id_document:
            return format_html('<a href="{}" target="_blank">View ID</a>', obj.id_document.url)
        return '-'
    id_document_link.short_description = 'ID document'

    def id_document_preview(self, obj):
        if not obj.id_document:
            return '-'
        url = obj.id_document.url
        if url.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            return format_html('<img src="{}" style="max-width:240px;border:1px solid #ddd;" />', url)
        return format_html('<a href="{}" target="_blank">Open document</a>', url)
    id_document_preview.short_description = 'Preview'

    def approve_verification(self, request, queryset):
        updated = queryset.update(is_verified=True)
        self.message_user(request, f"Approved verification for {updated} client(s).")
    approve_verification.short_description = "Approve verification"

    def revoke_verification(self, request, queryset):
        updated = queryset.update(is_verified=False)
        self.message_user(request, f"Revoked verification for {updated} client(s).")
    revoke_verification.short_description = "Revoke verification"

# -------------------------
# Portfolio files (list page)
# -------------------------
@admin.register(PortfolioFile)
class PortfolioFileAdmin(admin.ModelAdmin):
    list_display = ['freelancer_profile', 'file_name', 'file_size_kb', 'file_link', 'uploaded_at']
    list_filter = ['uploaded_at']
    search_fields = ['freelancer_profile__user__username', 'freelancer_profile__user__email', 'file_name']
    readonly_fields = ['uploaded_at', 'file_size_kb', 'file_link', 'image_preview']
    fields = ['freelancer_profile', 'file', 'file_name', 'file_size_kb', 'file_link', 'image_preview', 'uploaded_at']

    def file_link(self, obj):
        return format_html('<a href="{}" target="_blank">{}</a>', obj.file.url, obj.file_name or obj.file.name) if obj.file else '—'
    file_link.short_description = 'Open'

    def image_preview(self, obj):
        if obj.file:
            name = str(obj.file.name).lower()
            if name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
                return format_html('<img src="{}" style="max-height:160px;border-radius:6px;" />', obj.file.url)
        return '—'
    image_preview.short_description = 'Preview'

    def file_size_kb(self, obj):
        size = getattr(obj, 'file_size', None) or (obj.file.size if obj.file else 0)
        return f"{(size or 0)/1024:.1f} KB"
    file_size_kb.short_description = 'Size'
