from django.urls import path
from .views import (
    CreateReportView,
    CreateReportPublicView,
    ListReportsView,
    ListAllReportsView,
    ReportDetailView,
    UpdateReportStatusView,
    DeleteReportView,
)

urlpatterns = [
    # Create report (authenticated)
    path('create/', CreateReportView.as_view(), name='create_report'),
    
    # Create report (public - for testing)
    path('create/public/', CreateReportPublicView.as_view(), name='create_report_public'),
    
    # List user's reports
    path('', ListReportsView.as_view(), name='list_reports'),
    
    # List all reports (admin only)
    path('all/', ListAllReportsView.as_view(), name='list_all_reports'),
    
    # Get single report
    path('<int:report_id>/', ReportDetailView.as_view(), name='report_detail'),
    
    # Update report status (admin only)
    path('<int:report_id>/status/', UpdateReportStatusView.as_view(), name='update_report_status'),
    
    # Delete report
    path('<int:report_id>/delete/', DeleteReportView.as_view(), name='delete_report'),
]