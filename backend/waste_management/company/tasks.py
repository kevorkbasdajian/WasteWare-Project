from django.utils import timezone
from django.db import transaction
from .models import Pickup, RouteStop
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def interpolate_position(start_lat, start_lon, end_lat, end_lon, progress):
    """
    Interpolate position between two points based on progress (0-1)
    """
    lat = start_lat + (end_lat - start_lat) * progress
    lon = start_lon + (end_lon - start_lon) * progress
    return lat, lon

def get_current_segment_and_progress(waypoints, overall_progress):
    """
    Given waypoints and overall progress (0-100), determine which segment
    the truck is on and the progress within that segment
    """
    if overall_progress <= 0:
        return 0, 0.0, waypoints[0], waypoints[1] if len(waypoints) > 1 else waypoints[0]
    if overall_progress >= 100:
        return len(waypoints) - 2, 1.0, waypoints[-2], waypoints[-1]
    
    num_segments = len(waypoints) - 1
    progress_per_segment = 100.0 / num_segments
    
    segment_index = int(overall_progress / progress_per_segment)
    if segment_index >= num_segments:
        segment_index = num_segments - 1
    
    segment_progress = (overall_progress % progress_per_segment) / progress_per_segment
    
    return segment_index, segment_progress, waypoints[segment_index], waypoints[segment_index + 1]

@transaction.atomic
def update_pickup_statuses():
    """
    Check all pickups and update their statuses based on schedule times
    This should be called periodically (e.g., every 30 seconds)
    """
    now = timezone.now()
    pickups = Pickup.objects.select_related('schedule', 'route').all()
    
    for pickup in pickups:
        old_status = pickup.status
        
        # Check if should be completed
        if pickup.should_be_completed() and pickup.status != 'completed':
            pickup.status = 'completed'
            pickup.schedule.status = 'completed'
            pickup.schedule.save()
            
            # Move truck back to company location
            pickup.update_live_location(33.8938, 35.5018)
            
            # Check if route should be inactive
            other_active_pickups = Pickup.objects.filter(
                route=pickup.route,
                status__in=['Not Started', 'In Progress']
            ).exclude(pickup_id=pickup.pickup_id)
            
            if not other_active_pickups.exists():
                pickup.route.status = 'inactive'
                pickup.route.save()
            
            pickup.save()
            print(f"Pickup {pickup.pickup_id} marked as completed")
        
        # Check if should be in progress
        elif pickup.should_be_in_progress() and pickup.status == 'Not Started':
            pickup.status = 'In Progress'
            pickup.schedule.status = 'inProgress'
            pickup.schedule.save()
            pickup.save()
            print(f"Pickup {pickup.pickup_id} started")

@transaction.atomic
def simulate_truck_movements():
    """
    Simulate truck movement for all in-progress pickups
    This should be called periodically (e.g., every 10 seconds)
    """
    active_pickups = Pickup.objects.filter(status='In Progress').select_related('schedule', 'route')
    
    for pickup in active_pickups:
        # Calculate progress percentage based on time
        progress = pickup.calculate_progress_percentage()
        
        # Get waypoints
        waypoints = pickup.get_route_waypoints()
        
        if len(waypoints) < 2:
            continue
        
        # Determine current segment and position
        segment_index, segment_progress, start_waypoint, end_waypoint = get_current_segment_and_progress(waypoints, progress)
        
        # Interpolate position
        new_lat, new_lon = interpolate_position(
            start_waypoint['latitude'],
            start_waypoint['longitude'],
            end_waypoint['latitude'],
            end_waypoint['longitude'],
            segment_progress
        )
        
        # Update live location
        pickup.update_live_location(new_lat, new_lon)
        
        # Check if truck just passed a dumping location (within 50 meters)
        if end_waypoint.get('type') == 'dumping':
            distance = calculate_distance(
                new_lat, new_lon,
                end_waypoint['latitude'],
                end_waypoint['longitude']
            )
            
            # If within 50 meters of dumping, add weight
            if distance < 0.05:  # 50 meters
                capacity = end_waypoint.get('capacity', 0)
                pickup.weight_collected = float(pickup.weight_collected or 0) + float(capacity)
                pickup.save()
                
                # Mark route stop as passed
                try:
                    route_stop = RouteStop.objects.get(
                        route=pickup.route,
                        dumping_id=end_waypoint['dumping_id']
                    )
                    if not route_stop.has_passed:
                        route_stop.has_passed = True
                        route_stop.save()
                        print(f"Pickup {pickup.pickup_id} collected {capacity}kg at dumping {end_waypoint['dumping_id']}")
                except RouteStop.DoesNotExist:
                    pass
        
        print(f"Pickup {pickup.pickup_id}: {progress:.2f}% complete, location: ({new_lat:.6f}, {new_lon:.6f})")