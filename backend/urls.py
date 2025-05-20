from django.contrib import admin
from django.urls import path, include
from .views import nearby_restaurants, add_visit, remove_visit
from backend.user.views import ForgotPasswordView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend.user.urls')),
    path('api/restaurants/', include('backend.restaurants.urls')),
    path('api/nearby/', nearby_restaurants),
    path('api/forgot-password/', ForgotPasswordView.as_view()),
    path('api/restaurants/', include('backend.addrestaurants.urls')),
]
