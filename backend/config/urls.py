"""config URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from apps.categories.views import (
    PaymentMethodListCreateView, PaymentMethodDetailView,
    IncomeSourceListCreateView, IncomeSourceDetailView
)

def health_check(request):
    db_status = "healthy"
    user_count = 0
    error_msg = None
    try:
        from utils.prisma_client import get_prisma
        db = get_prisma()
        user_count = db.user.count()
    except Exception as e:
        import traceback
        db_status = "error"
        error_msg = f"{type(e).__name__}: {str(e)}"

    return JsonResponse({
        "status": "healthy" if db_status == "healthy" else "database_error",
        "service": "FinanceOS Django REST Backend",
        "version": "1.0.0",
        "database": db_status,
        "usersCount": user_count,
        "error": error_msg,
    })

urlpatterns = [
    path('', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/transactions/', include('apps.transactions.urls')),
    path('api/categories/', include('apps.categories.urls')),
    path('api/payment-methods/', PaymentMethodListCreateView.as_view(), name='payment-methods'),
    path('api/payment-methods/<str:pk>/', PaymentMethodDetailView.as_view(), name='payment-methods-detail'),
    path('api/income-sources/', IncomeSourceListCreateView.as_view(), name='income-sources'),
    path('api/income-sources/<str:pk>/', IncomeSourceDetailView.as_view(), name='income-sources-detail'),
    path('api/budgets/', include('apps.budgets.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/audit-logs/', include('apps.audit.urls')),
]
