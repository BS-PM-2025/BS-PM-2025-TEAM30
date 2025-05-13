from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import SavedRestaurant
from .serializers import SavedRestaurantSerializer

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
