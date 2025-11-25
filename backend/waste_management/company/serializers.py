from rest_framework import serializers
from django.db import transaction
from .models import Driver, Truck, Dumping, Route, RouteStop, WasteType,Schedule
from authentication.models import Addresses


# -------------------------
# Address serializer (allows nested creation)
# -------------------------
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Addresses
        fields = ['address_id', 'street', 'city', 'region', 'latitude', 'longitude', 'postal_code']
        read_only_fields = ['address_id']

# -------------------------
# Driver serializer (use driver_id PK)
# -------------------------
class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = ['driver_id', 'first_name', 'last_name', 'phone', 'created_at']

# -------------------------
# Truck serializer (use truck_id PK)
# -------------------------
class TruckSerializer(serializers.ModelSerializer):
    driver = DriverSerializer(read_only=True)
    driver_id = serializers.PrimaryKeyRelatedField(
        queryset=Driver.objects.all(),
        source='driver',
        write_only=True,
        required=False,
        allow_null=True
    )

    class Meta:
        model = Truck
        fields = ['truck_id', 'driver', 'driver_id', 'available', 'created_at']

# -------------------------
# Dumping serializer
# - supports referencing existing dumping via dumping_id
# - supports nested address creation via address object
# -------------------------
class DumpingSerializer(serializers.ModelSerializer):
    dumping_id = serializers.IntegerField(write_only=True, required=False)
    address_detail = AddressSerializer(source='address', write_only=True, required=False)
    address = serializers.PrimaryKeyRelatedField(queryset=Addresses.objects.all())

    class Meta:
        model = Dumping
        fields = ['dumping_id', 'dumping_id', 'dumping_id',  # harmless duplication removed later; keep behaviour explicit below
                  'dumping_id', 'dumping_id']  # we'll override by listing actual fields cleanly below

# Correct DumpingSerializer concrete (clean definition)
class DumpingSerializer(serializers.ModelSerializer):
    address_detail = AddressSerializer(source='address', read_only=True)
    # Remove the PrimaryKeyRelatedField - we'll handle address manually
    address = serializers.JSONField(write_only=True)

    class Meta:
        model = Dumping
        fields = ['dumping_id', 'Title', 'waste_type', 'address', 'address_detail', 'maximum_capacity', 'collected_waste', 'created_at']
        read_only_fields = ['dumping_id', 'created_at', 'address_detail']
        


    def create(self, validated_data):
        # Check if nested address is provided in initial_data
        # address_data = self.initial_data.get('address')
        address_raw = self.initial_data.get('address')

        
        if isinstance(address_raw, dict):
            addr_ser = AddressSerializer(data=address_raw)
            addr_ser.is_valid(raise_exception=True)
            address_obj = addr_ser.save()
            validated_data['address'] = address_obj
        elif isinstance(address_raw, int):
            try:
                validated_data['address'] = Addresses.objects.get(address_id=address_raw)
            except Addresses.DoesNotExist:
                raise serializers.ValidationError({"address": "Invalid address ID"})

        else:
            raise serializers.ValidationError({"address": "Must be nested object or address ID"})

        return Dumping.objects.create(**validated_data)
# -------------------------
# RouteStop serializer (read-only nested)
# -------------------------
class RouteStopSerializer(serializers.ModelSerializer):
    dumping = DumpingSerializer(read_only=True)

    class Meta:
        model = RouteStop
        fields = ['route', 'dumping', 'has_passed']

class WasteTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteType
        fields = ['waste_type_id', 'name', 'description']

