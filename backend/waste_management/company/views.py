from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Driver, Truck, Dumping, Route, WasteType,Schedule,Pickup
from .serializers import (
    DriverSerializer, TruckSerializer, DumpingSerializer,
    RouteSerializer,WasteTypeSerializer,ScheduleSerializer,PickupSerializer
)

# ------------------- DRIVER -------------------
class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all().order_by('-created_at')
    serializer_class = DriverSerializer
    permission_classes = [IsAuthenticated]  # Back to standard permission

    def list(self, request, *args, **kwargs):
        print("=" * 50)
        print("USER:", request.user)
        print("USER TYPE:", type(request.user))
        if hasattr(request.user, 'user_id'):
            print("USER ID:", request.user.user_id)
        if hasattr(request.user, 'company_id'):
            print("COMPANY ID:", request.user.company_id)
        print("=" * 50)
        return super().list(request, *args, **kwargs)
        
    def get_queryset(self):
        qs = super().get_queryset()
        unassigned_to_route = self.request.query_params.get("unassigned_to_route")
        if unassigned_to_route is not None:
            qs = qs.filter(trucks__routes__isnull=True).distinct()
        return qs


# ------------------- TRUCK -------------------
class TruckViewSet(viewsets.ModelViewSet):
    queryset = Truck.objects.all().order_by('truck_id')
    serializer_class = TruckSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        available = self.request.query_params.get("available")
        driver_id = self.request.query_params.get("driver")

        if available is not None:
            qs = qs.filter(available=True)
        if driver_id is not None:
            qs = qs.filter(driver_id=driver_id)

        return qs


# ------------------- DUMPING -------------------
class DumpingViewSet(viewsets.ModelViewSet):
    queryset = Dumping.objects.all().order_by('-created_at')
    serializer_class = DumpingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        waste_type = self.request.query_params.get("waste_type")
        if waste_type:
            qs = qs.filter(waste_type_id=waste_type)
        return qs
    def create(self, request, *args, **kwargs):
        print("=" * 50)
        print("RECEIVED DATA:", request.data)
        print("=" * 50)
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("VALIDATION ERRORS:", serializer.errors)
            print("=" * 50)
            return Response(serializer.errors, status=400)

        dumping = serializer.save()
        return Response(DumpingSerializer(dumping).data, status=201)


# ------------------- ROUTE -------------------
class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all().order_by('-created_at')
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        route = serializer.save()
        return Response(RouteSerializer(route).data, status=201)
    
class WasteTypeViewSet(viewsets.ModelViewSet):
    queryset = WasteType.objects.all().order_by('name')
    serializer_class = WasteTypeSerializer
    permission_classes = [IsAuthenticated]


# views.py - Update the existing ScheduleViewSet

class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all().order_by('-pickup_date', '-start_time')
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        from django.utils import timezone
        qs = super().get_queryset()
        date = self.request.query_params.get("date")
        status_param = self.request.query_params.get("status")
        future_only = self.request.query_params.get("future_only")
        available = self.request.query_params.get("available")  # Not assigned to any pickup
        
        if date:
            qs = qs.filter(pickup_date=date)
        if status_param:
            qs = qs.filter(status=status_param)
        if future_only == 'true':
            # Get schedules from today onwards
            today = timezone.now().date()
            qs = qs.filter(pickup_date__gte=today)
        if available == 'true':
            # Get schedules not assigned to any pickup
            qs = qs.filter(pickups__isnull=True)
        
        return qs
    


class PickupViewSet(viewsets.ModelViewSet):
    queryset = Pickup.objects.all().order_by('-created_at')
    serializer_class = PickupSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        status = self.request.query_params.get("status")
        route_id = self.request.query_params.get("route_id")
        schedule_id = self.request.query_params.get("schedule_id")
        date = self.request.query_params.get("date")
        active_only = self.request.query_params.get("active_only")
        
        if status:
            qs = qs.filter(status=status)
        if route_id:
            qs = qs.filter(route_id=route_id)
        if schedule_id:
            qs = qs.filter(schedule_id=schedule_id)
        if date:
            qs = qs.filter(schedule__pickup_date=date)
        if active_only == 'true':
            qs = qs.filter(status__in=['Not Started', 'In Progress'])
        
        return qs.select_related('schedule', 'route', 'route__driver', 'route__truck', 'route__waste_type')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pickup = serializer.save()
        return Response(PickupSerializer(pickup).data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def update_statuses(self, request):
        """
        Manually trigger status updates for all pickups
        """
        from .tasks import update_pickup_statuses
        update_pickup_statuses()
        return Response({"message": "Pickup statuses updated"})
    
    @action(detail=False, methods=['post'])
    def simulate_movements(self, request):
        """
        Manually trigger truck movement simulation
        """
        from .tasks import simulate_truck_movements
        simulate_truck_movements()
        return Response({"message": "Truck movements simulated"})
    
    @action(detail=True, methods=['patch'])
    def update_location(self, request, pk=None):
        """
        Update live location of the pickup
        Expected payload: {"latitude": <num>, "longitude": <num>}
        """
        pickup = self.get_object()
        live_location = request.data.get('live_location')
        
        if not live_location or 'latitude' not in live_location or 'longitude' not in live_location:
            return Response(
                {"error": "live_location must include latitude and longitude"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pickup.live_location = live_location
        pickup.save()
        
        return Response(PickupSerializer(pickup).data)
    
    @action(detail=True, methods=['patch'])
    def update_weight(self, request, pk=None):
        """
        Update collected weight
        Expected payload: {"weight_collected": <num>}
        """
        pickup = self.get_object()
        weight = request.data.get('weight_collected')
        
        if weight is None:
            return Response(
                {"error": "weight_collected is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pickup.weight_collected = weight
        pickup.save()
        
        return Response(PickupSerializer(pickup).data)
    
    @action(detail=True, methods=['get'])
    def current_position(self, request, pk=None):
        """
        Get current simulated position of the truck
        """
        pickup = self.get_object()
        
        return Response({
            'pickup_id': pickup.pickup_id,
            'live_location': pickup.live_location,
            'status': pickup.status,
            'progress_percentage': pickup.calculate_progress_percentage(),
            'weight_collected': pickup.weight_collected
        })


