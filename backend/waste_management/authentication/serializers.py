from rest_framework import serializers
from .models import Users, Companies, Roles,Address
from .utils import hash_password, verify_password

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


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['address_id', 'street', 'city', 'region', 'latitude', 'longitude', 'postal_code']
        read_only_fields = ['address_id']