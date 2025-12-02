from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSignupSerializer, CompanySignupSerializer, LoginSerializer, AdminSignupSerializer,AddressSerializer,ProfileSerializer, UserManagementSerializer, UserUpdateSerializer
from .models import Users, Companies, Roles,Addresses
from .utils import verify_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .jwt_auth import CustomJWTAuthentication


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
        # ============ MOCK DATA (CURRENTLY ACTIVE) ============
        # Mock user list matching the screenshot
        # mock_users = [
        #     {
        #         'user_id': 1,
        #         'full_name': 'Rafik Mikkawi',
        #         'email': 'rafik@gmail.com',
        #         'phone_number': '70082111',
        #         'role': 'admin',
        #         'account_status': 'Active',
        #         'created_at': '2024-01-15T10:30:00Z',
        #         'points_balance': 2500
        #     },
        #     {
        #         'user_id': 2,
        #         'full_name': 'Kevork Basdajian',
        #         'email': 'Kevork@gmail.com',
        #         'phone_number': '76627028',
        #         'role': 'user',
        #         'account_status': 'Active',
        #         'created_at': '2024-02-20T14:22:00Z',
        #         'points_balance': 1247
        #     },
        #     {
        #         'user_id': 3,
        #         'full_name': 'Christian Alam',
        #         'email': 'Chris@gmail.com',
        #         'phone_number': '71191268',
        #         'role': 'user',
        #         'account_status': 'Active',
        #         'created_at': '2024-03-10T09:15:00Z',
        #         'points_balance': 890
        #     },
        #     {
        #         'user_id': 4,
        #         'full_name': 'Sarah Johnson',
        #         'email': 'sarah.j@gmail.com',
        #         'phone_number': '70123456',
        #         'role': 'user',
        #         'account_status': 'Suspended',
        #         'created_at': '2024-01-05T11:00:00Z',
        #         'points_balance': 450
        #     },
        #     {
        #         'user_id': 5,
        #         'full_name': 'Mike Anderson',
        #         'email': 'mike.a@gmail.com',
        #         'phone_number': '76789012',
        #         'role': 'user',
        #         'account_status': 'Active',
        #         'created_at': '2024-04-01T16:45:00Z',
        #         'points_balance': 1580
        #     }
        # ]
        
        # return Response(mock_users, status=status.HTTP_200_OK)
        # ======================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
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


# Replace the existing UserUpdateView in your views.py with this:

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
