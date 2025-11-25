from django.urls import path
from .views import ChatView, ChatHistoryView, FAQListView

urlpatterns = [
    path('chat/', ChatView.as_view(), name='chat'),
    path('history/', ChatHistoryView.as_view(), name='chat_history'),
    path('faqs/', FAQListView.as_view(), name='faq_list'),
]