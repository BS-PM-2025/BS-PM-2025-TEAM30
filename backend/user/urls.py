# backend/user/urls.py - עדכון הקובץ הקיים

from django.urls import path
from .views import RegisterUserView, LoginView, ResetPasswordView, UserPreferencesView, get_smart_recommendations

urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    # 🆕 נתיבים חדשים להעדפות
    path('preferences/', UserPreferencesView.as_view(), name='user-preferences'),
    path('recommendations/', get_smart_recommendations, name='smart-recommendations'),
]