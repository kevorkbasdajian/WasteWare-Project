from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from authentication.models import Users

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        """
        Override to ensure we only read from headers, never from body
        """
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token

    def get_user(self, validated_token):
        """
        Override to use custom Users model instead of Django's User
        """
        try:
            user_id = validated_token.get('user_id')
            if user_id is None:
                raise InvalidToken('Token contained no valid user identification')
            
            user = Users.objects.get(user_id=user_id)
            return user
        except Users.DoesNotExist:
            raise InvalidToken('User not found')