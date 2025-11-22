from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from authentication.models import Users

class CustomJWTAuthentication(JWTAuthentication):
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