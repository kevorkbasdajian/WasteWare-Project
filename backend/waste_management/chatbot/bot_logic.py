import google.generativeai as genai
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta

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
- Provide location-based information (pickups, recycling centers, routes)

Report Categories:
🗑️ Illegal Dumping - Large unauthorized waste dumps
🚮 Public Littering - Street waste, scattered trash
☢️ Hazardous Materials - Chemicals, medical waste
🧱 Construction Debris - Building materials, rubble
🍃 Organic Waste - Food waste, garden waste
📱 E-Waste - Electronics, batteries, appliances

Severity Levels: Low, Medium, High, Critical
Priority Levels: Routine, Moderate, High, Emergency
Logout Button: End of Navigation Menu or In Profile Page

If the user thanks you, respond politely but briefly.

Keep responses:
- Short and conversational (3-5 sentences)
- Focused on waste management topics
- Helpful and action-oriented
- Friendly and encouraging"""

    def get_user_context(self, user_id):
        """Get user's location and personal data for context-aware responses"""
        try:
            from authentication.models import Users
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            context = {
                'has_address': user.address is not None,
                'city': user.address.city if user.address else None,
                'region': user.address.region if user.address else None,
                'latitude': float(user.address.latitude) if user.address and user.address.latitude else None,
                'longitude': float(user.address.longitude) if user.address and user.address.longitude else None,
            }
            return context
        except Exception as e:
            print(f"Error getting user context: {e}")
            return {'has_address': False}

    def get_next_pickup(self, user_id):
        """Find the next scheduled pickup for user's area"""
        try:
            from company.models import Pickup, Schedule, Route, RouteStop
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            # Check if user has address
            if not user.address or not user.address.city:
                return "📍 Please add your address in your profile first so I can check pickup schedules for your area!"
            
            # Get current date
            today = timezone.now().date()
            
            # Find upcoming pickups (schedules in the future)
            upcoming_schedules = Schedule.objects.filter(
                pickup_date__gte=today,
                status='available'
            ).order_by('pickup_date', 'start_time')[:5]
            
            if not upcoming_schedules.exists():
                return f"🗓️ No upcoming pickups scheduled yet for {user.address.city}. Check back soon!"
            
            # Format the response
            response = f"📅 **Upcoming Pickups in {user.address.city}:**\n\n"
            for schedule in upcoming_schedules:
                response += f"• {schedule.pickup_date.strftime('%A, %B %d')} at {schedule.start_time.strftime('%I:%M %p')}\n"
            
            response += "\n💡 Make sure your waste is ready before the pickup time!"
            return response
            
        except Exception as e:
            print(f"Error getting next pickup: {e}")
            return "Sorry, I couldn't check pickup schedules right now. Please try again later."

    def get_nearest_recycling_centers(self, user_id):
        """Find nearest recycling centers/dumping locations"""
        try:
            from company.models import Dumping
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            # Check if user has address
            if not user.address or not user.address.city:
                return "📍 Please add your address in your profile first so I can find recycling centers near you!"
            
            # Get dumping locations in the same city
            centers = Dumping.objects.select_related('address', 'waste_type').filter(
                address__city__iexact=user.address.city
            )[:5]
            
            if not centers.exists():
                return f"♻️ No recycling centers found in {user.address.city} yet. Try checking the Map page for all locations!"
            
            # Format response
            response = f"♻️ **Recycling Centers in {user.address.city}:**\n\n"
            for center in centers:
                response += f"• **{center.Title}**\n"
                response += f"  Type: {center.waste_type.name}\n"
                response += f"  Location: {center.address.street}\n"
                if center.maximum_capacity:
                    response += f"  Capacity: {center.collected_waste}/{center.maximum_capacity} kg\n"
                response += "\n"
            
            response += "🗺️ View exact locations on the Map page!"
            return response
            
        except Exception as e:
            print(f"Error getting recycling centers: {e}")
            return "Sorry, I couldn't find recycling centers right now. Please try again later."

    def get_nearby_routes(self, user_id):
        """Check if there are active collection routes in user's area"""
        try:
            from company.models import Route, RouteStop
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            # Check if user has address
            if not user.address or not user.address.city:
                return "📍 Please add your address in your profile first so I can check routes in your area!"
            
            # Find active routes that have stops in user's city
            routes = Route.objects.filter(
                status='active',
                route_stops__dumping__address__city__iexact=user.address.city
            ).select_related('waste_type', 'driver').distinct()[:5]
            
            if not routes.exists():
                return f"🚛 No active collection routes found in {user.address.city} right now."
            
            # Format response
            response = f"🚛 **Active Routes in {user.address.city}:**\n\n"
            for route in routes:
                response += f"• Route #{route.route_id} - {route.waste_type.name}\n"
                if route.driver:
                    response += f"  Driver: {route.driver.first_name} {route.driver.last_name}\n"
                response += "\n"
            
            response += "📱 Track routes in real-time on the Map page!"
            return response
            
        except Exception as e:
            print(f"Error getting nearby routes: {e}")
            return "Sorry, I couldn't check routes right now. Please try again later."

    def detect_location_query(self, message, user_id):
        """Detect if user is asking location-based questions"""
        message_lower = message.lower()
        
        # DEBUG: Print what we're checking
        print(f"🔍 DEBUG: Checking message: '{message}'")
        print(f"🔍 DEBUG: Lowercase: '{message_lower}'")
        
        # Pickup schedule queries
        pickup_keywords = ['pickup', 'pick up', 'collection', 'next collection', 'when', 'schedule']
        print(f"🔍 DEBUG: Checking pickup keywords...")
        for keyword in pickup_keywords:
            if keyword in message_lower:
                print(f"✅ DEBUG: Found keyword '{keyword}'")
                if 'next' in message_lower or 'when' in message_lower or 'schedule' in message_lower:
                    print(f"🎯 DEBUG: Calling get_next_pickup()")
                    return self.get_next_pickup(user_id)
        
        # Recycling center queries
        center_keywords = ['recycling center', 'nearest', 'close', 'nearby', 'where can i', 'dumping']
        print(f"🔍 DEBUG: Checking center keywords...")
        for keyword in center_keywords:
            if keyword in message_lower:
                print(f"✅ DEBUG: Found keyword '{keyword}'")
                return self.get_nearest_recycling_centers(user_id)
        
        # Route queries
        route_keywords = ['route', 'truck', 'collection route', 'active route']
        print(f"🔍 DEBUG: Checking route keywords...")
        for keyword in route_keywords:
            if keyword in message_lower:
                print(f"✅ DEBUG: Found keyword '{keyword}'")
                if 'near' in message_lower or 'area' in message_lower or 'my' in message_lower:
                    print(f"🎯 DEBUG: Calling get_nearby_routes()")
                    return self.get_nearby_routes(user_id)
        
        print(f"❌ DEBUG: No location keywords matched, using AI")
        return None

    def get_response(self, user_message, user_id=None):
        """Get AI response for user message"""
        
        if not self.model:
            return "Sorry, AI service is temporarily unavailable. Please try again later."
        
        try:
            # First check if this is a location-based query
            if user_id:
                location_response = self.detect_location_query(user_message, user_id)
                if location_response:
                    return location_response
            
            # Otherwise, use Gemini AI
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
print("🔥🔥🔥 NEW BOT_LOGIC.PY LOADED! 🔥🔥🔥")