from django.urls import path
from .views import (
    NotificationListCreateView,
    NotificationDetailView,
    NotificationMarkAllReadView,
    NotificationClearAllView,
)

urlpatterns = [
    path('', NotificationListCreateView.as_view(), name='notification-list-create'),
    path('mark-read/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('clear-all/', NotificationClearAllView.as_view(), name='notification-clear-all'),
    path('<str:pk>/', NotificationDetailView.as_view(), name='notification-detail'),
    path('<str:pk>/mark-read/', NotificationDetailView.as_view(), name='notification-mark-single-read'),
]
