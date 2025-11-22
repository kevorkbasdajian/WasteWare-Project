from rest_framework import serializers
from .models import Reports
from authentication.models import Addresses, Users


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Addresses
        fields = ['street', 'city', 'region', 'latitude', 'longitude', 'postal_code']


class ReportCreateSerializer(serializers.ModelSerializer):
    # Accept address fields directly
    street = serializers.CharField(write_only=True, required=False, allow_blank=True)
    city = serializers.CharField(write_only=True, required=False, allow_blank=True)
    region = serializers.CharField(write_only=True, required=False, allow_blank=True)
    latitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, 
        write_only=True, required=False, allow_null=True
    )
    longitude = serializers.DecimalField(
        max_digits=9, decimal_places=6, 
        write_only=True, required=False, allow_null=True
    )
    
    # Map frontend field names to backend
    category = serializers.CharField(write_only=True, source='type_of_report')
    severity = serializers.CharField(write_only=True, required=False, allow_blank=True)
    priority = serializers.CharField(write_only=True, required=False, allow_blank=True)
    details = serializers.CharField(write_only=True, required=False, allow_blank=True, source='description')
    
    class Meta:
        model = Reports
        fields = [
            'title', 
            'category',      # maps to type_of_report
            'severity',      # maps to severity_level
            'priority',      # maps to response_priority
            'details',       # maps to description
            'image_url',
            # Address fields
            'street',
            'city', 
            'region',
            'latitude',
            'longitude',
        ]

    def validate_category(self, value):
        """Map frontend category IDs to database values"""
        category_map = {
            'dumping': 'illegal dumping',
            'littering': 'public littering',
            'hazardous': 'hazardous materials',
            'construction': 'construction debris',
            'organic': 'organic waste',
            'ewaste': 'E-waste',
        }
        return category_map.get(value, value)

    def validate_severity(self, value):
        """Map frontend severity to database integer"""
        severity_map = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4,
        }
        if value:
            return severity_map.get(value.lower(), 1)
        return None

    def validate_priority(self, value):
        """Validate priority is one of allowed values"""
        allowed = ['routine', 'moderate', 'high', 'emergency']
        if value and value.lower() in allowed:
            return value.lower()
        return None

    def create(self, validated_data):
        # Extract address fields
        street = validated_data.pop('street', '')
        city = validated_data.pop('city', '')
        region = validated_data.pop('region', '')
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)

        # Map severity string to integer
        severity = validated_data.pop('severity', None)
        if severity:
            validated_data['severity_level'] = severity

        # Map priority
        priority = validated_data.pop('priority', None)
        if priority:
            validated_data['response_priority'] = priority

        # Create address if location data provided
        address = None
        if street or city or latitude:
            address = Addresses.objects.create(
                street=street or '',
                city=city or '',
                region=region,
                latitude=latitude,
                longitude=longitude
            )
            validated_data['address'] = address

        # Get user from context
        user = self.context.get('user')
        if user:
            validated_data['user'] = user

        return Reports.objects.create(**validated_data)


class ReportListSerializer(serializers.ModelSerializer):
    """Serializer for listing reports"""
    address = AddressSerializer(read_only=True)
    user_name = serializers.SerializerMethodField()
    type_display = serializers.CharField(source='get_type_of_report_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_level_display', read_only=True)
    priority_display = serializers.CharField(source='get_response_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Reports
        fields = [
            'report_id',
            'title',
            'type_of_report',
            'type_display',
            'severity_level',
            'severity_display',
            'response_priority',
            'priority_display',
            'address',
            'description',
            'image_url',
            'status',
            'status_display',
            'user_name',
            'created_at',
            'resolved_at',
        ]

    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return None


class ReportDetailSerializer(ReportListSerializer):
    """Serializer for single report detail"""
    handled_by_name = serializers.SerializerMethodField()

    class Meta(ReportListSerializer.Meta):
        fields = ReportListSerializer.Meta.fields + ['handled_by_name']

    def get_handled_by_name(self, obj):
        if obj.handled_by:
            return f"{obj.handled_by.first_name} {obj.handled_by.last_name}"
        return None