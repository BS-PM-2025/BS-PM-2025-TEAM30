import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const DetectRestaurant = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [error, setError] = useState("");
  const [manualId, setManualId] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) {
      detectById(idFromUrl);
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

  const detectById = async (id) => {
    try {
      const res = await fetch("http://localhost:8000/api/restaurants/detect/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
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
    <div style={{ padding: "20px" }}>
      <h2>📍 זיהוי מסעדה לפי מיקום או מזהה</h2>

      <button onClick={detectByLocation}>זהה לפי מיקום</button>

      <div style={{ marginTop: "10px" }}>
        <input
          type="number"
          placeholder="מזהה מסעדה"
          value={manualId}
          onChange={(e) => setManualId(e.target.value)}
        />
        <button onClick={() => detectById(manualId)}>זהה לפי מזהה</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {restaurant && (
        <div style={{ border: "1px solid gray", padding: "10px", marginTop: "20px" }}>
          <h3>{restaurant.name}</h3>
          <p>{restaurant.description || "אין תיאור"}</p>
          <p>כתובת: {restaurant.address}</p>
          <button onClick={promote}>סמן כמומלצת ⭐</button>
        </div>
      )}
    </div>
  );
};

export default DetectRestaurant;