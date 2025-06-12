
from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_first_name = serializers.ReadOnlyField()
    stars_display = serializers.ReadOnlyField()
    created_at_hebrew = serializers.ReadOnlyField()

    class Meta:
        model = Review
        fields = [
            'id', 'user_email', 'user_first_name', 'restaurant_name',
            'restaurant_lat', 'restaurant_lng', 'rating', 'title',
            'content', 'created_at', 'created_at_hebrew', 'stars_display',
            'tags', 'is_approved'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_rating(self, value):
        """וידוא שהדירוג בין 1-5"""
        if not 1 <= value <= 5:
            raise serializers.ValidationError("הדירוג חייב להיות בין 1 ל-5 כוכבים")
        return value

    def validate_content(self, value):
        """וידוא שהביקורת לא ריקה ולא קצרה מדי"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("הביקורת חייבת להכיל לפחות 10 תווים")
        return value.strip()


class ReviewSummarySerializer(serializers.Serializer):
    """סיריאלייזר לסיכום ביקורות של מסעדה"""
    restaurant_name = serializers.CharField()
    restaurant_lat = serializers.FloatField()
    restaurant_lng = serializers.FloatField()
    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()
    rating_breakdown = serializers.DictField()  # כמה ביקורות מכל דירוג (1-5)
    recent_reviews = ReviewSerializer(many=True)