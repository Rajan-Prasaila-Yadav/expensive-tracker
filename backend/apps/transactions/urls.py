from django.urls import path
from .views import TransactionListCreateView, TransactionDetailView, TransactionDuplicateView

urlpatterns = [
    path('', TransactionListCreateView.as_view(), name='transaction-list-create'),
    path('<str:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
    path('<str:pk>/duplicate/', TransactionDuplicateView.as_view(), name='transaction-duplicate'),
]
