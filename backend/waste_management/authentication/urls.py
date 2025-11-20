from django.urls import path
from .views import UserSignupView, CompanySignupView, LoginView, AdminSignupView,LogoutView

urlpatterns = [
    path('signup/user/', UserSignupView.as_view(), name='user-signup'),
    path('signup/admin/', AdminSignupView.as_view(), name='admin-signup'),
    path('signup/company/', CompanySignupView.as_view(), name='company-signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
]
