from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # Change this
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth import get_user_model
from .models import Report
from .serializers import ReportCreateSerializer, ReportListSerializer

User = get_user_model()


class ReportCreateView(generics.CreateAPIView):
    """Create a new report with photo upload support"""
    permission_classes = [AllowAny]  # ✅ Allow anyone (temporary for testing)
    serializer_class = ReportCreateSerializer
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        print("📥 Received data:", request.data)  # Debug log
        
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            print("❌ Validation errors:", serializer.errors)  # Debug log
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ Use the first user for testing (temporary)
        test_user = User.objects.first()
        if not test_user:
            return Response(
                {'error': 'No users found. Please create a user first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Override the request user
        request.user = test_user
        
        report = serializer.save()
        
        # Return success response
        response_serializer = ReportListSerializer(report)
        return Response(
            {
                'message': 'Report submitted successfully! 🎉',
                'report': response_serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class ReportListView(generics.ListAPIView):
    """List all reports for the authenticated user"""
    permission_classes = [AllowAny]  # ✅ Temporary
    serializer_class = ReportListSerializer
    queryset = Report.objects.all()  # Show all reports for testing


class ReportDetailView(generics.RetrieveAPIView):
    """Get a specific report"""
    permission_classes = [AllowAny]  # ✅ Temporary
    serializer_class = ReportListSerializer
    queryset = Report.objects.all()


class ReportUpdateStatusView(APIView):
    """Update report status"""
    permission_classes = [AllowAny]  # ✅ Temporary
    
    def patch(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response(
                {'error': 'Report not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        if new_status not in ['pending', 'reviewed', 'resolved']:
            return Response(
                {'error': 'Invalid status. Must be: pending, reviewed, or resolved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        report.status = new_status
        report.save()
        
        serializer = ReportListSerializer(report)
        return Response({
            'message': 'Status updated successfully',
            'report': serializer.data
        })


class ReportDeleteView(generics.DestroyAPIView):
    """Delete a report"""
    permission_classes = [AllowAny]  # ✅ Temporary
    queryset = Report.objects.all()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'Report deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )
