from django.db import models
from django.utils import timezone
from authentication.models import Users, Addresses

class Reports(models.Model):
    TYPE_CHOICES = [
        ('illegal dumping', 'Illegal Dumping'),
        ('public littering', 'Public Littering'),
        ('hazardous materials', 'Hazardous Materials'),
        ('construction debris', 'Construction Debris'),
        ('organic waste', 'Organic Waste'),
        ('E-waste', 'E-Waste'),
    ]

    SEVERITY_CHOICES = [
        (1, 'Low'),
        (2, 'Medium'),
        (3, 'High'),
        (4, 'Critical'),
    ]

    PRIORITY_CHOICES = [
        ('routine', 'Routine'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
        ('emergency', 'Emergency'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
    ]

    report_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        Users, 
        on_delete=models.CASCADE, 
        db_column='user_id',
        related_name='reports'
    )
    title = models.TextField()
    type_of_report = models.CharField(
        max_length=50, 
        choices=TYPE_CHOICES
    )
    severity_level = models.IntegerField(
        choices=SEVERITY_CHOICES,
        null=True,
        blank=True
    )
    response_priority = models.CharField(
        max_length=20, 
        choices=PRIORITY_CHOICES,
        null=True,
        blank=True
    )
    address = models.ForeignKey(
        Addresses, 
        on_delete=models.SET_NULL, 
        db_column='address_id',
        null=True,
        blank=True
    )
    description = models.TextField(null=True, blank=True)
    image_url = models.ImageField(upload_to='reports/', null=True, blank=True)
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    handled_by = models.ForeignKey(
        Users, 
        on_delete=models.SET_NULL, 
        db_column='handled_by',
        null=True,
        blank=True,
        related_name='handled_reports'
    )
    created_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'Reports'
        ordering = ['-created_at']

    def __str__(self):
        return f"Report #{self.report_id}: {self.title}"