from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,viewsets
from .serializers import UserSignupSerializer, CompanySignupSerializer, LoginSerializer, AdminSignupSerializer,AddressSerializer,ProfileSerializer, UserManagementSerializer, UserUpdateSerializer,NotificationSerializer, CreateNotificationSerializer,UserBasicSerializer,CompanyManagementSerializer,CompanyCreateSerializer, CompanyUpdateSerializer,CompanyProfileSerializer,CompanyProfileUpdateSerializer
from .models import Users, Companies, Roles,Addresses,Notifications
from .utils import verify_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from .jwt_auth import CustomJWTAuthentication
from rest_framework.decorators import action
from django.db.models import Q
from .utils import hash_password





class LogoutView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        try:
            
            resp = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
            
            return resp
            
        except Exception as e:
            resp = Response(
                {"error": "Error during logout"}, 
                status=status.HTTP_200_OK  
            )
            
            return resp

# --------------------------
# Helper function to generate JWT token
# --------------------------

def get_tokens_for_user(obj):
    token = AccessToken()
    if(isinstance(obj,Users)):
        token['user_id'] = obj.user_id
        token['role'] = str(obj.role.role_name)
    elif (isinstance(obj,Companies)):
        token['company_id'] = obj.company_id

    

    token['email'] = obj.email
    return {
        'access': str(token),
    }

# --------------------------
# User Signup
# --------------------------
class UserSignupView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = get_tokens_for_user(user)
            access = token['access']
            response = Response({'user_id': user.user_id, 'access': access},status = status.HTTP_201_CREATED)

            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------
# Admin Signup
# --------------------------
class AdminSignupView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        serializer = AdminSignupSerializer(data=request.data)
        if serializer.is_valid():
            admin = serializer.save()
            token = get_tokens_for_user(admin)
            access = token['access']
            response = Response({'user_id': admin.user_id, 'access': access}, status=status.HTTP_201_CREATED)

            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------
# Company Signup
# --------------------------
class CompanySignupView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        serializer = CompanySignupSerializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save()
            token = get_tokens_for_user(company)
            access = token['access']
            response = Response({'company_id': company.company_id, 'access': access}, status=status.HTTP_201_CREATED)

            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------
# Login View
# --------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        # Check normal users
        try:
            user = Users.objects.get(email=email)
            if verify_password(password, user.password_hash):
                token = get_tokens_for_user(user)
                access = token['access']
                if user.role.role_name == 'Admin':
                    user_type = 'admin'
                else:
                    user_type = 'user'
                response = Response({'user_type': user_type, 'user_id': user.user_id, 'access': access}, status=status.HTTP_200_OK)
                return response
        except Users.DoesNotExist:
            pass

        # Check company users
        try:
            company = Companies.objects.get(email=email)
            if verify_password(password, company.password_hash):
                token = get_tokens_for_user(company)
                access = token['access']
                response = Response({'user_type': 'company', 'company_id': company.company_id, 'access': access}, status=status.HTTP_200_OK)

                return response
        except Companies.DoesNotExist:
            pass

        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    
class AddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing addresses
    """
    queryset = Addresses.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Optionally restricts the returned addresses
        """
        return Addresses.objects.all()





# --------------------------
# Profile View
# --------------------------
class ProfileView(APIView):
   
    
    # Require authentication (user must be logged in with valid token)
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        
        
        try:
            user = request.user
            serializer = ProfileSerializer(user)
            
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        




# --------------------------
# Update Profile View
# --------------------------



