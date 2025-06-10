# backend/user/views.py - עם העדפות אוכל לכל ארוחה

from datetime import datetime
from django.shortcuts import render
from rest_framework import generics
from .models import User
from .serializers import UserSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from .serializers import UserSerializer, UserPreferencesSerializer
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
import json
from rest_framework.views import APIView
from rest_framework.decorators import api_view


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
        email = request.data.get('email', '').strip()

        print(f"🔍 מייל שהתקבל מה-Frontend: '{email}'")

        user = User.objects.filter(email__iexact=email).first()

        if user is None:
            return Response({'error': '❌ לא נמצא משתמש עם המייל הזה'}, status=status.HTTP_404_NOT_FOUND)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f'http://localhost:3000/reset-password/{uid}/{token}'

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


class UserPreferencesView(APIView):
    """API לניהול העדפות משתמש"""

    def get(self, request):
        """קבלת העדפות המשתמש הנוכחי"""
        email = request.GET.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)

            # יצירת מבנה נתונים מפורט עם העדפות לכל ארוחה
            preferences_data = {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'preferred_breakfast_time': user.preferred_breakfast_time.strftime(
                    '%H:%M') if user.preferred_breakfast_time else '09:00',
                'preferred_lunch_time': user.preferred_lunch_time.strftime(
                    '%H:%M') if user.preferred_lunch_time else '13:00',
                'preferred_dinner_time': user.preferred_dinner_time.strftime(
                    '%H:%M') if user.preferred_dinner_time else '19:00',

                # 🆕 העדפות אוכל לכל ארוחה
                'breakfast_foods': user.get_breakfast_foods(),
                'lunch_foods': user.get_lunch_foods(),
                'dinner_foods': user.get_dinner_foods(),

                # תאימות לאחור
                'preferred_food_types': user.preferred_food_types or '[]',
                'preferred_food_types_list': user.get_preferred_food_types(),

                'max_distance_preference': user.max_distance_preference or 2000,
                'min_rating_preference': user.min_rating_preference or 3.0,
                'current_meal_preference': self._get_current_meal_preference(user),

                # 🆕 העדפת האוכל הנוכחית
                'current_meal_food_preferences': user.get_current_meal_food_preferences(),
                'all_meal_preferences': user.get_all_meal_preferences()
            }

            return Response(preferences_data, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"🚨 שגיאה בקבלת העדפות: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """עדכון העדפות המשתמש"""
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)

            print(f"🔧 מעדכן העדפות עבור: {email}")
            print(f"📋 נתונים שהתקבלו: {request.data}")

            # עדכון העדפות שעות
            if 'preferred_breakfast_time' in request.data and request.data['preferred_breakfast_time']:
                try:
                    user.preferred_breakfast_time = datetime.strptime(request.data['preferred_breakfast_time'],
                                                                      '%H:%M').time()
                except ValueError as ve:
                    print(f"⚠️ שגיאה בפרסור שעת בוקר: {ve}")

            if 'preferred_lunch_time' in request.data and request.data['preferred_lunch_time']:
                try:
                    user.preferred_lunch_time = datetime.strptime(request.data['preferred_lunch_time'], '%H:%M').time()
                except ValueError as ve:
                    print(f"⚠️ שגיאה בפרסור שעת צהריים: {ve}")

            if 'preferred_dinner_time' in request.data and request.data['preferred_dinner_time']:
                try:
                    user.preferred_dinner_time = datetime.strptime(request.data['preferred_dinner_time'],
                                                                   '%H:%M').time()
                except ValueError as ve:
                    print(f"⚠️ שגיאה בפרסור שעת ערב: {ve}")

            # 🆕 עדכון העדפות אוכל לכל ארוחה
            if 'breakfast_foods' in request.data:
                breakfast_foods = request.data['breakfast_foods']
                if isinstance(breakfast_foods, list):
                    user.set_breakfast_foods(breakfast_foods)
                    print(f"🌅 עדכן אוכל בוקר: {breakfast_foods}")

            if 'lunch_foods' in request.data:
                lunch_foods = request.data['lunch_foods']
                if isinstance(lunch_foods, list):
                    user.set_lunch_foods(lunch_foods)
                    print(f"☀️ עדכן אוכל צהריים: {lunch_foods}")

            if 'dinner_foods' in request.data:
                dinner_foods = request.data['dinner_foods']
                if isinstance(dinner_foods, list):
                    user.set_dinner_foods(dinner_foods)
                    print(f"🌙 עדכן אוכל ערב: {dinner_foods}")

            # תאימות לאחור - העדפות כלליות
            if 'preferred_food_types' in request.data:
                food_types = request.data['preferred_food_types']
                if isinstance(food_types, list):
                    user.set_preferred_food_types(food_types)
                elif isinstance(food_types, str):
                    try:
                        food_types_list = json.loads(food_types)
                        user.set_preferred_food_types(food_types_list)
                    except json.JSONDecodeError:
                        user.preferred_food_types = food_types

            # עדכון העדפות נוספות
            if 'max_distance_preference' in request.data:
                try:
                    user.max_distance_preference = int(request.data['max_distance_preference'])
                except (ValueError, TypeError):
                    print(f"⚠️ שגיאה בפרסור מרחק מקסימלי")

            if 'min_rating_preference' in request.data:
                try:
                    user.min_rating_preference = float(request.data['min_rating_preference'])
                except (ValueError, TypeError):
                    print(f"⚠️ שגיאה בפרסור דירוג מינימלי")

            user.save()
            print(f"✅ העדפות נשמרו בהצלחה עבור {email}")

            # החזרת נתונים מעודכנים
            updated_preferences = {
                'email': user.email,
                'preferred_breakfast_time': user.preferred_breakfast_time.strftime(
                    '%H:%M') if user.preferred_breakfast_time else '09:00',
                'preferred_lunch_time': user.preferred_lunch_time.strftime(
                    '%H:%M') if user.preferred_lunch_time else '13:00',
                'preferred_dinner_time': user.preferred_dinner_time.strftime(
                    '%H:%M') if user.preferred_dinner_time else '19:00',
                'breakfast_foods': user.get_breakfast_foods(),
                'lunch_foods': user.get_lunch_foods(),
                'dinner_foods': user.get_dinner_foods(),
                'preferred_food_types_list': user.get_preferred_food_types(),
                'max_distance_preference': user.max_distance_preference,
                'min_rating_preference': user.min_rating_preference,
                'current_meal_food_preferences': user.get_current_meal_food_preferences(),
            }

            return Response({
                'message': '✅ ההעדפות עודכנו בהצלחה',
                'preferences': updated_preferences
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"🚨 שגיאה בעדכון העדפות: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': f'שגיאה בשמירת ההעדפות: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_current_meal_preference(self, user):
        """פונקציה פרטית לקבלת ההעדפה הנוכחית"""
        try:
            meal_type, preferred_time = user.get_current_meal_preference()
            return {
                'meal_type': meal_type,
                'preferred_time': preferred_time.strftime('%H:%M') if preferred_time else None
            }
        except Exception as e:
            print(f"⚠️ שגיאה בקבלת העדפה נוכחית: {e}")
            return {
                'meal_type': 'lunch',
                'preferred_time': '13:00'
            }


@api_view(['GET'])
def get_smart_recommendations(request):
    """🆕 המלצות חכמות מעודכנות עם העדפות לפי ארוחה"""
    email = request.GET.get('email')
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')

    if not all([email, lat, lng]):
        return Response({'error': 'Email, lat, and lng are required'}, status=400)

    try:
        user = User.objects.get(email=email)

        # קבלת העדפות נוכחיות
        meal_type, preferred_time = user.get_current_meal_preference()

        # 🆕 קבלת העדפות האוכל הספציפיות לארוחה הנוכחית
        current_meal_foods = user.get_current_meal_food_preferences()
        all_meal_prefs = user.get_all_meal_preferences()

        recommendations = {
            'meal_type': meal_type,
            'preferred_time': preferred_time.strftime('%H:%M') if preferred_time else None,
            'current_meal_foods': current_meal_foods,
            'all_meal_preferences': all_meal_prefs,
            'max_distance': user.max_distance_preference,
            'min_rating': user.min_rating_preference,
            'message': f'המלצות ל{meal_type} בשעה {preferred_time.strftime("%H:%M") if preferred_time else "לא הוגדר"} - {", ".join(current_meal_foods) if current_meal_foods else "אין העדפות ספציפיות"}'
        }

        return Response(recommendations, status=200)

    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
    except Exception as e:
        print(f"🚨 שגיאה בהמלצות: {str(e)}")
        return Response({'error': str(e)}, status=500)