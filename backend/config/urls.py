"""config URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from apps.categories.views import (
    PaymentMethodListCreateView, PaymentMethodDetailView,
    IncomeSourceListCreateView, IncomeSourceDetailView
)

def health_check(request):
    return JsonResponse({
        "status": "healthy",
        "service": "FinanceOS Django REST Backend",
        "version": "1.0.0",
        "database": "PostgreSQL via Prisma",
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
