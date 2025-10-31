from django.db import models
from django.contrib.postgres.fields import JSONField
from django.utils import timezone

# ===============================
# 1. Core Entities
# ===============================

class Roles(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50)
    class Meta:
        db_table = 'Roles'


class Addresses(models.Model):
    address_id = models.AutoField(primary_key=True)
    street = models.TextField()
    city = models.TextField()
    region = models.TextField(null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    postal_code = models.CharField(max_length=20, null=True, blank=True)

    class Meta:
        db_table = 'Addresses'


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

    class Meta:
        db_table = 'Users'


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






class Permissions(models.Model):
    permission_id = models.AutoField(primary_key=True)
    role = models.ForeignKey(Roles, models.DO_NOTHING, db_column='role_id',default = 1)
    module_name = models.CharField(max_length=50)
    can_view = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        db_table = 'Permissions'

