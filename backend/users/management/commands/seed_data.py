# backend/users/management/commands/seed_data.py
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import FreelancerProfile, Skill
from projects.models import Project
from proposals.models import Proposal
from contracts.models import Contract, Review
from messaging.models import Message
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with sample data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # Create Skills - EXPANDED LIST
        skills_data = [
            # Programming Languages
            'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
            'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Perl', 'Dart', 'Objective-C',
            
            # Web Development
            'React', 'Angular', 'Vue.js', 'Node.js', 'Django', 'Flask', 'FastAPI', 'Express.js',
            'Next.js', 'Nuxt.js', 'Svelte', 'jQuery', 'Bootstrap', 'Tailwind CSS', 'Material-UI',
            'HTML5', 'CSS3', 'SASS', 'LESS', 'Webpack', 'Vite',
            
            # Backend & APIs
            'REST API', 'GraphQL', 'gRPC', 'WebSockets', 'Microservices', 'Spring Boot',
            'Laravel', 'Ruby on Rails', 'ASP.NET', '.NET Core',
            
            # Mobile Development
            'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin',
            'Ionic', 'Cordova', 'SwiftUI',
            
            # Databases
            'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'Cassandra',
            'Oracle', 'SQL Server', 'SQLite', 'Firebase', 'DynamoDB', 'Neo4j',
            
            # Cloud & DevOps
            'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI',
            'GitHub Actions', 'Terraform', 'Ansible', 'CircleCI', 'Travis CI',
            
            # Data Science & AI
            'Machine Learning', 'Deep Learning', 'Data Science', 'Data Analysis', 'TensorFlow',
            'PyTorch', 'Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter', 'NLP',
            'Computer Vision', 'AI/ML', 'Big Data', 'Apache Spark', 'Hadoop',
            
            # Design
            'UI/UX Design', 'Graphic Design', 'Web Design', 'Logo Design', 'Brand Identity',
            'Figma', 'Adobe XD', 'Sketch', 'Adobe Photoshop', 'Adobe Illustrator',
            'InDesign', 'Canva', 'Prototyping', 'Wireframing', '3D Design', 'Blender',
            'AutoCAD', 'Animation', 'Video Editing', 'After Effects', 'Premiere Pro',
            
            # Marketing & Business
            'Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Marketing',
            'Email Marketing', 'Google Analytics', 'Facebook Ads', 'Google Ads',
            'Content Writing', 'Copywriting', 'Technical Writing', 'Blog Writing',
            'Proofreading', 'Translation', 'Transcription',
            
            # Project Management
            'Project Management', 'Agile', 'Scrum', 'Jira', 'Trello', 'Asana', 'Slack',
            'Product Management', 'Business Analysis', 'Requirements Gathering',
            
            # Testing & QA
            'Software Testing', 'QA', 'Manual Testing', 'Automation Testing', 'Selenium',
            'Cypress', 'Jest', 'Pytest', 'Unit Testing', 'Integration Testing',
            
            # Blockchain & Web3
            'Blockchain', 'Ethereum', 'Solidity', 'Smart Contracts', 'Web3', 'Cryptocurrency',
            'NFT', 'DeFi',
            
            # Game Development
            'Unity', 'Unreal Engine', 'Game Development', 'Game Design', '2D Game Development',
            '3D Game Development', 'Godot',
            
            # Security
            'Cybersecurity', 'Penetration Testing', 'Ethical Hacking', 'Network Security',
            'Information Security',
            
            # Other Technologies
            'Linux', 'Windows Server', 'System Administration', 'Network Administration',
            'WordPress', 'Shopify', 'WooCommerce', 'E-commerce', 'CMS Development',
            'API Development', 'Database Design', 'Data Modeling', 'ETL',
            'Version Control', 'Git', 'GitHub', 'GitLab', 'Bitbucket',
            
            # Soft Skills
            'Communication', 'Problem Solving', 'Team Collaboration', 'Time Management',
            'Critical Thinking', 'Leadership', 'Customer Service'
        ]
        
        skills = []
        for skill_name in skills_data:
            skill, created = Skill.objects.get_or_create(
                name=skill_name,
                defaults={'slug': skill_name.lower().replace(' ', '-').replace('/', '-').replace('.', '')}
            )
            skills.append(skill)
            if created:
                self.stdout.write(f'Created skill: {skill_name}')
        
        self.stdout.write(self.style.SUCCESS(f'Created/verified {len(skills)} skills'))

        # Create Clients
        clients = []
        client_data = [
            {
                'email': 'john.client@example.com',
                'username': 'johnclient',
                'first_name': 'John',
                'last_name': 'Doe',
                'role': 'client',
                'location': 'New York, USA',
                'bio': 'Tech startup founder looking for talented developers'
            },
            {
                'email': 'sarah.manager@example.com',
                'username': 'sarahmanager',
                'first_name': 'Sarah',
                'last_name': 'Smith',
                'role': 'client',
                'location': 'London, UK',
                'bio': 'Project manager at a digital agency'
            }
        ]

        for data in client_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['username'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': data['role'],
                    'location': data['location'],
                    'bio': data['bio']
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            clients.append(user)
        
        self.stdout.write(f'Created {len(clients)} clients')

        # Create Freelancers
        freelancers = []
        freelancer_data = [
            {
                'email': 'alex.dev@example.com',
                'username': 'alexdev',
                'first_name': 'Alex',
                'last_name': 'Johnson',
                'location': 'San Francisco, USA',
                'bio': 'Full-stack developer with 5+ years experience',
                'hourly_rate': 75.00,
                'availability': 'full-time',
                'skills': ['Python', 'JavaScript', 'React', 'Django'],
                'portfolio': 'Built 20+ web applications for startups and enterprises'
            },
            {
                'email': 'maria.designer@example.com',
                'username': 'mariadesigner',
                'first_name': 'Maria',
                'last_name': 'Garcia',
                'location': 'Barcelona, Spain',
                'bio': 'Creative UI/UX designer passionate about user-centered design',
                'hourly_rate': 60.00,
                'availability': 'part-time',
                'skills': ['UI/UX Design', 'Graphic Design'],
                'portfolio': 'Designed interfaces for mobile apps with 1M+ downloads'
            },
            {
                'email': 'david.writer@example.com',
                'username': 'davidwriter',
                'first_name': 'David',
                'last_name': 'Chen',
                'location': 'Singapore',
                'bio': 'Content writer specializing in tech and marketing',
                'hourly_rate': 45.00,
                'availability': 'contract',
                'skills': ['Content Writing', 'SEO', 'Digital Marketing'],
                'portfolio': 'Written 500+ articles for tech blogs and SaaS companies'
            }
        ]

        for data in freelancer_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'username': data['username'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': 'freelancer',
                    'location': data['location'],
                    'bio': data['bio']
                }
            )
            if created:
                user.set_password('password123')
                user.save()

            profile, _ = FreelancerProfile.objects.get_or_create(
                user=user,
                defaults={
                    'hourly_rate': Decimal(data['hourly_rate']),
                    'availability': data['availability'],
                    'portfolio': data['portfolio']
                }
            )
            
            for skill_name in data['skills']:
                skill = Skill.objects.get(name=skill_name)
                profile.skills.add(skill)
            
            freelancers.append(user)
        
        self.stdout.write(f'Created {len(freelancers)} freelancers')

        # Create Projects
        projects = []
        project_data = [
            {
                'client': clients[0],
                'title': 'E-commerce Website Development',
                'description': 'Looking for a full-stack developer to build a modern e-commerce platform with payment integration, inventory management, and admin dashboard.',
                'skills': ['Python', 'Django', 'React', 'PostgreSQL'],
                'budget_min': 3000,
                'budget_max': 5000,
                'duration_estimate': '3_months',
                'status': 'open'
            },
            {
                'client': clients[0],
                'title': 'Mobile App UI/UX Design',
                'description': 'Need a talented designer to create wireframes and high-fidelity mockups for a fitness tracking mobile app.',
                'skills': ['UI/UX Design', 'Graphic Design'],
                'budget_min': 1500,
                'budget_max': 2500,
                'duration_estimate': '1_month',
                'status': 'open'
            },
            {
                'client': clients[1],
                'title': 'Content Writing for Tech Blog',
                'description': 'Seeking an experienced tech writer to create 10 SEO-optimized blog posts about AI and machine learning.',
                'skills': ['Content Writing', 'SEO'],
                'budget_min': 800,
                'budget_max': 1200,
                'duration_estimate': '1_month',
                'status': 'open'
            },
            {
                'client': clients[1],
                'title': 'React Dashboard Development',
                'description': 'Build an admin dashboard with charts, tables, and data visualization using React and modern UI libraries.',
                'skills': ['React', 'JavaScript', 'TypeScript'],
                'budget_min': 2000,
                'budget_max': 3500,
                'duration_estimate': '1_month',
                'status': 'in_progress'
            },
            {
                'client': clients[0],
                'title': 'SEO Optimization Service',
                'description': 'Looking for an SEO expert to optimize our website and improve search rankings.',
                'skills': ['SEO', 'Digital Marketing'],
                'budget_min': 1000,
                'budget_max': 2000,
                'duration_estimate': '1_month',
                'status': 'open'
            },
            {
                'client': clients[1],
                'title': 'API Development with Node.js',
                'description': 'Need a backend developer to create RESTful APIs for our mobile application.',
                'skills': ['Node.js', 'JavaScript', 'MongoDB'],
                'budget_min': 2500,
                'budget_max': 4000,
                'duration_estimate': '1_month',
                'status': 'completed'
            }
        ]

        for data in project_data:
            project, _ = Project.objects.get_or_create(
                client=data['client'],
                title=data['title'],
                defaults={
                    'description': data['description'],
                    'budget_min': Decimal(data['budget_min']),
                    'budget_max': Decimal(data['budget_max']),
                    'duration_estimate': data['duration_estimate'],
                    'status': data['status']
                }
            )
            for skill_name in data['skills']:
                skill = Skill.objects.get(name=skill_name)
                project.skills_required.add(skill)
            projects.append(project)
        
        self.stdout.write(f'Created {len(projects)} projects')

        # Create Proposals
        proposals = []
        proposal_data = [
            {
                'project': projects[0],
                'freelancer': freelancers[0],
                'cover_letter': 'I have extensive experience building e-commerce platforms with Django and React. I can deliver a scalable solution with all the features you need.',
                'bid_amount': 4200,
                'estimated_time': '10 weeks',
                'status': 'pending'
            },
            {
                'project': projects[1],
                'freelancer': freelancers[1],
                'cover_letter': 'As a UI/UX designer, I specialize in creating intuitive mobile app designs. I would love to work on your fitness app project.',
                'bid_amount': 2000,
                'estimated_time': '4 weeks',
                'status': 'accepted'
            },
            {
                'project': projects[2],
                'freelancer': freelancers[2],
                'cover_letter': 'I am a professional tech writer with expertise in AI/ML topics. I can create engaging, SEO-optimized content for your blog.',
                'bid_amount': 1000,
                'estimated_time': '3 weeks',
                'status': 'pending'
            },
            {
                'project': projects[3],
                'freelancer': freelancers[0],
                'cover_letter': 'I can build a modern React dashboard with beautiful charts and data visualization. My recent projects include similar work.',
                'bid_amount': 2800,
                'estimated_time': '5 weeks',
                'status': 'accepted'
            },
            {
                'project': projects[4],
                'freelancer': freelancers[2],
                'cover_letter': 'SEO is my specialty. I have helped numerous websites improve their search rankings through technical and content optimization.',
                'bid_amount': 1500,
                'estimated_time': '4 weeks',
                'status': 'pending'
            }
        ]

        for data in proposal_data:
            proposal, _ = Proposal.objects.get_or_create(
                project=data['project'],
                freelancer=data['freelancer'],
                defaults={
                    'cover_letter': data['cover_letter'],
                    'bid_amount': Decimal(data['bid_amount']),
                    'estimated_time': data['estimated_time'],
                    'status': data['status']
                }
            )
            proposals.append(proposal)
        
        self.stdout.write(f'Created {len(proposals)} proposals')

        # Create Contracts
        contracts = []
        accepted_proposals = [p for p in proposals if p.status == 'accepted']
        
        for proposal in accepted_proposals:
            contract, _ = Contract.objects.get_or_create(
                proposal=proposal,
                defaults={
                    'client_signed': True,
                    'freelancer_signed': True,
                    'status': 'active',
                    'terms': f'Contract for {proposal.project.title}. Deliverables as discussed. Payment upon completion.',
                    'payment_terms': 'Full payment on project completion'
                }
            )
            contracts.append(contract)
        
        self.stdout.write(f'Created {len(contracts)} contracts')

        # Create Messages
        messages = []
        message_data = [
            {
                'sender': clients[0],
                'recipient': freelancers[0],
                'content': 'Hi Alex, I saw your proposal for the e-commerce project. Can we schedule a call to discuss the details?'
            },
            {
                'sender': freelancers[0],
                'recipient': clients[0],
                'content': 'Absolutely! I am available tomorrow afternoon. What time works best for you?'
            },
            {
                'sender': clients[1],
                'recipient': freelancers[1],
                'content': 'Maria, your design portfolio is impressive! I would like to move forward with your proposal.'
            },
            {
                'sender': freelancers[1],
                'recipient': clients[1],
                'content': 'Thank you! I am excited to work on this project. When can we start?'
            },
            {
                'sender': freelancers[2],
                'recipient': clients[1],
                'content': 'Hi Sarah, I just submitted my proposal for the content writing project. Let me know if you have any questions!'
            }
        ]

        for data in message_data:
            message, _ = Message.objects.get_or_create(
                sender=data['sender'],
                recipient=data['recipient'],
                content=data['content']
            )
            messages.append(message)
        
        self.stdout.write(f'Created {len(messages)} messages')

        # Create Reviews
        reviews = []
        if contracts:
            review_data = [
                {
                    'contract': contracts[0],
                    'reviewer': contracts[0].proposal.project.client,
                    'reviewee': contracts[0].proposal.freelancer,
                    'rating': 5,
                    'comment': 'Excellent work! Maria delivered beautiful designs ahead of schedule. Highly recommended!'
                },
                {
                    'contract': contracts[0],
                    'reviewer': contracts[0].proposal.freelancer,
                    'reviewee': contracts[0].proposal.project.client,
                    'rating': 5,
                    'comment': 'Great client! Clear communication and prompt feedback throughout the project.'
                }
            ]

            for data in review_data:
                review, _ = Review.objects.get_or_create(
                    contract=data['contract'],
                    reviewer=data['reviewer'],
                    defaults={
                        'reviewee': data['reviewee'],
                        'rating': data['rating'],
                        'comment': data['comment']
                    }
                )
                reviews.append(review)
            
            self.stdout.write(f'Created {len(reviews)} reviews')

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))
        self.stdout.write(f'\nTest Accounts Created:')
        self.stdout.write(f'  Clients: john.client@example.com / sarah.manager@example.com')
        self.stdout.write(f'  Freelancers: alex.dev@example.com / maria.designer@example.com / david.writer@example.com')
        self.stdout.write(f'  Password for all: password123')