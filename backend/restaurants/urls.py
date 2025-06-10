# backend/restaurants/urls.py - עם endpoints חדשים להסרת מסעדות

from django.urls import path
from . import views
from backend.restaurants.views import get_popular_times_view, remove_saved_restaurant, toggle_saved_restaurant

urlpatterns = [
    path('save-restaurant/', views.save_restaurant),
    path('get-saved/', views.get_saved_restaurants),
    path('load/', get_popular_times_view),

    # 🆕 endpoints חדשים להסרת מסעדות שמורות
    path('remove-saved/', remove_saved_restaurant, name='remove_saved_restaurant'),
    path('toggle-saved/', toggle_saved_restaurant, name='toggle_saved_restaurant'),
]