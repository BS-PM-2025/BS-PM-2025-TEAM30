from django.contrib import admin
from django.urls import path, include
from .views import nearby_restaurants, add_visit, remove_visit
from backend.user.views import ForgotPasswordView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('backend.user.urls')),
    path('api/restaurants/', include('backend.addrestaurants.urls')),
    path('api/nearby/', nearby_restaurants),
    path('api/forgot-password/', ForgotPasswordView.as_view()),
    path('api/visit/', add_visit),
    path('api/visit/remove/', remove_visit),
    # Include the restaurants urls at the api/ level
    path('api/', include('backend.restaurants.urls')),
]