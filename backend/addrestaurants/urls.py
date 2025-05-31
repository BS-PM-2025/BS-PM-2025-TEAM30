from django.urls import path
from .views import detect_restaurant, pending_restaurants, approve_restaurant, create_restaurant

urlpatterns = [
    path('', create_restaurant, name='create_restaurant'),
    path('detect/', detect_restaurant, name='detect_restaurant'),
    path('pending/', pending_restaurants, name='pending_restaurants'),
    path('approve/', approve_restaurant, name='approve_restaurant'),
]