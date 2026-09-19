
"""
Django settings for UpacharKhoj Nepal healthcare coordination platform.
"""

import os
from pathlib import Path
from datetime import timedelta

import dj_database_url
from decouple import config, Csv


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# ============================================================
# SECURITY SETTINGS
# ============================================================

DEBUG = config('DEBUG', default=True, cast=bool)

# Use a development-only fallback locally.
# Production requires a SECRET_KEY environment variable.
if DEBUG:
    SECRET_KEY = config(
        'SECRET_KEY',
        default='django-insecure-local-development-only-change-me'
    )
else:
    SECRET_KEY = config('SECRET_KEY')


ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=Csv()
)


# ============================================================
# APPLICATION DEFINITION
# ============================================================

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'channels',
    'django_filters',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.hospitals',
    'apps.referrals',
    'apps.audit',
]

INSTALLED_APPS = (
    DJANGO_APPS
    + THIRD_PARTY_APPS
    + LOCAL_APPS
)


# ============================================================
# MIDDLEWARE
# ============================================================

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',

    'whitenoise.middleware.WhiteNoiseMiddleware',

    'corsheaders.middleware.CorsMiddleware',

    'django.contrib.sessions.middleware.SessionMiddleware',

    'django.middleware.common.CommonMiddleware',

    'django.middleware.csrf.CsrfViewMiddleware',

    'django.contrib.auth.middleware.AuthenticationMiddleware',

    'django.contrib.messages.middleware.MessageMiddleware',

    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ============================================================
# URL CONFIGURATION
# ============================================================

ROOT_URLCONF = 'upacharkhoj.urls'


# ============================================================
# TEMPLATES
# ============================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',

        'DIRS': [
            BASE_DIR / 'templates'
        ],

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


# ============================================================
# WSGI AND ASGI
# ============================================================

WSGI_APPLICATION = 'upacharkhoj.wsgi.application'

ASGI_APPLICATION = 'upacharkhoj.asgi.application'


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

# Local development:
# Uses SQLite unless another database is configured.
#
# Production:
# Uses PostgreSQL through DATABASE_URL.

DATABASE_URL = config(
    'DATABASE_URL',
    default=''
)

if DATABASE_URL:

    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }

else:

    # Production must use a configured database URL.
    if not DEBUG:
        raise RuntimeError(
            'DATABASE_URL must be configured in production.'
        )

    # Existing local database configuration
    _db_engine = config(
        'DB_ENGINE',
        default='django.db.backends.sqlite3'
    )

    _db_name = config(
        'DB_NAME',
        default=str(BASE_DIR / 'db.sqlite3')
    )

    if _db_engine == 'django.db.backends.sqlite3':

        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': _db_name,
            }
        }

    else:

        DATABASES = {
            'default': {
                'ENGINE': _db_engine,

                'NAME': _db_name,

                'USER': config(
                    'DB_USER',
                    default=''
                ),

                'PASSWORD': config(
                    'DB_PASSWORD',
                    default=''
                ),

                'HOST': config(
                    'DB_HOST',
                    default='localhost'
                ),

                'PORT': config(
                    'DB_PORT',
                    default='5432'
                ),
            }
        }


# ============================================================
# PASSWORD VALIDATION
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'UserAttributeSimilarityValidator'
        )
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'MinimumLengthValidator'
        )
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'CommonPasswordValidator'
        )
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'NumericPasswordValidator'
        )
    },
]


# ============================================================
# CUSTOM USER MODEL
# ============================================================

AUTH_USER_MODEL = 'accounts.User'


# ============================================================
# INTERNATIONALIZATION
# ============================================================

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kathmandu'

USE_I18N = True

USE_TZ = True


# ============================================================
# STATIC FILES
# ============================================================

STATIC_URL = '/static/'

STATIC_ROOT = BASE_DIR / 'staticfiles'

STATICFILES_DIRS = (
    [BASE_DIR / 'static']
    if (BASE_DIR / 'static').exists()
    else []
)


# ============================================================
# STATIC FILE STORAGE
# ============================================================

STORAGES = {
    'default': {
        'BACKEND': (
            'django.core.files.storage.'
            'FileSystemStorage'
        ),
    },

    'staticfiles': {
        'BACKEND': (
            'whitenoise.storage.'
            'CompressedManifestStaticFilesStorage'
        ),
    },
}


# ============================================================
# MEDIA FILES
# ============================================================

MEDIA_URL = config(
    'MEDIA_URL',
    default='/media/'
)

MEDIA_ROOT = BASE_DIR / config(
    'MEDIA_ROOT',
    default='media'
)


# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ============================================================
# DJANGO REST FRAMEWORK
# ============================================================

