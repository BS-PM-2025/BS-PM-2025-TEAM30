from outscraper import ApiClient
import os

api_client = ApiClient(api_key='YjRkNjQ4NTYxYzQ1NDc3YTliNjQxYTZlMDYwZGNlZDB8ZDQwNDViN2YxMA')  # ← שים כאן את ה־Key שלך

def fetch_popular_times(place_name):
    try:
        results = api_client.google_maps_search(
            place_name,
            limit=1,
            fields=['popular_times', 'current_popularity']
        )

        print("Outscraper response:", results)

        # תיקון: גישה למערך מקונן
        if not results or not results[0] or not isinstance(results[0][0], dict):
            return None

        place = results[0][0]

        return {
            "name": place.get("name"),
            "current_popularity": place.get("current_popularity"),
            "popular_times": place.get("popular_times"),
        }

    except Exception as e:
        print("שגיאה בשליפת עומס:", e)
        return None
