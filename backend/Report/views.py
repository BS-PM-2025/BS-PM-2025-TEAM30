# backend/Report/views.py
from rest_framework import generics
from .models import IssueReport
from .serializers import IssueReportSerializer

class ReportIssueView(generics.CreateAPIView):
    queryset = IssueReport.objects.all()
    serializer_class = IssueReportSerializer