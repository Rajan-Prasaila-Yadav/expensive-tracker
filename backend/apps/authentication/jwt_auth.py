"""Custom JWT Authentication for Prisma UUID users in Django REST Framework."""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import AccessToken
from utils.prisma_client import get_prisma

class PrismaAuthUser:
    """Lightweight user class for Django request.user."""
    def __init__(self, user_data):
        self.id = user_data.id if hasattr(user_data, 'id') else user_data.get('id')
        self.name = user_data.name if hasattr(user_data, 'name') else user_data.get('name')
        self.email = user_data.email if hasattr(user_data, 'email') else user_data.get('email')
        self.is_authenticated = True
        self.is_anonymous = False
        self.is_active = True

    def __str__(self):
        return f"{self.email} ({self.id})"


class PrismaJWTAuthentication(BaseAuthentication):
    """Authenticate requests using JWT tokens with Prisma UUID user IDs."""
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token_str = auth_header.split(' ')[1]
        try:
            token = AccessToken(token_str)
            user_id = token.get('user_id')
            if not user_id:
                return None

            db = get_prisma()
            user = db.user.find_unique(where={'id': user_id})
            if not user:
                raise AuthenticationFailed("User not found.")

            return (PrismaAuthUser(user), token)
        except AuthenticationFailed:
            raise
        except Exception as e:
            return None
