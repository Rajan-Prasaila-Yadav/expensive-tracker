from django.urls import path
from .views import (
    CategoryListCreateView, CategoryDetailView,
    PaymentMethodListCreateView, PaymentMethodDetailView,
    IncomeSourceListCreateView, IncomeSourceDetailView
)

urlpatterns = [
    # Categories
    path('', CategoryListCreateView.as_view(), name='category-list-create'),
    path('<str:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # Payment Methods
    path('methods/', PaymentMethodListCreateView.as_view(), name='payment-methods-list-create'),
    path('methods/<str:pk>/', PaymentMethodDetailView.as_view(), name='payment-methods-detail'),

    # Income Sources
    path('sources/', IncomeSourceListCreateView.as_view(), name='income-sources-list-create'),
    path('sources/<str:pk>/', IncomeSourceDetailView.as_view(), name='income-sources-detail'),
]
