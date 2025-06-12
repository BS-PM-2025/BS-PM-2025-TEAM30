
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    user_email = models.EmailField(verbose_name="אימייל משתמש")
    restaurant_name = models.CharField(max_length=255, verbose_name="שם המסעדה")
    restaurant_lat = models.FloatField(verbose_name="קואורדינטת רוחב")
    restaurant_lng = models.FloatField(verbose_name="קואורדינטת אורך")

    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name="דירוג (1-5 כוכבים)"
    )
    title = models.CharField(max_length=100, verbose_name="כותרת הביקורת", blank=True)
    content = models.TextField(verbose_name="תוכן הביקורת")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="תאריך יצירה")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="תאריך עדכון")
    is_approved = models.BooleanField(default=True, verbose_name="אושר למעקב")

    tags = models.CharField(max_length=200, blank=True, help_text="תגיות מופרדות בפסיקים")

    class Meta:
        verbose_name = "ביקורת"
        verbose_name_plural = "ביקורות"
        ordering = ['-created_at']
        unique_together = ['user_email', 'restaurant_name', 'restaurant_lat', 'restaurant_lng']

    def __str__(self):
        return f"{self.user_email} - {self.restaurant_name} ({self.rating}⭐)"

    @property
    def user_first_name(self):
        return self.user_email.split('@')[0]

    @property
    def stars_display(self):
        return "⭐" * self.rating + "☆" * (5 - self.rating)

    @property
    def created_at_hebrew(self):
        months = {
            1: "ינואר", 2: "פברואר", 3: "מרץ", 4: "אפריל",
            5: "מאי", 6: "יוני", 7: "יולי", 8: "אוגוסט",
            9: "ספטמבר", 10: "אוקטובר", 11: "נובמבר", 12: "דצמבר"
        }
        return f"{self.created_at.day} {months[self.created_at.month]} {self.created_at.year}"