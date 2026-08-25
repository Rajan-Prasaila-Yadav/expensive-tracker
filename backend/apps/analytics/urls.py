from django.urls import path
from .views import OverviewKPIView, MonthlyTrendView

urlpatterns = [
    path('overview/', OverviewKPIView.as_view(), name='analytics-overview'),
    path('summary/', OverviewKPIView.as_view(), name='analytics-summary'),
    path('monthly-trend/', MonthlyTrendView.as_view(), name='analytics-monthly-trend'),
]
