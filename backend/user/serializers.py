# backend/user/serializers.py - הוספה לקובץ הקיים

import rest_framework.serializers as serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserPreferencesSerializer(serializers.ModelSerializer):
    """Serializer להעדפות משתמש"""
    preferred_food_types_list = serializers.SerializerMethodField()
    current_meal_preference = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'email',
            'first_name',
            'last_name',
            'preferred_breakfast_time',
            'preferred_lunch_time',
            'preferred_dinner_time',
            'preferred_food_types',
            'preferred_food_types_list',
            'max_distance_preference',
            'min_rating_preference',
            'current_meal_preference'
        ]
        read_only_fields = ['email', 'first_name', 'last_name']

    def get_preferred_food_types_list(self, obj):
        """מחזיר את סוגי האוכל המועדפים כרשימה"""
        return obj.get_preferred_food_types()

    def get_current_meal_preference(self, obj):
        """מחזיר את ההעדפה הנוכחית לפי השעה"""
        meal_type, preferred_time = obj.get_current_meal_preference()
        return {
            'meal_type': meal_type,
            'preferred_time': preferred_time.strftime('%H:%M') if preferred_time else None
        }