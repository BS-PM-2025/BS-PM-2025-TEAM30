# ✅ views.py – שליפת מסעדות עם חישוב מרחק וסינון
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from math import radians, cos, sin, sqrt, atan2
import requests
from .user.models import VisitedRestaurant

# חישוב מרחק בין נקודות (מטרים)
def calculate_distance(lat1, lng1, lat2, lng2):
    R = 6371000  # מטרים
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

@csrf_exempt
def nearby_restaurants(request):
    lat = float(request.GET.get('lat'))
    lng = float(request.GET.get('lng'))
    radius = float(request.GET.get('radius', 1000))
    place_type = request.GET.get('type', 'restaurant')
    search = request.GET.get('search', '').lower()
    email = request.GET.get('email')

    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": radius,
        "type": place_type,
        "key": settings.GOOGLE_MAPS_API_KEY
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
        dist = calculate_distance(lat, lng, lat2, lng2)

        if dist <= radius:
            visited = False
            if email:
                visited = VisitedRestaurant.objects.filter(user_email=email, restaurant_name__icontains=name).exists()

            results.append({
                "name": name,
                "lat": lat2,
                "lng": lng2,
                "rating": place.get('rating', None),
                "distance_in_meters": dist,
                "visited": visited
            })

    return JsonResponse(results, safe=False)
