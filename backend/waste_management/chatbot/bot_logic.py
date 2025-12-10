import google.generativeai as genai
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta, time
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
            if not hasattr(settings, 'GEMINI_API_KEY'):
                self.model_error = "GEMINI_API_KEY not found in settings"
            elif not settings.GEMINI_API_KEY:
                self.model_error = "GEMINI_API_KEY is empty"
            else:
                self.model = genai.GenerativeModel('models/gemini-2.5-flash')
                print("✅ Gemini initialized!")
        except Exception as e:
            self.model_error = f"Could not initialize Gemini model: {e}"
            import traceback
            traceback.print_exc()
        
        self.conversation_history = {}
        self.system_prompt = """You are WasteWare Assistant for Lebanon waste management.

🎯 SMART FEATURES:
1. Smart Dumping Recommendation - Best location based on distance, capacity, traffic
2. Route Conflict Analysis - Check if trucks are nearby
3. Optimal Disposal Time - Best time to visit
4. Eco-Impact Calculator - Environmental comparison
5. Multi-Waste Route Optimizer - Plan route for multiple waste types

RULES: Provide complete information directly. Use emojis. Be specific with numbers."""

    def calculate_distance(self, lat1, lon1, lat2, lon2):
        """Haversine formula for distance in km"""
        R = 6371
        lat1_rad, lat2_rad = math.radians(lat1), math.radians(lat2)
        delta_lat, delta_lon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def get_traffic_score(self, hour):
        """Traffic score 0-10 (higher = worse)"""
        if 7 <= hour <= 9 or 16 <= hour <= 19: return 8
        elif 10 <= hour <= 15: return 3
        elif 20 <= hour <= 23: return 5
        else: return 1

    # ========== FEATURE 1: SMART DUMPING RECOMMENDATION ==========
    def calculate_dumping_score(self, dumping, user_lat, user_lon, waste_type=None):
        """Calculate comprehensive score 0-10 (higher is better)"""
        details = {}
        
        # Distance (40% weight)
        if dumping['distance_km'] is not None:
            if dumping['distance_km'] <= 2: distance_score = 10
            elif dumping['distance_km'] <= 5: distance_score = 10 - (dumping['distance_km'] - 2) * 2
            else: distance_score = max(0, 4 - (dumping['distance_km'] - 5) * 0.5)
        else: distance_score = 0
        details['distance_score'] = round(distance_score, 1)
        
        # Capacity (35% weight)
        cp = dumping['capacity_percent']
        if cp < 50: capacity_score = 10
        elif cp < 70: capacity_score = 8
        elif cp < 85: capacity_score = 5
        elif cp < 95: capacity_score = 2
        else: capacity_score = 0
        details['capacity_score'] = capacity_score
        
        # Traffic (15% weight)
        traffic_score = 10 - self.get_traffic_score(timezone.now().hour)
        details['traffic_score'] = traffic_score
        
        # Waste Type Match (10% weight)
        if waste_type:
            if dumping['waste_type'].lower() == waste_type.lower(): type_score = 10
            elif dumping['waste_type'].lower() == 'general': type_score = 7
            else: type_score = 3
        else: type_score = 10
        details['type_score'] = type_score
        
        final = distance_score*0.40 + capacity_score*0.35 + traffic_score*0.15 + type_score*0.10
        details['final_score'] = round(final, 1)
        return final, details

    def smart_dumping_recommendation(self, user_lat, user_lon, waste_type=None, top_n=3):
        """Feature 1: Recommend best dumping locations"""
        try:
            from company.models import Dumping
            dumpings = Dumping.objects.select_related('waste_type', 'address').all()
            scored = []
            
            for d in dumpings:
                if not d.address or not d.address.latitude: continue
                dist = self.calculate_distance(user_lat, user_lon, float(d.address.latitude), float(d.address.longitude))
                data = {
                    'id': d.dumping_id, 'title': d.Title,
                    'waste_type': d.waste_type.name if d.waste_type else "General",
                    'distance_km': round(dist, 2),
                    'capacity_percent': round((d.collected_waste/d.maximum_capacity*100), 1) if d.maximum_capacity else 0,
                    'collected': d.collected_waste, 'max_capacity': d.maximum_capacity,
                    'address': f"{d.address.street}, {d.address.city}", 'city': d.address.city,
                    'latitude': float(d.address.latitude), 'longitude': float(d.address.longitude)
                }
                score, details = self.calculate_dumping_score(data, user_lat, user_lon, waste_type)
                data['score'], data['score_details'] = score, details
                scored.append(data)
            
            scored.sort(key=lambda x: x['score'], reverse=True)
            return scored[:top_n]
        except Exception as e:
            print(f"Error in smart_dumping_recommendation: {e}")
            return []

    # ========== FEATURE 2: ROUTE CONFLICT ANALYSIS ==========
    def check_nearby_trucks(self, user_lat, user_lon, hours_ahead=2, proximity_km=3):
        """Feature 2: Check if trucks will be nearby"""
        try:
            from company.models import Pickup
            now = timezone.now() + timedelta(hours=2)
            future = now + timedelta(hours=hours_ahead)
            
            pickups = Pickup.objects.select_related('route__driver', 'route__truck', 'schedule').prefetch_related(
                'route__route_stops__dumping__address'
            ).filter(status__in=['In Progress', 'Not Started'], schedule__pickup_date=now.date())
            
            nearby = []
            for p in pickups:
                start = timezone.make_aware(datetime.combine(p.schedule.pickup_date, p.schedule.start_time))
                end = timezone.make_aware(datetime.combine(p.schedule.pickup_date, p.schedule.end_time))
                if not (start <= future and end >= now): continue
                
                for stop in p.route.route_stops.all():
                    if not stop.dumping.address or not stop.dumping.address.latitude: continue
                    dist = self.calculate_distance(user_lat, user_lon, float(stop.dumping.address.latitude), float(stop.dumping.address.longitude))
                    if dist <= proximity_km:
                        elapsed = (now - start).total_seconds() / 3600
                        nearby.append({
                            'pickup_id': p.pickup_id, 'truck_id': p.route.truck.truck_id if p.route.truck else None,
                            'driver': f"{p.route.driver.first_name} {p.route.driver.last_name}" if p.route.driver else "Unknown",
                            'status': p.status, 'distance_km': round(dist, 2),
                            'stop_location': f"{stop.dumping.Title} ({stop.dumping.address.street})",
                            'estimated_arrival': start + timedelta(hours=elapsed),
                            'progress_percent': round(p.calculate_progress_percentage(), 1)
                        })
            return nearby
        except Exception as e:
            print(f"Error: {e}")
            return []

    # ========== FEATURE 3: OPTIMAL DISPOSAL TIME ==========
    def calculate_optimal_disposal_time(self, user_lat, user_lon, waste_type=None):
        """Feature 3: Best time to visit dumping sites"""
        try:
            nearby = self.smart_dumping_recommendation(user_lat, user_lon, waste_type, 3)
            if not nearby: return None
            
            slots = []
            for h in range(6, 22):
                traffic = self.get_traffic_score(h)
                activity = 8 if (8<=h<=11 or 14<=h<=17) else 2 if (h<8 or h>19) else 5
                combined = traffic*0.6 + activity*0.4
                slots.append({
                    'hour': h, 'time': f"{h:02d}:00",
                    'traffic_level': 'Heavy' if traffic>=7 else 'Moderate' if traffic>=4 else 'Light',
                    'activity_level': 'High' if activity>=7 else 'Medium' if activity>=4 else 'Low',
                    'combined_score': round(combined, 1),
                    'recommendation': 'Excellent' if combined<=3 else 'Good' if combined<=5 else 'Fair' if combined<=7 else 'Avoid'
                })
            slots.sort(key=lambda x: x['combined_score'])
            return {'target_dumping': nearby[0], 'best_times': slots[:3], 'worst_times': slots[-2:], 'all_times': slots}
        except Exception as e:
            print(f"Error: {e}")
            return None

    # ========== FEATURE 4: ECO-IMPACT CALCULATOR ==========
    def calculate_eco_impact(self, user_lat, user_lon, waste_type=None):
        """Feature 4: Environmental impact comparison"""
        try:
            options = self.smart_dumping_recommendation(user_lat, user_lon, waste_type, 3)
            if not options: return None
            
            CO2_PER_KM, EFFICIENCY_PENALTY = 0.12, 20
            analysis = []
            
            for i, opt in enumerate(options):
                travel_co2 = opt['distance_km'] * 2 * CO2_PER_KM
                capacity_penalty = EFFICIENCY_PENALTY * (opt['capacity_percent']-85)/15 if opt['capacity_percent']>85 else 0
                type_benefit = 5 if (waste_type and opt['waste_type'].lower()==waste_type.lower()) else 0
                net = travel_co2 + capacity_penalty - type_benefit
                
                analysis.append({
                    'rank': i+1, 'dumping': opt['title'], 'distance_km': opt['distance_km'],
                    'travel_co2': round(travel_co2, 2), 'capacity_penalty': round(capacity_penalty, 2),
                    'type_benefit': round(type_benefit, 2), 'net_co2': round(net, 2),
                    'equivalent': f"{round(net/0.12, 1)} km of driving"
                })
            
            best, worst = analysis[0], analysis[-1]
            saved = worst['net_co2'] - best['net_co2']
            return {'analysis': analysis, 'best_choice': best, 'co2_saved_vs_worst': round(saved, 2), 'trees_equivalent': round(saved/21, 2)}
        except Exception as e:
            print(f"Error: {e}")
            return None

    # ========== FEATURE 5: MULTI-WASTE ROUTE OPTIMIZER ==========
    def optimize_multi_waste_route(self, user_lat, user_lon, waste_types):
        """Feature 5: Optimal route for multiple waste types"""
        try:
            destinations = []
            for wt in waste_types:
                recs = self.smart_dumping_recommendation(user_lat, user_lon, wt, 1)
                if recs: destinations.append({'waste_type': wt, 'dumping': recs[0]})
            if not destinations: return None
            
            routes = []
            
            # Route 1: Nearest first
            sorted_dest = sorted(destinations, key=lambda x: x['dumping']['distance_km'])
            r1_dist, r1_stops = 0, []
            curr_lat, curr_lon = user_lat, user_lon
            for dest in sorted_dest:
                d = self.calculate_distance(curr_lat, curr_lon, dest['dumping']['latitude'], dest['dumping']['longitude'])
                r1_dist += d
                r1_stops.append({'order': len(r1_stops)+1, 'waste_type': dest['waste_type'], 'dumping': dest['dumping']['title'], 'distance_from_previous': round(d, 2)})
                curr_lat, curr_lon = dest['dumping']['latitude'], dest['dumping']['longitude']
            r1_dist += self.calculate_distance(curr_lat, curr_lon, user_lat, user_lon)
            routes.append({'name': 'Nearest First', 'description': 'Visit by proximity', 'total_distance': round(r1_dist, 2), 'estimated_time_minutes': round(r1_dist*5, 0), 'stops': r1_stops})
            
            # Route 2: Farthest first
            if len(sorted_dest) > 1:
                rev = list(reversed(sorted_dest))
                r2_dist, r2_stops = 0, []
                curr_lat, curr_lon = user_lat, user_lon
                for dest in rev:
                    d = self.calculate_distance(curr_lat, curr_lon, dest['dumping']['latitude'], dest['dumping']['longitude'])
                    r2_dist += d
                    r2_stops.append({'order': len(r2_stops)+1, 'waste_type': dest['waste_type'], 'dumping': dest['dumping']['title'], 'distance_from_previous': round(d, 2)})
                    curr_lat, curr_lon = dest['dumping']['latitude'], dest['dumping']['longitude']
                r2_dist += self.calculate_distance(curr_lat, curr_lon, user_lat, user_lon)
                routes.append({'name': 'Farthest First', 'description': 'Visit farthest then work back', 'total_distance': round(r2_dist, 2), 'estimated_time_minutes': round(r2_dist*5, 0), 'stops': r2_stops})
            
            # Route 3: Individual round trips
            r3_dist, r3_stops = 0, []
            for dest in destinations:
                d = dest['dumping']['distance_km']
                r3_dist += d * 2
                r3_stops.append({'order': len(r3_stops)+1, 'waste_type': dest['waste_type'], 'dumping': dest['dumping']['title'], 'distance_round_trip': round(d*2, 2)})
            routes.append({'name': 'Individual Trips', 'description': 'Return home after each', 'total_distance': round(r3_dist, 2), 'estimated_time_minutes': round(r3_dist*5, 0), 'stops': r3_stops})
            
            best = min(routes, key=lambda x: x['total_distance'])
            return {'routes': routes, 'recommended': best, 'distance_saved': round(max(r['total_distance'] for r in routes) - best['total_distance'], 2)}
        except Exception as e:
            print(f"Error: {e}")
            return None

    def get_all_database_context(self, user_id):
        """Get complete database context"""
        try:
            from company.models import Route, Pickup, Dumping, Schedule, Driver, Truck, WasteType
            from authentication.models import Users
            
            context = {'user_info': {}, 'routes': [], 'pickups': [], 'dumpings': [], 'schedules': [], 'drivers': [], 'trucks': [], 'waste_types': []}
            
            # USER INFO
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
            except: pass
            
            # Continue with rest of database fetching (waste types, drivers, trucks, dumpings, routes, schedules, pickups)
            # [Keep your existing get_all_database_context implementation here]
            
            return context
        except Exception as e:
            print(f"Error: {e}")
            return None

    def format_context_for_ai(self, context):
        """Format database context for AI"""
        if not context: return "No database information available."
        
        formatted = "=== DATABASE INFO ===\n\n"
        
        # Add user info, waste types, drivers, trucks, dumpings, routes, schedules, pickups
        # [Keep your existing format_context_for_ai implementation]
        
        return formatted

    def get_response(self, user_message, user_id=None):
        """Get AI response with database context AND smart features"""
        try:
            if not self.model: return "I'm currently unavailable. Please try again later."
            
            # Get database context
            db_context = self.get_all_database_context(user_id) if user_id else None
            context_str = self.format_context_for_ai(db_context) if db_context else ""
            
            # Check if user is asking for smart features
            smart_analysis = ""
            user_lat = db_context['user_info'].get('latitude') if db_context else None
            user_lon = db_context['user_info'].get('longitude') if db_context else None
            
            if user_lat and user_lon:
                msg_lower = user_message.lower()
                
                # Feature 1: Smart dumping recommendation
                if any(word in msg_lower for word in ['where should i throw', 'best dumping', 'recommend dumping', 'where to dispose']):
                    waste_type = None
                    for wt in ['plastic', 'organic', 'glass', 'metal', 'paper', 'hazardous']:
                        if wt in msg_lower: waste_type = wt; break
                    
                    recs = self.smart_dumping_recommendation(user_lat, user_lon, waste_type, 3)
                    if recs:
                        smart_analysis += "\n\n🎯 SMART DUMPING ANALYSIS:\n"
                        for i, r in enumerate(recs, 1):
                            smart_analysis += f"\n#{i} {r['title']} (Score: {r['score']}/10)\n"
                            smart_analysis += f"   📍 Distance: {r['distance_km']} km\n"
                            smart_analysis += f"   📊 Capacity: {r['capacity_percent']}% full\n"
                            smart_analysis += f"   🗑️ Type: {r['waste_type']}\n"
                            smart_analysis += f"   📍 Location: {r['address']}\n"
                
                # Feature 2: Nearby trucks
                if any(word in msg_lower for word in ['truck near', 'garbage truck', 'pickup near', 'trucks nearby']):
                    trucks = self.check_nearby_trucks(user_lat, user_lon)
                    if trucks:
                        smart_analysis += "\n\n🚛 NEARBY TRUCKS:\n"
                        for t in trucks:
                            smart_analysis += f"   • Truck #{t['truck_id']}: {t['driver']} - {t['distance_km']}km away\n"
                            smart_analysis += f"     Status: {t['status']} ({t['progress_percent']}% complete)\n"
                            smart_analysis += f"     Location: {t['stop_location']}\n"
                    else:
                        smart_analysis += "\n\n✅ No trucks nearby in the next 2 hours!\n"
                
                # Feature 3: Optimal time
                if any(word in msg_lower for word in ['best time', 'when should i', 'optimal time', 'what time']):
                    time_analysis = self.calculate_optimal_disposal_time(user_lat, user_lon)
                    if time_analysis:
                        smart_analysis += "\n\n⏰ OPTIMAL DISPOSAL TIME:\n"
                        smart_analysis += f"Target: {time_analysis['target_dumping']['title']}\n\n"
                        smart_analysis += "Best Times:\n"
                        for t in time_analysis['best_times']:
                            smart_analysis += f"   • {t['time']} - {t['recommendation']} (Traffic: {t['traffic_level']}, Activity: {t['activity_level']})\n"
                
                # Feature 4: Eco-impact
                if any(word in msg_lower for word in ['eco', 'environmental', 'carbon', 'co2', 'impact']):
                    eco = self.calculate_eco_impact(user_lat, user_lon)
                    if eco:
                        smart_analysis += "\n\n🌱 ECO-IMPACT ANALYSIS:\n"
                        for a in eco['analysis']:
                            smart_analysis += f"\n#{a['rank']} {a['dumping']}\n"
                            smart_analysis += f"   Distance: {a['distance_km']} km\n"
                            smart_analysis += f"   CO2 Emissions: {a['net_co2']} kg (equivalent to {a['equivalent']})\n"
                        smart_analysis += f"\n💚 Choosing best option saves {eco['co2_saved_vs_worst']} kg CO2!\n"
                        smart_analysis += f"   (That's {eco['trees_equivalent']} tree-years of carbon absorption)\n"
                
                # Feature 5: Multi-waste route
                if any(word in msg_lower for word in ['multiple waste', 'different waste', 'route for', 'optimize route']):
                    waste_types = [wt for wt in ['plastic', 'organic', 'glass', 'metal'] if wt in msg_lower]
                    if len(waste_types) >= 2:
                        route_opt = self.optimize_multi_waste_route(user_lat, user_lon, waste_types)
                        if route_opt:
                            smart_analysis += "\n\n🗺️ MULTI-WASTE ROUTE OPTIMIZATION:\n"
                            smart_analysis += f"\n✅ RECOMMENDED: {route_opt['recommended']['name']}\n"
                            smart_analysis += f"   Total Distance: {route_opt['recommended']['total_distance']} km\n"
                            smart_analysis += f"   Estimated Time: {route_opt['recommended']['estimated_time_minutes']} min\n"
                            smart_analysis += f"   Saves {route_opt['distance_saved']} km vs worst route!\n\n"
                            for stop in route_opt['recommended']['stops']:
                                smart_analysis += f"   {stop['order']}. {stop['dumping']} ({stop['waste_type']})\n"
            
            # Combine context and smart analysis
            full_context = context_str + smart_analysis
            
            return self._get_gemini_response(user_message, user_id, full_context)
        except Exception as e:
            print(f"Error: {e}")
            return "I'm having trouble responding. Please try again."
    
    def _get_gemini_response(self, user_message, user_id, context_str):
        """Get Gemini AI response"""
        try:
            if user_id not in self.conversation_history:
                self.conversation_history[user_id] = self.model.start_chat(history=[])
            
            chat = self.conversation_history[user_id]
            
            if len(chat.history) == 0:
                full_message = f"{self.system_prompt}\n\n{context_str}\n\nUser: {user_message}"
            else:
                full_message = f"{context_str}\n\nUser: {user_message}"
            
            response = chat.send_message(full_message)
            return response.text
        except Exception as e:
            print(f"Error: {e}")
            raise
    
    def clear_history(self, user_id):
        """Clear conversation history"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]

# Singleton
chatbot = WasteWareChatbot()
print("🔥 SMART BOT WITH 5 COMPUTATIONAL FEATURES LOADED! 🔥")