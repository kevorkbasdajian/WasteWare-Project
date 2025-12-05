from rest_framework import serializers
from .models import Users, Companies, Roles,Addresses,Notifications
from clientReports.models import Reports
from .utils import hash_password, verify_password
from django.utils import timezone
from datetime import datetime
from django.db.models import Sum  # Uncomment when WasteReports table exists

# --------------------------
# Signup Serializers
# --------------------------
class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)


    def validate_email(self, value):
        if Users.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value
    
    
    
    class Meta:
        model = Users
        fields = ['first_name', 'last_name', 'email', 'password', 'phone_number']

    def create(self, validated_data):
        role = Roles.objects.get(role_name='Client')
        validated_data['role_id'] = role.role_id
        validated_data['password_hash'] = hash_password(validated_data.pop('password'))
        return Users.objects.create(**validated_data)


class CompanySignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Companies
        fields = ['company_name', 'email', 'password', 'phone_number', 'address', 'license_number']

    def create(self, validated_data):
        validated_data['password_hash'] = hash_password(validated_data.pop('password'))
        return Companies.objects.create(**validated_data)



class AdminSignupSerializer(UserSignupSerializer):
    def create(self, validated_data):
        role = Roles.objects.get(role_name='Admin')
        validated_data['role_id'] = role.role_id
        validated_data['password_hash'] = hash_password(validated_data.pop('password'))
        return Users.objects.create(**validated_data)


# --------------------------
# Login Serializer
# --------------------------
class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

# --------------------------
# Address Serializer
# --------------------------
class AddressSerializer(serializers.ModelSerializer):
    """Serializer for address data"""
    class Meta:
        model = Addresses
        fields = ['street', 'city', 'region', 'latitude', 'longitude', 'postal_code']



class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Addresses
        fields = ['address_id', 'street', 'city', 'region', 'latitude', 'longitude', 'postal_code']
        read_only_fields = ['address_id']

# --------------------------
# User Profile Serializer
# --------------------------
class ProfileSerializer(serializers.ModelSerializer):
    # Custom fields (not directly from model)
    name = serializers.SerializerMethodField()  # Combines first_name + last_name
    avatar = serializers.SerializerMethodField()  # Returns profile_image URL
    stats = serializers.SerializerMethodField()  # Calculates all stats
    badge = serializers.CharField()  # Returns user badge text
    address = AddressSerializer(read_only=True)
    
    # NEW: Add report history for dashboard chart
    report_history = serializers.SerializerMethodField()
    
    class Meta:
        model = Users
        fields = [
            'user_id',
            'name',
            'email',
            'avatar',
            'badge',
            'phone_number',
            'address',
            'account_status',
            'stats',
            'report_history',  # NEW FIELD
        ]
    
    def get_name(self, obj):
        """Combine first_name and last_name"""
        return f"{obj.first_name} {obj.last_name}"
    
    def get_avatar(self, obj):
        """Return profile image URL or default placeholder"""
        if obj.profile_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return ""
    
    def get_badge(self, obj):
        """Return user badge text based on account status or role"""
        return obj.badge if obj.badge else "Begin Here"
    
    def get_stats(self, obj):
        # Calculate days active (days since account created)
        days_active = (timezone.now() - obj.created_at).days
        eco_points = obj.points_balance  
        
        # ============ REAL DATA ============
        # Count total reports submitted by this user
        reports_submitted = Reports.objects.filter(user=obj).count()
        
        # Calculate derived stats
        waste_recycled = reports_submitted * 1.75  # Example: avg 1.75kg per report
        co2_reduced = waste_recycled * 0.08  # Example: 0.08 tons CO2 per kg waste
        trees_saved = int(co2_reduced * 3.77)  # Example: 1 ton CO2 = ~3.77 trees
        
        return {
            "co2_reduced": round(co2_reduced, 1),
            "trees_saved": trees_saved,
            "waste_recycled": int(waste_recycled),
            "reports_submitted": reports_submitted,
            "eco_points": eco_points,
            "days_active": days_active
        }
    
    def get_report_history(self, obj):
        """
        Get report counts grouped by date for dashboard charts.
        Returns reports from the last 6 months with daily counts.
        """
        from datetime import timedelta
        from django.db.models import Count
        from django.db.models.functions import TruncDate
        
        # Get reports from last 6 months
        six_months_ago = timezone.now() - timedelta(days=180)
        
        reports = Reports.objects.filter(
            user=obj,
            created_at__gte=six_months_ago
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('report_id')
        ).order_by('date')
        
        # Convert to list of {date, count} objects
        return [
            {
                'date': report['date'].isoformat(),
                'count': report['count']
            }
            for report in reports
        ]
    
    
