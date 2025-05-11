import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './DetectRestaurant.css';

const DetectRestaurant = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const nameFromUrl = searchParams.get("name");
    if (nameFromUrl) {
      detectByName(nameFromUrl);
    }
  }, [searchParams]);

  const detectByLocation = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await fetch("http://localhost:8000/api/restaurants/detect/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setRestaurant(data);
          setError("");
        } else {
          setError(data.error || "שגיאה בזיהוי");
        }
      } catch (err) {
        setError("שגיאה בהתחברות לשרת");
      }
    });
  };

  const detectByName = async (name) => {
    try {
      const res = await fetch("http://localhost:8000/api/restaurants/detect/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setRestaurant(data);
        setError("");
      } else {
        setError(data.error || "שגיאה בזיהוי");
      }
    } catch (err) {
      setError("שגיאה בהתחברות לשרת");
    }
  };

  const promote = async () => {
    await fetch("http://localhost:8000/api/restaurants/promote/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: restaurant.id }),
    });
    alert("סומנה כמומלצת ✅");
  };

 return (
    <div
      className="detect-container"
      style={{
        backgroundImage: "url('/images/misshilla-menu-meatbar.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="detect-box">
        <h2 className="detect-title">📍 זיהוי מסעדה לפי מיקום או שם</h2>
        <div style={{ padding: "20px" }}>
          <h2>📍 זיהוי מסעדה לפי מיקום או מזהה</h2>

          <div className="detect-buttons">
            <button onClick={detectByLocation}>זהה לפי מיקום</button>
          </div>

          <div className="detect-input-group">
            <input
              type="text"
              placeholder="שם מסעדה"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
            />
            <button onClick={() => detectByName(restaurantName)}>זהה לפי שם</button>
          </div>

          {error && <p className="detect-error">{error}</p>}

          {restaurant && (
            <div className="restaurant-card fade-in">
              <h3>{restaurant.name}</h3>
              <p>{restaurant.description || "אין תיאור"}</p>
              <p>כתובת: {restaurant.address}</p>
              <button onClick={promote}>סמן כמומלצת ⭐</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetectRestaurant;