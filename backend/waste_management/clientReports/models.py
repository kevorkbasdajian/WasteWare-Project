from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Address(models.Model):
    street = models.TextField()
    city = models.TextField()
    region = models.TextField(blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        db_table = 'addresses'
        verbose_name_plural = 'Addresses'
    
    def __str__(self):
        return f"{self.street}, {self.city}"


class Report(models.Model):
    TYPE_CHOICES = [
        ('illegal dumping', 'Illegal Dumping'),
        ('public littering', 'Public Littering'),
        ('hazardous materials', 'Hazardous Materials'),
        ('construction debris', 'Construction Debris'),
        ('organic waste', 'Organic Waste'),
        ('e-waste', 'E-Waste'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('resolved', 'Resolved'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    title = models.TextField()
    type_of_report = models.CharField(max_length=50, choices=TYPE_CHOICES)
    severity_level = models.IntegerField()  # 1=Low, 2=Medium, 3=High, 4=Critical
    response_priority = models.CharField(max_length=20)
    address = models.ForeignKey(Address, on_delete=models.CASCADE, related_name='reports')
    description = models.TextField(blank=True, null=True)
    image_url = models.ImageField(upload_to='reports/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.status}"