from django.urls import path
from .views import RegisterUserView, ReportIssueView

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
]