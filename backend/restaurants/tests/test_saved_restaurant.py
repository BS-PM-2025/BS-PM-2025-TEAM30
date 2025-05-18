from django.test import TestCase
from rest_framework.test import APIClient
from backend.restaurants.models import SavedRestaurant

class SavedRestaurantTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.email = "test@example.com"
        self.restaurant_data = {
            "user_email": self.email,
            "name": "Falafel Hakosem",
            "lat": 32.0758,
            "lng": 34.7864,
            "address": "Shlomo HaMelech St 1, Tel Aviv"
        }

    def test_save_restaurant_success(self):
        response = self.client.post("/api/save-restaurant/", self.restaurant_data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "✅ נשמר בהצלחה")
        self.assertEqual(SavedRestaurant.objects.count(), 1)

    def test_prevent_duplicate_restaurant(self):
        self.client.post("/api/save-restaurant/", self.restaurant_data, format='json')
        response = self.client.post("/api/save-restaurant/", self.restaurant_data, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["message"], "⚠️ כבר שמור אצלך")
        self.assertEqual(SavedRestaurant.objects.count(), 1)

    def test_save_missing_field_fails(self):
        invalid_data = self.restaurant_data.copy()
        invalid_data.pop("name")
        response = self.client.post("/api/save-restaurant/", invalid_data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    def test_get_saved_restaurants_by_email(self):
        SavedRestaurant.objects.create(**self.restaurant_data)
        response = self.client.get(f"/api/get-saved/?email={self.email}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], self.restaurant_data["name"])

    def test_get_saved_restaurants_with_no_matches(self):
        response = self.client.get("/api/get-saved/?email=someone@else.com")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 0)

    def test_get_saved_restaurants_without_email_fails(self):
        response = self.client.get("/api/get-saved/")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.data)
