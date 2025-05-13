from django.urls import path
from .views import detect_restaurant, pending_restaurants, approve_restaurant, reject_restaurant

urlpatterns = [
    path('detect/', detect_restaurant, name='detect_restaurant'),
    path('pending/', pending_restaurants, name='pending_restaurants'),
    path('approve/<int:pk>/', approve_restaurant, name='approve_restaurant'),
    path('reject/<int:pk>/', reject_restaurant, name='reject_restaurant'),
]