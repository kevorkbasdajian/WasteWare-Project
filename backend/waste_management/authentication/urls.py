from django.urls import path
from .views import UserSignupView, CompanySignupView, LoginView, AdminSignupView,LogoutView,CookieTokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('signup/user/', UserSignupView.as_view(), name='user-signup'),
    path('signup/admin/', AdminSignupView.as_view(), name='admin-signup'),
    path('signup/company/', CompanySignupView.as_view(), name='company-signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('token/', CookieTokenRefreshView.as_view(), name='token_obtain_pair'),  # optional if you use custom login
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
]
