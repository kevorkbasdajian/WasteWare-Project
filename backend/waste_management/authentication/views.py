from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSignupSerializer, CompanySignupSerializer, LoginSerializer, ProfileSerializer
from .models import Users, Companies, Roles
from .utils import verify_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from .serializers import ProfileSerializer
from .models import Users,Addresses

# --------------------------
# Helper function to generate JWT token
# --------------------------
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# --------------------------
# User Signup
# --------------------------
class UserSignupView(APIView):
    def post(self, request):
        serializer = UserSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = get_tokens_for_user(user)
            return Response({'user_id': user.user_id, 'token': token}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------
# Company Signup
# --------------------------
class CompanySignupView(APIView):
    def post(self, request):
        serializer = CompanySignupSerializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save()
            token = get_tokens_for_user(company)
            return Response({'company_id': company.company_id, 'token': token}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------
# Login View
# --------------------------
class LoginView(APIView):
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
                if user.role.role_name == 'Admin':
                    user_type = 'admin'
                else:
                    user_type = 'user'
                return Response({'user_type': user_type, 'user_id': user.user_id, 'token': token})
        except Users.DoesNotExist:
            pass

        # Check company users
        try:
            company = Companies.objects.get(email=email)
            if verify_password(password, company.password_hash):
                token = get_tokens_for_user(company)
                return Response({'user_type': 'company', 'company_id': company.company_id, 'token': token})
        except Companies.DoesNotExist:
            pass

        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)





# --------------------------
# Profile View
# --------------------------
class ProfileView(APIView):
   
    
    # Require authentication (user must be logged in with valid token)
    authentication_classes = [JWTAuthentication]
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
   
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
       
        try:
            user = request.user
            data = request.data
            
            if 'first_name' in data:
                user.first_name = data['first_name']
            
            if 'last_name' in data:
                user.last_name = data['last_name']
            
            if 'email' in data:
                # Check if email is already taken by another user
                if Users.objects.filter(email=data['email']).exclude(user_id=user.user_id).exists():
                    return Response({
                        'success': False,
                        'error': 'Email already in use'
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.email = data['email']
            
            if 'phone_number' in data:
                user.phone_number = data['phone_number']
            
            # Update address if provided
            if 'address' in data:
                address_data = data['address']
                
                # If user has an address, update it
                if user.address:
                    if 'street' in address_data:
                        user.address.street = address_data['street']
                    if 'city' in address_data:
                        user.address.city = address_data['city']
                    if 'region' in address_data:
                        user.address.region = address_data['region']
                    user.address.save()
                else:
                    # Create new address
                    new_address = Addresses.objects.create(
                        street=address_data.get('street', ''),
                        city=address_data.get('city', ''),
                        region=address_data.get('region', '')
                    )
                    user.address = new_address
            
            # Save user
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






# =============================================================
# USER MANAGEMENT VIEWS FOR ADMIN
# =============================================================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Users, Roles
from .serializers import UserManagementSerializer, UserUpdateSerializer

# --------------------------
# User Management List View (GET all users)
# --------------------------
class UserManagementListView(APIView):
    """
    GET: Return list of all users for admin management table
    Admin only endpoint
    """
    # permission_classes = [IsAuthenticated]  # Uncomment when auth is ready
    
    def get(self, request):
        # ============ MOCK DATA (CURRENTLY ACTIVE) ============
        # Mock user list matching the screenshot
        mock_users = [
            {
                'user_id': 1,
                'full_name': 'Rafik Mikkawi',
                'email': 'rafik@gmail.com',
                'phone_number': '70082111',
                'role': 'admin',
                'account_status': 'Active',
                'created_at': '2024-01-15T10:30:00Z',
                'points_balance': 2500
            },
            {
                'user_id': 2,
                'full_name': 'Kevork Basdajian',
                'email': 'Kevork@gmail.com',
                'phone_number': '76627028',
                'role': 'user',
                'account_status': 'Active',
                'created_at': '2024-02-20T14:22:00Z',
                'points_balance': 1247
            },
            {
                'user_id': 3,
                'full_name': 'Christian Alam',
                'email': 'Chris@gmail.com',
                'phone_number': '71191268',
                'role': 'user',
                'account_status': 'Active',
                'created_at': '2024-03-10T09:15:00Z',
                'points_balance': 890
            },
            {
                'user_id': 4,
                'full_name': 'Sarah Johnson',
                'email': 'sarah.j@gmail.com',
                'phone_number': '70123456',
                'role': 'user',
                'account_status': 'Suspended',
                'created_at': '2024-01-05T11:00:00Z',
                'points_balance': 450
            },
            {
                'user_id': 5,
                'full_name': 'Mike Anderson',
                'email': 'mike.a@gmail.com',
                'phone_number': '76789012',
                'role': 'user',
                'account_status': 'Active',
                'created_at': '2024-04-01T16:45:00Z',
                'points_balance': 1580
            }
        ]
        
        return Response(mock_users, status=status.HTTP_200_OK)
        # ======================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
        # try:
        #     # Fetch all users from database
        #     users = Users.objects.all().order_by('-created_at')
        #     
        #     # Serialize the data
        #     serializer = UserManagementSerializer(users, many=True)
        #     
        #     return Response(serializer.data, status=status.HTTP_200_OK)
        #     
        # except Exception as e:
        #     return Response(
        #         {'error': 'Failed to fetch users', 'detail': str(e)},
        #         status=status.HTTP_500_INTERNAL_SERVER_ERROR
        #     )
        # ==============================================================


# --------------------------
# User Update View (PUT - update role/status)
# --------------------------
class UserUpdateView(APIView):
    """
    PUT: Update user role or account status
    Admin only endpoint
    """
    # permission_classes = [IsAuthenticated]  # Uncomment when auth is ready
    
    def put(self, request, user_id):
        # ============ MOCK RESPONSE (CURRENTLY ACTIVE) ============
        # Mock successful update
        print(f"Mock: Updating user {user_id} with data:", request.data)
        
        return Response(
            {
                'message': 'User updated successfully',
                'user_id': user_id,
                'updated_fields': request.data
            },
            status=status.HTTP_200_OK
        )
        # ==========================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
        # try:
        #     # Get user from database
        #     user = Users.objects.get(user_id=user_id)
        #     
        #     # Update using serializer
        #     serializer = UserUpdateSerializer(user, data=request.data, partial=True)
        #     
        #     if serializer.is_valid():
        #         serializer.save()
        #         return Response(
        #             {
        #                 'message': 'User updated successfully',
        #                 'user': UserManagementSerializer(user).data
        #             },
        #             status=status.HTTP_200_OK
        #         )
        #     
        #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        #     
        # except Users.DoesNotExist:
        #     return Response(
        #         {'error': 'User not found'},
        #         status=status.HTTP_404_NOT_FOUND
        #     )
        # except Exception as e:
        #     return Response(
        #         {'error': 'Failed to update user', 'detail': str(e)},
        #         status=status.HTTP_500_INTERNAL_SERVER_ERROR
        #     )
        # ==============================================================


# --------------------------
# User Delete View (DELETE)
# --------------------------
class UserDeleteView(APIView):
    """
    DELETE: Delete a user from the system
    Admin only endpoint
    """
    # permission_classes = [IsAuthenticated]  # Uncomment when auth is ready
    
    def delete(self, request, user_id):
        # ============ MOCK RESPONSE (CURRENTLY ACTIVE) ============
        # Mock successful deletion
        print(f"Mock: Deleting user {user_id}")
        
        return Response(
            {
                'message': 'User deleted successfully',
                'user_id': user_id
            },
            status=status.HTTP_200_OK
        )
        # ==========================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
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