from django.urls import path
from .views import NotificationListCreateView, NotificationMarkReadView

urlpatterns = [
    path('', NotificationListCreateView.as_view(), name='notification-list-create'),
    path('mark-read/', NotificationMarkReadView.as_view(), name='notification-mark-all-read'),
    path('<str:pk>/mark-read/', NotificationMarkReadView.as_view(), name='notification-mark-single-read'),
    path('clear-all/', NotificationMarkReadView.as_view(), name='notification-clear-all'),
]
