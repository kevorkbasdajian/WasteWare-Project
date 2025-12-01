from rest_framework import serializers
from .models import Users, Companies, Roles
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
# Profile Serializer
# --------------------------
class ProfileSerializer(serializers.ModelSerializer):
    # Custom fields (not directly from model)
    name = serializers.SerializerMethodField()  # Combines first_name + last_name
    avatar = serializers.SerializerMethodField()  # Returns profile_image URL
    stats = serializers.SerializerMethodField()  # Calculates all stats
    badge = serializers.CharField()  # Returns user badge text
    
    class Meta:
        model = Users
        fields = [
            'user_id',
            'name',
            'email',
            'avatar',
            'badge',
            'phone_number',
            'account_status',
            'stats',
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
        return "https://i.pravatar.cc/150?img=12"
    
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
        
        # ============ FOR FUTURE: Real waste calculation ============
        # Uncomment this when Reports model has 'waste_amount' field
        # waste_data = Reports.objects.filter(user=obj).aggregate(
        #     total_waste=Sum('waste_amount')
        # )
        # waste_recycled = waste_data['total_waste'] or 0
        # co2_reduced = round(waste_recycled * 0.08, 1)
        # trees_saved = int(co2_reduced * 3.77)
        # ================================================================
        
        return {
            "co2_reduced": round(co2_reduced, 1),
            "trees_saved": trees_saved,
            "waste_recycled": int(waste_recycled),
            "reports_submitted": reports_submitted,
            "eco_points": eco_points,
            "days_active": days_active
        }



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