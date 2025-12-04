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





# --------------------------
# Company Management List View (GET all companies)
# --------------------------
class CompanyManagementListView(APIView):
    """
    GET: Return list of all companies for admin management table
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]  
    
    def get(self, request):
        # ============ MOCK DATA (CURRENTLY ACTIVE) ============
        mock_companies = [
            {
                'user_id': 1,
                'company_name': 'Mahmoud Hajj',
                'email': 'company@gmail.com',
                'phone_number': '12345678',
                'role': 'waste manager',
                'account_status': 'Active',
                'created_at': '2024-01-10T08:00:00Z',
            },
            {
                'user_id': 2,
                'company_name': 'Green Solutions Ltd',
                'email': 'green@solutions.com',
                'phone_number': '76543210',
                'role': 'waste manager',
                'account_status': 'Active',
                'created_at': '2024-02-15T09:30:00Z',
            },
            {
                'user_id': 3,
                'company_name': 'EcoWaste Services',
                'email': 'contact@ecowaste.com',
                'phone_number': '71234567',
                'role': 'waste manager',
                'account_status': 'Suspended',
                'created_at': '2024-03-20T11:15:00Z',
            }
        ]
        
        return Response(mock_companies, status=status.HTTP_200_OK)
        # ======================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
        # try:
        #     # Fetch all companies from database (users with company role)
        #     company_role = Roles.objects.get(role_name='Company')
        #     companies = Users.objects.filter(role_id=company_role).order_by('-created_at')
        #     
        #     # Serialize the data
        #     serializer = CompanyManagementSerializer(companies, many=True)
        #     
        #     return Response(serializer.data, status=status.HTTP_200_OK)
        #     
        # except Roles.DoesNotExist:
        #     return Response(
        #         {'error': 'Company role not found'},
        #         status=status.HTTP_404_NOT_FOUND
        #     )
        # except Exception as e:
        #     return Response(
        #         {'error': 'Failed to fetch companies', 'detail': str(e)},
        #         status=status.HTTP_500_INTERNAL_SERVER_ERROR
        #     )
        # ==============================================================


# --------------------------
# Company Update View (PUT - update company info)
# --------------------------
class CompanyUpdateView(APIView):
    """
    PUT: Update company information
    Admin only endpoint
    """
    permission_classes = [IsAuthenticated]  
    
    def put(self, request, company_id):
        # ============ MOCK RESPONSE (CURRENTLY ACTIVE) ============
        # Mock successful update
        print(f"Mock: Updating company {company_id} with data:", request.data)
        
        return Response(
            {
                'message': 'Company updated successfully',
                'company_id': company_id,
                'updated_fields': request.data
            },
            status=status.HTTP_200_OK
        )
        # ==========================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
        # try:
        #     # Get company from database
        #     company = Users.objects.get(user_id=company_id)
        #     
        #     # Update using serializer
        #     serializer = CompanyUpdateSerializer(company, data=request.data, partial=True)
        #     
        #     if serializer.is_valid():
        #         serializer.save()
        #         return Response(
        #             {
        #                 'message': 'Company updated successfully',
        #                 'company': CompanyManagementSerializer(company).data
        #             },
        #             status=status.HTTP_200_OK
        #         )
        #     
        #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        #     
        # except Users.DoesNotExist:
        #     return Response(
        #         {'error': 'Company not found'},
        #         status=status.HTTP_404_NOT_FOUND
        #     )
        # except Exception as e:
        #     return Response(
        #         {'error': 'Failed to update company', 'detail': str(e)},
        #         status=status.HTTP_500_INTERNAL_SERVER_ERROR
        #     )
        # ==============================================================


# --------------------------
# Company Delete View (DELETE)
# --------------------------
class CompanyDeleteView(APIView):
    """
    DELETE: Delete a company from the system
    Admin only endpoint
    """
    # permission_classes = [IsAuthenticated]  # Uncomment when auth is ready
    
    def delete(self, request, company_id):
        # ============ MOCK RESPONSE (CURRENTLY ACTIVE) ============
        # Mock successful deletion
        print(f"Mock: Deleting company {company_id}")
        
        return Response(
            {
                'message': 'Company deleted successfully',
                'company_id': company_id
            },
            status=status.HTTP_200_OK
        )
        # ==========================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
        # try:
        #     # Get company from database
        #     company = Users.objects.get(user_id=company_id)
        #     
        #     # Delete company
        #     company.delete()
        #     
        #     return Response(
        #         {'message': 'Company deleted successfully'},
        #         status=status.HTTP_200_OK
        #     )
        #     
        # except Users.DoesNotExist:
        #     return Response(
        #         {'error': 'Company not found'},
        #         status=status.HTTP_404_NOT_FOUND
        #     )
        # except Exception as e:
        #     return Response(
        #         {'error': 'Failed to delete company', 'detail': str(e)},
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
    # permission_classes = [IsAuthenticated]  # Uncomment when auth is ready
    
    def get(self, request):
        # ============ MOCK DATA (CURRENTLY ACTIVE) ============
        # Mock company profile data matching the screenshot
        mock_profile = {
            'user_id': 1,
            'company_name': 'Company Name',
            'contact_person_name': 'Mahmoud Khreij',
            'role_name': 'Waste Manager',
            'email': 'company@gmail.com',
            'phone_number': '+961 12345678',
            'address': 'Beirut, Zukaiq st, Bldg',
            'avatar': 'https://via.placeholder.com/150/10B981/FFFFFF?text=C',
            'account_status': 'Active',
            'created_at': '2024-01-10T08:00:00Z',
        }
        
        return Response(mock_profile, status=status.HTTP_200_OK)
        # ======================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
        # try:
        #     # Get authenticated company user
        #     user = request.user
        #     
        #     # Serialize the data
        #     serializer = CompanyProfileSerializer(user)
        #     
        #     return Response(serializer.data, status=status.HTTP_200_OK)
        #     
        # except Exception as e:
        #     return Response(
        #         {'error': 'Failed to fetch profile', 'detail': str(e)},
        #         status=status.HTTP_500_INTERNAL_SERVER_ERROR
        #     )
        # ==============================================================
    
    def put(self, request):
        # ============ MOCK UPDATE (CURRENTLY ACTIVE) ============
        # Mock successful update
        print("Mock: Updating company profile with data:", request.data)
        
        # Return updated profile
        mock_updated_profile = {
            'user_id': 1,
            'company_name': request.data.get('company_name', 'Company Name'),
            'contact_person_name': request.data.get('contact_person_name', 'Mahmoud Khreij'),
            'role_name': 'Waste Manager',
            'email': request.data.get('email', 'company@gmail.com'),
            'phone_number': request.data.get('phone_number', '+961 12345678'),
            'address': request.data.get('address', 'Beirut, Zukaiq st, Bldg'),
            'avatar': 'https://via.placeholder.com/150/10B981/FFFFFF?text=C',
            'account_status': 'Active',
            'created_at': '2024-01-10T08:00:00Z',
        }
        
        return Response(
            {
                'message': 'Profile updated successfully',
                'profile': mock_updated_profile
            },
            status=status.HTTP_200_OK
        )
        # ========================================================
        
        # ============ REAL API (COMMENTED OUT - USE LATER) ============
        # Uncomment when ready to use real database
        # 
        # try:
        #     # Get authenticated company user
        #     user = request.user
        #     
        #     # Update using serializer
        #     serializer = CompanyProfileUpdateSerializer(user, data=request.data, partial=True)
        #     
        #     if serializer.is_valid():
        #         serializer.save()
        #         
        #         # Return updated profile
        #         profile_serializer = CompanyProfileSerializer(user)
        #         return Response(
        #             {
        #                 'message': 'Profile updated successfully',
        #                 'profile': profile_serializer.data
        #             },
        #             status=status.HTTP_200_OK
        #         )
        #     
        #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        #     
        # except Exception as e:
        #     return Response(
        #         {'error': 'Failed to update profile', 'detail': str(e)},
        #         status=status.HTTP_500_INTERNAL_SERVER_ERROR
        #     )
        # ==============================================================        