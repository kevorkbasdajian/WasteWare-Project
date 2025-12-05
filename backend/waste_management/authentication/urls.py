from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from .views import UserSignupView, CompanySignupView, LoginView, AdminSignupView, LogoutView, ProfileView, UpdateProfileView, UserManagementListView, UserUpdateView, UserDeleteView,AddressViewSet,NotificationViewSet,UserListViewSet,CompanyManagementListView, CompanyUpdateView,CompanyDeleteView,CompanyProfileView,CompanyCreateView,AdminCreateUserView


router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'users', UserListViewSet, basename='user-list')
urlpatterns = [
    path('signup/user/', UserSignupView.as_view(), name='user-signup'),
    path('signup/admin/', AdminSignupView.as_view(), name='admin-signup'),
    path('signup/company/', CompanySignupView.as_view(), name='company-signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('', include(router.urls)),

    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/update/', UpdateProfileView.as_view(), name='update-profile'),

    path('admin/users/', UserManagementListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:user_id>/', UserUpdateView.as_view(), name='admin-user-update'),
    path('admin/users/<int:user_id>/delete/', UserDeleteView.as_view(), name='admin-user-delete'),
    path('admin/users/create/', AdminCreateUserView.as_view(), name='user-create'),

    path('admin/companies/', CompanyManagementListView.as_view(), name='admin-company-list'),
    path('admin/companies/create/', CompanyCreateView.as_view(), name='company-create'),

    path('admin/companies/<int:company_id>/', CompanyUpdateView.as_view(),  name='admin-company-update'),
    path('admin/companies/<int:company_id>/delete/', CompanyDeleteView.as_view(), name='admin-company-delete'),

    path('company/profile/', CompanyProfileView.as_view(), name='company-profile'),
    
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
