from rest_framework import serializers
from .models import Report, Address


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'region', 'latitude', 'longitude', 'postal_code']


class ReportCreateSerializer(serializers.Serializer):
    # Required fields
    title = serializers.CharField(max_length=200)
    type_of_report = serializers.CharField(max_length=50)
    severity_level = serializers.IntegerField(min_value=1, max_value=4)
    response_priority = serializers.CharField(max_length=20)
    coordinates = serializers.CharField(max_length=100)
    street_address = serializers.CharField(max_length=500, required=False, allow_blank=True)
    city_name = serializers.CharField(max_length=100)
    governorate = serializers.CharField(max_length=100)
    description = serializers.CharField(required=False, allow_blank=True)
    photo = serializers.ImageField(required=False, allow_null=True)
    
    def validate_type_of_report(self, value):
        valid_types = ['illegal dumping', 'public littering', 'hazardous materials', 
                      'construction debris', 'organic waste', 'e-waste']
        if value not in valid_types:
            raise serializers.ValidationError(f"Invalid report type. Must be one of: {', '.join(valid_types)}")
        return value
    
    def validate_response_priority(self, value):
        valid_priorities = ['routine', 'moderate', 'high', 'emergency']
        if value not in valid_priorities:
            raise serializers.ValidationError(f"Invalid priority. Must be one of: {', '.join(valid_priorities)}")
        return value
    
    def validate_coordinates(self, value):
        """Validate coordinates format: 'latitude, longitude'"""
        try:
            parts = value.split(',')
            if len(parts) != 2:
                raise ValueError
            lat = float(parts[0].strip())
            lng = float(parts[1].strip())
            if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
                raise ValueError
            return value
        except:
            raise serializers.ValidationError("Coordinates must be in format: 'latitude, longitude'")
    
    def create(self, validated_data):
        # Extract coordinates
        coords = validated_data.pop('coordinates')
        lat, lng = [float(x.strip()) for x in coords.split(',')]
        
        # Extract address fields
        street = validated_data.pop('street_address', '')
        city = validated_data.pop('city_name')
        governorate = validated_data.pop('governorate')
        
        # Create address
        address = Address.objects.create(
            street=street,
            city=city,
            region=governorate,
            latitude=lat,
            longitude=lng
        )
        
        # Handle photo upload
        photo = validated_data.pop('photo', None)
        
        # Create report
        report = Report.objects.create(
            user=self.context['request'].user,
            address=address,
            image_url=photo,
            **validated_data
        )
        
        return report


class ReportListSerializer(serializers.ModelSerializer):
    address_detail = AddressSerializer(source='address', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Report
        fields = [
            'id',
            'title',
            'type_of_report',
            'severity_level',
            'response_priority',
            'description',
            'image_url',
            'address_detail',
            'status',
            'user_name',
            'created_at',
            'resolved_at',
        ]
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"