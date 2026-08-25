from decimal import Decimal
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from utils.prisma_client import get_prisma
from utils.auth_helper import get_authenticated_user_id

class TransactionListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({'results': [], 'count': 0})

        tx_type = request.query_params.get('type')
        category_id = request.query_params.get('category_id')
        method_id = request.query_params.get('payment_method_id')
        status_filter = request.query_params.get('status')
        search_query = request.query_params.get('search')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        sort_by = request.query_params.get('sort', '-date')

        where = {'userId': user_id}
        if tx_type and tx_type != 'all':
            where['type'] = tx_type
        if category_id and category_id != 'all':
            where['categoryId'] = category_id
        if method_id and method_id != 'all':
            where['paymentMethodId'] = method_id
        if status_filter and status_filter != 'all':
            where['status'] = status_filter
        if date_from and date_to:
            try:
                where['date'] = {
                    'gte': datetime.strptime(date_from, '%Y-%m-%d'),
                    'lte': datetime.strptime(date_to, '%Y-%m-%d')
                }
            except Exception:
                pass
        if search_query:
            where['OR'] = [
                {'title': {'contains': search_query, 'mode': 'insensitive'}},
                {'notes': {'contains': search_query, 'mode': 'insensitive'}}
            ]

        # Sorting
        order = {'date': 'desc'}
        if sort_by == 'date': order = {'date': 'asc'}
        elif sort_by == '-date': order = {'date': 'desc'}
        elif sort_by == 'amount': order = {'amount': 'asc'}
        elif sort_by == '-amount': order = {'amount': 'desc'}
        elif sort_by == 'title': order = {'title': 'asc'}
        elif sort_by == '-title': order = {'title': 'desc'}

        transactions = db.transaction.find_many(
            where=where,
            order=order,
            include={'category': True, 'paymentMethod': True}
        )

        results = [{
            'id': t.id,
            'type': t.type,
            'title': t.title,
            'amount': float(t.amount),
            'date': t.date.strftime('%Y-%m-%d'),
            'time': t.time,
            'categoryId': t.categoryId,
            'sourceId': t.categoryId if t.type == 'income' else None,
            'paymentMethodId': t.paymentMethodId,
            'notes': t.notes or '',
            'status': t.status,
            'tags': t.tags,
            'category': {
                'id': t.category.id,
                'name': t.category.name,
                'icon': t.category.icon,
                'color': t.category.color
            } if t.category else None,
            'paymentMethod': {
                'id': t.paymentMethod.id,
                'name': t.paymentMethod.name,
                'icon': t.paymentMethod.icon,
                'type': t.paymentMethod.type
            } if t.paymentMethod else None,
        } for t in transactions]

        return Response({'results': results, 'count': len(results)})

    def post(self, request):
        db = get_prisma()
        user_id = get_authenticated_user_id(request)
        if not user_id:
            return Response({"error": "User required"}, status=status.HTTP_401_UNAUTHORIZED)

        d = request.data
        if not d.get('title') or d.get('amount') is None:
            return Response({"error": "Title and amount are required."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Resolve Category / Income Stream
        cat_id = d.get('categoryId') or d.get('sourceId')
        category = None
        if cat_id and cat_id != 'all':
            category = db.category.find_first(where={'id': cat_id})
            if not category:
                # Check incomesource table
                inc_src = db.incomesource.find_first(where={'id': cat_id})
                if inc_src:
                    try:
                        category = db.category.create(
                            data={
                                'id': inc_src.id,
                                'userId': user_id,
                                'name': inc_src.name,
                                'icon': inc_src.icon or '💼',
                                'color': inc_src.color or '#22c55e',
                                'type': 'income'
                            }
                        )
                    except Exception:
                        category = db.category.find_first(where={'id': inc_src.id})

        if not category:
            tx_type = d.get('type', 'expense')
            category = db.category.find_first(where={'userId': user_id, 'type': tx_type})
            if not category:
                category = db.category.find_first(where={'userId': user_id})
            if not category:
                category = db.category.create(data={
                    'userId': user_id,
                    'name': 'General',
                    'icon': '📁',
                    'color': '#3b82f6',
                    'type': tx_type
                })

        # 2. Resolve Payment Method
        pm_id = d.get('paymentMethodId')
        pm = None
        if pm_id and pm_id != 'all':
            pm = db.paymentmethod.find_first(where={'id': pm_id})
        if not pm:
            pm = db.paymentmethod.find_first(where={'userId': user_id})
            if not pm:
                pm = db.paymentmethod.create(data={
                    'userId': user_id,
                    'name': 'Cash',
                    'type': 'cash',
                    'icon': '💵',
                    'balance': Decimal('0.00')
                })

        date_val = datetime.strptime(d['date'], '%Y-%m-%d') if d.get('date') else datetime.now()

        tx = db.transaction.create(
            data={
                'userId': user_id,
                'type': d.get('type', 'expense'),
                'title': d['title'],
                'amount': Decimal(str(d['amount'])),
                'date': date_val,
                'time': d.get('time', datetime.now().strftime('%H:%M')),
                'categoryId': category.id if category else None,
                'paymentMethodId': pm.id if pm else None,
                'notes': d.get('notes', ''),
                'status': d.get('status', 'completed'),
                'tags': d.get('tags', []),
            },
            include={'category': True, 'paymentMethod': True}
        )

        return Response({
            'id': tx.id,
            'title': tx.title,
            'amount': float(tx.amount),
            'type': tx.type,
            'date': tx.date.strftime('%Y-%m-%d'),
            'time': tx.time,
            'categoryId': tx.categoryId,
            'paymentMethodId': tx.paymentMethodId,
            'status': tx.status,
            'notes': tx.notes,
            'message': 'Transaction created successfully in PostgreSQL database.'
        }, status=status.HTTP_201_CREATED)


class TransactionDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        db = get_prisma()
        tx = db.transaction.find_unique(
            where={'id': pk},
            include={'category': True, 'paymentMethod': True}
        )
        if not tx:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'id': tx.id,
            'type': tx.type,
            'title': tx.title,
            'amount': float(tx.amount),
            'date': tx.date.strftime('%Y-%m-%d'),
            'time': tx.time,
            'categoryId': tx.categoryId,
            'paymentMethodId': tx.paymentMethodId,
            'status': tx.status,
            'notes': tx.notes,
            'tags': tx.tags,
            'category': {
                'id': tx.category.id,
                'name': tx.category.name,
                'icon': tx.category.icon,
                'color': tx.category.color
            } if tx.category else None,
            'paymentMethod': {
                'id': tx.paymentMethod.id,
                'name': tx.paymentMethod.name,
                'icon': tx.paymentMethod.icon,
                'type': tx.paymentMethod.type
            } if tx.paymentMethod else None,
        })

    def put(self, request, pk):
        db = get_prisma()
        d = request.data
        update_data = {}
        if 'title' in d: update_data['title'] = d['title']
        if 'amount' in d: update_data['amount'] = Decimal(str(d['amount']))
        if 'type' in d: update_data['type'] = d['type']
        if 'status' in d: update_data['status'] = d['status']
        if 'notes' in d: update_data['notes'] = d['notes']
        if 'tags' in d: update_data['tags'] = d['tags']
        if 'date' in d: update_data['date'] = datetime.strptime(d['date'], '%Y-%m-%d')
        if 'time' in d: update_data['time'] = d['time']
        if 'categoryId' in d: update_data['categoryId'] = d['categoryId']
        if 'paymentMethodId' in d: update_data['paymentMethodId'] = d['paymentMethodId']

        tx = db.transaction.update(
            where={'id': pk},
            data=update_data,
            include={'category': True, 'paymentMethod': True}
        )
        return Response({'id': tx.id, 'message': 'Transaction updated successfully'})

    def delete(self, request, pk):
        db = get_prisma()
        db.transaction.delete(where={'id': pk})
        return Response({'message': 'Transaction deleted successfully'}, status=status.HTTP_200_OK)


class TransactionDuplicateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        db = get_prisma()
        original = db.transaction.find_unique(where={'id': pk})
        if not original:
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)

        duplicate = db.transaction.create(
            data={
                'userId': original.userId,
                'type': original.type,
                'title': f"{original.title} (Copy)",
                'amount': original.amount,
                'date': datetime.now(),
                'time': datetime.now().strftime('%H:%M'),
                'categoryId': original.categoryId,
                'paymentMethodId': original.paymentMethodId,
                'notes': original.notes,
                'status': original.status,
                'tags': original.tags,
            }
        )
        return Response({'id': duplicate.id, 'message': 'Transaction duplicated successfully'}, status=status.HTTP_201_CREATED)
