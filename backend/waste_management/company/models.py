from django.db import models
from django.conf import settings
from django.utils import timezone

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
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
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
        ('scheduled', 'Scheduled'),
        ('inProgress','inProgress'),
        ('completed', 'Completed'),
        ('canceled', 'Canceled'),
    ]
    
    schedule_id = models.AutoField(primary_key=True)
    pickup_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
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