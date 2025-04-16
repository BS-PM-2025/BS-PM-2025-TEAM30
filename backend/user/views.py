from django.shortcuts import render
from rest_framework import generics
from .models import User
from .serializers import UserSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

class RegisterUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, username=email, password=password)

        if user is not None:
            return Response({'message': 'התחברות הצליחה ✅'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'אימייל או סיסמה שגויים ❌'}, status=status.HTTP_401_UNAUTHORIZED)