class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        try:
            user = request.user
            data = request.data  # Handles form-data automatically

            # -----------------------
            # BASIC FIELDS
            # -----------------------
            if 'first_name' in data:
                user.first_name = data['first_name']

            if 'last_name' in data:
                user.last_name = data['last_name']

            if 'email' in data:
                # Check if taken by another user
                if Users.objects.filter(email=data['email']).exclude(user_id=user.user_id).exists():
                    return Response({
                        'success': False,
                        'error': 'Email already in use'
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.email = data['email']

            if 'phone_number' in data:
                user.phone_number = data['phone_number']

            # -----------------------
            # BADGE FIELD
            # -----------------------
            if 'badge' in data:
                user.badge = data['badge']

            # -----------------------
            # PROFILE IMAGE
            # -----------------------
            if 'profile_image' in request.FILES:
                user.profile_image = request.FILES['profile_image']

            # -----------------------
            # ADDRESS (form-data format)
            # -----------------------
            street = data.get("address.street")
            city = data.get("address.city")
            region = data.get("address.region")

            if street or city or region:
                if user.address:
                    # Update existing address
                    if street: user.address.street = street
                    if city: user.address.city = city
                    if region: user.address.region = region
                    user.address.save()
                else:
                    # Create new address
                    new_address = Addresses.objects.create(
                        street=street or "",
                        city=city or "",
                        region=region or ""
                    )
                    user.address = new_address

            # -----------------------
            # SAVE USER
            # -----------------------
            user.save()

            # Return updated profile
            serializer = ProfileSerializer(user)

            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'data': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




# Replace the existing UserUpdateView in your views.py with this:



class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Check if user is a Company
        try:
            company = Companies.objects.get(email=user.email) if hasattr(user, 'email') else None
            if company:
                return Notifications.objects.filter(company=company).select_related('user', 'company')
        except Companies.DoesNotExist:
            pass
        
        # Check if user is a regular User
        try:
            regular_user = Users.objects.get(email=user.email) if hasattr(user, 'email') else None
            if regular_user:
                return Notifications.objects.filter(user=regular_user).select_related('company')
        except Users.DoesNotExist:
            pass
        
        return Notifications.objects.none()
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        # Filter by unread if requested
        unread_only = request.query_params.get('unread_only')
        if unread_only == 'true':
            queryset = queryset.filter(is_read=False)
        
        # Filter by priority
        priority = request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def send_notification(self, request):
        """
        Company endpoint to send notifications to users
        """
        # DEBUG: Print what we're receiving
        print("=" * 50)
        print("REQUEST USER:", request.user)
        print("USER TYPE:", type(request.user))
        print("USER EMAIL:", getattr(request.user, 'email', 'NO EMAIL'))
        print("HAS COMPANY_ID:", hasattr(request.user, 'company_id'))
        print("HAS USER_ID:", hasattr(request.user, 'user_id'))
        
        # Try to find company
        try:
            company = Companies.objects.get(email=request.user.email)
            print("COMPANY FOUND:", company)
        except Companies.DoesNotExist:
            print("COMPANY NOT FOUND")
            return Response(
                {'error': 'Only companies can send notifications'},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            print("ERROR:", e)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        print("=" * 50)
        
        serializer = CreateNotificationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            result = serializer.save()
            return Response(result, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read
        """
        notification = self.get_object()
        
        # Ensure user can only mark their own notifications
        try:
            regular_user = Users.objects.get(email=request.user.email)
            if notification.user != regular_user:
                return Response(
                    {'error': 'Cannot mark other users notifications'},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Users.DoesNotExist:
            return Response(
                {'error': 'Only users can mark notifications as read'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        notification.is_read = True
        notification.save()
        
        return Response(NotificationSerializer(notification).data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Mark all user's notifications as read
        """
        try:
            regular_user = Users.objects.get(email=request.user.email)
            Notifications.objects.filter(user=regular_user, is_read=False).update(is_read=True)
            return Response({'message': 'All notifications marked as read'})
        except Users.DoesNotExist:
            return Response(
                {'error': 'Only users can mark notifications as read'},
                status=status.HTTP_403_FORBIDDEN
            )
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread notifications
        """
        try:
            regular_user = Users.objects.get(email=request.user.email)
            count = Notifications.objects.filter(user=regular_user, is_read=False).count()
            return Response({'unread_count': count})
        except Users.DoesNotExist:
            return Response({'unread_count': 0})
    
    @action(detail=False, methods=['get'])
    def recent_unread(self, request):
        """
        Get recent unread notifications (for polling)
        """
        try:
            regular_user = Users.objects.get(email=request.user.email)
            
            # Get timestamp of last check (sent from frontend)
            last_check = request.query_params.get('last_check')
            
            queryset = Notifications.objects.filter(user=regular_user, is_read=False)
            
            if last_check:
                from django.utils import timezone
                from datetime import datetime
                last_check_time = datetime.fromisoformat(last_check.replace('Z', '+00:00'))
                queryset = queryset.filter(created_at__gt=last_check_time)
            
            serializer = self.get_serializer(queryset[:5], many=True)  # Last 5 unread
            return Response({
                'notifications': serializer.data,
                'has_new': queryset.exists()
            })
        except Users.DoesNotExist:
            return Response({'notifications': [], 'has_new': False})

class UserListViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for companies to view users for custom targeting
    """
    queryset = Users.objects.filter(account_status='active').order_by('first_name', 'last_name')
    serializer_class = UserBasicSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only companies can access this
        try:
            Companies.objects.get(email=self.request.user.email)
        except Companies.DoesNotExist:
            return Users.objects.none()
        
        queryset = super().get_queryset()
        
        # Filter by city if provided
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(address__city__icontains=city)
        
        # Search by name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset.select_related('address')


        # try:
        #     # Get user from database
        #     user = Users.objects.get(user_id=user_id)
        #     
        #     # Delete user
        #     user.delete()
        #     
        #     return Response(
        #         {'message': 'User deleted successfully'},
        #         status=status.HTTP_200_OK
        #     )
        #     
        # except Users.DoesNotExist:
        #     return Response(
        #         {'error': 'User not found'},
        #         status=status.HTTP_404_NOT_FOUND
        #     )
        # except Exception as e:
        #     return Response(
        #         {'error': 'Failed to delete user', 'detail': str(e)},
        #         status=status.HTTP_500_INTERNAL_SERVER_ERROR
        #     )
        # ==============================================================















# --------------------------
# Company Profile View (GET and PUT)
# --------------------------
class CompanyProfileView(APIView):
    """
    GET: Return company profile data
    PUT: Update company profile data
    Company only endpoint
    """
    permission_classes = [IsAuthenticated]  
    
    def get(self, request):        
        try:
            # Get authenticated company user
            print("Rafik farik",request.user)
            user = request.user
            
            # Serialize the data
            serializer = CompanyProfileSerializer(user)
            
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch profile', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def put(self, request):
        
        try:
            # Get authenticated company user
            user = request.user
            
            # Update using serializer
            serializer = CompanyProfileUpdateSerializer(user, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                
                # Return updated profile
                profile_serializer = CompanyProfileSerializer(user)
                return Response(
                    {
                        'message': 'Profile updated successfully',
                        'profile': profile_serializer.data
                    },
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to update profile', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



#For Admin 
class CompanyCreateView(APIView):
    """
    POST: Create a new company
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Use serializer for validation and creation
            serializer = CompanyCreateSerializer(data=request.data)
            
            if not serializer.is_valid():
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create company
            company = serializer.save()
            
            # Return created company data
            response_serializer = CompanyManagementSerializer(company)
            
            return Response(
                {
                    'message': 'Company created successfully',
                    'company': response_serializer.data
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': 'Failed to create company', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# --------------------------
# Company Update View
# --------------------------
class CompanyUpdateView(APIView):
    """
    PUT: Update company information
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, company_id):
        try:
            # Get company from Companies table
            company = Companies.objects.get(company_id=company_id)
            
            # Update using serializer
            serializer = CompanyUpdateSerializer(company, data=request.data, partial=True)
            
            if not serializer.is_valid():
                return Response(
                    {'error': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Save updates
            updated_company = serializer.save()
            
            # Return updated company data
            response_serializer = CompanyManagementSerializer(updated_company)
            
            return Response(
                {
                    'message': 'Company updated successfully',
                    'company': response_serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Companies.DoesNotExist:
            return Response(
                {'error': 'Company not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to update company', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# --------------------------
# Company Delete View
# --------------------------
class CompanyDeleteView(APIView):
    """
    DELETE: Delete a company from the system
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, company_id):
        try:
            # Get company from Companies table
            company = Companies.objects.get(company_id=company_id)
            
            # Delete company
            company.delete()
            
            return Response(
                {'message': 'Company deleted successfully'},
                status=status.HTTP_200_OK
            )
            
        except Companies.DoesNotExist:
            return Response(
                {'error': 'Company not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to delete company', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# --------------------------
# Company List View
# --------------------------
class CompanyManagementListView(APIView):
    """
    GET: Return list of all companies for admin management table
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Fetch all companies from Companies table
            companies = Companies.objects.all().order_by('-created_at')
            
            # Serialize the data
            serializer = CompanyManagementSerializer(companies, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch companies', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# --------------------------
# User Management List View (GET all users)
# --------------------------
class UserManagementListView(APIView):
    """
    GET: Return list of all users for admin management table
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]  # Uncomment when auth is ready
    
    def get(self, request):
       
        

        try:
            # Fetch all users from database
            users = Users.objects.all().order_by('-created_at')
            
            # Serialize the data
            serializer = UserManagementSerializer(users, many=True)
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'Failed to fetch users', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        # ==============================================================


# --------------------------
# User Update View (PUT - update user info)
# --------------------------
class UserUpdateView(APIView):
    """
    PUT: Update user information including name, email, phone, role, and status
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, user_id):
        try:
            # Get user from database
            user = Users.objects.get(user_id=user_id)
            
            # Update using serializer
            serializer = UserUpdateSerializer(user, data=request.data, partial=True)
            
            if serializer.is_valid():
                updated_user = serializer.save()
                
                # Return updated user data in the format expected by frontend
                response_data = UserManagementSerializer(updated_user).data
                
                return Response(
                    {
                        'message': 'User updated successfully',
                        'user': response_data
                    },
                    status=status.HTTP_200_OK
                )
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Users.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to update user', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# --------------------------
# User Delete View (DELETE)
# --------------------------
class UserDeleteView(APIView):
    """
    DELETE: Delete a user from the system
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]  # Uncomment when auth is ready
    
    def delete(self, request, user_id):
    #     # ============ MOCK RESPONSE (CURRENTLY ACTIVE) ============
    #     # Mock successful deletion
    #     print(f"Mock: Deleting user {user_id}")
        
    #     return Response(
    #         {
    #             'message': 'User deleted successfully',
    #             'user_id': user_id
    #         },
    #         status=status.HTTP_200_OK
    #     )
        # ==========================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
        try:
            # Get user from database
            user = Users.objects.get(user_id=user_id)
            
            # Delete user
            user.delete()
            
            return Response(
                {'message': 'User deleted successfully'},
                status=status.HTTP_200_OK
            )
            
        except Users.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to delete user', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        # ==============================================================

class AdminCreateUserView(APIView):
    permission_classes = [IsAuthenticated]  

    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            response_serializer = UserManagementSerializer(user)
            return Response(
                {
                    'message': 'user created successfully',
                    'user': response_serializer.data

                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




