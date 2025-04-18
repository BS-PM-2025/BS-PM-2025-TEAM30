from django.db import models

class VisitedRestaurant(models.Model):
    user_email = models.EmailField()
    restaurant_name = models.CharField(max_length=255)
    visit_date = models.DateField(auto_now_add=True)
    rating = models.IntegerField(null=True, blank=True)
    latitude = models.FloatField()
    longitude = models.FloatField()

    def __str__(self):
        return f"{self.user_email} - {self.restaurant_name}"