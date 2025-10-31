from rest_framework import serializers
from .models import Report, Address

class AddressSerializer(serializers.ModelSerializer):
    #
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'region', 'latitude', 'longitude', 'postal_code']
    
    def create(self, validated_data):
        """Create and return a new Address instance, given the validated data."""
        return Address.objects.create(**validated_data)
    
class ReportSerializer(serializers.ModelSerializer):
    # Read-only fields
    address_details = AddressSerializer(source='address', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    # Write-only fields
    coordinates = serializers.CharField(write_only=True, required=False)
    street_address = serializers.CharField(write_only=True, required=False)
    city_name = serializers.CharField(write_only=True, required=False)
    governorate = serializers.CharField(write_only=True, required=False)
    photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Report
        fields = [
            'id', 'user', 'title', 'type_of_report', 'severity_level', 'response_priority',
            'description', 'image_url', 'status', 'created_at', 'resolved_at',
            
            #Read-only fields
            'address_details', 'user_email',
            
            #Write-only fields
            'coordinates', 'street_address', 'city_name', 'governorate', 'photo'
        ]
        read_only_fields = ['id', 'user', 'status', 'created_at', 'resolved_at']

def validate_severity_level(self, value):
    """Ensure severity level is between 1 and 5."""
    if value not in [1, 2, 3, 4, 5]:
        raise serializers.ValidationError("Severity level must be between 1 and 5.")
    return value

def create(self, validated_data):
    """Create report with address"""
    # Extract address-related data
    coordinates = validated_data.pop('coordinates', None)
    street_address = validated_data.pop('street_address', None)
    city_name = validated_data.pop('city_name', None)
    governorate = validated_data.pop('governorate', None)
    photo = validated_data.pop('photo', None)

    #Parse coordinates if provided
    latitude = longitude = None
    if coordinates:
        try:
            lat_str, lon_str = coordinates.split(',')
            latitude = float(lat_str.strip())
            longitude = float(lon_str.strip())
        except (ValueError, AttributeError):
            pass
    
    #Create address if any address data provided
    address = None
    if street_address or city_name:
        address = Address.objects.create(
            street=street_address or '',
            city=city_name or '',
            region=governorate or '',
            latitude=latitude,
            longitude=longitude
        )
        validated_data['address'] = address

    #Handle photo upload if provided
    if photo:
        #We just store the filename
        validated_data['image_url'] = photo.name
    
    #Create and return the report
    report = Report.objects.create(**validated_data)
    return report


class ReportListSerializer(serializers.ModelSerializer):
    # Simplified serializer for listing reports
    user_name = serializers.SerializerMethodField()
    address_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = ['id',
                  'title', 
                  'type_of_report', 
                  'severity_level', 
                  'response_priority', 
                  'status', 
                  'created_at',
                  'user_name',
                  'address_summary',
                  ]
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}" if obj.user.first_name and obj.user.last_name else obj.user.username
    
    def get_address_summary(self, obj):
        if obj.address:
            return f"{obj.address.city}, {obj.address.region}"
        return "N/A"