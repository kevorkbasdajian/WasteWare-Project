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
    profile_image = models.TextField(null=True, blank=True)
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
