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
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
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


@api_view(['GET'])
def pending_restaurants(request):
    pending = Restaurant.objects.filter(is_approved=False)
    return Response(RestaurantSerializer(pending, many=True).data)


@api_view(['POST'])
def approve_restaurant(request):
    restaurant_id = request.data.get('id')
    action = request.data.get('action')  # 'approve' or 'reject'

    if not restaurant_id or action not in ['approve', 'reject']:
        return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        restaurant = Restaurant.objects.get(id=restaurant_id)
        if action == 'approve':
            restaurant.is_approved = True
            restaurant.save()
            return Response({'success': 'Restaurant approved successfully'})
        else:  # reject
            restaurant.delete()
            return Response({'success': 'Restaurant rejected and deleted successfully'})
    except Restaurant.DoesNotExist:
        return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def reject_restaurant(request, pk):
    try:
        restaurant = Restaurant.objects.get(id=pk)
        restaurant.delete()
        return Response({'success': 'Restaurant rejected and deleted successfully'})
    except Restaurant.DoesNotExist:
        return Response({'error': 'Restaurant not found'}, status=status.HTTP_404_NOT_FOUND)