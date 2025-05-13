from django.urls import path
from . import views

urlpatterns = [
    path('api/save-restaurant/', views.save_restaurant),
    path('api/get-saved/', views.get_saved_restaurants),
]
