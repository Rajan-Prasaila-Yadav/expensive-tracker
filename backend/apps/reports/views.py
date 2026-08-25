import csv
from io import StringIO
from datetime import datetime
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from utils.prisma_client import get_prisma
from utils.auth_helper import get_authenticated_user_id

class ReportExportCSVView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({"error": "User required"}, status=401)

        txs = db.transaction.find_many(
            where={'userId': user_id},
            order={'date': 'desc'},
            include={'category': True, 'paymentMethod': True}
        )

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="transactions_export_{datetime.now().strftime("%Y%m%d")}.csv"'

        # UTF-8 BOM for Excel compatibility
        response.write('\ufeff')

        writer = csv.writer(response)
        writer.writerow(['Date', 'Time', 'Title', 'Type', 'Category', 'Payment Method', 'Status', 'Amount', 'Notes'])

        for t in txs:
            cat_name = t.category.name if t.category else ''
            pm_name = t.paymentMethod.name if t.paymentMethod else ''
            amt = float(t.amount) if t.type == 'income' else -float(t.amount)
            writer.writerow([
                t.date.strftime('%Y-%m-%d'),
                t.time,
                t.title,
                t.type.upper(),
                cat_name,
                pm_name,
                t.status.upper(),
                amt,
                t.notes or '',
            ])

        return response
