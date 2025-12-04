from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DriverViewSet, 
    TruckViewSet, 
    DumpingViewSet, 
    RouteViewSet,
    WasteTypeViewSet,
    ScheduleViewSet,
    PickupViewSet,
)

router = DefaultRouter()
router.register(r'drivers', DriverViewSet, basename='driver')
router.register(r'trucks', TruckViewSet, basename='truck')
router.register(r'dumpings', DumpingViewSet, basename='dumping')
router.register(r'routes', RouteViewSet, basename='route')
router.register(r'waste-types', WasteTypeViewSet, basename='wastetype')
router.register(r'schedules', ScheduleViewSet, basename='schedule') 
router.register(r'pickups', PickupViewSet, basename='pickup')

urlpatterns = [
    path('', include(router.urls)),
]