# backend/talentlink/settings.py
import os
from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

# ============= SECURITY =============
SECRET_KEY = config('SECRET_KEY', default='your-secret-key-change-in-production')
DEBUG = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

# ============= INSTALLED APPS =============
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party
    'rest_framework',
    'corsheaders',
    
    # Local
    'users.apps.UsersConfig',
    'projects.apps.ProjectsConfig',
    'proposals.apps.ProposalsConfig',
    'contracts.apps.ContractsConfig',
    'messaging.apps.MessagingConfig',
    'notifications.apps.NotificationsConfig',
    'jobs.apps.JobsConfig',
    'saved_items.apps.SavedItemsConfig',
    'workspaces.apps.WorkspacesConfig',
    'helpcentre', 
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'talentlink.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'talentlink.wsgi.application'

# ============= DATABASE =============
import dj_database_url

if config('DATABASE_URL', default=None):
    DATABASES = {
        'default': dj_database_url.config(default=config('DATABASE_URL'), conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ============= AUTH & JWT =============
AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============= REST FRAMEWORK =============
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

# ============= EMAIL / FRONTEND SETTINGS (added) =============
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "talentlink58@gmail.com"
EMAIL_HOST_PASSWORD = "qjyg zwhm lzvr ipnv"  # app password
DEFAULT_FROM_EMAIL = "TalentLink <talentlink58@gmail.com>"

# URL where the React app runs (used in password reset links if needed)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# ============= JWT SETTINGS =============
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


AUTHENTICATION_BACKENDS = [
    'users.authentication.EmailBackend',
    'django.contrib.auth.backends.ModelBackend',
]
# ============= CORS =============
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://localhost:5173',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# ============= INTERNATIONALIZATION =============
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ============= STATIC & MEDIA FILES =============
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800   # 50MB total request body


# Allowed file types 
ALLOWED_FILE_EXTENSIONS = [
    'jpg', 'jpeg', 'png', 'gif', 'pdf', 
    'doc', 'docx', 'txt', 'zip'
]

GEMINI_API_KEY = "AIzaSyDAP829g5RBj_sGpD8aRdedYSUzo1ftfQs"
