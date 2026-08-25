from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from utils.prisma_client import get_prisma
from utils.auth_helper import get_authenticated_user_id

class NotificationListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response([])

        notifications = db.notification.find_many(
            where={'userId': user_id},
            order={'timestamp': 'desc'}
        )

        return Response([{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'type': n.type,
            'read': n.read,
            'timestamp': n.timestamp.isoformat(),
        } for n in notifications])

    def post(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({"error": "User required"}, status=status.HTTP_401_UNAUTHORIZED)

        d = request.data
        n = db.notification.create(
            data={
                'userId': user_id,
                'title': d['title'],
                'message': d['message'],
                'type': d.get('type', 'info'),
                'read': False,
            }
        )
        return Response({'id': n.id, 'title': n.title, 'message': n.message, 'type': n.type, 'read': n.read}, status=status.HTTP_201_CREATED)


class NotificationMarkReadView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, pk):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        n = db.notification.update(
            where={'id': pk},
            data={'read': True}
        )
        return Response({'id': n.id, 'read': n.read})


class NotificationMarkAllReadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if user_id:
            db.notification.update_many(
                where={'userId': user_id, 'read': False},
                data={'read': True}
            )
        return Response({'message': 'All notifications marked as read'})
