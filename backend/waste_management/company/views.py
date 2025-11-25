from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Driver, Truck, Dumping, Route, WasteType,Schedule
from .serializers import (
    DriverSerializer, TruckSerializer, DumpingSerializer,
    RouteSerializer,WasteTypeSerializer,ScheduleSerializer
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


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.all().order_by('-pickup_date', '-start_time')
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        date = self.request.query_params.get("date")
        status = self.request.query_params.get("status")
        
        if date:
            qs = qs.filter(pickup_date=date)
        if status:
            qs = qs.filter(status=status)
        
        return qs


