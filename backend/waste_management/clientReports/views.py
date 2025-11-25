from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .authentication import CustomJWTAuthentication
from .models import Reports
from .serializers import ReportCreateSerializer, ReportListSerializer, ReportDetailSerializer
from authentication.models import Users


class CreateReportView(APIView):
    """
    POST /api/reports/create/
    Create a new report
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get user directly from request (set by CustomJWTAuthentication)
            user_id = request.auth.get('user_id') if request.auth else None
            user = None
            
            if user_id:
                try:
                    user = Users.objects.get(user_id=user_id)
                except Users.DoesNotExist:
                    return Response(
                        {'error': 'User not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )

            serializer = ReportCreateSerializer(
                data=request.data, 
                context={'user': user}
            )
            
            if serializer.is_valid():
                report = serializer.save()
                return Response({
                    'message': 'Report created successfully',
                    'report_id': report.report_id,
                    'title': report.title,
                    'status': report.status
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreateReportPublicView(APIView):
    """
    POST /api/reports/create/public/
    Create a new report without authentication (for testing)
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        try:
            # For public reports, get user_id from request body
            user_id = request.data.get('user_id')
            user = None
            
            if user_id:
                try:
                    user = Users.objects.get(user_id=user_id)
                except Users.DoesNotExist:
                    pass  # Allow report without user for testing

            serializer = ReportCreateSerializer(
                data=request.data, 
                context={'user': user}
            )
            
            if serializer.is_valid():
                report = serializer.save()
                return Response({
                    'message': 'Report created successfully',
                    'report_id': report.report_id,
                    'title': report.title,
                    'status': report.status
                }, status=status.HTTP_201_CREATED)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListReportsView(APIView):
    """
    GET /api/reports/
    List all reports for the authenticated user
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            user_id = request.auth.get('user_id') if request.auth else None
            
            if user_id:
                reports = Reports.objects.filter(user__user_id=user_id)
            else:
                reports = Reports.objects.none()
            
            serializer = ReportListSerializer(reports, many=True)
            return Response({
                'count': reports.count(),
                'reports': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ListAllReportsView(APIView):
    """
    GET /api/reports/all/
    List all reports (for admins)
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Check if user is admin
            user_id = request.auth.get('user_id') if request.auth else None
            role = request.auth.get('role') if request.auth else None
            
            if role != 'Admin':
                return Response(
                    {'error': 'Permission denied. Admin access required.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            reports = Reports.objects.all()
            serializer = ReportListSerializer(reports, many=True)
            return Response({
                'count': reports.count(),
                'reports': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReportDetailView(APIView):
    """
    GET /api/reports/<report_id>/
    Get a single report by ID
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        try:
            report = Reports.objects.get(report_id=report_id)
            serializer = ReportDetailSerializer(report)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Reports.DoesNotExist:
            return Response(
                {'error': 'Report not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class UpdateReportStatusView(APIView):
    """
    PATCH /api/reports/<report_id>/status/
    Update report status (for admins)
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, report_id):
        try:
            role = request.auth.get('role') if request.auth else None
            
            if role != 'Admin':
                return Response(
                    {'error': 'Permission denied. Admin access required.'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            report = Reports.objects.get(report_id=report_id)
            new_status = request.data.get('status')
            
            if new_status not in ['pending', 'reviewed', 'resolved']:
                return Response(
                    {'error': 'Invalid status'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            report.status = new_status
            
            # Set resolved_at if status is resolved
            if new_status == 'resolved':
                from django.utils import timezone
                report.resolved_at = timezone.now()
                
                # Set handled_by to current admin
                user_id = request.auth.get('user_id')
                if user_id:
                    try:
                        admin = Users.objects.get(user_id=user_id)
                        report.handled_by = admin
                    except Users.DoesNotExist:
                        pass
            
            report.save()
            
            return Response({
                'message': 'Report status updated',
                'report_id': report.report_id,
                'status': report.status
            }, status=status.HTTP_200_OK)
            
        except Reports.DoesNotExist:
            return Response(
                {'error': 'Report not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class DeleteReportView(APIView):
    """
    DELETE /api/reports/<report_id>/
    Delete a report
    """
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, report_id):
        try:
            user_id = request.auth.get('user_id') if request.auth else None
            role = request.auth.get('role') if request.auth else None
            
            report = Reports.objects.get(report_id=report_id)
            
            # Allow deletion if user owns the report or is admin
            if role != 'Admin' and report.user.user_id != user_id:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            report.delete()
            return Response(
                {'message': 'Report deleted successfully'}, 
                status=status.HTTP_200_OK
            )
            
        except Reports.DoesNotExist:
            return Response(
                {'error': 'Report not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )