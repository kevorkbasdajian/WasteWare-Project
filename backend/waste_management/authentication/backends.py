from django.contrib.auth.backends import BaseBackend
from .models import Users, Companies
from .utils import verify_password

class CustomUserBackend(BaseBackend):
    """
    Authenticate normal users, company users, and admins.
    """
    def authenticate(self, request, email=None, password=None):
        # 1. Try to authenticate normal users
        try:
            user = Users.objects.get(email=email)
            if verify_password(password, user.password_hash):
                return user
        except Users.DoesNotExist:
            pass

        # 2. Try to authenticate company users
        try:
            company = Companies.objects.get(email=email)
            if verify_password(password, company.password_hash):
                return company
        except Companies.DoesNotExist:
            pass

        return None

    def get_user(self, user_id):
        try:
            return Users.objects.get(pk=user_id)
        except Users.DoesNotExist:
            try:
                return Companies.objects.get(pk=user_id)
            except Companies.DoesNotExist:
                return None
