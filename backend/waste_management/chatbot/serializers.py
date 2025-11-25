from rest_framework import serializers
from .models import ChatbotLogs, FAQ

class ChatMessageSerializer(serializers.Serializer):
    message = serializers.CharField(required=True, max_length=2000)

class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    timestamp = serializers.DateTimeField()

class ChatLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotLogs
        fields = ['chat_id', 'message_text', 'response_text', 'timestamp']

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['faq_id', 'question', 'answer', 'category']