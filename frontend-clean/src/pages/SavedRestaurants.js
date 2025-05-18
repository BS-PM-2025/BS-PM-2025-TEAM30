import React, { useEffect, useState } from 'react';
import './SavedRestaurants.css';

const SavedRestaurants = () => {
  const [saved, setSaved] = useState([]);
  const [error, setError] = useState('');
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/get-saved/?email=${email}`);
        const data = await res.json();
        if (res.ok) {
          setSaved(data);
        } else {
          setError(data.error || 'שגיאה בשליפת מסעדות');
        }
      } catch (err) {
        setError('בעיה בהתחברות לשרת');
      }
    };

    if (email) fetchSaved();
    else setError('משתמש לא מחובר');
  }, [email]);

  const handleNavigate = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="saved-container">
      <h2>🍽️ המסעדות ששמרת</h2>
      {error && <p className="error-msg">{error}</p>}
      {!error && saved.length === 0 && <p>אין מסעדות שמורות עדיין.</p>}
      <div className="cards">
        {saved.map((place, index) => (
          <div key={index} className="card">
            <h3>{place.name}</h3>
            <p>{place.address}</p>
            <button onClick={() => handleNavigate(place.lat, place.lng)}>
              📍 נווט למסעדה
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedRestaurants;
