from rest_framework import serializers
from .models import SavedRestaurant

class SavedRestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedRestaurant
        fields = '__all__'
