from utils.prisma_client import get_prisma

def get_authenticated_user_id(request):
    """
    Returns the ID represented by a valid JWT.  There is deliberately no
    fallback user: requests without a token must never read or write another
    account's records.
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

    return None
