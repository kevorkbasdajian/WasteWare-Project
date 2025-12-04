from rest_framework import serializers
from .models import Users, Companies, Roles
from .utils import hash_password, verify_password
from django.utils import timezone
from datetime import datetime
# from .models import WasteReports  # Uncomment when WasteReports table exists
# from django.db.models import Sum  # Uncomment when WasteReports table exists

# --------------------------
# Signup Serializers
# --------------------------
class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    def validate_email(self, value):
        if Users.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value
    
    email = serializers.EmailField(
        required=True,
        error_messages={
            "unique": "This email is already registesred. Please log in instead."
        }
    )
    
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
    badge = serializers.SerializerMethodField()  # Returns user badge text
    
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
            return obj.profile_image
        # Return a default avatar if none exists
        return "https://i.pravatar.cc/150?img=12"
    
    def get_badge(self, obj):
        """Return user badge text based on account status or role"""
        return "Began Here"
    
    def get_stats(self, obj):
        
        
        # Calculate days active (days since account created)
        days_active = (timezone.now() - obj.created_at).days
        eco_points = obj.points_balance  




        # ============ MOCK DATA (CURRENTLY ACTIVE) ============

        reports_submitted = 89  # Placeholder - will be: obj.wastereports_set.count()
        waste_recycled = reports_submitted * 1.75  # Example: avg 1.75kg per report
        co2_reduced = waste_recycled * 0.08  # Example: 0.08 tons CO2 per kg waste
        trees_saved = int(co2_reduced * 3.77)  # Example: 1 ton CO2 = ~3.77 trees
        
        
        # ============ REAL DATA (COMMENTED OUT - USE LATER) ============
        # Uncomment this when WasteReports table exists in database
        # 
        # # Import the WasteReports model at the top of file:
        # # from .models import WasteReports
        # 
        # # Count total reports submitted by this user
        # reports_submitted = WasteReports.objects.filter(user=obj).count()
        # 
        # # Sum total waste recycled (assuming WasteReports has 'waste_amount' field in kg)
        # from django.db.models import Sum
        # waste_data = WasteReports.objects.filter(user=obj).aggregate(
        #     total_waste=Sum('waste_amount')
        # )
        # waste_recycled = waste_data['total_waste'] or 0
        # 
        # # Calculate CO2 reduced (formula: 1kg waste = 0.08 tons CO2 saved)
        # co2_reduced = round(waste_recycled * 0.08, 1)
        # 
        # # Calculate trees saved (formula: 1 ton CO2 = 3.77 trees)
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

# --------------------------
# User Management Serializer (for Admin)
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
        """Return role name (admin, user, company)"""
        if obj.role_id:
            return obj.role_id.role_name.lower()
        return "user"


# --------------------------
# User Update Serializer (for Admin)
# --------------------------
class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user role and status.
    Admin can change: role, account_status
    """
    role_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Users
        fields = ['account_status', 'role_name']
    
    def update(self, instance, validated_data):
        # Update account status
        if 'account_status' in validated_data:
            instance.account_status = validated_data['account_status']
        
        # Update role
        if 'role_name' in validated_data:
            role_name = validated_data.pop('role_name')
            try:
                role = Roles.objects.get(role_name=role_name)
                instance.role_id = role
            except Roles.DoesNotExist:
                raise serializers.ValidationError(f"Role '{role_name}' does not exist")
        
        instance.save()
        return instance
    




# --------------------------
# Company Management Serializer (for Admin)
# --------------------------
class CompanyManagementSerializer(serializers.ModelSerializer):
    """
    Serializer for admin company management.
    Returns all company data needed for the admin table.
    """
    
    company_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    
    class Meta:
        model = Users
        fields = [
            'user_id',
            'company_name',
            'email',
            'phone_number',
            'role',
            'account_status',
            'created_at',
        ]
    
    def get_company_name(self, obj):
        """Return company name (first_name for companies)"""
        return obj.first_name
    
    def get_role(self, obj):
        """Return role description (e.g., 'waste manager')"""
        if obj.role_id:
            return obj.role_id.role_name.lower()
        return "company"


# --------------------------
# Company Update Serializer (for Admin)
# --------------------------
class CompanyUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating company info.
    Admin can change: company name, email, phone, role, status
    """
    company_name = serializers.CharField(write_only=True, required=False)
    role_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Users
        fields = ['company_name', 'email', 'phone_number', 'role_name', 'account_status']
    
    def update(self, instance, validated_data):
        # Update company name
        if 'company_name' in validated_data:
            instance.first_name = validated_data.pop('company_name')
        
        # Update email
        if 'email' in validated_data:
            instance.email = validated_data['email']
        
        # Update phone
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data['phone_number']
        
        # Update account status
        if 'account_status' in validated_data:
            instance.account_status = validated_data['account_status']
        
        # Update role
        if 'role_name' in validated_data:
            role_name = validated_data.pop('role_name')
            try:
                role = Roles.objects.get(role_name=role_name)
                instance.role_id = role
            except Roles.DoesNotExist:
                raise serializers.ValidationError(f"Role '{role_name}' does not exist")
        
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
    
    company_name = serializers.SerializerMethodField()
    contact_person_name = serializers.SerializerMethodField()
    role_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Users
        fields = [
            'user_id',
            'company_name',
            'contact_person_name',
            'role_name',
            'email',
            'phone_number',
            'address',
            'avatar',
            'account_status',
            'created_at',
        ]
    
    def get_company_name(self, obj):
        """Return company name (stored in first_name for companies)"""
        return obj.first_name
    
    def get_contact_person_name(self, obj):
        """Return contact person name (stored in last_name for companies)"""
        return obj.last_name if obj.last_name else "N/A"
    
    def get_role_name(self, obj):
        """Return role name"""
        if obj.role_id:
            return obj.role_id.role_name
        return "Company"
    
    def get_avatar(self, obj):
        """Return avatar URL or default"""
        if obj.profile_image:
            return obj.profile_image.url
        return None


# --------------------------
# Company Profile Update Serializer
# --------------------------
class CompanyProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating company profile information.
    """
    company_name = serializers.CharField(write_only=True, required=False)
    contact_person_name = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Users
        fields = [
            'company_name',
            'contact_person_name',
            'email',
            'phone_number',
            'address',
            'profile_image'
        ]
    
    def update(self, instance, validated_data):
        # Update company name
        if 'company_name' in validated_data:
            instance.first_name = validated_data.pop('company_name')
        
        # Update contact person name
        if 'contact_person_name' in validated_data:
            instance.last_name = validated_data.pop('contact_person_name')
        
        # Update other fields
        for field, value in validated_data.items():
            setattr(instance, field, value)
        
        instance.save()
        return instance
