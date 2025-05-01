from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Restaurant
from .serializers import RestaurantSerializer
from math import radians, cos, sin, asin, sqrt

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * asin(sqrt(a))

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