from django.db import models
from django.contrib.postgres.fields import JSONField
from django.utils import timezone
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

# ===============================
# 1. Core Entities
# ===============================

class Roles(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50)
    
    class Meta:
        db_table = 'Roles'
    
    def __str__(self):
        return self.role_name


# MOVE ADDRESSES FIRST - before Users and Companies that reference it
class Addresses(models.Model):
    address_id = models.AutoField(primary_key=True)
    street = models.TextField()
    city = models.TextField()
    region = models.TextField(blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "Addresses"

    def __str__(self):
        return f"{self.street}, {self.city}"


class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.CharField(max_length=100, unique=True)
    role = models.ForeignKey(Roles, models.DO_NOTHING, db_column='role_id', null=True)
    password_hash = models.TextField()
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    address = models.OneToOneField(Addresses, models.DO_NOTHING, db_column='address_id', null=True, blank=True)
    badge = models.CharField(max_length=100, null=True, blank=True)
    profile_image = models.ImageField(upload_to="profile_images/",null=True, blank=True)
    points_balance = models.IntegerField(default=0)
    account_status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)


    # Add these properties for Django ERST Framework compatibility
    @property
    def is_authenticated(sefl):
        return True
    
    @property
    def is_anonymous(self):
        return False
    
    class Meta:
        db_table = 'Users'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    # Add these properties for Django REST Framework compatibility
    @property
    def is_authenticated(self):
        """Always return True for authenticated users"""
        return True
    
    @property
    def is_anonymous(self):
        """Always return False for authenticated users"""
        return False


class Companies(models.Model):
    company_id = models.AutoField(primary_key=True)
    company_name = models.CharField(max_length=100)
    email = models.CharField(max_length=100, unique=True)
    password_hash = models.TextField()
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    address = models.OneToOneField(Addresses, models.DO_NOTHING, db_column='address_id', null=True, blank=True)
    license_number = models.CharField(max_length=50, null=True, blank=True)
    verification_status = models.CharField(max_length=20, default='pending')
    company_image = models.ImageField(upload_to="company_images/",null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'Companies'

    def __str__(self):
        return self.company_name

    # Add these properties for Django REST Framework compatibility
    @property
    def is_authenticated(self):
        """Always return True for authenticated companies"""
        return True
    
    @property
    def is_anonymous(self):
        """Always return False for authenticated companies"""
        return False


class Notifications(models.Model):
    NOTIFICATION_TYPES = [
        ('alert', 'Alert'),
        ('reward', 'Reward'),
        ('report', 'Report'),
        ('system', 'System'),
    ]
    
    PRIORITY_LEVELS = [
        ('high', 'High'),
        ('normal', 'Normal'),
        ('low', 'Low'),
    ]
    
    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Users', models.CASCADE, db_column='user_id', null=True, blank=True, related_name='notifications')
    company = models.ForeignKey('Companies', models.CASCADE, db_column='company_id', null=True, blank=True, related_name='sent_notifications')
    title = models.TextField()
    message = models.TextField(null=True, blank=True)
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='system')
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='normal')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    
    # Target audience info (for company notifications)
    target_audience = models.CharField(max_length=50, null=True, blank=True)  # 'all_users', 'custom'
    target_user_ids = models.JSONField(null=True, blank=True)  # List of user IDs for custom targeting

    class Meta:
        db_table = 'Notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.created_at}"

class Permissions(models.Model):
    permission_id = models.AutoField(primary_key=True)
    role = models.ForeignKey(Roles, models.DO_NOTHING, db_column='role_id', default=1)
    module_name = models.CharField(max_length=50)
    can_view = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        db_table = 'Permissions'

    def __str__(self):
        return f"{self.role.role_name} - {self.module_name}"
