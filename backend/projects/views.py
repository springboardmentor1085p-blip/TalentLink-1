from django.db.models import Q, Count
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Project
from .serializers import ProjectSerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from proposals.serializers import ProposalSerializer
from proposals.models import Proposal

CATEGORY_GROUPS = {
    "All - Accounting & Consulting": [
        "All - Accounting & Consulting",
        "Personal & Professional Coaching",
        "Accounting & Bookkeeping",
        "Financial Planning",
        "Recruiting & Human Resources",
        "Management Consulting & Analysis",
        "Other - Accounting & Consulting"
    ],
    "All - Admin Support": [
        "All - Admin Support",
        "Data Entry & Transcription Services",
        "Virtual Assistance",
        "Project Management",
        "Market Research & Product Reviews"
    ],
    "All - Customer Service": [
        "All - Customer Service",
        "Community Management & Tagging",
        "Customer Service & Tech Support"
    ],
    "All - Data Science & Analytics": [
        "All - Data Science & Analytics",
        "Data Analysis & Testing",
        "Data Extraction/ETL",
        "Data Mining & Management",
        "AI & Machine Learning"
    ],
    "All - Design & Creative": [
        "All - Design & Creative",
        "Art & Illustration",
        "Audio & Music Production",
        "Branding & Logo Design",
        "NFT, AR/VR & Game Art",
        "Graphic, Editorial & Presentation Design",
        "Performing Arts",
        "Photography",
        "Product Design",
        "Video & Animation"
    ],
    "All - Engineering & Architecture": [
        "All - Engineering & Architecture",
        "Building & Landscape Architecture",
        "Chemical Engineering",
        "Civil & Structural Engineering",
        "Contract Manufacturing",
        "Electrical & Electronic Engineering",
        "Interior & Trade Show Design",
        "Energy & Mechanical Engineering",
        "Physical Sciences",
        "3D Modeling & CAD"
    ],
    "All - IT & Networking": [
        "All - IT & Networking",
        "Database Management & Administration",
        "ERP/CRM Software",
        "Information Security & Compliance",
        "Network & System Administration",
        "DevOps & Solution Architecture"
    ],
    "All - Legal": [
        "All - Legal",
        "Corporate & Contract Law",
        "International & Immigration Law",
        "Finance & Tax Law",
        "Public Law"
    ],
    "All - Sales & Marketing": [
        "All - Sales & Marketing",
        "Digital Marketing",
        "Lead Generation & Telemarketing",
        "Marketing, PR & Brand Strategy"
    ],
    "All - Translation": [
        "All - Translation",
        "Language Tutoring & Interpretation",
        "Translation & Localization Services"
    ],
    "All - Web, Mobile & Software Dev": [
        "All - Web, Mobile & Software Dev",
        "Blockchain, NFT & Cryptocurrency",
        "AI Apps & Integration",
        "Desktop Application Development",
        "Ecommerce Development",
        "Game Design & Development",
        "Mobile Development",
        "Other - Software Development",
        "Product Management & Scrum",
        "QA Testing",
        "Scripts & Utilities",
        "Web & Mobile Design",
        "Web Development"
    ],
    "All - Writing": [
        "All - Writing",
        "Sales & Marketing Copywriting",
        "Content Writing",
        "Editing & Proofreading Services",
        "Professional & Business Writing"
    ]
}


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer

    permission_classes = [AllowAny]

    queryset = (
        Project.objects
        .all()
        .select_related('client')
        .prefetch_related('skills_required', 'file_attachments')
    )

    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_permissions(self):
        """
        Allow unauthenticated users to list and retrieve projects.
        Require authentication for create, update, delete.
        """
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # Automatically assign logged-in user as client
        serializer.save(client=self.request.user)

    def get_queryset(self):
        """
        Filter projects based on multiple criteria.
        Returns queryset of filtered projects.
        """
        params = self.request.query_params

        #  FIX: Check if this is a "my_projects" request from dashboard
        my_projects = params.get('my_projects', '').lower() == 'true'
        
        if my_projects and self.request.user and self.request.user.is_authenticated:
            # Return ALL projects for this client (no visibility or status filter)
            qs = Project.objects.filter(client=self.request.user)
            qs = qs.annotate(num_proposals=Count('proposals'))
            
            print(f"\n✅ MY_PROJECTS MODE: Returning {qs.count()} projects for user {self.request.user.id}")
            return qs

        # Normal public listing (for browse page)
        qs = Project.objects.filter(visibility='public')
        qs = qs.annotate(num_proposals=Count('proposals'))

        # ==========================================
        # DEBUG LOGGING (remove in production)
        # ==========================================
        print("\n" + "="*50)
        print("FILTER REQUEST")
        print("="*50)
        print(f"Initial queryset count: {qs.count()}")
        print(f"Params received: {dict(params)}")
        print("-"*50)

        # ==========================================
        # 1. STATUS FILTER
        # ==========================================
        status = params.get("status", "").strip()
        if status:
            qs = qs.filter(status=status)
            print(f"✓ Status filter '{status}': {qs.count()} projects")

        # ==========================================
        # 2. DURATION FILTER (Project Length)
        # ==========================================
        duration = params.get("duration", "").strip()
        if duration:
            duration_list = [d.strip() for d in duration.split(",") if d.strip()]
            if duration_list:
                qs = qs.filter(duration__in=duration_list)
                print(f"✓ Duration filter {duration_list}: {qs.count()} projects")

        # ==========================================
        # 3. HOURS PER WEEK FILTER
        # ==========================================
        hours_per_week = params.get("hours_per_week", "").strip()
        if hours_per_week:
            hours_list = [h.strip() for h in hours_per_week.split(",") if h.strip()]
            if hours_list:
                qs = qs.filter(hours_per_week__in=hours_list)
                print(f"✓ Hours/week filter {hours_list}: {qs.count()} projects")

        # ==========================================
        # 4. PROPOSAL COUNT FILTER
        # ==========================================
        proposal_range = params.get("proposal_range", "").strip()
        if proposal_range:
            proposal_list = [p.strip() for p in proposal_range.split(",") if p.strip()]
            if proposal_list:
                proposal_query = Q()
                for val in proposal_list:
                    if val == "0":
                        proposal_query |= Q(num_proposals=0)
                    elif val == "1_5":
                        proposal_query |= Q(num_proposals__gte=1, num_proposals__lte=5)
                    elif val == "6_15":
                        proposal_query |= Q(num_proposals__gte=6, num_proposals__lte=15)
                    elif val == "15_30":
                        proposal_query |= Q(num_proposals__gte=15, num_proposals__lte=30)
                    elif val == "30_plus":
                        proposal_query |= Q(num_proposals__gt=30)

                if proposal_query:
                    qs = qs.filter(proposal_query)
                    print(f"✓ Proposal filter {proposal_list}: {qs.count()} projects")

        # ==========================================
        # 5. JOB TYPE & PAYMENT FILTERS 
        # ==========================================
        job_types_param = params.get("job_type", "").strip()

        if job_types_param:
            job_types_list = [j.strip() for j in job_types_param.split(",") if j.strip()]
            print(f"\nJob types selected: {job_types_list}")

            combined_query = Q()

            # -------------------------
            # FIXED PRICE JOB FILTER
            # -------------------------
            if "fixed" in job_types_list:
                fixed_param = (
                    params.get("fixed_payment")
                    or params.get("budget_range")
                    or ""
                ).strip()

                if fixed_param:
                    fixed_ranges = [r.strip() for r in fixed_param.split(",") if r.strip()]
                    print(f"  Fixed ranges: {fixed_ranges}")

                    fixed_query = Q()
                    for r in fixed_ranges:
                        if r == "less_1000":
                            fixed_query |= Q(budget_max__lt=1000)
                        elif r == "1000_5000":
                            fixed_query |= Q(budget_min__gte=1000, budget_max__lte=5000)
                        elif r == "5000_10000":
                            fixed_query |= Q(budget_min__gte=5000, budget_max__lte=10000)
                        elif r == "10000_25000":
                            fixed_query |= Q(budget_min__gte=10000, budget_max__lte=25000)
                        elif r == "25000_plus":
                            fixed_query |= Q(budget_min__gt=25000)

                    combined_query |= Q(job_type="fixed") & fixed_query
                    debug_fixed = Project.objects.filter(Q(job_type="fixed") & fixed_query)
                    print(f"  → Fixed (budget) filter matched: {debug_fixed.count()} projects")
                else:
                    print("  No fixed_payment range provided → include all fixed projects")
                    combined_query |= Q(job_type="fixed")

            # -------------------------
            # HOURLY JOB FILTER
            # -------------------------
            if "hourly" in job_types_list:
                min_rate = params.get("hourly_min", "").strip()
                max_rate = params.get("hourly_max", "").strip()
                print(f"  Hourly filters: min={min_rate}, max={max_rate}")

                hourly_query = Q(job_type="hourly")

                try:
                    if min_rate:
                        hourly_query &= Q(hourly_min__gte=int(min_rate))
                        print(f"    ✓ Min hourly ≥ ₹{min_rate}")
                    if max_rate:
                        hourly_query &= Q(hourly_max__lte=int(max_rate))
                        print(f"    ✓ Max hourly ≤ ₹{max_rate}")
                except ValueError:
                    print("    ⚠ Invalid hourly range input detected")

                debug_hourly = Project.objects.filter(hourly_query)
                print(f"  → Hourly filter matched: {debug_hourly.count()} projects")

                combined_query |= hourly_query

            # -------------------------
            # APPLY COMBINED FILTER
            # -------------------------
            if combined_query:
                before = qs.count()
                qs = qs.filter(combined_query)
                after = qs.count()
                print(f"\n✓ Job type filter applied: {before} → {after} projects")
            else:
                print("\n⚠ No valid job type query built")

        # ==========================================
        # 6. SEARCH FILTER
        # ==========================================
        search = params.get("search", "").strip()
        if search:
            search_query = (
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(skills_required__name__icontains=search)
            )
            qs = qs.filter(search_query).distinct()
            print(f"✓ Search filter '{search}': {qs.count()} projects")

        # ==========================================
        # 7. CATEGORY FILTER (HIERARCHICAL)
        # ==========================================
        category = params.get("category", "").strip()
        if category:
            if category in CATEGORY_GROUPS:
                subcategories = CATEGORY_GROUPS[category]
                qs = qs.filter(category__in=subcategories)
                print(f"✓ Category group filter '{category}': searching in {len(subcategories)} subcategories: {qs.count()} projects")
            else:
                qs = qs.filter(category=category)
                print(f"✓ Category filter '{category}': {qs.count()} projects")

        # ==========================================
        # 8. EXPERIENCE LEVEL FILTER
        # ==========================================
        experience_level = params.get("experience_level", "").strip()
        if experience_level:
            exp_list = [e.strip() for e in experience_level.split(",") if e.strip()]
            if exp_list:
                qs = qs.filter(experience_level__in=exp_list)
                print(f"✓ Experience filter {exp_list}: {qs.count()} projects")

        # ==========================================
        # 9. LOCATION TYPE FILTER
        # ==========================================
        location_type = params.get("location_type", "").strip()
        if location_type:
            loc_list = [l.strip() for l in location_type.split(",") if l.strip()]
            if loc_list:
                qs = qs.filter(location_type__in=loc_list)
                print(f"✓ Location type filter {loc_list}: {qs.count()} projects")

        # ==========================================
        # 10. CLIENT LOCATION FILTER
        # ==========================================
        client_location = params.get("client_location", "").strip()
        if client_location:
            qs = qs.filter(client_location__icontains=client_location)
            print(f"✓ Client location filter '{client_location}': {qs.count()} projects")

        # ==========================================
        # FINAL RESULT
        # ==========================================
        print("-"*50)
        print(f"FINAL RESULT: {qs.count()} projects")
        print("="*50 + "\n")

        return qs

   
    @action(detail=True, methods=['get'], url_path='proposals', permission_classes=[IsAuthenticated])
    def proposals(self, request, pk=None):
        project = self.get_object()
        qs = project.proposals.select_related('freelancer').all()
        ser = ProposalSerializer(qs, many=True, context={'request': request})
        return Response(ser.data)

    def destroy(self, request, *args, **kwargs):
        project = self.get_object()
        if project.client != request.user:
            from rest_framework import status
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)