class ProfileUpdateSerializer(serializers.ModelSerializer):
    # Address input fields
    street = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    region = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    class Meta:
        model = Users
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "profile_image",

            # Address fields:
            "street",
            "city",
            "region",
            "postal_code",
            "latitude",
            "longitude",
        ]

    def update(self, instance, validated_data):
        # -------------------------------
        # Update basic user fields
        # -------------------------------
        for field in ["first_name", "last_name", "phone_number", "profile_image"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()

        # -------------------------------
        # Address handling logic
        # -------------------------------
        addr_fields = ["street", "city", "region", "postal_code", "latitude", "longitude"]
        addr_data = {f: validated_data.get(f, None) for f in addr_fields}

        # Check if frontend sent ANY address field
        if any(v not in [None, ""] for v in addr_data.values()):
            # If user already has an address → update it
            if instance.address:
                address = instance.address
                for key, value in addr_data.items():
                    if value not in [None, ""]:
                        setattr(address, key, value)
                address.save()
            else:
                # Create a new address
                address = Addresses.objects.create(
                    user=instance,
                    **{k: v for k, v in addr_data.items() if v not in [None, ""]}
                )
                instance.address = address
                instance.save()

        return instance

# =============================================================
# USER MANAGEMENT SERIALIZER FOR ADMIN
# =============================================================

from rest_framework import serializers
from .models import Users, Roles

# Add these to your existing serializers.py

# --------------------------
# User Management Serializer (for Admin) - UPDATED
# --------------------------
class UserManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for admin user management.
    Returns all user data needed for the admin table.
    """
    
    full_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = Users
        fields = [
            'user_id',
            'full_name',
            'email',
            'phone_number',
            'role',
            'account_status',
            'created_at',
            'points_balance',
        ]
    
    def get_full_name(self, obj):
        """Combine first_name and last_name"""
        return f"{obj.first_name} {obj.last_name}"
    
    def get_role(self, obj):
        """Return role name in lowercase for frontend display"""
        if obj.role:
            # Return "user" for "Client" role to match frontend expectations
            role_name = obj.role.role_name
            if role_name == 'Client':
                return 'user'
            return role_name.lower()  # admin -> admin, company -> company
        return "user"


# --------------------------
# User Update Serializer (for Admin) - UPDATED
# --------------------------
class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user information.
    Admin can change: first_name, last_name, email, phone_number, role, account_status
    """
    role_name = serializers.CharField(write_only=True, required=False)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    account_status = serializers.CharField(required=False)
    
    class Meta:
        model = Users
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'account_status', 'role_name']
    
    def validate_email(self, value):
        """Check if email is already taken by another user"""
        user_id = self.instance.user_id if self.instance else None
        if Users.objects.filter(email=value).exclude(user_id=user_id).exists():
            raise serializers.ValidationError("This email is already in use by another user.")
        return value
    
    def validate_account_status(self, value):
        """Validate and normalize account status"""
        # Accept both capitalized and lowercase
        valid_statuses = ['active', 'suspended', 'inactive', 'banned']
        normalized = value.lower()
        
        if normalized not in valid_statuses:
            raise serializers.ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        return normalized  # Store as lowercase in database
    
    def update(self, instance, validated_data):
        # Update basic fields
        if 'first_name' in validated_data:
            instance.first_name = validated_data['first_name']
        
        if 'last_name' in validated_data:
            instance.last_name = validated_data['last_name']
        
        if 'email' in validated_data:
            instance.email = validated_data['email']
        
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data['phone_number']
        
        # Update account status
        if 'account_status' in validated_data:
            instance.account_status = validated_data['account_status']
        
        # Update role
        if 'role_name' in validated_data:
            role_name = validated_data.pop('role_name')
            try:
                # Handle both "Client" and "Admin" from frontend
                role = Roles.objects.get(role_name=role_name)
                instance.role = role
            except Roles.DoesNotExist:
                raise serializers.ValidationError(f"Role '{role_name}' does not exist")
        
        instance.save()
        return instance
    

class NotificationSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notifications
        fields = [
            'notification_id',
            'user',
            'company',
            'company_name',
            'user_name',
            'title',
            'message',
            'type',
            'priority',
            'is_read',
            'created_at',
            'target_audience',
            'target_user_ids'
        ]
        read_only_fields = ['notification_id', 'created_at', 'company_name', 'user_name']
    
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return None

class CreateNotificationSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    message = serializers.CharField(allow_blank=True, required=False)
    type = serializers.ChoiceField(choices=['alert', 'reward', 'report', 'system'], default='system')
    priority = serializers.ChoiceField(choices=['high', 'normal', 'low'], default='normal')
    target_audience = serializers.ChoiceField(choices=['all_users', 'custom'])
    target_user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True
    )
    
    def validate(self, data):
        if data.get('target_audience') == 'custom' and not data.get('target_user_ids'):
            raise serializers.ValidationError({
                'target_user_ids': 'Must provide user IDs when target audience is custom'
            })
        return data
    
    def create(self, validated_data):
        from django.db import transaction
        
        # Get company from request context
        request = self.context['request']
        try:
            company = Companies.objects.get(email=request.user.email)
        except Companies.DoesNotExist:
            raise serializers.ValidationError("Only companies can send notifications")
        
        target_audience = validated_data['target_audience']
        target_user_ids = validated_data.get('target_user_ids', [])
        
        notifications_to_create = []
        
        with transaction.atomic():
            if target_audience == 'all_users':
                # Get all active users
                users = Users.objects.filter(account_status='active')
                for user in users:
                    notifications_to_create.append(
                        Notifications(
                            user=user,
                            company=company,
                            title=validated_data['title'],
                            message=validated_data.get('message', ''),
                            type=validated_data['type'],
                            priority=validated_data['priority'],
                            target_audience='all_users',
                            is_read=False
                        )
                    )
            else:  # custom
                users = Users.objects.filter(user_id__in=target_user_ids, account_status='active')
                for user in users:
                    notifications_to_create.append(
                        Notifications(
                            user=user,
                            company=company,
                            title=validated_data['title'],
                            message=validated_data.get('message', ''),
                            type=validated_data['type'],
                            priority=validated_data['priority'],
                            target_audience='custom',
                            target_user_ids=target_user_ids,
                            is_read=False
                        )
                    )
            
            # Bulk create all notifications
            created_notifications = Notifications.objects.bulk_create(notifications_to_create)
            
        return {
            'count': len(created_notifications),
            'target_audience': target_audience,
            'message': f'Successfully sent notification to {len(created_notifications)} users'
        }

class UserBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Users
        fields = ['user_id', 'first_name', 'last_name', 'full_name', 'email', 'account_status']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
