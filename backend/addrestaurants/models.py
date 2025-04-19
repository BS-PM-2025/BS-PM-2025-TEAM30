from django.db import models


class Restaurant(models.Model):
    name = models.CharField(max_length=100)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    is_open = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    location = models.CharField(max_length=200)  # עיר/מיקום
    website = models.URLField(blank=True, null=True)  # כתובת אתר (אופציונלי)
    description = models.TextField(blank=True, null=True)  # תיאור כללי (אופציונלי)

    def __str__(self):
        return self.name