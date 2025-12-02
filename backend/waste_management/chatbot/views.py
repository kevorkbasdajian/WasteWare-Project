from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import ChatbotLogs, FAQ
from .serializers import ChatMessageSerializer, ChatLogSerializer, FAQSerializer
from .bot_logic import chatbot
from clientReports.authentication import CustomJWTAuthentication
from rest_framework.permissions import IsAuthenticated

class ChatView(APIView):
    """POST /api/chatbot/chat/ - Send message to chatbot"""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_message = serializer.validated_data['message']
        
        # Get user if authenticated
        user = None
        if hasattr(request, 'user') and hasattr(request.user, 'user_id'):
            user = request.user
        
        # Get chatbot response
        bot_response = chatbot.get_response(
            user_message, 
            user.user_id if user else None
        )
        
        # Log conversation
        ChatbotLogs.objects.create(
            user=user,
            message_text=user_message,
            response_text=bot_response
        )
        
        return Response({
            'response': bot_response,
            'timestamp': timezone.now()
        }, status=status.HTTP_200_OK)


class ChatHistoryView(APIView):
    """GET /api/chatbot/history/ - Get user's chat history"""
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logs = ChatbotLogs.objects.filter(user=user).order_by('-timestamp')[:50]
        serializer = ChatLogSerializer(logs, many=True)
        return Response({
            'count': logs.count(),
            'history': serializer.data
        }, status=status.HTTP_200_OK)


class FAQListView(APIView):
    """GET /api/chatbot/faqs/ - Get all FAQs"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category', None)
        
        if category:
            faqs = FAQ.objects.filter(category=category)
        else:
            faqs = FAQ.objects.all()
        
        serializer = FAQSerializer(faqs, many=True)
        return Response({
            'count': faqs.count(),
            'faqs': serializer.data
        }, status=status.HTTP_200_OK)