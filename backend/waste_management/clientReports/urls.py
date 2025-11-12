from django.urls import path
from .views import (
    ReportCreateView,
    ReportListView,
    ReportDetailView,
    ReportUpdateStatusView,
    ReportDeleteView
)

urlpatterns = [
    path('reports/', ReportCreateView.as_view(), name='report-create'),
    path('reports/list/', ReportListView.as_view(), name='report-list'),
    path('reports/<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
    path('reports/<int:pk>/status/', ReportUpdateStatusView.as_view(), name='report-update-status'),
    path('reports/<int:pk>/delete/', ReportDeleteView.as_view(), name='report-delete'),
]