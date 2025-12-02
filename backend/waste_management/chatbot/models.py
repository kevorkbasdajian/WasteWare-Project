from django.db import models
from django.utils import timezone
from authentication.models import Users

class ChatbotLogs(models.Model):
    chat_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        Users, 
        on_delete=models.CASCADE, 
        db_column='user_id',
        null=True, 
        blank=True
    )
    message_text = models.TextField()
    response_text = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'ChatbotLogs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"Chat {self.chat_id} - {self.timestamp}"


class FAQ(models.Model):
    faq_id = models.AutoField(primary_key=True)
    question = models.TextField()
    answer = models.TextField()
    category = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'FAQ'

    def __str__(self):
        return self.question[:50]