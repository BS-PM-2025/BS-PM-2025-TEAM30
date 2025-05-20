from django.urls import path
from . import views
from backend.restaurants.views import get_popular_times_view
from django.urls import path, include


urlpatterns = [
    path('api/save-restaurant/', views.save_restaurant),
    path('api/get-saved/', views.get_saved_restaurants),
    path('api/load/', get_popular_times_view),
    path('api/', include('backend.restaurants.urls')),
]
