from django.urls import path
from .views import detect_restaurant, pending_restaurants

urlpatterns = [
    path('detect/', detect_restaurant, name='detect_restaurant'),
    path('pending/', pending_restaurants, name='pending_restaurants'),
]