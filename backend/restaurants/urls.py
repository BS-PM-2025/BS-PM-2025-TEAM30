from django.urls import path
from . import views
from backend.restaurants.views import get_popular_times_view

urlpatterns = [
    path('save-restaurant/', views.save_restaurant),
    path('get-saved/', views.get_saved_restaurants),
    path('load/', get_popular_times_view),
]
