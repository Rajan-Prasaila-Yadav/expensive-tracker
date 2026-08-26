from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from utils.prisma_client import get_prisma
from utils.auth_helper import get_authenticated_user_id

# ── Categories ─────────────────────────────────────────────────────────────

class CategoryListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response([])

        cat_type = request.query_params.get('type')
        where = {'userId': user_id}
        if cat_type and cat_type != 'all':
            where['type'] = cat_type

        categories = db.category.find_many(where=where, order={'createdAt': 'asc'})
        return Response([{
            'id': c.id,
            'name': c.name,
            'icon': c.icon,
            'color': c.color,
            'type': c.type,
        } for c in categories])

    def post(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({"error": "User authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        d = request.data
        if not d.get('name'):
            return Response({"error": "Category name is required"}, status=status.HTTP_400_BAD_REQUEST)

        category = db.category.create(
            data={
                'userId': user_id,
                'name': d['name'].strip(),
                'icon': d.get('icon', '📁'),
                'color': d.get('color', '#3b82f6'),
                'type': d.get('type', 'expense'),
            }
        )
        return Response({
            'id': category.id,
            'name': category.name,
            'icon': category.icon,
            'color': category.color,
            'type': category.type,
        }, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, pk):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        existing = db.category.find_unique(where={'id': pk}) if user_id else None
        if not existing or existing.userId != user_id:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        d = request.data
        update_data = {}
        if 'name' in d: update_data['name'] = d['name'].strip()
        if 'icon' in d: update_data['icon'] = d['icon']
        if 'color' in d: update_data['color'] = d['color']
        if 'type' in d: update_data['type'] = d['type']

        category = db.category.update(
            where={'id': pk},
            data=update_data
        )
        return Response({
            'id': category.id,
            'name': category.name,
            'icon': category.icon,
            'color': category.color,
            'type': category.type
        })

    def delete(self, request, pk):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        existing = db.category.find_unique(where={'id': pk}) if user_id else None
        if not existing or existing.userId != user_id:
            return Response({"error": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        db.category.delete(where={'id': pk})
        return Response({'message': 'Category deleted successfully'}, status=status.HTTP_200_OK)


# ── Payment Methods ────────────────────────────────────────────────────────

class PaymentMethodListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response([])

        methods = db.paymentmethod.find_many(where={'userId': user_id}, order={'createdAt': 'asc'})
        return Response([{
            'id': m.id,
            'name': m.name,
            'type': m.type,
            'icon': m.icon,
            'last4': m.last4,
            'balance': float(m.balance) if m.balance is not None else 0.0,
        } for m in methods])

    def post(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({"error": "User required"}, status=status.HTTP_401_UNAUTHORIZED)

        d = request.data
        if not d.get('name'):
            return Response({"error": "Account name is required"}, status=status.HTTP_400_BAD_REQUEST)

        balance_val = d.get('balance', 0)
        try:
            balance_dec = Decimal(str(balance_val)) if balance_val is not None else Decimal('0')
        except Exception:
            balance_dec = Decimal('0')

        pm = db.paymentmethod.create(
            data={
                'userId': user_id,
                'name': d['name'].strip(),
                'type': d.get('type', 'bank'),
                'icon': d.get('icon', '💳'),
                'last4': d.get('last4'),
                'balance': balance_dec,
            }
        )
        return Response({
            'id': pm.id,
            'name': pm.name,
            'type': pm.type,
            'icon': pm.icon,
            'last4': pm.last4,
            'balance': float(pm.balance)
        }, status=status.HTTP_201_CREATED)


class PaymentMethodDetailView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, pk):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        existing = db.paymentmethod.find_unique(where={'id': pk}) if user_id else None
        if not existing or existing.userId != user_id:
            return Response({"error": "Payment method not found"}, status=status.HTTP_404_NOT_FOUND)
        d = request.data
        update_data = {}
        if 'name' in d: update_data['name'] = d['name'].strip()
        if 'type' in d: update_data['type'] = d['type']
        if 'icon' in d: update_data['icon'] = d['icon']
        if 'last4' in d: update_data['last4'] = d['last4']
        if 'balance' in d and d['balance'] is not None:
            update_data['balance'] = Decimal(str(d['balance']))

        pm = db.paymentmethod.update(
            where={'id': pk},
            data=update_data
        )
        return Response({
            'id': pm.id,
            'name': pm.name,
            'type': pm.type,
            'icon': pm.icon,
            'last4': pm.last4,
            'balance': float(pm.balance)
        })

    def delete(self, request, pk):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        existing = db.paymentmethod.find_unique(where={'id': pk}) if user_id else None
        if not existing or existing.userId != user_id:
            return Response({"error": "Payment method not found"}, status=status.HTTP_404_NOT_FOUND)
        db.paymentmethod.delete(where={'id': pk})
        return Response({'message': 'Payment method deleted'}, status=status.HTTP_200_OK)


# ── Income Sources ─────────────────────────────────────────────────────────

class IncomeSourceListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response([])

        sources = db.incomesource.find_many(where={'userId': user_id}, order={'createdAt': 'asc'})

        # Self-healing sync: Ensure all income sources exist in category table for foreign key relations
        for s in sources:
            try:
                exists = db.category.find_unique(where={'id': s.id})
                if not exists:
                    db.category.create(
                        data={
                            'id': s.id,
                            'userId': user_id,
                            'name': s.name,
                            'icon': s.icon or '💼',
                            'color': s.color or '#22c55e',
                            'type': 'income'
                        }
                    )
            except Exception:
                pass

        return Response([{
            'id': s.id,
            'name': s.name,
            'type': s.type,
            'icon': s.icon,
            'color': s.color,
            'monthlyAvg': float(s.monthlyAvg) if s.monthlyAvg is not None else 0.0,
        } for s in sources])

    def post(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({"error": "User required"}, status=status.HTTP_401_UNAUTHORIZED)

        d = request.data
        if not d.get('name'):
            return Response({"error": "Income stream name is required"}, status=status.HTTP_400_BAD_REQUEST)

        avg_val = d.get('monthlyAvg', 0)
        try:
            avg_dec = Decimal(str(avg_val)) if avg_val is not None else Decimal('0')
        except Exception:
            avg_dec = Decimal('0')

        source = db.incomesource.create(
            data={
                'userId': user_id,
                'name': d['name'].strip(),
                'type': d.get('type', 'salary'),
                'icon': d.get('icon', '💼'),
                'color': d.get('color', '#22c55e'),
                'monthlyAvg': avg_dec,
            }
        )

        # Mirror in category table for direct Transaction.categoryId foreign key compatibility
        try:
            db.category.create(
                data={
                    'id': source.id,
                    'userId': user_id,
                    'name': source.name,
                    'icon': source.icon,
                    'color': source.color,
                    'type': 'income'
                }
            )
        except Exception:
            pass

        return Response({
            'id': source.id,
            'name': source.name,
            'type': source.type,
            'icon': source.icon,
            'color': source.color,
            'monthlyAvg': float(source.monthlyAvg)
        }, status=status.HTTP_201_CREATED)


class IncomeSourceDetailView(APIView):
    permission_classes = [AllowAny]

    def put(self, request, pk):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        existing = db.incomesource.find_unique(where={'id': pk}) if user_id else None
        if not existing or existing.userId != user_id:
            return Response({"error": "Income source not found"}, status=status.HTTP_404_NOT_FOUND)
        d = request.data
        update_data = {}
        if 'name' in d: update_data['name'] = d['name'].strip()
        if 'type' in d: update_data['type'] = d['type']
        if 'icon' in d: update_data['icon'] = d['icon']
        if 'color' in d: update_data['color'] = d['color']
        if 'monthlyAvg' in d and d['monthlyAvg'] is not None:
            update_data['monthlyAvg'] = Decimal(str(d['monthlyAvg']))

        source = db.incomesource.update(
            where={'id': pk},
            data=update_data
        )

        try:
            cat_update = {}
            if 'name' in d: cat_update['name'] = d['name'].strip()
            if 'icon' in d: cat_update['icon'] = d['icon']
            if 'color' in d: cat_update['color'] = d['color']
            if cat_update:
                db.category.update(where={'id': pk}, data=cat_update)
        except Exception:
            pass

        return Response({
            'id': source.id,
            'name': source.name,
            'type': source.type,
            'icon': source.icon,
            'color': source.color,
            'monthlyAvg': float(source.monthlyAvg)
        })

    def delete(self, request, pk):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        existing = db.incomesource.find_unique(where={'id': pk}) if user_id else None
        if not existing or existing.userId != user_id:
            return Response({"error": "Income source not found"}, status=status.HTTP_404_NOT_FOUND)
        try:
            db.incomesource.delete(where={'id': pk})
        except Exception:
            pass
        try:
            db.category.delete(where={'id': pk})
        except Exception:
            pass
        return Response({'message': 'Income stream deleted'}, status=status.HTTP_200_OK)
