from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from math import radians, cos, sin, sqrt, atan2, asin
import requests
from .restaurants.models import VisitedRestaurant
from rest_framework.decorators import api_view
from rest_framework.response import Response


def haversine(lat1, lon1, lat2, lon2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    return 6371 * c * 1000


@api_view(['POST'])
def add_visit(request):
    data = request.data
    email = data.get('email')
    name = data.get('restaurant_name')
    lat = data.get('lat')
    lng = data.get('lng')
    rating = data.get('rating')

    if not email or not name:
        return Response({'error': 'Missing data'}, status=400)

    VisitedRestaurant.objects.create(
        user_email=email,
        restaurant_name=name,
        latitude=lat,
        longitude=lng,
        rating=rating
    )
    return Response({'message': 'Visit saved!'})

@api_view(['POST'])
def remove_visit(request):
    data = request.data
    email = data.get('email')
    name = data.get('restaurant_name')

    if not email or not name:
        return Response({'error': 'Missing data'}, status=400)

    VisitedRestaurant.objects.filter(
        user_email=email,
        restaurant_name__icontains=name
    ).delete()

    return Response({'message': 'Visit removed'})

@csrf_exempt
def nearby_restaurants(request):
    try:
        lat = float(request.GET.get('lat'))
        lng = float(request.GET.get('lng'))
        radius = float(request.GET.get('radius', 0))
        place_type = request.GET.get('type', 'restaurant')
        search = request.GET.get('search', '').lower()
        email = request.GET.get('email', '')
        min_rating = float(request.GET.get('min_rating', 0))

        # שאילתת API רגילה (גוגל)
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            "location": f"{lat},{lng}",
            "radius": 3000,
            "type": place_type,
            "key": settings.REACT_APP_GOOGLE_MAPS_API_KEY
        }

        if search:
            params['keyword'] = search

        response = requests.get(url, params=params)
        data = response.json()

        results = []
        for place in data.get('results', []):
            name = place['name']
            lat2 = place['geometry']['location']['lat']
            lng2 = place['geometry']['location']['lng']
            rating = place.get('rating')
            distance = haversine(lat, lng, lat2, lng2)

            # דירוג
            if rating is None or float(rating) < min_rating:
                continue

            # חיפוש טקסט
            if search and search not in name.lower():
                continue

            # אם יש רדיוס - לסנן
            if radius and distance > radius:
                continue

            visited = False
            if email:
                visited = VisitedRestaurant.objects.filter(user_email=email, restaurant_name__icontains=name).exists()
                if email and request.GET.get("only_visited") == "true" and not visited:
                    continue

            results.append({
                "name": name,
                "lat": lat2,
                "lng": lng2,
                "rating": rating,
                "distance_in_meters": round(distance),
                "visited": visited
            })

        return JsonResponse(results, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)