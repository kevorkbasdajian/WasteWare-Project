from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSignupSerializer, CompanySignupSerializer, LoginSerializer, AdminSignupSerializer
from .models import Users, Companies, Roles
from .utils import verify_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


class LogoutView(APIView):
    permission_classes = [AllowAny]  

    def post(self, request):
        try:
            print("Entered the function")

            
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
        print("Starting login process...")  # Debug log
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
                print(f"Setting cookie for user login: {email}")  # Debug log
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
