from rest_framework import serializers
from .models import Users, Companies, Roles, Addresses, Notifications
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
    """Serializer for Address model"""
    class Meta:
        model = Addresses
        fields = ['address_id', 'street', 'city', 'region', 'postal_code', 'latitude', 'longitude']
# --------------------------
# User Profile Serializer
# --------------------------
class ProfileSerializer(serializers.ModelSerializer):
    # Custom fields (not directly from model)
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()
    address = AddressSerializer(read_only=True)
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
            'report_history',
        ]
    
    def get_name(self, obj):
        """Combine first_name and last_name"""
        return f"{obj.first_name} {obj.last_name}"
    
    def get_avatar(self, obj):
        """Return profile image URL or default placeholder"""
        try:
            if obj.profile_image:
                # Check if it's already a string (Supabase returns string URL)
                if isinstance(obj.profile_image, str):
                    return obj.profile_image
                
                # Otherwise it's an ImageField object
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(obj.profile_image.url)
                return obj.profile_image.url
            return ""
        except Exception as e:
            print(f"Error in get_avatar: {e}")
            return ""
    
    def get_badge(self, obj):
        """Return user badge text based on account status or role"""
        return obj.badge if obj.badge else "Begin Here"
    
    def get_stats(self, obj):
        try:
            # Calculate days active
            days_active = (timezone.now() - obj.created_at).days
            eco_points = obj.points_balance or 0
            
            # Count total reports
            try:
                reports_submitted = Reports.objects.filter(user=obj).count()
            except Exception:
                reports_submitted = 0
            
            # Calculate derived stats
            waste_recycled = reports_submitted * 1.75
            co2_reduced = waste_recycled * 0.08
            trees_saved = int(co2_reduced * 3.77)
            
            return {
                "co2_reduced": round(co2_reduced, 1),
                "trees_saved": trees_saved,
                "waste_recycled": int(waste_recycled),
                "reports_submitted": reports_submitted,
                "eco_points": eco_points,
                "days_active": days_active
            }
        except Exception as e:
            print(f"Error in get_stats: {e}")
            return {
                "co2_reduced": 0,
                "trees_saved": 0,
                "waste_recycled": 0,
                "reports_submitted": 0,
                "eco_points": 0,
                "days_active": 0
            }
    
    def get_report_history(self, obj):
        """Get report counts grouped by date for dashboard charts"""
        try:
            from datetime import timedelta
            from django.db.models import Count
            from django.db.models.functions import TruncDate
            
            six_months_ago = timezone.now() - timedelta(days=180)
            
            reports = Reports.objects.filter(
                user=obj,
                created_at__gte=six_months_ago
            ).annotate(
                date=TruncDate('created_at')
            ).values('date').annotate(
                count=Count('report_id')
            ).order_by('date')
            
            return [
                {
                    'date': report['date'].isoformat(),
                    'count': report['count']
                }
                for report in reports
            ]
        except Exception as e:
            print(f"Error in get_report_history: {e}")
            return []
    
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





# --------------------------
# User Update Serializer (for Admin) - UPDATED
# --------------------------
class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user information.
    Admin can change: first_name, last_name, email, phone_number, role, account_status
    """
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Users
        fields = ['first_name', 'last_name', 'phone_number',]
    
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
        
        
        
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data['phone_number']
        
        # Update account status
        if 'account_status' in validated_data:
            instance.account_status = validated_data['account_status']
        
        instance.save()
        return instance



class CompanyManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for admin company management.
    Returns all company data needed for the admin table.
    """
    
    # role = serializers.SerializerMethodField()
    
    class Meta:
        model = Companies  # ← CHANGED from Users to Companies
        fields = [
            'company_id',      # ← CHANGED from user_id
            'company_name',
            'email',
            'phone_number',
            'created_at',
        ]
    
    def get_role(self, obj):
        """Return a default role for companies"""
        return "waste manager"