# -------------------------
# Route serializer (main one)
# -------------------------
class RouteSerializer(serializers.ModelSerializer):
    # Accept driver_id from frontend (user selects driver)
    driver_id = serializers.PrimaryKeyRelatedField(queryset=Driver.objects.all(), source='driver', write_only=True, required=True)

    # If frontend chooses a truck explicitly (only allowed when driver has no truck),
    # send truck_id; otherwise omit it.
    truck_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    truck = TruckSerializer(read_only=True)

    # dumpings: accept list of either { "dumping_id": X } or full Dumping payload
    dumpings = serializers.ListField(child=serializers.DictField(), write_only=True)

    route_stops = RouteStopSerializer(many=True, read_only=True)

    class Meta:
        model = Route
        fields = ['route_id', 'waste_type', 'driver_id', 'truck', 'truck_id', 'dumpings', 'route_stops', 'status', 'created_at']
        read_only_fields = ['route_id', 'truck', 'route_stops', 'created_at']
    def validate(self, data):
        """
        Validate business rules before create:
        - ensure the dumpings provided (existing ones) match the waste_type
        - if truck_id provided, ensure that truck exists and is available and unassigned (unless it is driver current truck)
        """
        driver = data.get('driver')
        truck_id_value = self.initial_data.get('truck_id', None)
        waste_type = data.get('waste_type')

        # 1) If driver already has a truck, disallow specifying a different truck_id.
        driver_inst = driver
        if driver_inst:
            current_truck = Truck.objects.filter(driver=driver_inst).first()
            if current_truck:
                # if frontend provided truck_id and it's different -> error
                if truck_id_value is not None and int(truck_id_value) != current_truck.truck_id:
                    raise serializers.ValidationError({"truck_id": "Selected driver already has a truck assigned. You may not change it."})
        # 2) If truck_id provided, check its availability and driver assignment
        if truck_id_value is not None:
            try:
                truck_obj = Truck.objects.get(truck_id=truck_id_value)
            except Truck.DoesNotExist:
                raise serializers.ValidationError({"truck_id": f"Truck {truck_id_value} does not exist."})
            # if driver has no truck, ensure truck is available and has no driver
            if not Truck.objects.filter(driver=driver_inst, truck_id=truck_obj.truck_id).exists():
                if not truck_obj.available:
                    raise serializers.ValidationError({"truck_id": "Truck is not available."})
                if truck_obj.driver is not None:
                    raise serializers.ValidationError({"truck_id": "Truck already assigned to another driver."})

        # 3) Check dumpings' waste_type matches route waste_type (if waste_type provided)
        dumpings_list = self.initial_data.get('dumpings', [])
        for entry in dumpings_list:
            if entry.get('dumping_id'):
                try:
                    d = Dumping.objects.get(dumping_id=entry['dumping_id'])
                except Dumping.DoesNotExist:
                    raise serializers.ValidationError({"dumpings": f"Dumping {entry['dumping_id']} not found."})
                if waste_type and d.waste_type_id != waste_type.waste_type_id:
                    raise serializers.ValidationError({"dumpings": f"Dumping {d.dumping_id} has waste_type {d.waste_type_id}; expected {waste_type.waste_type_id}."})
            else:
                # if creating new dumping (entry has waste_type), check entry waste_type matches route
                if 'waste_type' in entry and waste_type and int(entry['waste_type']) != waste_type.waste_type_id:
                    raise serializers.ValidationError({"dumpings": "New dumping waste_type must match route waste_type."})

        return data

    @transaction.atomic
    def create(self, validated_data):
        """
        Creation steps:
        - Resolve driver
        - If driver already has a truck, use that truck
        - Else if truck_id provided, assign that truck to driver
        - Create the route
        - Create/attach dumpings and create RouteStop entries
        """
        driver = validated_data.pop('driver')
        truck_id_value = self.initial_data.get('truck_id', None)
        dumpings_payload = self.initial_data.get('dumpings', [])

        # check driver current truck
        current_truck = Truck.objects.filter(driver=driver).first()
        truck_obj = None
        if current_truck:
            truck_obj = current_truck
        else:
            # if frontend supplied truck_id, assign that truck to driver
            if truck_id_value is not None:
                truck_obj = Truck.objects.get(truck_id=truck_id_value)
                # assign truck to driver
                truck_obj.driver = driver
                truck_obj.available = False  # mark unavailable because assigned; modify if you want different behavior
                truck_obj.save()

        # create the route
        route = Route.objects.create(driver=driver, truck=truck_obj, waste_type=validated_data.get('waste_type'), status=validated_data.get('status', 'scheduled') )

        # handle dumpings: either reference existing or create new (with optional nested address)
        for entry in dumpings_payload:
            if entry.get('dumping_id'):
                dumping_obj = Dumping.objects.get(dumping_id=entry['dumping_id'])
            else:
                # create nested address if provided
                addr_data = entry.get('address')
                if isinstance(addr_data, dict):
                    addr_serializer = AddressSerializer(data=addr_data)
                    addr_serializer.is_valid(raise_exception=True)
                    address_obj = addr_serializer.save()
                    entry['address'] = address_obj.address_id  # set fk id so DumpingSerializer can create
                dumping_serializer = DumpingSerializer(data=entry)
                dumping_serializer.is_valid(raise_exception=True)
                dumping_obj = dumping_serializer.save()

            # create RouteStop
            RouteStop.objects.create(route=route, dumping=dumping_obj)

        return route
    


class ScheduleSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Schedule
        fields = ['schedule_id', 'pickup_date', 'start_time', 'end_time', 'status', 'notes', 'created_at']
        read_only_fields = ['schedule_id', 'created_at']
    
    def validate(self, data):
        """
        Validate that:
        1. start_time is before end_time
        2. No duplicate schedule at the same date and time
        """
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        pickup_date = data.get('pickup_date')
        
        # Check start_time < end_time
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                "end_time": "End time must be after start time."
            })
        
        # Check for duplicate schedule at same date and time
        if pickup_date and start_time:
            # Exclude current instance when updating
            queryset = Schedule.objects.filter(
                pickup_date=pickup_date,
                start_time=start_time
            )
            
            # If updating, exclude the current instance
            if self.instance:
                queryset = queryset.exclude(schedule_id=self.instance.schedule_id)
            
            if queryset.exists():
                raise serializers.ValidationError({
                    "start_time": "A schedule already exists at this date and time."
                })
        
        return data