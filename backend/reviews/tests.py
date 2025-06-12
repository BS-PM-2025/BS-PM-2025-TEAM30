from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Review


class ReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.restaurant_data = {
            "user_email": "test@example.com",
            "restaurant_name": "מסעדת הבדיקה",
            "restaurant_lat": 32.0853,
            "restaurant_lng": 34.7818,
            "rating": 5,
            "title": "מסעדה מעולה!",
            "content": "האוכל היה טעים מאוד והשירות מצוין. ממליץ בחום!",
            "tags": "טעים, מהיר, יקר"
        }

    def test_create_review_success(self):
        """בדיקת יצירת ביקורת מוצלחת"""
        response = self.client.post("/api/reviews/create/", self.restaurant_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "✅ הביקורת נשמרה בהצלחה!")
        self.assertEqual(Review.objects.count(), 1)

        review = Review.objects.first()
        self.assertEqual(review.user_email, "test@example.com")
        self.assertEqual(review.restaurant_name, "מסעדת הבדיקה")
        self.assertEqual(review.rating, 5)

    def test_create_duplicate_review_fails(self):
        """בדיקה שלא ניתן ליצור ביקורת כפולה"""
        # יצירת ביקורת ראשונה
        self.client.post("/api/reviews/create/", self.restaurant_data, format='json')

        # ניסיון יצירת ביקורת שנייה על אותה מסעדה
        response = self.client.post("/api/reviews/create/", self.restaurant_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "כבר כתבת ביקורת על המסעדה הזאת")
        self.assertEqual(Review.objects.count(), 1)

    def test_create_review_invalid_rating(self):
        """בדיקת יצירת ביקורת עם דירוג לא תקין"""
        invalid_data = self.restaurant_data.copy()
        invalid_data["rating"] = 6  # דירוג לא תקין

        response = self.client.post("/api/reviews/create/", invalid_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Review.objects.count(), 0)

    def test_create_review_short_content(self):
        """בדיקת יצירת ביקורת עם תוכן קצר מדי"""
        invalid_data = self.restaurant_data.copy()
        invalid_data["content"] = "קצר"  # תוכן קצר מדי

        response = self.client.post("/api/reviews/create/", invalid_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Review.objects.count(), 0)

    def test_get_restaurant_reviews_success(self):
        """בדיקת קבלת ביקורות של מסעדה"""
        # יצירת כמה ביקורות
        Review.objects.create(
            user_email="user1@example.com",
            restaurant_name="מסעדת הבדיקה",
            restaurant_lat=32.0853,
            restaurant_lng=34.7818,
            rating=5,
            content="ביקורת מעולה"
        )
        Review.objects.create(
            user_email="user2@example.com",
            restaurant_name="מסעדת הבדיקה",
            restaurant_lat=32.0853,
            restaurant_lng=34.7818,
            rating=4,
            content="ביקורת טובה"
        )

        params = {
            "restaurant_name": "מסעדת הבדיקה",
            "restaurant_lat": 32.0853,
            "restaurant_lng": 34.7818
        }

        response = self.client.get("/api/reviews/restaurant/", params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_reviews"], 2)
        self.assertEqual(response.data["average_rating"], 4.5)
        self.assertEqual(len(response.data["recent_reviews"]), 2)

    def test_get_restaurant_reviews_missing_params(self):
        """בדיקת קבלת ביקורות ללא פרמטרים נדרשים"""
        response = self.client.get("/api/reviews/restaurant/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "חסרים פרטי המסעדה (שם, קואורדינטות)")

    def test_update_review_success(self):
        """בדיקת עדכון ביקורת מוצלח"""
        review = Review.objects.create(
            user_email="test@example.com",
            restaurant_name="מסעדת הבדיקה",
            restaurant_lat=32.0853,
            restaurant_lng=34.7818,
            rating=4,
            content="ביקורת ראשונית"
        )

        update_data = {
            "user_email": "test@example.com",
            "rating": 5,
            "content": "ביקורת מעודכנת - עכשיו זה מעולה!"
        }

        response = self.client.put(f"/api/reviews/update/{review.id}/", update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "✅ הביקורת עודכנה בהצלחה!")

        review.refresh_from_db()
        self.assertEqual(review.rating, 5)
        self.assertEqual(review.content, "ביקורת מעודכנת - עכשיו זה מעולה!")

    def test_update_review_unauthorized(self):
        """בדיקת עדכון ביקורת של משתמש אחר"""
        review = Review.objects.create(
            user_email="other@example.com",
            restaurant_name="מסעדת הבדיקה",
            restaurant_lat=32.0853,
            restaurant_lng=34.7818,
            rating=4,
            content="ביקורת של משתמש אחר"
        )

        update_data = {
            "user_email": "test@example.com",  # משתמש שונה
            "rating": 5,
            "content": "ניסיון עדכון לא מורשה"
        }

        response = self.client.put(f"/api/reviews/update/{review.id}/", update_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "אין לך הרשאה לערוך ביקורת זו")

    def test_delete_review_success(self):
        """בדיקת מחיקת ביקורת מוצלחת"""
        review = Review.objects.create(
            user_email="test@example.com",
            restaurant_name="מסעדת הבדיקה",
            restaurant_lat=32.0853,
            restaurant_lng=34.7818,
            rating=4,
            content="ביקורת למחיקה"
        )

        response = self.client.delete(
            f"/api/reviews/delete/{review.id}/",
            {"user_email": "test@example.com"},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "✅ הביקורת נמחקה בהצלחה!")
        self.assertEqual(Review.objects.count(), 0)

    def test_delete_review_unauthorized(self):
        """בדיקת מחיקת ביקורת של משתמש אחר"""
        review = Review.objects.create(
            user_email="other@example.com",
            restaurant_name="מסעדת הבדיקה",
            restaurant_lat=32.0853,
            restaurant_lng=34.7818,
            rating=4,
            content="ביקורת של משתמש אחר"
        )

        response = self.client.delete(
            f"/api/reviews/delete/{review.id}/",
            {"user_email": "test@example.com"},  # משתמש שונה
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "אין לך הרשאה למחוק ביקורת זו")
        self.assertEqual(Review.objects.count(), 1)

    def test_get_all_reviews_with_filters(self):
        """בדיקת קבלת כל הביקורות עם פילטרים"""
        # יצירת ביקורות שונות
        Review.objects.create(
            user_email="user1@example.com",
            restaurant_name="פיצריה רומא",
            restaurant_lat=32.0853,
            restaurant_lng=34.7818,
            rating=5,
            content="פיצה מעולה!"
        )
        Review.objects.create(
            user_email="user2@example.com",
            restaurant_name="המבורגריה טובה",
            restaurant_lat=32.0854,
            restaurant_lng=34.7819,
            rating=3,
            content="המבורגר בסדר"
        )

        # חיפוש לפי מילת מפתח
        response = self.client.get("/api/reviews/all/", {"search": "פיצה"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["reviews"]), 1)
        self.assertEqual(response.data["reviews"][0]["restaurant_name"], "פיצריה רומא")

        # פילטר לפי דירוג מינימלי
        response = self.client.get("/api/reviews/all/", {"min_rating": 4})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["reviews"]), 1)
        self.assertEqual(response.data["reviews"][0]["rating"], 5)

    def test_review_model_properties(self):
        """בדיקת המאפיינים של מודל הביקורת"""
        review = Review.objects.create(
            user_email="test@example.com",
            restaurant_name="מסעדת הבדיקה",
            restaurant_lat=32.0853,
            restaurant_lng=34.7818,
            rating=4,
            content="ביקורת לבדיקה"
        )

        # בדיקת user_first_name property
        self.assertEqual(review.user_first_name, "test")

        # בדיקת stars_display property
        self.assertEqual(review.stars_display, "⭐⭐⭐⭐☆")

        # בדיקת __str__ method
        self.assertEqual(str(review), "test@example.com - מסעדת הבדיקה (4⭐)")

    def test_review_rating_breakdown(self):
        """בדיקת פילוח הדירוגים"""
        restaurant_name = "מסעדה לבדיקה"
        lat, lng = 32.0853, 34.7818

        # יצירת ביקורות עם דירוגים שונים
        ratings = [5, 5, 4, 4, 3, 2, 1]
        for i, rating in enumerate(ratings):
            Review.objects.create(
                user_email=f"user{i}@example.com",
                restaurant_name=restaurant_name,
                restaurant_lat=lat,
                restaurant_lng=lng,
                rating=rating,
                content=f"ביקורת מספר {i + 1}"
            )

        params = {
            "restaurant_name": restaurant_name,
            "restaurant_lat": lat,
            "restaurant_lng": lng
        }

        response = self.client.get("/api/reviews/restaurant/", params)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_reviews"], 7)

        # בדיקת פילוח הדירוגים
        breakdown = response.data["rating_breakdown"]
        self.assertEqual(breakdown["5"], 2)  # שתי ביקורות של 5 כוכבים
        self.assertEqual(breakdown["4"], 2)  # שתי ביקורות של 4 כוכבים
        self.assertEqual(breakdown["3"], 1)  # ביקורת אחת של 3 כוכבים
        self.assertEqual(breakdown["2"], 1)  # ביקורת אחת של 2 כוכבים
        self.assertEqual(breakdown["1"], 1)  # ביקורת אחת של 1 כוכב

        # בדיקת הממוצע (5+5+4+4+3+2+1)/7 = 24/7 ≈ 3.4
        self.assertAlmostEqual(response.data["average_rating"], 3.4, places=1)