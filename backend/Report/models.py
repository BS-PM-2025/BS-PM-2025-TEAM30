from django.db import models

class IssueReport(models.Model):
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    dummy = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.email} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"