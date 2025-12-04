from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

# DO NOT IMPORT Address - use string reference instead!

class WasteType(models.Model):
    waste_type_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "Waste_types"

    def __str__(self):
        return self.name


class Driver(models.Model):
    driver_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Drivers"

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip()


class Truck(models.Model):
    truck_id = models.AutoField(primary_key=True)
    driver = models.ForeignKey("Driver", on_delete=models.SET_NULL, null=True, blank=True, related_name="trucks")
    available = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Trucks"

    def __str__(self):
        return f"Truck {self.truck_id}"


class Dumping(models.Model):
    dumping_id = models.AutoField(primary_key=True)
    Title = models.TextField()
    waste_type = models.ForeignKey(WasteType, on_delete=models.CASCADE)
    # String reference to avoid circular import and avoid creating Addresses table again
    address = models.OneToOneField('authentication.Addresses', on_delete=models.CASCADE)
    maximum_capacity = models.IntegerField(null=True, blank=True)
    collected_waste = models.IntegerField(default=0)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Dumpings"

    def __str__(self):
        return self.Title


class Route(models.Model):
    STATUS_CHOICES = [
        # ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        # ('cancelled', 'Cancelled'),
    ]
    route_id = models.AutoField(primary_key=True)
    waste_type = models.ForeignKey(WasteType, on_delete=models.CASCADE)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name="routes")
    truck = models.ForeignKey(Truck, on_delete=models.SET_NULL, null=True, blank=True, related_name="routes")
    created_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')


    class Meta:
        db_table = "Routes"

    def __str__(self):
        return f"Route {self.route_id} - {self.status}"


class RouteStop(models.Model):
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="route_stops")
    dumping = models.ForeignKey(Dumping, on_delete=models.CASCADE)
    has_passed = models.BooleanField(default=False)



    class Meta:
        db_table = "Route_stops"
        unique_together = ('route', 'dumping')

    def __str__(self):
        return f"Route {self.route.route_id} - Dumping {self.dumping.dumping_id}"
    

class Schedule(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('inProgress','inProgress'),
        ('completed', 'Completed'),
    ]
    
    schedule_id = models.AutoField(primary_key=True)
    pickup_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "Schedules"
        # Prevent duplicate schedules at the same time
        unique_together = ('pickup_date', 'start_time')

    def __str__(self):
        return f"Schedule {self.schedule_id} - {self.pickup_date} at {self.start_time}"

    def clean(self):
        from django.core.exceptions import ValidationError
        # Validate that start_time is before end_time
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError('Start time must be before end time.')


# models.py - Add this to your existing models

class Pickup(models.Model):
    STATUS_CHOICES = [
        ('Not Started', 'Not Started'),
        ('In Progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    pickup_id = models.AutoField(primary_key=True)
    schedule = models.ForeignKey(Schedule, on_delete=models.CASCADE, related_name='pickups')
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='pickups')
    weight_collected = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)
    live_location = models.JSONField(null=True, blank=True)  # {"latitude": <num>, "longitude": <num>}
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Not Started')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'Pickups'
        
    def __str__(self):
        return f"Pickup {self.pickup_id} - Route {self.route_id} - {self.status}"
    
    def update_live_location(self, latitude, longitude):
        """Update the live location of the pickup"""
        self.live_location = {
            'latitude': latitude,
            'longitude': longitude,
            'updated_at': timezone.now().isoformat()
        }
        self.save()

    def get_route_waypoints(self):
        """Get all waypoints (company + route stops + company) for this pickup"""
        
        waypoints = []
        route = self.route
        
        # Get company address (you'll need to implement this based on your auth model)
        # For now, using dummy Beirut coordinates
        company_location = {
            'latitude': 33.8938,
            'longitude': 35.5018,
            'type': 'company'
        }
        waypoints.append(company_location)
        
        # Get all route stops
        route_stops = route.route_stops.all().order_by('id')
        for stop in route_stops:
            if stop.dumping.address:
                waypoints.append({
                    'latitude': float(stop.dumping.address.latitude),
                    'longitude': float(stop.dumping.address.longitude),
                    'type': 'dumping',
                    'dumping_id': stop.dumping.dumping_id,
                    'capacity': stop.dumping.maximum_capacity
                })
        
        # Return to company
        waypoints.append(company_location)
        
        return waypoints

    def should_be_in_progress(self):
        """Check if pickup should be in progress based on schedule time"""
        from django.utils import timezone
        import datetime
        
        # now = timezone.now()
        now = timezone.now() + timedelta(hours=2)

        # Combine schedule date and times to create proper datetime objects
        schedule_datetime_start = timezone.make_aware(
            datetime.datetime.combine(self.schedule.pickup_date, self.schedule.start_time)
        )
        schedule_datetime_end = timezone.make_aware(
            datetime.datetime.combine(self.schedule.pickup_date, self.schedule.end_time)
        )
        
        # Check if current time is between start and end
        is_in_progress = schedule_datetime_start <= now < schedule_datetime_end
        
        # Debug print (you can remove this later)
        print(f"Pickup {self.pickup_id}: Now={now}, Start={schedule_datetime_start}, End={schedule_datetime_end}, InProgress={is_in_progress}")
        
        return is_in_progress

    def should_be_completed(self):
        """Check if pickup should be completed based on schedule end time"""
        from django.utils import timezone
        import datetime
        
        # now = timezone.now()
        now = timezone.now() + timedelta(hours=2)

        schedule_datetime_end = timezone.make_aware(
            datetime.datetime.combine(self.schedule.pickup_date, self.schedule.end_time)
        )
        
        # Check if current time is past the end time
        is_completed = now >= schedule_datetime_end
        
        # Debug print (you can remove this later)
        print(f"Pickup {self.pickup_id}: Now={now}, End={schedule_datetime_end}, Completed={is_completed}")
        
        return is_completed

    def calculate_progress_percentage(self):
        """Calculate how far along the pickup is based on time"""
        from django.utils import timezone
        import datetime
        
        if self.status == 'completed':
            return 100.0
        if self.status == 'Not Started':
            return 0.0
        
        # now = timezone.now()
        now = timezone.now() + timedelta(hours=2)

        schedule_datetime_start = timezone.make_aware(
            datetime.datetime.combine(self.schedule.pickup_date, self.schedule.start_time)
        )
        schedule_datetime_end = timezone.make_aware(
            datetime.datetime.combine(self.schedule.pickup_date, self.schedule.end_time)
        )
        
        if now < schedule_datetime_start:
            return 0.0
        if now >= schedule_datetime_end:
            return 100.0
        
        total_duration = (schedule_datetime_end - schedule_datetime_start).total_seconds()
        elapsed = (now - schedule_datetime_start).total_seconds()
        
        return (elapsed / total_duration) * 100.0