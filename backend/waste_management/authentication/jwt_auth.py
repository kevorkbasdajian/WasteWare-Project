from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from authentication.models import Users, Companies

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        Override to use custom Users or Companies model instead of Django's User
        """
        try:
            # Check if it's a user token
            user_id = validated_token.get('user_id')
            if user_id is not None:
                user = Users.objects.get(user_id=user_id)
                return user
            
            # Check if it's a company token
            company_id = validated_token.get('company_id')
            if company_id is not None:
                company = Companies.objects.get(company_id=company_id)
                return company
            
            raise InvalidToken('Token contained no valid user or company identification')
            
        except Users.DoesNotExist:
            raise InvalidToken('User not found')
        except Companies.DoesNotExist:
            raise InvalidToken('Company not found')