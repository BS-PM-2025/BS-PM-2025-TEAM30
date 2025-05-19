from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Restaurant
from .serializers import RestaurantSerializer
import requests
from math import radians, cos, sin, asin, sqrt
from django.conf import settings

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return R * 2 * asin(sqrt(a))

def get_lat_long_from_address(address):
    key = settings.GOOGLE_MAPS_API_KEY
    response = requests.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        params={"address": address, "key": key}
    )
    if response.status_code == 200:
        data = response.json()
        if data["results"]:
            location = data["results"][0]["geometry"]["location"]
            return location["lat"], location["lng"]
    return None, None

@api_view(['POST'])
def detect_restaurant(request):
    name = request.data.get('name')
    lat = request.data.get('latitude')
    lon = request.data.get('longitude')

    if name:
        try:
            r = Restaurant.objects.get(name__iexact=name.strip())
            return Response(RestaurantSerializer(r).data)
        except Restaurant.DoesNotExist:
            return Response({'error': 'לא נמצאה מסעדה עם שם זה'}, status=status.HTTP_404_NOT_FOUND)

    if lat and lon:
        lat = float(lat)
        lon = float(lon)
        closest = None
        for r in Restaurant.objects.exclude(latitude=None).exclude(longitude=None):
            dist = haversine(lat, lon, r.latitude, r.longitude)
            if dist < 0.02:
                closest = r
                break
        if closest:
            return Response(RestaurantSerializer(closest).data)

    return Response({'error': 'יש לשלוח שם מסעדה או מיקום'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def pending_restaurants(request):
    pending = Restaurant.objects.filter(is_approved=False)
    return Response(RestaurantSerializer(pending, many=True).data)

@api_view(['POST'])
def approve_restaurant(request):
    restaurant_id = request.data.get('id')
    action = request.data.get('action')

    if not restaurant_id or action not in ['approve', 'reject']:
        return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        restaurant = Restaurant.objects.get(id=restaurant_id)
        if action == 'approve':
            restaurant.is_approved = True
            restaurant.save()
            return Response({'success': 'Restaurant approved successfully'})
        else:
            restaurant.delete()
            return Response({'success': 'Restaurant rejected and deleted successfully'})
    except Restaurant.DoesNotExist:
        return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def create_restaurant(request):
    data = request.data.copy()
    address = data.get('address')

    if address:
        lat, lng = get_lat_long_from_address(address)
        if lat and lng:
            data['latitude'] = lat
            data['longitude'] = lng
        else:
            return Response({'error': 'לא הצלחנו לקבל קואורדינטות מהכתובת'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = RestaurantSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)