REST_FRAMEWORK = {

    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.'
        'JWTAuthentication',
    ),

    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),

    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],

    'DEFAULT_PAGINATION_CLASS': (
        'rest_framework.pagination.'
        'PageNumberPagination'
    ),

    'PAGE_SIZE': 20,

    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
}


# ============================================================
# JWT SETTINGS
# ============================================================

SIMPLE_JWT = {

    'ACCESS_TOKEN_LIFETIME': timedelta(
        days=config(
            'JWT_ACCESS_TOKEN_LIFETIME_DAYS',
            default=1,
            cast=int
        )
    ),

    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=config(
            'JWT_REFRESH_TOKEN_LIFETIME_DAYS',
            default=7,
            cast=int
        )
    ),

    'ROTATE_REFRESH_TOKENS': True,

    'BLACKLIST_AFTER_ROTATION': True,

    'UPDATE_LAST_LOGIN': True,

    'ALGORITHM': 'HS256',

    'SIGNING_KEY': SECRET_KEY,

    'AUTH_HEADER_TYPES': ('Bearer',),

    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',

    'USER_ID_FIELD': 'id',

    'USER_ID_CLAIM': 'user_id',

    'TOKEN_OBTAIN_SERIALIZER': (
        'rest_framework_simplejwt.serializers.'
        'TokenObtainPairSerializer'
    ),

    'TOKEN_REFRESH_SERIALIZER': (
        'rest_framework_simplejwt.serializers.'
        'TokenRefreshSerializer'
    ),
}


# ============================================================
# CORS SETTINGS
# ============================================================

# Allow only configured frontend origins.
CORS_ALLOW_ALL_ORIGINS = config(
    'CORS_ALLOW_ALL_ORIGINS',
    default=False,
    cast=bool
)

# Local development origins.
# Set CORS_ALLOWED_ORIGINS on Render for production.
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default=(
        'http://localhost:5173,'
        'http://127.0.0.1:5173,'
        'http://localhost:3000,'
        'http://127.0.0.1:3000'
    ) if DEBUG else '',
    cast=Csv()
)

# Preserve support for credentialed requests.
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


# ============================================================
# CSRF SETTINGS
# ============================================================

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default=(
        'http://localhost:5173,'
        'http://127.0.0.1:5173'
    ) if DEBUG else '',
    cast=Csv()
)


# ============================================================
# DJANGO CHANNELS
# ============================================================

# In-memory channel layer for local development
# and single-process demonstrations.

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': (
            'channels.layers.InMemoryChannelLayer'
        ),
    }
}

# A shared channel layer, such as Redis, is required
# when WebSocket messages need to be shared across
# multiple workers or instances.


# ============================================================
# EMAIL SETTINGS
# ============================================================

EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default=(
        'django.core.mail.backends.'
        'console.EmailBackend'
    )
)

EMAIL_HOST = config(
    'EMAIL_HOST',
    default='smtp.gmail.com'
)

EMAIL_PORT = config(
    'EMAIL_PORT',
    default=587,
    cast=int
)

EMAIL_USE_TLS = config(
    'EMAIL_USE_TLS',
    default=True,
    cast=bool
)

EMAIL_HOST_USER = config(
    'EMAIL_HOST_USER',
    default=''
)

EMAIL_HOST_PASSWORD = config(
    'EMAIL_HOST_PASSWORD',
    default=''
)

DEFAULT_FROM_EMAIL = config(
    'DEFAULT_FROM_EMAIL',
    default='noreply@upacharkhoj.np'
)


# ============================================================
# FRONTEND URL
# ============================================================

FRONTEND_URL = config(
    'FRONTEND_URL',
    default='http://localhost:5173'
)


# ============================================================
# PRODUCTION SECURITY
# ============================================================

if not DEBUG:

    # Trust HTTPS information from Render's proxy.
    SECURE_PROXY_SSL_HEADER = (
        'HTTP_X_FORWARDED_PROTO',
        'https'
    )

    SECURE_SSL_REDIRECT = True

    SESSION_COOKIE_SECURE = True

    CSRF_COOKIE_SECURE = True

    SECURE_CONTENT_TYPE_NOSNIFF = True

    X_FRAME_OPTIONS = 'DENY'


# ============================================================
# LOGGING
# ============================================================

LOGGING = {

    'version': 1,

    'disable_existing_loggers': False,

    'formatters': {

        'verbose': {
            'format': (
                '{levelname} {asctime} {module} '
                '{process:d} {thread:d} {message}'
            ),
            'style': '{',
        },

        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },

    },

    'handlers': {

        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },

    },

    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },

    'loggers': {

        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },

        'apps': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },

    },
}