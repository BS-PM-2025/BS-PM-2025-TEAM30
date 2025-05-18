from django.urls import path
<<<<<<< HEAD
from .views import detect_restaurant, pending_restaurants

urlpatterns = [
    path('detect/', detect_restaurant, name='detect_restaurant'),
    path('pending/', pending_restaurants, name='pending_restaurants'),
=======
from .views import detect_restaurant

urlpatterns = [
    path('detect/', detect_restaurant, name='detect-restaurant'),
>>>>>>> 52f2de104c8ca1820c617610de6b88754f99bfcd
]