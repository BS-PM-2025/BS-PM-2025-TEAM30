from django.urls import path
from .views import RestaurantCreateView

urlpatterns = [
    path('', RestaurantCreateView.as_view(), name='add-restaurant'),
]