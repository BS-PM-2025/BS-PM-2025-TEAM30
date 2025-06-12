
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Avg, Count, Q
from .models import Review
from .serializers import ReviewSerializer, ReviewSummarySerializer


@api_view(['POST'])
def create_review(request):
    """יצירת ביקורת חדשה"""
    serializer = ReviewSerializer(data=request.data)

    if serializer.is_valid():
        # בדיקה אם המשתמש כבר כתב ביקורת על המסעדה הזאת
        existing_review = Review.objects.filter(
            user_email=serializer.validated_data['user_email'],
            restaurant_name=serializer.validated_data['restaurant_name'],
            restaurant_lat=serializer.validated_data['restaurant_lat'],
            restaurant_lng=serializer.validated_data['restaurant_lng']
        ).first()

        if existing_review:
            return Response({
                'error': 'כבר כתבת ביקורת על המסעדה הזאת',
                'existing_review_id': existing_review.id
            }, status=status.HTTP_400_BAD_REQUEST)

        review = serializer.save()
        return Response({
            'message': '✅ הביקורת נשמרה בהצלחה!',
            'review': ReviewSerializer(review).data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_restaurant_reviews(request):
    """קבלת כל הביקורות של מסעדה ספציפית"""
    restaurant_name = request.GET.get('restaurant_name')
    restaurant_lat = request.GET.get('restaurant_lat')
    restaurant_lng = request.GET.get('restaurant_lng')

    if not all([restaurant_name, restaurant_lat, restaurant_lng]):
        return Response({
            'error': 'חסרים פרטי המסעדה (שם, קואורדינטות)'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        lat = float(restaurant_lat)
        lng = float(restaurant_lng)

        # חיפוש ביקורות עם טולרנס קטן בקואורדינטות
        lat_tolerance = 0.001  # כ-100 מטר
        lng_tolerance = 0.001

        reviews = Review.objects.filter(
            restaurant_name__icontains=restaurant_name,
            restaurant_lat__range=[lat - lat_tolerance, lat + lat_tolerance],
            restaurant_lng__range=[lng - lng_tolerance, lng + lng_tolerance],
            is_approved=True
        ).order_by('-created_at')

        # חישוב סטטיסטיקות
        total_reviews = reviews.count()
        if total_reviews > 0:
            average_rating = reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']

            # פילוח לפי דירוגים
            rating_breakdown = {}
            for i in range(1, 6):
                count = reviews.filter(rating=i).count()
                rating_breakdown[str(i)] = count
        else:
            average_rating = 0
            rating_breakdown = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}

        # ביקורות אחרונות (מקסימום 5)
        recent_reviews = reviews[:5]

        summary_data = {
            'restaurant_name': restaurant_name,
            'restaurant_lat': lat,
            'restaurant_lng': lng,
            'total_reviews': total_reviews,
            'average_rating': round(average_rating, 1) if average_rating else 0,
            'rating_breakdown': rating_breakdown,
            'recent_reviews': ReviewSerializer(recent_reviews, many=True).data
        }

        return Response(summary_data, status=status.HTTP_200_OK)

    except ValueError:
        return Response({
            'error': 'קואורדינטות לא תקינות'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_all_reviews(request):
    """קבלת כל הביקורות (עם חיפוש ופילטרים)"""
    search = request.GET.get('search', '')
    min_rating = request.GET.get('min_rating')
    user_email = request.GET.get('user_email')

    reviews = Review.objects.filter(is_approved=True)

    # סינון לפי חיפוש
    if search:
        reviews = reviews.filter(
            Q(restaurant_name__icontains=search) |
            Q(title__icontains=search) |
            Q(content__icontains=search)
        )

    # סינון לפי דירוג מינימלי
    if min_rating:
        try:
            reviews = reviews.filter(rating__gte=int(min_rating))
        except ValueError:
            pass

    # סינון לפי משתמש
    if user_email:
        reviews = reviews.filter(user_email=user_email)

    reviews = reviews.order_by('-created_at')

    # פגינציה פשוטה
    page_size = 10
    page = int(request.GET.get('page', 1))
    start = (page - 1) * page_size
    end = start + page_size

    total_count = reviews.count()
    reviews_page = reviews[start:end]

    return Response({
        'reviews': ReviewSerializer(reviews_page, many=True).data,
        'total_count': total_count,
        'page': page,
        'has_next': end < total_count
    }, status=status.HTTP_200_OK)


@api_view(['PUT'])
def update_review(request, review_id):
    """עדכון ביקורת קיימת"""
    try:
        review = Review.objects.get(id=review_id)

        # וידוא שהמשתמש מעדכן את הביקורת שלו
        user_email = request.data.get('user_email')
        if review.user_email != user_email:
            return Response({
                'error': 'אין לך הרשאה לערוך ביקורת זו'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = ReviewSerializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': '✅ הביקורת עודכנה בהצלחה!',
                'review': serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Review.DoesNotExist:
        return Response({
            'error': 'ביקורת לא נמצאה'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
def delete_review(request, review_id):
    """מחיקת ביקורת"""
    try:
        review = Review.objects.get(id=review_id)

        # וידוא שהמשתמש מוחק את הביקורת שלו
        user_email = request.data.get('user_email') or request.GET.get('user_email')
        if review.user_email != user_email:
            return Response({
                'error': 'אין לך הרשאה למחוק ביקורת זו'
            }, status=status.HTTP_403_FORBIDDEN)

        review.delete()
        return Response({
            'message': '✅ הביקורת נמחקה בהצלחה!'
        }, status=status.HTTP_200_OK)

    except Review.DoesNotExist:
        return Response({
            'error': 'ביקורת לא נמצאה'
        }, status=status.HTTP_404_NOT_FOUND)