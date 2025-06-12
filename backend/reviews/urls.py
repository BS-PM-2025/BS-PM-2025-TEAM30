from django.urls import path
from . import views

urlpatterns = [
    # יצירת ביקורת חדשה
    path('create/', views.create_review, name='create_review'),

    # קבלת ביקורות של מסעדה ספציפית
    path('restaurant/', views.get_restaurant_reviews, name='get_restaurant_reviews'),

    # קבלת כל הביקורות (עם חיפוש ופילטרים)
    path('all/', views.get_all_reviews, name='get_all_reviews'),

    # עדכון ביקורת
    path('update/<int:review_id>/', views.update_review, name='update_review'),

    # מחיקת ביקורת
    path('delete/<int:review_id>/', views.delete_review, name='delete_review'),

]