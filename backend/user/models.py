# backend/user/models.py - הוספה למודל User הקיים

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import json


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # 🆕 הוספת שדות העדפות שעות
    preferred_breakfast_time = models.TimeField(null=True, blank=True, help_text="שעה מועדפת לארוחת בוקר")
    preferred_lunch_time = models.TimeField(null=True, blank=True, help_text="שעה מועדפת לארוחת צהריים")
    preferred_dinner_time = models.TimeField(null=True, blank=True, help_text="שעה מועדפת לארוחת ערב")

    # העדפות נוספות
    preferred_food_types = models.TextField(blank=True, help_text="סוגי אוכל מועדפים (JSON)")
    max_distance_preference = models.IntegerField(default=2000, help_text="מרחק מקסימלי מועדף במטרים")
    min_rating_preference = models.FloatField(default=3.0, help_text="דירוג מינימלי מועדף")

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return self.email

    def get_preferred_food_types(self):
        """מחזיר רשימת סוגי אוכל מועדפים"""
        if self.preferred_food_types:
            try:
                return json.loads(self.preferred_food_types)
            except json.JSONDecodeError:
                return []
        return []

    def set_preferred_food_types(self, food_types_list):
        """מגדיר סוגי אוכל מועדפים"""
        self.preferred_food_types = json.dumps(food_types_list)

    def get_current_meal_preference(self):
        """מחזיר את ההעדפה הנוכחית לפי השעה"""
        from datetime import datetime
        current_time = datetime.now().time()

        # ברירות מחדל אם לא הוגדרו העדפות
        breakfast_time = self.preferred_breakfast_time or datetime.strptime("09:00", "%H:%M").time()
        lunch_time = self.preferred_lunch_time or datetime.strptime("13:00", "%H:%M").time()
        dinner_time = self.preferred_dinner_time or datetime.strptime("19:00", "%H:%M").time()

        if current_time < lunch_time:
            return 'breakfast', breakfast_time
        elif current_time < dinner_time:
            return 'lunch', lunch_time
        else:
            return 'dinner', dinner_time