# backend/user/models.py - עם העדפות אוכל לכל ארוחה

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

    # שעות ארוחות
    preferred_breakfast_time = models.TimeField(null=True, blank=True, help_text="שעה מועדפת לארוחת בוקר")
    preferred_lunch_time = models.TimeField(null=True, blank=True, help_text="שעה מועדפת לארוחת צהריים")
    preferred_dinner_time = models.TimeField(null=True, blank=True, help_text="שעה מועדפת לארוחת ערב")

    # 🆕 העדפות אוכל לכל ארוחה בנפרד
    preferred_breakfast_foods = models.TextField(blank=True, help_text="סוגי אוכל מועדפים לארוחת בוקר (JSON)")
    preferred_lunch_foods = models.TextField(blank=True, help_text="סוגי אוכל מועדפים לארוחת צהריים (JSON)")
    preferred_dinner_foods = models.TextField(blank=True, help_text="סוגי אוכל מועדפים לארוחת ערב (JSON)")

    # העדפות כלליות
    preferred_food_types = models.TextField(blank=True, help_text="סוגי אוכל מועדפים כלליים (JSON) - לתאימות לאחור")
    max_distance_preference = models.IntegerField(default=2000, help_text="מרחק מקסימלי מועדף במטרים")
    min_rating_preference = models.FloatField(default=3.0, help_text="דירוג מינימלי מועדף")

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return self.email

    # 🆕 פונקציות לניהול העדפות אוכל לפי ארוחה
    def get_breakfast_foods(self):
        """מחזיר רשימת סוגי אוכל מועדפים לבוקר"""
        if self.preferred_breakfast_foods:
            try:
                return json.loads(self.preferred_breakfast_foods)
            except json.JSONDecodeError:
                return []
        return []

    def set_breakfast_foods(self, food_types_list):
        """מגדיר סוגי אוכל מועדפים לבוקר"""
        self.preferred_breakfast_foods = json.dumps(food_types_list)

    def get_lunch_foods(self):
        """מחזיר רשימת סוגי אוכל מועדפים לצהריים"""
        if self.preferred_lunch_foods:
            try:
                return json.loads(self.preferred_lunch_foods)
            except json.JSONDecodeError:
                return []
        return []

    def set_lunch_foods(self, food_types_list):
        """מגדיר סוגי אוכל מועדפים לצהריים"""
        self.preferred_lunch_foods = json.dumps(food_types_list)

    def get_dinner_foods(self):
        """מחזיר רשימת סוגי אוכל מועדפים לערב"""
        if self.preferred_dinner_foods:
            try:
                return json.loads(self.preferred_dinner_foods)
            except json.JSONDecodeError:
                return []
        return []

    def set_dinner_foods(self, food_types_list):
        """מגדיר סוגי אוכל מועדפים לערב"""
        self.preferred_dinner_foods = json.dumps(food_types_list)

    # שמירה על תאימות לאחור
    def get_preferred_food_types(self):
        """מחזיר רשימת סוגי אוכל מועדפים כלליים"""
        if self.preferred_food_types:
            try:
                return json.loads(self.preferred_food_types)
            except json.JSONDecodeError:
                return []
        return []

    def set_preferred_food_types(self, food_types_list):
        """מגדיר סוגי אוכל מועדפים כלליים"""
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

    def get_current_meal_food_preferences(self):
        """🆕 מחזיר את העדפות האוכל הנוכחיות לפי השעה"""
        meal_type, _ = self.get_current_meal_preference()

        if meal_type == 'breakfast':
            return self.get_breakfast_foods()
        elif meal_type == 'lunch':
            return self.get_lunch_foods()
        elif meal_type == 'dinner':
            return self.get_dinner_foods()

        # fallback לכלליות
        return self.get_preferred_food_types()

    def get_all_meal_preferences(self):
        """🆕 מחזיר את כל העדפות האוכל לכל הארוחות"""
        return {
            'breakfast': self.get_breakfast_foods(),
            'lunch': self.get_lunch_foods(),
            'dinner': self.get_dinner_foods(),
            'general': self.get_preferred_food_types()
        }