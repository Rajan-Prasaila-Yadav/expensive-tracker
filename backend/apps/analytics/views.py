from datetime import datetime, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from utils.prisma_client import get_prisma
from utils.auth_helper import get_authenticated_user_id

class OverviewKPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({
                'balance': 0, 'income': 0, 'expense': 0, 'transfer': 0,
                'budgetTotal': 0, 'budgetSpent': 0, 'budgetUsedPct': 0,
                'recentTransactions': []
            })

        txs = db.transaction.find_many(
            where={'userId': user_id, 'status': 'completed'},
            order={'date': 'desc'},
            include={'category': True, 'paymentMethod': True}
        )

        income = sum(float(t.amount) for t in txs if t.type == 'income')
        expense = sum(float(t.amount) for t in txs if t.type == 'expense')
        transfer = sum(float(t.amount) for t in txs if t.type == 'transfer')
        balance = income - expense

        budgets = db.budget.find_many(where={'userId': user_id})
        budget_total = sum(float(b.limitAmount) for b in budgets)
        budget_spent = min(expense, budget_total) if budget_total > 0 else 0
        budget_used_pct = round((expense / budget_total * 100), 1) if budget_total > 0 else 0

        recent = [{
            'id': t.id,
            'type': t.type,
            'title': t.title,
            'amount': float(t.amount),
            'date': t.date.strftime('%Y-%m-%d'),
            'time': t.time,
            'status': t.status,
            'category': {'name': t.category.name, 'icon': t.category.icon, 'color': t.category.color} if t.category else None,
            'paymentMethod': {'name': t.paymentMethod.name, 'icon': t.paymentMethod.icon} if t.paymentMethod else None,
        } for t in txs[:8]]

        return Response({
            'balance': balance,
            'income': income,
            'expense': expense,
            'transfer': transfer,
            'budgetTotal': budget_total,
            'budgetSpent': budget_spent,
            'budgetUsedPct': budget_used_pct,
            'recentTransactions': recent,
        })


class MonthlyTrendView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response([])

        txs = db.transaction.find_many(
            where={'userId': user_id, 'status': 'completed'},
            order={'date': 'asc'}
        )

        # Group by Month-Year
        months_map = {}
        for t in txs:
            m_key = t.date.strftime('%b %Y')
            if m_key not in months_map:
                months_map[m_key] = {'month': t.date.strftime('%b'), 'income': 0, 'expense': 0, 'transfer': 0}
            if t.type == 'income': months_map[m_key]['income'] += float(t.amount)
            elif t.type == 'expense': months_map[m_key]['expense'] += float(t.amount)
            elif t.type == 'transfer': months_map[m_key]['transfer'] += float(t.amount)

        data = list(months_map.values())
        return Response(data[-6:] if len(data) >= 6 else data)