# --------------------------
# Company Create Serializer (for Admin)
# --------------------------
class CompanyCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new company
    """
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    
    class Meta:
        model = Companies
        fields = ['company_name', 'email', 'phone_number', 'password']
    
    def validate_email(self, value):
        """Check if email already exists"""
        if Companies.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value
    
    def create(self, validated_data):
        """Create company with hashed password"""
        from .utils import hash_password
        
        password = validated_data.pop('password')
        validated_data['password_hash'] = hash_password(password)
        
        return Companies.objects.create(**validated_data)


# --------------------------
# Company Update Serializer (for Admin)
# --------------------------
class CompanyUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating company info.
    Admin can change: company name, email, phone, status
    """
    
    class Meta:
        model = Companies
        fields = ['company_name',  'phone_number']
    
    # def validate_email(self, value):
    #     """Check if email is taken by another company"""
    #     company_id = self.instance.company_id if self.instance else None
    #     if Companies.objects.filter(email=value).exclude(company_id=company_id).exists():
    #         raise serializers.ValidationError("This email is already in use by another company.")
    #     return value
    
    # def validate_account_status(self, value):
    #     """Validate and normalize account status"""
    #     valid_statuses = ['active', 'suspended', 'inactive', 'banned']
    #     normalized = value.lower()
        
    #     if normalized not in valid_statuses:
    #         raise serializers.ValidationError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
    #     return normalized
    
    def update(self, instance, validated_data):
        """Update company fields"""
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        return instance











# --------------------------
# Company Profile Serializer
# --------------------------
class CompanyProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for company profile page.
    Returns company profile data and contact person information.
    """
    address = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Companies
        fields = [
            'company_id',
            'company_name',
            'email',
            'phone_number',
            'address',
            'avatar',
            'license_number',
            'created_at',
        ]
    
    def get_address(self, obj):
        """Return address data or None"""
        if obj.address:
            return {
                'address_id': obj.address.address_id,
                'street': obj.address.street or '',
                'city': obj.address.city or '',
                'region': obj.address.region or '',
                'postal_code': obj.address.postal_code or '',
                'latitude': str(obj.address.latitude) if obj.address.latitude else None,
                'longitude': str(obj.address.longitude) if obj.address.longitude else None,
            }
        return {
            'street': '',
            'city': '',
            'region': '',
            'postal_code': '',
            'latitude': None,
            'longitude': None,
        }
    
    def get_avatar(self, obj):
        """Return company image URL or empty string"""
        try:
            if obj.company_image:
                # Check if it's already a string (Supabase returns string URL)
                if isinstance(obj.company_image, str):
                    return obj.company_image
                
                # Otherwise it's an ImageField object
                return obj.company_image.url
            return ""
        except Exception as e:
            print(f"Error getting company avatar: {e}")
            return ""

# --------------------------
# Company Profile Update Serializer
# --------------------------
class CompanyProfileUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating company profile information.
    Using Serializer instead of ModelSerializer for more control.
    """
    company_name = serializers.CharField(required=False, allow_blank=False)
    phone_number = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.ImageField(write_only=True, required=False)
    remove_avatar = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    # Address fields
    street = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    region = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    
    def update(self, instance, validated_data):
        """Update company instance with validated data"""
        
        # Extract and remove special fields
        remove_avatar = validated_data.pop('remove_avatar', None)
        profile_image = validated_data.pop('profile_image', None)
        
        # Extract address fields
        addr_fields = ['street', 'city', 'region', 'postal_code', 'latitude', 'longitude']
        addr_data = {}
        for field in addr_fields:
            if field in validated_data:
                addr_data[field] = validated_data.pop(field)
        
        # Handle image removal
        if remove_avatar == 'true':
            if instance.company_image:
                try:
                    instance.company_image.delete(save=False)
                except:
                    pass
            instance.company_image = None
        
        # Handle new image upload
        elif profile_image:
            # Delete old image if exists
            if instance.company_image:
                try:
                    instance.company_image.delete(save=False)
                except:
                    pass
            instance.company_image = profile_image
        
        # Update basic company fields
        if 'company_name' in validated_data:
            instance.company_name = validated_data['company_name']
        
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data['phone_number']
        
        # Save company instance
        instance.save()
        
        # Handle address update/creation
        if addr_data and any(v not in [None, ''] for v in addr_data.values()):
            if instance.address:
                # Update existing address
                address = instance.address
                for key, value in addr_data.items():
                    if value not in [None, '']:
                        setattr(address, key, value)
                address.save()
            else:
                # Create new address (filter out empty values)
                filtered_addr_data = {k: v for k, v in addr_data.items() if v not in [None, '']}
                if filtered_addr_data:
                    address = Addresses.objects.create(**filtered_addr_data)
                    instance.address = address
                    instance.save()
        
        return instance
