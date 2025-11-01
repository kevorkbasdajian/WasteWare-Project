from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from .serializers import UserSignupSerializer, CompanySignupSerializer, LoginSerializer, AdminSignupSerializer
from .models import Users, Companies, Roles
from .utils import verify_password
from django.conf import settings
from django.contrib.auth import authenticate


class LogoutView(APIView):
    permission_classes = []  # Allow both authenticated and unauthenticated requests

    def post(self, request):
        try:
            print("Entered the function")
            # Get refresh token from cookie
            refresh_token = request.COOKIES.get('refresh_token')
            
            # Create response first
            resp = Response({"detail": "Logged out"}, status=status.HTTP_200_OK)
            
            # Always delete the cookie, even if token is invalid
            resp.delete_cookie(
                key='refresh_token',
                path='/',
                domain=None,  # This ensures it matches the cookie's domain
                samesite='Lax'
            )
            
            # Try to blacklist the token if we have one
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except TokenError:
                    # Still return 200 even if token is invalid
                    # We're logging out anyway
                    pass
            
            return resp
            
        except Exception as e:
            # Still try to clear the cookie even if there's an error
            resp = Response(
                {"error": "Error during logout"}, 
                status=status.HTTP_200_OK  # Changed to 200 since we're still logging out
            )
            resp.delete_cookie(
                key='refresh_token',
                path='/',
                domain=None,
                samesite='Lax'
            )
            return resp



class CookieTokenRefreshView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        if not refresh_token:
            return Response({'error': 'Refresh token missing'}, status=401)
        try:
            token = RefreshToken(refresh_token)
            access = str(token.access_token)
            # Optionally issue a new refresh token when rotating
            new_refresh = None
            if settings.SIMPLE_JWT['ROTATE_REFRESH_TOKENS']:
                new_refresh = str(token)  # after rotation SimpleJWT handles it
                # set new cookie
            resp = Response({'access': access})
            if new_refresh:
                resp.set_cookie('refresh_token', new_refresh, httponly=True, secure=True, samesite='Lax')
            return resp
        except TokenError:
            return Response({'error': 'Invalid token'}, status=401)

# --------------------------
# Helper function to generate JWT token
# --------------------------

def get_tokens_for_user(user):
    # manually create refresh token without relying on Django's auth.User relation
    refresh = RefreshToken()
    refresh['user_id'] = user.user_id
    refresh['email'] = user.email
    refresh['role'] = str(user.role.role_name) if user.role else None
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
            access = token['access']
            refresh = token['refresh']
            response = Response({'user_id': user.user_id, 'access': access},status = status.HTTP_201_CREATED)
            # set HttpOnly cookie for refresh
            response.set_cookie(
            key='refresh_token',
            value=refresh,
            httponly=True,
            samesite='Lax',
            secure=False,   # required when samesite=None
            max_age=7*24*3600,    # match refresh lifetime
            path='/'     # restrict path if desired
            )
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------
# Admin Signup
# --------------------------
class AdminSignupView(APIView):
    def post(self, request):
        serializer = AdminSignupSerializer(data=request.data)
        if serializer.is_valid():
            admin = serializer.save()
            token = get_tokens_for_user(admin)
            access = token['access']
            refresh = token['refresh']
            response = Response({'user_id': admin.user_id, 'access': access}, status=status.HTTP_201_CREATED)
            # set HttpOnly cookie for refresh
            response.set_cookie(
                key='refresh_token',
                value=refresh,
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=7*24*3600,    # match refresh lifetime

                path='/'
            )
            return response
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
            access = token['access']
            refresh = token['refresh']
            response = Response({'company_id': company.company_id, 'access': access}, status=status.HTTP_201_CREATED)
            # set HttpOnly cookie for refresh
            response.set_cookie(
                key='refresh_token',
                value=refresh,
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=7*24*3600,    # match refresh lifetime
                path='/'
            )
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --------------------------
# Login View
# --------------------------
class LoginView(APIView):
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
                refresh = token['refresh']
                if user.role.role_name == 'Admin':
                    user_type = 'admin'
                else:
                    user_type = 'user'
                # return access in body and set httponly refresh cookie
                print(f"Setting cookie for user login: {email}")  # Debug log
                response = Response({'user_type': user_type, 'user_id': user.user_id, 'access': access}, status=status.HTTP_200_OK)
                response.set_cookie(
                    key='refresh_token',
                    value=refresh,
                    httponly=True,
                    samesite='Lax',
                    secure=False,
                    path='/'
                )
                print("Cookie set for user login")  # Debug log
                return response
        except Users.DoesNotExist:
            pass

        # Check company users
        try:
            company = Companies.objects.get(email=email)
            if verify_password(password, company.password_hash):
                print(f"Setting cookie for company login: {email}")  # Debug log
                token = get_tokens_for_user(company)
                access = token['access']
                refresh = token['refresh']
                response = Response({'user_type': 'company', 'company_id': company.company_id, 'access': access}, status=status.HTTP_200_OK)
                response.set_cookie(
                    key='refresh_token',
                    value=refresh,
                    httponly=True,
                    samesite='Lax',
                    secure=False,
                    path='/'
                )
                print("Cookie set for company login")  # Debug log
                return response
        except Companies.DoesNotExist:
            pass

        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
