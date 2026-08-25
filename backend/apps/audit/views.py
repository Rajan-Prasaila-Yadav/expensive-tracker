from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from utils.prisma_client import get_prisma
from utils.auth_helper import get_authenticated_user_id

class AuditLogListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response([])

        result_filter = request.query_params.get('result')
        where = {'userId': user_id}
        if result_filter and result_filter != 'all':
            where['result'] = result_filter

        logs = db.auditlog.find_many(
            where=where,
            order={'timestamp': 'desc'}
        )

        return Response([{
            'id': l.id,
            'action': l.action,
            'entity': l.entity,
            'entityId': l.entityId,
            'device': l.device,
            'browser': l.browser,
            'os': l.os,
            'ip': l.ip,
            'result': l.result,
            'details': l.details,
            'timestamp': l.timestamp.isoformat(),
        } for l in logs])
