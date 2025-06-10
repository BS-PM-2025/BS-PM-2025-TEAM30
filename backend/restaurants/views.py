# backend/restaurants/views.py - הוספת פונקציה להסרת מסעדות שמורות

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import SavedRestaurant
from .serializers import SavedRestaurantSerializer
from .utils import fetch_popular_times


@api_view(['POST'])
def save_restaurant(request):
    email = request.data.get('user_email')
    name = request.data.get('name')
    lat = request.data.get('lat')
    lng = request.data.get('lng')

    if SavedRestaurant.objects.filter(user_email=email, name=name, lat=lat, lng=lng).exists():
        return Response({'message': '⚠️ כבר שמור אצלך'}, status=200)

    serializer = SavedRestaurantSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'message': '✅ נשמר בהצלחה'})
    return Response(serializer.errors, status=400)


@api_view(['GET'])
def get_saved_restaurants(request):
    email = request.GET.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    restaurants = SavedRestaurant.objects.filter(user_email=email)
    serializer = SavedRestaurantSerializer(restaurants, many=True)
    return Response(serializer.data)


# 🆕 פונקציה חדשה להסרת מסעדות שמורות
@api_view(['POST', 'DELETE'])
def remove_saved_restaurant(request):
    """הסרת מסעדה שמורה"""
    email = request.data.get('user_email')
    name = request.data.get('name')
    lat = request.data.get('lat')
    lng = request.data.get('lng')

    if not all([email, name, lat, lng]):
        return Response({'error': 'חסרים פרטים נדרשים'}, status=400)

    try:
        # חיפוש המסעדה השמורה
        saved_restaurant = SavedRestaurant.objects.filter(
            user_email=email,
            name=name,
            lat=lat,
            lng=lng
        ).first()

        if not saved_restaurant:
            return Response({'error': 'המסעדה לא נמצאה ברשימה השמורה'}, status=404)

        # מחיקת המסעדה
        saved_restaurant.delete()

        return Response({'message': '✅ המסעדה הוסרה בהצלחה מהרשימה השמורה'}, status=200)

    except Exception as e:
        print(f"שגיאה בהסרת מסעדה שמורה: {str(e)}")
        return Response({'error': 'שגיאה בהסרת המסעדה'}, status=500)


# 🆕 פונקציה חלופית להסרה (אם הראשונה לא עובדת)
@api_view(['POST'])
def toggle_saved_restaurant(request):
    """הוספה/הסרה של מסעדה שמורה (toggle)"""
    email = request.data.get('user_email')
    name = request.data.get('name')
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    action = request.data.get('action', 'toggle')  # 'add', 'remove', 'toggle'

    if not all([email, name, lat, lng]):
        return Response({'error': 'חסרים פרטים נדרשים'}, status=400)

    try:
        # בדיקה אם המסעדה כבר שמורה
        saved_restaurant = SavedRestaurant.objects.filter(
            user_email=email,
            name=name,
            lat=lat,
            lng=lng
        ).first()

        if action == 'remove' or (action == 'toggle' and saved_restaurant):
            # הסרה
            if saved_restaurant:
                saved_restaurant.delete()
                return Response({'message': '✅ המסעדה הוסרה מהרשימה השמורה', 'status': 'removed'}, status=200)
            else:
                return Response({'error': 'המסעדה לא נמצאה ברשימה'}, status=404)

        elif action == 'add' or (action == 'toggle' and not saved_restaurant):
            # הוספה
            if saved_restaurant:
                return Response({'message': '⚠️ המסעדה כבר שמורה', 'status': 'already_saved'}, status=200)
            else:
                serializer = SavedRestaurantSerializer(data=request.data)
                if serializer.is_valid():
                    serializer.save()
                    return Response({'message': '✅ המסעדה נשמרה בהצלחה', 'status': 'saved'}, status=200)
                else:
                    return Response(serializer.errors, status=400)

    except Exception as e:
        print(f"שגיאה ב-toggle מסעדה שמורה: {str(e)}")
        return Response({'error': 'שגיאה בעדכון המסעדה'}, status=500)


@api_view(['GET'])
def get_popular_times_view(request):
    name = request.GET.get('name')
    if not name:
        return Response({"error": "missing name"}, status=400)

    data = fetch_popular_times(name)
    if not data:
        return Response({"error": "no data"}, status=404)

    return Response(data)