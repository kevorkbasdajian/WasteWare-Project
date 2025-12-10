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
        
        self.system_prompt = """You are WasteWare Assistant, a helpful chatbot for a waste management app in Lebanon.

You have DIRECT ACCESS to all database information including:
- All routes (active/inactive with drivers, trucks, waste types, stops)
- All pickups (scheduled/in progress/completed with dates, times, weights)
- All dumping locations (with capacities, types, addresses, coordinates)
- All schedules (pickup dates, times, status)
- All drivers and trucks
- User locations and addresses

IMPORTANT RULES:
1. NEVER say "go to the Map page" or "check the X page" - YOU provide the information directly
2. When asked about routes, pickups, schedules, or dumpings - give COMPLETE details
3. Answer ANY question about the data with full information
4. Be specific with numbers, dates, times, locations, and names
5. If asked for "all" or "list" - show ALL items, don't limit arbitrarily
6. Calculate distances when relevant using user's location
7. Format responses clearly with emojis and structure

Report Categories:
🗑 Illegal Dumping - Large unauthorized waste dumps
🚮 Public Littering - Street waste, scattered trash
☢ Hazardous Materials - Chemicals, medical waste
🧱 Construction Debris - Building materials, rubble
🍃 Organic Waste - Food waste, garden waste
📱 E-Waste - Electronics, batteries, appliances

Keep responses informative and complete - don't redirect users elsewhere!"""

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

    def get_all_database_context(self, user_id):
        """Get COMPLETE context from ALL database tables"""
        try:
            from company.models import Route, Pickup, Dumping, Schedule, Driver, Truck, WasteType, RouteStop
            from authentication.models import Users
            
            context = {
                'user_info': {},
                'routes': [],
                'pickups': [],
                'dumpings': [],
                'schedules': [],
                'drivers': [],
                'trucks': [],
                'waste_types': []
            }
            
            # USER INFORMATION
            try:
                user = Users.objects.select_related('address').get(user_id=user_id)
                context['user_info'] = {
                    'has_address': user.address is not None,
                    'city': user.address.city if user.address else None,
                    'region': user.address.region if user.address else None,
                    'street': user.address.street if user.address else None,
                    'latitude': float(user.address.latitude) if user.address and user.address.latitude else None,
                    'longitude': float(user.address.longitude) if user.address and user.address.longitude else None,
                }
            except:
                pass
            
            # ALL WASTE TYPES
            waste_types = WasteType.objects.all()
            for wt in waste_types:
                context['waste_types'].append({
                    'id': wt.waste_type_id,
                    'name': wt.name,
                    'description': wt.description
                })
            
            # ALL DRIVERS
            drivers = Driver.objects.all()
            for driver in drivers:
                context['drivers'].append({
                    'id': driver.driver_id,
                    'name': f"{driver.first_name} {driver.last_name}".strip(),
                    'phone': driver.phone,
                    'created_at': driver.created_at.strftime('%Y-%m-%d')
                })
            
            # ALL TRUCKS
            trucks = Truck.objects.select_related('driver').all()
            for truck in trucks:
                context['trucks'].append({
                    'id': truck.truck_id,
                    'driver': f"{truck.driver.first_name} {truck.driver.last_name}" if truck.driver else "No driver",
                    'available': truck.available,
                    'created_at': truck.created_at.strftime('%Y-%m-%d')
                })
            
            # ALL DUMPINGS
            dumpings = Dumping.objects.select_related('waste_type', 'address').all()
            user_lat = context['user_info'].get('latitude')
            user_lon = context['user_info'].get('longitude')
            
            for dumping in dumpings:
                dumping_data = {
                    'id': dumping.dumping_id,
                    'title': dumping.Title,
                    'waste_type': dumping.waste_type.name if dumping.waste_type else "General",
                    'max_capacity': dumping.maximum_capacity,
                    'collected': dumping.collected_waste,
                    'capacity_percent': round((dumping.collected_waste / dumping.maximum_capacity * 100), 1) if dumping.maximum_capacity else 0,
                    'address': {
                        'street': dumping.address.street if dumping.address else "Unknown",
                        'city': dumping.address.city if dumping.address else "Unknown",
                        'region': dumping.address.region if dumping.address else "Unknown",
                        'latitude': float(dumping.address.latitude) if dumping.address and dumping.address.latitude else None,
                        'longitude': float(dumping.address.longitude) if dumping.address and dumping.address.longitude else None
                    },
                    'created_at': dumping.created_at.strftime('%Y-%m-%d')
                }
                
                # Calculate distance if user has location
                if user_lat and user_lon and dumping_data['address']['latitude'] and dumping_data['address']['longitude']:
                    try:
                        distance = self.calculate_distance(
                            user_lat, user_lon,
                            dumping_data['address']['latitude'],
                            dumping_data['address']['longitude']
                        )
                        dumping_data['distance_km'] = round(distance, 2)
                    except:
                        dumping_data['distance_km'] = None
                else:
                    dumping_data['distance_km'] = None
                
                context['dumpings'].append(dumping_data)
            
            # ALL ROUTES
            routes = Route.objects.select_related('waste_type', 'driver', 'truck').prefetch_related(
                'route_stops',
                'route_stops__dumping',
                'route_stops__dumping__address'
            ).all()
            
            for route in routes:
                stops = []
                for stop in route.route_stops.all():
                    stops.append({
                        'dumping_id': stop.dumping.dumping_id if stop.dumping else None,
                        'dumping_title': stop.dumping.Title if stop.dumping else "Unknown",
                        'address': f"{stop.dumping.address.street}, {stop.dumping.address.city}" if stop.dumping and stop.dumping.address else "Unknown",
                        'has_passed': stop.has_passed
                    })
                
                context['routes'].append({
                    'id': route.route_id,
                    'waste_type': route.waste_type.name if route.waste_type else "General",
                    'driver': f"{route.driver.first_name} {route.driver.last_name}" if route.driver else "No driver",
                    'truck_id': route.truck.truck_id if route.truck else None,
                    'status': route.status,
                    'stops_count': len(stops),
                    'stops': stops,
                    'created_at': route.created_at.strftime('%Y-%m-%d')
                })
            
            # ALL SCHEDULES
            schedules = Schedule.objects.all().order_by('-pickup_date', '-start_time')
            for schedule in schedules:
                context['schedules'].append({
                    'id': schedule.schedule_id,
                    'date': schedule.pickup_date.strftime('%A, %B %d, %Y'),
                    'start_time': schedule.start_time.strftime('%I:%M %p'),
                    'end_time': schedule.end_time.strftime('%I:%M %p') if schedule.end_time else None,
                    'status': schedule.status,
                    'notes': schedule.notes,
                    'created_at': schedule.created_at.strftime('%Y-%m-%d')
                })
            
            # ALL PICKUPS
            pickups = Pickup.objects.select_related(
                'schedule',
                'route',
                'route__waste_type',
                'route__driver',
                'route__truck'
            ).prefetch_related(
                'route__route_stops',
                'route__route_stops__dumping'
            ).order_by('-schedule__pickup_date', '-schedule__start_time')
            
            for pickup in pickups:
                schedule = pickup.schedule
                route = pickup.route
                
                context['pickups'].append({
                    'id': pickup.pickup_id,
                    'status': pickup.status,
                    'weight_collected': float(pickup.weight_collected) if pickup.weight_collected else 0,
                    'live_location': pickup.live_location,
                    'schedule': {
                        'id': schedule.schedule_id,
                        'date': schedule.pickup_date.strftime('%A, %B %d, %Y'),
                        'start_time': schedule.start_time.strftime('%I:%M %p'),
                        'end_time': schedule.end_time.strftime('%I:%M %p') if schedule.end_time else None,
                        'status': schedule.status
                    },
                    'route': {
                        'id': route.route_id,
                        'waste_type': route.waste_type.name if route.waste_type else "General",
                        'driver': f"{route.driver.first_name} {route.driver.last_name}" if route.driver else "No driver",
                        'truck_id': route.truck.truck_id if route.truck else None,
                        'status': route.status,
                        'stops_count': route.route_stops.count()
                    },
                    'created_at': pickup.created_at.strftime('%Y-%m-%d %I:%M %p'),
                    'updated_at': pickup.updated_at.strftime('%Y-%m-%d %I:%M %p')
                })
            
            return context
            
        except Exception as e:
            print(f"Error getting database context: {e}")
            import traceback
            traceback.print_exc()
            return None

    def format_context_for_ai(self, context):
        """Format the database context into a readable string for the AI"""
        if not context:
            return "No database information available."
        
        formatted = "=== COMPLETE DATABASE INFORMATION ===\n\n"
        
        # USER INFO
        if context['user_info'].get('has_address'):
            formatted += f"📍 USER LOCATION:\n"
            formatted += f"   City: {context['user_info']['city']}\n"
            formatted += f"   Region: {context['user_info']['region']}\n"
            formatted += f"   Street: {context['user_info']['street']}\n"
            formatted += f"   Coordinates: ({context['user_info']['latitude']}, {context['user_info']['longitude']})\n\n"
        
        # WASTE TYPES
        if context['waste_types']:
            formatted += f"🗑 WASTE TYPES ({len(context['waste_types'])}):\n"
            for wt in context['waste_types']:
                formatted += f"   • {wt['name']} (ID: {wt['id']}): {wt['description']}\n"
            formatted += "\n"
        
        # DRIVERS
        if context['drivers']:
            formatted += f"👤 DRIVERS ({len(context['drivers'])}):\n"
            for driver in context['drivers']:
                formatted += f"   • Driver #{driver['id']}: {driver['name']} | Phone: {driver['phone']}\n"
            formatted += "\n"
        
        # TRUCKS
        if context['trucks']:
            formatted += f"🚛 TRUCKS ({len(context['trucks'])}):\n"
            for truck in context['trucks']:
                status = "Available" if truck['available'] else "Unavailable"
                formatted += f"   • Truck #{truck['id']}: {status} | Driver: {truck['driver']}\n"
            formatted += "\n"
        
        # DUMPINGS
        if context['dumpings']:
            formatted += f"🗑 DUMPING LOCATIONS ({len(context['dumpings'])}):\n"
            for dump in context['dumpings']:
                dist_str = f" | Distance: {dump['distance_km']} km" if dump['distance_km'] is not None else ""
                formatted += f"   • #{dump['id']} '{dump['title']}': {dump['waste_type']} | "
                formatted += f"Capacity: {dump['collected']}/{dump['max_capacity']} tons ({dump['capacity_percent']}%) | "
                formatted += f"Location: {dump['address']['street']}, {dump['address']['city']}{dist_str}\n"
            formatted += "\n"
        
        # ROUTES
        if context['routes']:
            formatted += f"🛣 ROUTES ({len(context['routes'])}):\n"
            for route in context['routes']:
                formatted += f"   • Route #{route['id']}: {route['waste_type']} | Status: {route['status']} | "
                formatted += f"Driver: {route['driver']} | Truck: {route['truck_id']} | Stops: {route['stops_count']}\n"
                if route['stops']:
                    for stop in route['stops']:
                        passed = "✓" if stop['has_passed'] else "○"
                        formatted += f"      {passed} {stop['dumping_title']} ({stop['address']})\n"
            formatted += "\n"
        
        # SCHEDULES
        if context['schedules']:
            formatted += f"📅 SCHEDULES ({len(context['schedules'])}):\n"
            for sched in context['schedules'][:20]:  # Limit to 20 most recent
                formatted += f"   • Schedule #{sched['id']}: {sched['date']} | {sched['start_time']}-{sched['end_time']} | "
                formatted += f"Status: {sched['status']}"
                if sched['notes']:
                    formatted += f" | Notes: {sched['notes']}"
                formatted += "\n"
            if len(context['schedules']) > 20:
                formatted += f"   ... and {len(context['schedules']) - 20} more schedules\n"
            formatted += "\n"
        
        # PICKUPS
        if context['pickups']:
            formatted += f"📦 PICKUPS ({len(context['pickups'])}):\n"
            for pickup in context['pickups'][:20]:  # Limit to 20 most recent
                formatted += f"   • Pickup #{pickup['id']}: Status: {pickup['status']} | "
                formatted += f"Date: {pickup['schedule']['date']} | Time: {pickup['schedule']['start_time']}-{pickup['schedule']['end_time']} | "
                formatted += f"Route #{pickup['route']['id']} ({pickup['route']['waste_type']}) | "
                formatted += f"Driver: {pickup['route']['driver']} | Weight: {pickup['weight_collected']} kg | "
                formatted += f"Stops: {pickup['route']['stops_count']}\n"
            if len(context['pickups']) > 20:
                formatted += f"   ... and {len(context['pickups']) - 20} more pickups\n"
            formatted += "\n"
        
        formatted += "=== END OF DATABASE INFORMATION ===\n"
        return formatted

    def get_response(self, user_message, user_id=None):
        """Get AI response with complete database context"""
        
        try:
            # If model is not available
            if not self.model:
                return "I'm currently unavailable. Please try again later or contact support."
            
            # Get complete database context
            print(f"📊 Fetching complete database context for user {user_id}...")
            db_context = self.get_all_database_context(user_id) if user_id else None
            
            # Format context for AI
            context_str = self.format_context_for_ai(db_context) if db_context else "No database information available."
            
            print(f"🤖 Calling Gemini AI with full context...")
            return self._get_gemini_response(user_message, user_id, context_str)
            
        except Exception as e:
            print(f"❌ ERROR in get_response: {e}")
            import traceback
            traceback.print_exc()
            return "I'm having trouble responding right now. Please try again or contact support."
    
    def _get_gemini_response(self, user_message, user_id, context_str):
        """Get response from Gemini AI with complete database context"""
        
        try:
            # Create or get conversation
            if user_id not in self.conversation_history:
                self.conversation_history[user_id] = self.model.start_chat(history=[])
            
            chat = self.conversation_history[user_id]
            
            # Build the complete message with context
            if len(chat.history) == 0:
                # First message - include system prompt and full context
                full_message = f"""{self.system_prompt}

{context_str}

User Question: {user_message}

Remember: NEVER redirect to pages. Provide complete information directly from the database context above."""
            else:
                # Continue conversation - include fresh context with each message
                full_message = f"""{context_str}

User Question: {user_message}

Remember: NEVER redirect to pages. Provide complete information directly from the database context above."""
            
            print(f"📤 Sending message to Gemini (length: {len(full_message)} chars)")
            response = chat.send_message(full_message)
            print(f"✅ Received response from Gemini")
            return response.text
            
        except Exception as e:
            print(f"❌ ERROR in _get_gemini_response: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def clear_history(self, user_id):
        """Clear conversation history for a user"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]

# Singleton instance
chatbot = WasteWareChatbot()
print("🔥🔥🔥 COMPLETE DATABASE-AWARE BOT LOADED! 🔥🔥🔥")