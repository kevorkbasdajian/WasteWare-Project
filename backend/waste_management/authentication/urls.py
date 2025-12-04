from django.urls import path
from .views import (UserSignupView, CompanySignupView, LoginView, ProfileView, UpdateProfileView, UserManagementListView, UserUpdateView, UserDeleteView
, CompanyManagementListView,
    CompanyUpdateView,
    CompanyDeleteView,CompanyProfileView,)

urlpatterns = [
    path('signup/user/', UserSignupView.as_view(), name='user-signup'),
    path('signup/company/', CompanySignupView.as_view(), name='company-signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),
    path('admin/users/', UserManagementListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:user_id>/', UserUpdateView.as_view(), name='admin-user-update'),
    path('admin/users/<int:user_id>/delete/', UserDeleteView.as_view(), name='admin-user-delete'),
    path('admin/companies/', CompanyManagementListView.as_view(), name='admin-company-list'),
    path('admin/companies/<int:company_id>/', CompanyUpdateView.as_view(),  name='admin-company-update'),
    path('admin/companies/<int:company_id>/delete/', CompanyDeleteView.as_view(), name='admin-company-delete'),
    path('company/profile/', CompanyProfileView.as_view(), name='company-profile'),
]
