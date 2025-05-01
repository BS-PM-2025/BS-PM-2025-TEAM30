from django.urls import path
from .views import detect_restaurant

urlpatterns = [
    path('detect/', detect_restaurant, name='detect-restaurant'),
]