from decimal import Decimal
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from utils.prisma_client import get_prisma
from utils.auth_helper import get_authenticated_user_id

class BudgetListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response([])

        period = request.query_params.get('period')
        where = {'userId': user_id}
        if period and period != 'all':
            where['period'] = period

        budgets = db.budget.find_many(where=where, include={'category': True})

        # Calculate actual spent for each budget in real time
        results = []
        for b in budgets:
            txs = db.transaction.find_many(
                where={
                    'userId': user_id,
                    'categoryId': b.categoryId,
                    'type': 'expense',
                    'status': 'completed',
                    'date': {'gte': b.startDate, 'lte': b.endDate}
                }
            )
            spent = sum(float(t.amount) for t in txs)
            results.append({
                'id': b.id,
                'categoryId': b.categoryId,
                'period': b.period,
                'limit': float(b.limitAmount),
                'spent': spent,
                'startDate': b.startDate.strftime('%Y-%m-%d'),
                'endDate': b.endDate.strftime('%Y-%m-%d'),
                'category': {
                    'id': b.category.id,
                    'name': b.category.name,
                    'icon': b.category.icon,
                    'color': b.category.color
                } if b.category else None
            })

        return Response(results)

    def post(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({"error": "User required"}, status=status.HTTP_401_UNAUTHORIZED)

        d = request.data
        start_d = datetime.strptime(d['startDate'], '%Y-%m-%d') if d.get('startDate') else datetime.now().replace(day=1)
        end_d = datetime.strptime(d['endDate'], '%Y-%m-%d') if d.get('endDate') else datetime.now().replace(day=28)

        budget = db.budget.create(
            data={
                'userId': user_id,
                'categoryId': d['categoryId'],
                'period': d.get('period', 'monthly'),
                'limitAmount': Decimal(str(d['limit'])),
                'startDate': start_d,
                'endDate': end_d,
            },
            include={'category': True}
        )

        return Response({
            'id': budget.id,
            'categoryId': budget.categoryId,
            'period': budget.period,
            'limit': float(budget.limitAmount),
            'spent': 0,
            'startDate': budget.startDate.strftime('%Y-%m-%d'),
            'endDate': budget.endDate.strftime('%Y-%m-%d'),
        }, status=status.HTTP_201_CREATED)


class BudgetDetailView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, pk):
        db = get_prisma()
        d = request.data
        update_data = {}
        if 'limit' in d: update_data['limitAmount'] = Decimal(str(d['limit']))
        if 'period' in d: update_data['period'] = d['period']
        if 'startDate' in d: update_data['startDate'] = datetime.strptime(d['startDate'], '%Y-%m-%d')
        if 'endDate' in d: update_data['endDate'] = datetime.strptime(d['endDate'], '%Y-%m-%d')

        b = db.budget.update(where={'id': pk}, data=update_data)
        return Response({'id': b.id, 'limit': float(b.limitAmount), 'message': 'Budget updated'})

    def delete(self, request, pk):
        db = get_prisma()
        db.budget.delete(where={'id': pk})
        return Response({'message': 'Budget deleted'}, status=status.HTTP_200_OK)
