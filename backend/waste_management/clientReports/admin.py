from django.contrib import admin
from .models import Report, Address

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['id', 'street', 'city', 'region']
    search_fields = ['street', 'city', 'region']
    list_filter = ['city', 'region']

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'title',
        'type_of_report',
        'severity_level',
        'response_priority',
        'status',
        'user',
        'created_at'
    ]
    list_filter = [
        'status',
        'type_of_report',
        'response_priority',
        'severity_level',
        'created_at'
    ]
    search_fields = ['title', 'description', 'user__username', 'user__email']
    readonly_fields = ['created_at', 'resolved_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'title', 'description')
        }),
        ('Classification', {
            'fields': ('type_of_report', 'severity_level', 'response_priority')
        }),
        ('Location', {
            'fields': ('address',)
        }),
        ('Media', {
            'fields': ('image_url',)
        }),
        ('Status', {
            'fields': ('status', 'handled_by', 'resolved_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )