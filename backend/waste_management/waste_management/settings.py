"""
Django settings for waste_management project.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(_file_).resolve().parent.parent

# Load environment variables
load_dotenv()
env = environ.Env(
    DEBUG=(bool, False)
)

# Read .env file for local development
env_file = os.path.join(BASE_DIR, '..', '.env')
if os.path.exists(env_file):
    environ.Env.read_env(env_file)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-cw#9ejscj#(^oa6*=yhs()pyu9wf%n#-f7zzsq)$^$dk+mk=5j')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DEBUG', default=True)

# Detect if running on Railway
# IS_RAILWAY = os.environ.get('RAILWAY_ENVIRONMENT') is not None
CORS_ALLOW_ALL_ORIGINS = True  # Don't allow all origins in production



CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Local development
    "http://localhost:3001",
    "https://your-frontend.vercel.app",  # Replace with your actual frontend URL
    "https://your-frontend.netlify.app",  # Or wherever your frontend is deployed
]
ALLOWED_HOSTS = [
    'wasteware-project-production.up.railway.app',
    '.railway.app',
    'localhost',
    '127.0.0.1',
]

USE_TZ = True
TIME_ZONE = 'Asia/Beirut'

# Application definition
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
    'authentication',
    'company',
    'clientReports',
    'chatbot',
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CSRF_TRUSTED_ORIGINS = [
    "https://*.railway.app",
    "https://*.up.railway.app",
]

from datetime import timedelta

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'authentication.jwt_auth.CustomJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',

]

ROOT_URLCONF = 'waste_management.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'waste_management.wsgi.application'

# Database
# Railway provides DATABASE_URL automatically when you add PostgreSQL
DATABASES = {
    'default': env.db(
        'DATABASE_URL',
        default='postgres://postgres:Kevork55.@localhost:5432/waste_db'
    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Gemini API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Security settings for production
# if IS_RAILWAY:
#     SECURE_SSL_REDIRECT = False  # Railway handles SSL
#     SESSION_COOKIE_SECURE = True
#     CSRF_COOKIE_SECURE = True

# In your settings.py - UPDATE THIS SECTION

import os
from supabase import create_client, Client


SUPABASE_URL = "https://rjcsykwglyrdqrpbzkbz.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY3N5a3dnbHlyZHFycGJ6a2J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2NTY1MywiZXhwIjoyMDgwODQxNjUzfQ.oRh0GdZQo62pj6qbkD1WhVzLTuB8adSqc4N-aHCIs9Y"

SUPABASE: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Media settings
DEFAULT_FILE_STORAGE = "authentication.storage_backend.SupabaseMediaStorage"
MEDIA_URL = "/media/"

# BASE_DIR = Path(_file_).resolve().parent.parent

# # Supabase Configuration
# SUPABASE_URL = os.environ.get(
#     "SUPABASE_URL", 
#     "https://rjcsykwglyrdqrpbzkbz.supabase.co"
# )

# # Anon key - for frontend/public access
# SUPABASE_KEY = os.environ.get(
#     "SUPABASE_KEY",
#     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY3N5a3dnbHlyZHFycGJ6a2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyNjU2NTMsImV4cCI6MjA4MDg0MTY1M30.eZTIDAimCRBcWiYb0cQbtvnIzT5DOGEw0eWQEkm37S8"
# )

# # Service role key - for backend uploads (bypasses RLS)
# SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJqY3N5a3dnbHlyZHFycGJ6a2J6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI2NTY1MywiZXhwIjoyMDgwODQxNjUzfQ.oRh0GdZQo62pj6qbkD1WhVzLTuB8adSqc4N-aHCIs9Y')

# SUPABASE_BUCKET = os.environ.get("SUPABASE_BUCKET", "wasteware-media")

# # Use Supabase for file storage
# DEFAULT_FILE_STORAGE = "authentication.storage_backend.SupabaseStorage"

# # Media URL
# MEDIA_URL = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/"