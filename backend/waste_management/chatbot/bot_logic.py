import google.generativeai as genai
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import math
import re

# Configure Gemini
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    print("✅ Gemini API configured successfully")
except Exception as e:
    print(f"❌ Warning: Gemini API key not configured: {e}")

class WasteWareChatbot:
    def __init__(self):
        self.model = None
        self.model_error = None
        
        try:
            print(f"🔧 Attempting to initialize Gemini model...")
            
            if not hasattr(settings, 'GEMINI_API_KEY'):
                self.model_error = "GEMINI_API_KEY not found in settings"
                print(f"❌ {self.model_error}")
            elif not settings.GEMINI_API_KEY:
                self.model_error = "GEMINI_API_KEY is empty"
                print(f"❌ {self.model_error}")
            else:
                print(f"🔑 API Key configured: {bool(settings.GEMINI_API_KEY)}")
                print(f"🔑 API Key (first 10 chars): {settings.GEMINI_API_KEY[:10]}")
                
                self.model = genai.GenerativeModel('models/gemini-2.5-flash')
                print("✅ Gemini 1.5 Flash initialized successfully!")
            
        except Exception as e:
            self.model_error = f"Could not initialize Gemini model: {e}"
            print(f"❌ {self.model_error}")
            import traceback
            traceback.print_exc()
        
        self.conversation_history = {}
        
        # Fallback responses for common questions
        self.fallback_responses = {
            'hello': "👋 Hello! I'm the WasteWare assistant. I can help you with:\n• Submitting waste reports\n• Finding recycling centers\n• Checking pickup schedules\n• Learning about our rewards system\n\nWhat would you like to know?",
            'hi': "👋 Hi there! How can I help you with waste management today?",
            'help': "🤖 **I can help you with:**\n\n• Submitting waste reports\n• Finding recycling centers nearby\n• Checking pickup schedules\n• Learning recycling tips\n• Understanding the rewards system\n• Navigating the app\n\nWhat would you like to know?",
        }
        
        self.system_prompt = """You are WasteWare Assistant, a helpful chatbot for a waste management app in Lebanon.

Your role:
- Help users navigate the app (Home, Map, Report, Rewards, Profile pages)
- Answer recycling questions (plastic, paper, glass, metal, e-waste, organic waste, hazardous materials)
- Guide users on submitting reports (categories, severity levels, priority levels)
- Explain the rewards system
- Provide location-based information (pickups, recycling centers, routes)

Report Categories:
🗑 Illegal Dumping - Large unauthorized waste dumps
🚮 Public Littering - Street waste, scattered trash
☢ Hazardous Materials - Chemicals, medical waste
🧱 Construction Debris - Building materials, rubble
🍃 Organic Waste - Food waste, garden waste
📱 E-Waste - Electronics, batteries, appliances

Severity Levels: Low, Medium, High, Critical
Priority Levels: Routine, Moderate, High, Emergency

Keep responses:
- Short and conversational (3-5 sentences)
- Focused on waste management topics
- Helpful and action-oriented
- Friendly and encouraging"""

    def get_fallback_response(self, message):
        """Get a fallback response for common questions when AI is unavailable"""
        message_lower = message.lower().strip()
        
        if message_lower in self.fallback_responses:
            return self.fallback_responses[message_lower]
        
        for key, response in self.fallback_responses.items():
            if key in message_lower:
                return response
        
        greetings = ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening']
        if any(greeting in message_lower for greeting in greetings):
            return self.fallback_responses['hello']
        
        thanks = ['thank', 'thanks', 'thx', 'appreciate']
        if any(word in message_lower for word in thanks):
            return "You're welcome! 😊 Let me know if you need anything else!"
        
        return None

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

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates using Haversine formula (in km)"""
        R = 6371
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

    def extract_waste_type(self, message):
        """Extract waste type from message"""
        message_lower = message.lower()
        waste_types = {
            'plastic': ['plastic', 'plastics'],
            'paper': ['paper', 'cardboard'],
            'glass': ['glass'],
            'metal': ['metal', 'aluminum', 'steel', 'can', 'cans'],
            'organic': ['organic', 'food', 'compost', 'garden'],
            'chemical': ['chemical', 'hazardous', 'toxic'],
            'electronic': ['electronic', 'e-waste', 'ewaste', 'electronics', 'battery', 'batteries']
        }
        
        for waste_type, keywords in waste_types.items():
            if any(keyword in message_lower for keyword in keywords):
                return waste_type
        
        return None

    def get_dumpings_by_type(self, user_id, waste_type=None):
        """Get dumpings filtered by waste type, sorted by distance"""
        try:
            from company.models import Dumping
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            if not user.address or not user.address.latitude or not user.address.longitude:
                return "📍 Please add your address with GPS coordinates in your profile first!"
            
            user_lat = float(user.address.latitude)
            user_lon = float(user.address.longitude)
            
            # Get dumpings
            query = Dumping.objects.select_related('address', 'waste_type').filter(
                address__latitude__isnull=False,
                address__longitude__isnull=False
            )
            
            # Filter by waste type if specified
            if waste_type:
                query = query.filter(waste_type__name__icontains=waste_type)
            
            all_dumpings = query
            
            if not all_dumpings.exists():
                type_msg = f" of type '{waste_type}'" if waste_type else ""
                return f"🗑 No dumping locations{type_msg} found in the system."
            
            # Calculate distances
            dumpings_with_distance = []
            for dumping in all_dumpings:
                try:
                    dumping_lat = float(str(dumping.address.latitude).replace(',', '.'))
                    dumping_lon = float(str(dumping.address.longitude).replace(',', '.'))
                    distance = self.calculate_distance(user_lat, user_lon, dumping_lat, dumping_lon)
                    
                    dumpings_with_distance.append({
                        'dumping': dumping,
                        'distance': distance
                    })
                except (ValueError, TypeError):
                    continue
            
            if not dumpings_with_distance:
                return "❌ No valid dumping locations found."
            
            # Sort by distance
            dumpings_with_distance.sort(key=lambda x: x['distance'])
            
            # Format response
            type_msg = f" (Type: {waste_type.title()})" if waste_type else ""
            response = f"🗑 **Dumping Locations{type_msg}:**\n\n"
            
            for idx, data in enumerate(dumpings_with_distance, 1):
                dumping = data['dumping']
                distance = data['distance']
                
                response += f"{idx}. **{dumping.Title}**\n"
                response += f"   📍 Distance: {distance:.2f} km\n"
                response += f"   🗑 Type: {dumping.waste_type.name if dumping.waste_type else 'General'}\n"
                response += f"   📫 Location: {dumping.address.street}, {dumping.address.city}\n"
                
                if dumping.maximum_capacity:
                    capacity_pct = (dumping.collected_waste / dumping.maximum_capacity) * 100
                    response += f"   📊 Capacity: {dumping.collected_waste}/{dumping.maximum_capacity} tons ({capacity_pct:.0f}%)\n"
                response += "\n"
            
            return response
            
        except Exception as e:
            print(f"Error getting dumpings: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I couldn't retrieve dumping locations right now."

    def get_closest_dumping(self, user_id, waste_type=None):
        """Get the closest dumping location"""
        try:
            from company.models import Dumping
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            if not user.address or not user.address.latitude or not user.address.longitude:
                return "📍 Please add your address with GPS coordinates in your profile first!"
            
            user_lat = float(user.address.latitude)
            user_lon = float(user.address.longitude)
            
            query = Dumping.objects.select_related('address', 'waste_type').filter(
                address__latitude__isnull=False,
                address__longitude__isnull=False
            )
            
            if waste_type:
                query = query.filter(waste_type__name__icontains=waste_type)
            
            all_dumpings = query
            
            if not all_dumpings.exists():
                type_msg = f" for {waste_type}" if waste_type else ""
                return f"🗑 No dumping locations{type_msg} found."
            
            # Find closest
            closest = None
            min_distance = float('inf')
            
            for dumping in all_dumpings:
                try:
                    dumping_lat = float(str(dumping.address.latitude).replace(',', '.'))
                    dumping_lon = float(str(dumping.address.longitude).replace(',', '.'))
                    distance = self.calculate_distance(user_lat, user_lon, dumping_lat, dumping_lon)
                    
                    if distance < min_distance:
                        min_distance = distance
                        closest = dumping
                except (ValueError, TypeError):
                    continue
            
            if not closest:
                return "❌ Could not find valid dumping locations."
            
            type_msg = f" for {waste_type}" if waste_type else ""
            response = f"📍 **Closest Dumping Location{type_msg}:**\n\n"
            response += f"**{closest.Title}**\n"
            response += f"📍 Distance: {min_distance:.2f} km\n"
            response += f"🗑 Type: {closest.waste_type.name if closest.waste_type else 'General'}\n"
            response += f"📫 Location: {closest.address.street}, {closest.address.city}\n"
            
            if closest.maximum_capacity:
                capacity_pct = (closest.collected_waste / closest.maximum_capacity) * 100
                response += f"📊 Capacity: {closest.collected_waste}/{closest.maximum_capacity} tons ({capacity_pct:.0f}%)\n"
            
            return response
            
        except Exception as e:
            print(f"Error getting closest dumping: {e}")
            return "Sorry, I couldn't find the closest location right now."

    def get_farthest_dumping(self, user_id, waste_type=None):
        """Get the farthest dumping location"""
        try:
            from company.models import Dumping
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            if not user.address or not user.address.latitude or not user.address.longitude:
                return "📍 Please add your address with GPS coordinates in your profile first!"
            
            user_lat = float(user.address.latitude)
            user_lon = float(user.address.longitude)
            
            query = Dumping.objects.select_related('address', 'waste_type').filter(
                address__latitude__isnull=False,
                address__longitude__isnull=False
            )
            
            if waste_type:
                query = query.filter(waste_type__name__icontains=waste_type)
            
            all_dumpings = query
            
            if not all_dumpings.exists():
                type_msg = f" for {waste_type}" if waste_type else ""
                return f"🗑 No dumping locations{type_msg} found."
            
            # Find farthest
            farthest = None
            max_distance = 0
            
            for dumping in all_dumpings:
                try:
                    dumping_lat = float(str(dumping.address.latitude).replace(',', '.'))
                    dumping_lon = float(str(dumping.address.longitude).replace(',', '.'))
                    distance = self.calculate_distance(user_lat, user_lon, dumping_lat, dumping_lon)
                    
                    if distance > max_distance:
                        max_distance = distance
                        farthest = dumping
                except (ValueError, TypeError):
                    continue
            
            if not farthest:
                return "❌ Could not find valid dumping locations."
            
            type_msg = f" for {waste_type}" if waste_type else ""
            response = f"📍 **Farthest Dumping Location{type_msg}:**\n\n"
            response += f"**{farthest.Title}**\n"
            response += f"📍 Distance: {max_distance:.2f} km\n"
            response += f"🗑 Type: {farthest.waste_type.name if farthest.waste_type else 'General'}\n"
            response += f"📫 Location: {farthest.address.street}, {farthest.address.city}\n"
            
            if farthest.maximum_capacity:
                capacity_pct = (farthest.collected_waste / farthest.maximum_capacity) * 100
                response += f"📊 Capacity: {farthest.collected_waste}/{farthest.maximum_capacity} tons ({capacity_pct:.0f}%)\n"
            
            return response
            
        except Exception as e:
            print(f"Error getting farthest dumping: {e}")
            return "Sorry, I couldn't find the farthest location right now."

    def get_all_routes(self, status_filter=None):
        """Get all routes with optional status filter"""
        try:
            from company.models import Route
            
            query = Route.objects.select_related('waste_type', 'driver', 'truck').prefetch_related(
                'route_stops',
                'route_stops__dumping',
                'route_stops__dumping__address'
            )
            
            if status_filter:
                query = query.filter(status__iexact=status_filter)
            
            routes = query.all()
            
            if not routes.exists():
                status_msg = f" with status '{status_filter}'" if status_filter else ""
                return f"🚛 No routes{status_msg} found in the system."
            
            status_msg = f" (Status: {status_filter.title()})" if status_filter else ""
            response = f"🚛 **All Routes{status_msg}:**\n\n"
            
            for route in routes:
                driver_name = f"{route.driver.first_name} {route.driver.last_name}" if route.driver else "Not assigned"
                waste_type = route.waste_type.name if route.waste_type else "General Waste"
                truck_info = f"Truck #{route.truck.truck_id}" if route.truck else "No truck assigned"
                
                response += f"🛣 **Route #{route.route_id}**\n"
                response += f"   🗑 Waste Type: {waste_type}\n"
                response += f"   👤 Driver: {driver_name}\n"
                response += f"   🚛 Vehicle: {truck_info}\n"
                response += f"   📊 Status: {route.status}\n"
                
                route_stops = route.route_stops.all()
                if route_stops.exists():
                    response += f"   📍 Stops: {route_stops.count()} locations\n"
                    for stop in route_stops[:3]:
                        if stop.dumping:
                            response += f"      • {stop.dumping.Title}\n"
                    if route_stops.count() > 3:
                        response += f"      • ... and {route_stops.count() - 3} more\n"
                else:
                    response += f"   📍 Stops: No stops defined\n"
                
                response += "\n"
            
            return response
            
        except Exception as e:
            print(f"Error getting routes: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I couldn't retrieve route information right now."

    def get_all_pickups(self, status_filter=None):
        """Get all pickups with optional status filter"""
        try:
            from company.models import Pickup
            
            query = Pickup.objects.select_related(
                'schedule',
                'route',
                'route__waste_type',
                'route__driver'
            ).order_by('-schedule__pickup_date', '-schedule__start_time')
            
            if status_filter:
                query = query.filter(status__iexact=status_filter)
            
            pickups = query[:20]  # Limit to 20 most recent
            
            if not pickups.exists():
                status_msg = f" with status '{status_filter}'" if status_filter else ""
                return f"📅 No pickups{status_msg} found in the system."
            
            status_msg = f" (Status: {status_filter.title()})" if status_filter else ""
            response = f"📅 **All Pickups{status_msg} (Latest 20):**\n\n"
            
            for pickup in pickups:
                schedule = pickup.schedule
                route = pickup.route
                
                pickup_date = schedule.pickup_date.strftime('%A, %B %d, %Y')
                start_time = schedule.start_time.strftime('%I:%M %p')
                end_time = schedule.end_time.strftime('%I:%M %p') if schedule.end_time else "Not specified"
                waste_type = route.waste_type.name if route.waste_type else "General Waste"
                driver = f"{route.driver.first_name} {route.driver.last_name}" if route.driver else "Not assigned"
                
                response += f"🚛 **Pickup #{pickup.pickup_id}**\n"
                response += f"   📅 Date: {pickup_date}\n"
                response += f"   ⏰ Time: {start_time} - {end_time}\n"
                response += f"   🗑 Type: {waste_type}\n"
                response += f"   👤 Driver: {driver}\n"
                response += f"   📊 Status: {pickup.status}\n"
                
                if pickup.weight_collected:
                    response += f"   ⚖️ Weight: {pickup.weight_collected} kg\n"
                
                response += "\n"
            
            return response
            
        except Exception as e:
            print(f"Error getting pickups: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I couldn't retrieve pickup information right now."

    def detect_advanced_query(self, message, user_id):
        """Detect advanced queries about dumpings, routes, and pickups"""
        message_lower = message.lower()
        
        # Extract waste type if mentioned
        waste_type = self.extract_waste_type(message)
        
        # CLOSEST DUMPING
        if any(word in message_lower for word in ['closest', 'nearest', 'close']) and any(word in message_lower for word in ['dumping', 'dumpster', 'location', 'center']):
            return self.get_closest_dumping(user_id, waste_type)
        
        # FARTHEST DUMPING
        if any(word in message_lower for word in ['farthest', 'furthest', 'far']) and any(word in message_lower for word in ['dumping', 'dumpster', 'location', 'center']):
            return self.get_farthest_dumping(user_id, waste_type)
        
        # ALL DUMPINGS (with optional type filter)
        if ('all' in message_lower or 'list' in message_lower or 'show' in message_lower) and any(word in message_lower for word in ['dumping', 'dumpings', 'dumpster', 'dumpsters', 'location', 'locations', 'center', 'centers']):
            return self.get_dumpings_by_type(user_id, waste_type)
        
        # WASTE TYPE SPECIFIC (e.g., "where can I throw plastic")
        if waste_type and any(word in message_lower for word in ['throw', 'dispose', 'dump', 'recycle']):
            return self.get_closest_dumping(user_id, waste_type)
        
        # ALL ROUTES
        if ('all' in message_lower or 'list' in message_lower or 'show' in message_lower) and 'route' in message_lower:
            status = None
            if 'active' in message_lower:
                status = 'active'
            elif 'inactive' in message_lower:
                status = 'inactive'
            return self.get_all_routes(status)
        
        # AVAILABLE/ACTIVE ROUTES
        if any(word in message_lower for word in ['available', 'active']) and 'route' in message_lower:
            return self.get_all_routes('active')
        
        # ALL PICKUPS
        if ('all' in message_lower or 'list' in message_lower or 'show' in message_lower) and 'pickup' in message_lower:
            status = None
            if 'not started' in message_lower:
                status = 'Not Started'
            elif 'in progress' in message_lower or 'progress' in message_lower:
                status = 'In Progress'
            elif 'completed' in message_lower:
                status = 'completed'
            return self.get_all_pickups(status)
        
        return None

    def get_response(self, user_message, user_id=None):
        """Get AI response for user message with fallback support"""
        
        try:
            # Check for advanced queries first
            if user_id:
                advanced_response = self.detect_advanced_query(user_message, user_id)
                if advanced_response:
                    return advanced_response
            
            # Try to get fallback response for common questions
            fallback = self.get_fallback_response(user_message)
            
            # If model is not available, use fallback
            if not self.model:
                if fallback:
                    return fallback
                return "I'm currently in limited mode. I can help with:\n\n• Pickup schedules\n• Finding recycling centers\n• Basic app navigation\n\nPlease try asking about these topics!"
            
            # Try to use Gemini AI
            print(f"🤖 Calling Gemini AI for message: '{user_message}'")
            return self._get_gemini_response(user_message, user_id)
            
        except Exception as e:
            print(f"❌ ERROR in get_response: {e}")
            import traceback
            traceback.print_exc()
            
            fallback = self.get_fallback_response(user_message)
            if fallback:
                return fallback
            
            return "I'm having trouble responding right now. Try asking:\n• 'Show me all dumpings'\n• 'Find closest plastic dumping'\n• 'List all routes'\n• 'Show all pickups'"
    
    def _get_gemini_response(self, user_message, user_id):
        """Get response from Gemini AI with conversation context"""
        
        try:
            if user_id not in self.conversation_history:
                self.conversation_history[user_id] = self.model.start_chat(history=[])
            
            chat = self.conversation_history[user_id]
            
            if len(chat.history) == 0:
                full_message = f"{self.system_prompt}\n\nUser: {user_message}"
            else:
                full_message = user_message
            
            response = chat.send_message(full_message)
            return response.text
            
        except Exception as e:
            print(f"❌ ERROR in _get_gemini_response: {e}")
            import traceback
            traceback.print_exc()
            
            fallback = self.get_fallback_response(user_message)
            if fallback:
                return fallback
            
            raise
    
    def clear_history(self, user_id):
        """Clear conversation history for a user"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]

# Singleton instance
chatbot = WasteWareChatbot()
print("🔥🔥🔥 ENHANCED BOT_LOGIC.PY LOADED! 🔥🔥🔥")