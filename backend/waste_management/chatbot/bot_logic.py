import google.generativeai as genai
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
import math

# Configure Gemini
try:
    genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    print(f"Warning: Gemini API key not configured: {e}")

class WasteWareChatbot:
    def _init_(self):
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
🗑 Illegal Dumping - Large unauthorized waste dumps
🚮 Public Littering - Street waste, scattered trash
☢ Hazardous Materials - Chemicals, medical waste
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

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates using Haversine formula (in km)"""
        R = 6371  # Radius of Earth in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c

    def get_next_pickup(self, user_id):
        """Find the next scheduled pickups with status 'Not Started' - ordered by date and time"""
        try:
            from company.models import Pickup, Schedule, Route
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            # Check if user has address
            if not user.address or not user.address.city:
                return "📍 Please add your address in your profile first so I can check pickup schedules for your area!"
            
            # Find pickups with status "Not Started" and get related schedule and route info
            not_started_pickups = Pickup.objects.filter(
                status='Not Started'
            ).select_related(
                'schedule', 
                'route',
                'route__waste_type',
                'route__driver'
            ).order_by('schedule_pickup_date', 'schedule_start_time')
            
            if not not_started_pickups.exists():
                return f"🗓 No upcoming pickups scheduled yet for {user.address.city}. Check back soon!"
            
            # Format the response with start and end times
            response = f"📅 *Upcoming Pickups (Not Started):*\n\n"
            
            for pickup in not_started_pickups:
                schedule = pickup.schedule
                route = pickup.route
                
                # Format date
                pickup_date = schedule.pickup_date.strftime('%A, %B %d, %Y')
                
                # Format start and end times
                start_time = schedule.start_time.strftime('%I:%M %p')
                end_time = schedule.end_time.strftime('%I:%M %p') if schedule.end_time else "Not specified"
                
                # Waste type
                waste_type = route.waste_type.name if route.waste_type else "General Waste"
                
                response += f"🚛 *Pickup #{pickup.pickup_id}*\n"
                response += f"   📅 Date: {pickup_date}\n"
                response += f"   ⏰ Time: {start_time} - {end_time}\n"
                response += f"   🗑 Type: {waste_type}\n"
                response += f"   📍 Status: {pickup.status}\n\n"
            
            response += "💡 Make sure your waste is ready before the pickup time!"
            return response
            
        except Exception as e:
            print(f"Error getting next pickup: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I couldn't check pickup schedules right now. Please try again later."

    def get_pickup_details(self, user_id):
        """Get detailed information about pickups including route details, driver, and route stops"""
        try:
            from company.models import Pickup, Schedule, Route, RouteStop, Dumping
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            # Check if user has address
            if not user.address or not user.address.city:
                return "📍 Please add your address in your profile first so I can check pickup information for your area!"
            
            # Find pickups with status "Not Started"
            not_started_pickups = Pickup.objects.filter(
                status='Not Started'
            ).select_related(
                'schedule', 
                'route',
                'route__waste_type',
                'route__driver'
            ).prefetch_related(
                'route__route_stops',
                'route_route_stops_dumping',
                'route_route_stopsdumping_address'
            ).order_by('schedule_pickup_date', 'schedule_start_time')[:3]  # Limit to first 3 for detailed view
            
            if not not_started_pickups.exists():
                return f"🗓 No upcoming pickups found. Check back soon!"
            
            # Format detailed response
            response = f"📋 *Detailed Pickup Information:*\n\n"
            
            for pickup in not_started_pickups:
                schedule = pickup.schedule
                route = pickup.route
                
                # Schedule Details
                pickup_date = schedule.pickup_date.strftime('%A, %B %d, %Y')
                start_time = schedule.start_time.strftime('%I:%M %p')
                end_time = schedule.end_time.strftime('%I:%M %p') if schedule.end_time else "Not specified"
                
                response += f"🚛 *Pickup #{pickup.pickup_id}*\n"
                response += f"📅 *Schedule:*\n"
                response += f"   Date: {pickup_date}\n"
                response += f"   Time: {start_time} - {end_time}\n\n"
                
                # Route Details
                waste_type = route.waste_type.name if route.waste_type else "General Waste"
                driver_name = f"{route.driver.first_name} {route.driver.last_name}" if route.driver else "Not assigned"
                
                response += f"🛣 *Route Details:*\n"
                response += f"   Route ID: {route.route_id}\n"
                response += f"   Waste Type: {waste_type}\n"
                response += f"   Driver: {driver_name}\n"
                response += f"   Status: {route.status}\n\n"
                
                # Route Stops
                route_stops = route.route_stops.all()
                if route_stops.exists():
                    response += f"📍 *Route Stops ({route_stops.count()} stops):*\n"
                    for idx, stop in enumerate(route_stops, 1):
                        dumping = stop.dumping
                        dumping_name = dumping.Title if dumping else "Unknown Location"
                        dumping_address = f"{dumping.address.street}, {dumping.address.city}" if dumping and dumping.address else "Address not available"
                        
                        response += f"   {idx}. {dumping_name}\n"
                        response += f"      📮 {dumping_address}\n"
                    response += "\n"
                else:
                    response += f"📍 *Route Stops:* No stops defined yet\n\n"
                
                response += "─" * 40 + "\n\n"
            
            response += "💡 Track your pickup in real-time on the Map page!"
            return response
            
        except Exception as e:
            print(f"Error getting pickup details: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I couldn't retrieve detailed pickup information right now. Please try again later."

    def get_nearest_recycling_centers(self, user_id):
        """Find nearest recycling centers/dumping locations within 10km using Haversine formula"""
        try:
            from company.models import Dumping
            from authentication.models import Users
            
            user = Users.objects.select_related('address').get(user_id=user_id)
            
            # Check if user has address with coordinates
            if not user.address:
                return "📍 Please add your address in your profile first so I can find recycling centers near you!"
            
            if not user.address.latitude or not user.address.longitude:
                return "📍 Your address doesn't have GPS coordinates. Please update your address with a valid location!"
            
            # Get user coordinates
            user_lat = float(user.address.latitude)
            user_lon = float(user.address.longitude)
            
            # Get all dumping locations with valid coordinates
            all_dumpings = Dumping.objects.select_related('address', 'waste_type').filter(
                address_latitude_isnull=False,
                address_longitude_isnull=False
            )
            
            # Calculate distances and filter within 10km
            nearby_centers = []
            for dumping in all_dumpings:
                try:
                    dumping_lat = float(str(dumping.address.latitude).replace(',', '.'))
                    dumping_lon = float(str(dumping.address.longitude).replace(',', '.'))
                    
                    # Calculate distance
                    distance = self.calculate_distance(user_lat, user_lon, dumping_lat, dumping_lon)
                    
                    # Only include if within 10km
                    if distance <= 10:
                        nearby_centers.append({
                            'dumping': dumping,
                            'distance': distance
                        })
                except (ValueError, TypeError) as e:
                    print(f"Invalid coordinates for dumping {dumping.dumping_id}: {e}")
                    continue
            
            # Sort by distance
            nearby_centers.sort(key=lambda x: x['distance'])
            
            if not nearby_centers:
                return f"♻ No recycling centers found within 10km of your location. Try checking the Map page for all locations!"
            
            # Format response (limit to top 5)
            response = f"♻ *Recycling Centers Near You (Within 10km):*\n\n"
            for idx, center_data in enumerate(nearby_centers[:5], 1):
                center = center_data['dumping']
                distance = center_data['distance']
                
                response += f"{idx}. *{center.Title}*\n"
                response += f"   📏 Distance: {distance:.1f} km\n"
                response += f"   🗑 Type: {center.waste_type.name if center.waste_type else 'General'}\n"
                response += f"   📮 Location: {center.address.street}, {center.address.city}\n"
                
                if center.maximum_capacity:
                    capacity_pct = (center.collected_waste / center.maximum_capacity) * 100
                    response += f"   📊 Capacity: {center.collected_waste}/{center.maximum_capacity} tons ({capacity_pct:.0f}%)\n"
                response += "\n"
            
            response += "🗺 View exact locations and get directions on the Map page!"
            return response
            
        except Exception as e:
            print(f"Error getting recycling centers: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I couldn't find recycling centers right now. Please try again later."

    def get_nearby_routes(self, user_id):
        """Check if there are active collection routes in user's area with driver and stop details"""
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
                route_stops_dumpingaddresscity_iexact=user.address.city
            ).select_related(
                'waste_type', 
                'driver'
            ).prefetch_related(
                'route_stops',
                'route_stops__dumping',
                'route_stops_dumping_address'
            ).distinct()[:5]
            
            if not routes.exists():
                return f"🚛 No active collection routes found in {user.address.city} right now."
            
            # Format response
            response = f"🚛 *Active Routes in {user.address.city}:*\n\n"
            for route in routes:
                driver_name = f"{route.driver.first_name} {route.driver.last_name}" if route.driver else "Not assigned"
                waste_type = route.waste_type.name if route.waste_type else "General Waste"
                
                response += f"🛣 *Route #{route.route_id}*\n"
                response += f"   🗑 Type: {waste_type}\n"
                response += f"   👤 Driver: {driver_name}\n"
                response += f"   📊 Status: {route.status}\n"
                
                # Show route stops
                route_stops = route.route_stops.all()
                if route_stops.exists():
                    response += f"   📍 Stops: {route_stops.count()} locations\n"
                    for stop in route_stops[:3]:  # Show first 3 stops
                        if stop.dumping:
                            response += f"      • {stop.dumping.Title}\n"
                    if route_stops.count() > 3:
                        response += f"      • ... and {route_stops.count() - 3} more\n"
                response += "\n"
            
            response += "📱 Track routes in real-time on the Map page!"
            return response
            
        except Exception as e:
            print(f"Error getting nearby routes: {e}")
            import traceback
            traceback.print_exc()
            return "Sorry, I couldn't check routes right now. Please try again later."

    def detect_location_query(self, message, user_id):
        """Detect if user is asking location-based questions"""
        message_lower = message.lower()
        
        # DEBUG: Print what we're checking
        print(f"🔍 DEBUG: Checking message: '{message}'")
        print(f"🔍 DEBUG: Lowercase: '{message_lower}'")
        
        # Pickup DETAILS/ROUTE INFO queries (more detailed information)
        detail_keywords = ['route info', 'pickup info', 'pickup detail', 'route detail', 'tell me about', 'information about']
        for keyword in detail_keywords:
            if keyword in message_lower:
                if 'pickup' in message_lower or 'route' in message_lower:
                    print(f"🎯 DEBUG: Calling get_pickup_details()")
                    return self.get_pickup_details(user_id)
        
        # Pickup schedule queries (simple next pickup)
        pickup_keywords = ['pickup', 'pick up', 'collection', 'next collection', 'when', 'schedule']
        print(f"🔍 DEBUG: Checking pickup keywords...")
        for keyword in pickup_keywords:
            if keyword in message_lower:
                print(f"✅ DEBUG: Found keyword '{keyword}'")
                if 'next' in message_lower or 'when' in message_lower or 'schedule' in message_lower or 'upcoming' in message_lower:
                    print(f"🎯 DEBUG: Calling get_next_pickup()")
                    return self.get_next_pickup(user_id)
        
        # Recycling center queries (UPDATED: dumpsters, dumping, near me)
        center_keywords = ['recycling center', 'nearest', 'close', 'nearby', 'where can i', 'dumping', 'dumpster', 'near me', 'centers near']
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