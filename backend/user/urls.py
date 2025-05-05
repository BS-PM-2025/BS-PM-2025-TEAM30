from django.urls import path
from .views import RegisterUserView
from .views import LoginView
from .views import ResetPasswordView


urlpatterns = [
    path('register/', RegisterUserView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),

]
