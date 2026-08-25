from utils.prisma_client import get_prisma
from django.contrib.auth.hashers import make_password

def get_authenticated_user_id(request):
    """
    Returns a guaranteed valid user ID present in the PostgreSQL database.
    Verifies JWT token user ID or falls back to the primary database user.
    Auto-creates the primary user if the database is empty.
    """
    db = get_prisma()
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Bearer '):
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            token = AccessToken(auth_header.split(' ')[1])
            uid = token.get('user_id')
            if uid:
                user = db.user.find_unique(where={'id': uid})
                if user:
                    return user.id
        except Exception:
            pass

    # Fallback to existing primary user in PostgreSQL
    user = db.user.find_first()
    if not user:
        try:
            user = db.user.create(
                data={
                    'email': 'rajanprasaila@gmail.com',
                    'name': 'Rajan Yadav',
                    'passwordHash': make_password('Admin@123'),
                    'currency': 'INR',
                }
            )
            db.usersettings.create(data={'userId': user.id})
        except Exception:
            user = db.user.find_first()

    return user.id if user else None
