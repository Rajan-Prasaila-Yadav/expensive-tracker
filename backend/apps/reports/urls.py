from django.urls import path
from .views import ReportExportCSVView

urlpatterns = [
    path('export/csv/', ReportExportCSVView.as_view(), name='reports-export-csv'),
]
