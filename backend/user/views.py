from django.shortcuts import render
from rest_framework import generics
from .models import User
from .serializers import UserSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate

from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail

from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode

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



class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email', '').strip()  # ניקוי רווחים

        # 🐞 הדפסה לדיבוג
        print(f"🔍 מייל שהתקבל מה-Frontend: '{email}'")

        # שימוש בטוח עם חיפוש גמיש
        user = User.objects.filter(email__iexact=email).first()

        if user is None:
            return Response({'error': '❌ לא נמצא משתמש עם המייל הזה'}, status=status.HTTP_404_NOT_FOUND)

        # ✅ יצירת טוקן ו־uid
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # ✅ לינק לשחזור סיסמה
        reset_link = f'http://localhost:3000/reset-password/{uid}/{token}'

        # ✅ שליחת המייל
        send_mail(
            'שחזור סיסמה - RouteBite',
            f'שלום {user.first_name},\n\nלחץ על הקישור הבא כדי לאפס את הסיסמה שלך:\n{reset_link}\n\nאם לא ביקשת איפוס סיסמה – תוכל להתעלם מההודעה.',
            'noreply@routebite.com',
            [user.email],
            fail_silently=False,
        )

        return Response({'message': '✔ קישור לשחזור נשלח למייל שלך'}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        try:
            uid = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': '❌ קישור לא תקף'}, status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            user.set_password(password)
            user.save()
            return Response({'message': '✅ הסיסמה אופסה בהצלחה'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': '❌ הקישור פג תוקף'}, status=status.HTTP_400_BAD_REQUEST)

#
# class ForgotPasswordView(APIView):
#     def post(self, request):
#         email = request.data.get('email')
#         email = email.strip()
#         print(f"🔍 מייל שהתקבל מה-Frontend: '{email}'")
#         try:
#             user = User.objects.get(email=email)
#
#             # ✅ יצירת טוקן ו־uid
#             uid = urlsafe_base64_encode(force_bytes(user.pk))
#             token = default_token_generator.make_token(user)
#
#             # ✅ לינק לשחזור סיסמה
#             reset_link = f'http://localhost:3000/reset-password/{uid}/{token}'
#
#             # ✅ שליחת המייל
#             send_mail(
#                 'שחזור סיסמה - RouteBite',
#                 f'שלום {user.username},\n\nלחץ על הקישור הבא כדי לאפס את הסיסמה שלך:\n{reset_link}\n\nאם לא ביקשת איפוס סיסמה – תוכל להתעלם מההודעה.',
#                 'noreply@routebite.com',
#                 [email],
#                 fail_silently=False,
#             )
#
#             return Response({'message': '✔ קישור לשחזור נשלח למייל שלך'}, status=status.HTTP_200_OK)
#
#         except User.DoesNotExist:
#             return Response({'error': '❌ לא נמצא משתמש עם המייל הזה'}, status=status.HTTP_404_NOT_FOUND)