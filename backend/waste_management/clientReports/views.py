from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q
from .models import Report, Address
from .serializers import ReportSerializer, ReportListSerializer, AddressSerializer


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reports
    
    Endpoints:
    - GET /api/reports/ - List all reports
    - POST /api/reports/ - Create new report
    - GET /api/reports/{id}/ - Get specific report
    - PUT /api/reports/{id}/ - Update report
    - DELETE /api/reports/{id}/ - Delete report
    - GET /api/reports/my_reports/ - Get current user's reports
    """
    
    queryset = Report.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail"""
        if self.action == 'list':
            return ReportListSerializer
        return ReportSerializer
    
    def get_queryset(self):
        """Filter queryset based on query params"""
        queryset = Report.objects.select_related('user', 'address').all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by type
        type_filter = self.request.query_params.get('type', None)
        if type_filter:
            queryset = queryset.filter(type_of_report=type_filter)
        
        # Filter by priority
        priority_filter = self.request.query_params.get('priority', None)
        if priority_filter:
            queryset = queryset.filter(response_priority=priority_filter)
        
        # Search by title or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Create a new report"""
        # Map frontend field names to backend
        severity_map = {
            'low': 1,
            'medium': 2,
            'high': 3,
            'critical': 4
        }
        
        # Prepare data
        data = request.data.copy()
        
        # Convert severity level from string to int
        if 'severity' in data:
            severity = data.pop('severity')
            data['severity_level'] = severity_map.get(severity, 2)
        
        # Rename fields to match serializer
        if 'category' in data:
            data['type_of_report'] = data.pop('category')
        
        if 'priority' in data:
            data['response_priority'] = data.pop('priority')
        
        if 'address' in data:
            data['street_address'] = data.pop('address')
        
        if 'city' in data:
            data['city_name'] = data.pop('city')
        
        if 'governorate' in data:
            data['governorate'] = data.pop('governorate')
        
        if 'details' in data:
            data['description'] = data.pop('details')
        
        # Add current user
        data['user'] = request.user.id
        
        # Create serializer and validate
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'message': 'Report created successfully',
                'report': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    def perform_create(self, serializer):
        """Save the report with current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_reports(self, request):
        """Get reports created by current user"""
        reports = self.get_queryset().filter(user=request.user)
        serializer = ReportListSerializer(reports, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark a report as resolved"""
        report = self.get_object()
        report.status = 'resolved'
        report.handled_by = request.user
        from django.utils import timezone
        report.resolved_at = timezone.now()
        report.save()
        
        serializer = self.get_serializer(report)
        return Response({
            'message': 'Report marked as resolved',
            'report': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get report statistics"""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'reviewed': queryset.filter(status='reviewed').count(),
            'resolved': queryset.filter(status='resolved').count(),
            'by_type': {},
            'by_priority': {},
        }
        
        # Count by type
        for choice in Report.TYPE_CHOICES:
            count = queryset.filter(type_of_report=choice[0]).count()
            stats['by_type'][choice[0]] = count
        
        # Count by priority
        for choice in Report.PRIORITY_CHOICES:
            count = queryset.filter(response_priority=choice[0]).count()
            stats['by_priority'][choice[0]] = count
        
        return Response(stats)