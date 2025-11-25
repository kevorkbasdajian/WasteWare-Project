import google.generativeai as genai
from django.conf import settings

# Configure Gemini
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    print(f"Warning: Gemini API key not configured: {e}")

class WasteWareChatbot:
    def __init__(self):
        self.model = None
        try:
            self.model = genai.GenerativeModel('models/gemini-2.5-flash')
            print("✅ Gemini 2.5 Flash initialized successfully!")
        except Exception as e:
            print(f"❌ Could not initialize Gemini model: {e}")
        
        self.conversation_history = {}
        
        self.system_prompt = """You are WasteWare Assistant, a helpful chatbot for a waste management app in Lebanon.

Your role:
- Help users navigate the app (Home, Map, Report, Rewards, Profile pages)
- Answer recycling questions (plastic, paper, glass, metal, e-waste, organic waste, hazardous materials)
- Guide users on submitting reports (categories, severity levels, priority levels)
- Explain the rewards system

Report Categories:
🗑️ Illegal Dumping - Large unauthorized waste dumps
🚮 Public Littering - Street waste, scattered trash
☢️ Hazardous Materials - Chemicals, medical waste
🧱 Construction Debris - Building materials, rubble
🍃 Organic Waste - Food waste, garden waste
📱 E-Waste - Electronics, batteries, appliances

Severity Levels: Low, Medium, High, Critical
Priority Levels: Routine, Moderate, High, Emergency
Lougout Button: End of Navigation Menu or In Profile Page

If the user thanks you, respond politely but briefly.

Keep responses:
- Short and conversational (3-5 sentences)
- Focused on waste management topics
- Helpful and action-oriented
- Friendly and encouraging"""

    def get_response(self, user_message, user_id=None):
        """Get AI response for user message"""
        
        if not self.model:
            return "Sorry, AI service is temporarily unavailable. Please try again later."
        
        try:
            return self._get_gemini_response(user_message, user_id)
        except Exception as e:
            print(f"Gemini error: {e}")
            return "I'm having trouble responding right now. Please try again in a moment."
    
    def _get_gemini_response(self, user_message, user_id):
        """Get response from Gemini AI with conversation context"""
        
        # Get or create conversation for this user
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = self.model.start_chat(history=[])
        
        chat = self.conversation_history[user_id]
        
        # Add system prompt on first message
        if len(chat.history) == 0:
            full_message = f"{self.system_prompt}\n\nUser: {user_message}"
        else:
            full_message = user_message
        
        # Get AI response
        response = chat.send_message(full_message)
        return response.text
    
    def clear_history(self, user_id):
        """Clear conversation history for a user"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]

# Singleton instance
chatbot = WasteWareChatbot()