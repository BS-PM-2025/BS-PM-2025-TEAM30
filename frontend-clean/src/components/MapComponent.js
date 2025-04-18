// ✅ MapComponent.js – כולל שימוש ב-icon_color והצגת כרטיסים מתחת למפה
import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Circle } from '@react-google-maps/api';
import './MapComponent.css';

const containerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '12px',
  boxShadow: '0 0 15px rgba(0,0,0,0.2)'
};

const getPlaceTypeByHour = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return "cafe";
  if (hour >= 11 && hour < 17) return "meal_takeaway";
  return "restaurant";
};

const getPlaceLabel = (type) => {
  if (type === "cafe") return "בתי קפה";
  if (type === "meal_takeaway") return "אוכל מהיר";
  return "מסעדות רגילות";
};

const MapComponent = () => {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(1000);
  const [filterByHour, setFilterByHour] = useState(true);
  const [filterVisited, setFilterVisited] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  const userEmail = localStorage.getItem("userEmail");

  const fetchPlaces = (latitude, longitude) => {
    const type = filterByHour ? getPlaceTypeByHour() : 'restaurant';
    const query = new URLSearchParams({
      lat: latitude,
      lng: longitude,
      type,
      radius,
      search,
      min_rating: minRating
    });

    if (filterVisited && isLoggedIn && userEmail) {
      query.append('email', userEmail);
    }

    fetch(`http://localhost:8000/api/nearby/?${query.toString()}`)
      .then(res => res.json())
      .then(data => setPlaces(data))
      .catch(err => console.error("שגיאה ב-fetch:", err));
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        fetchPlaces(latitude, longitude);
      },
      (err) => console.error("שגיאה באיתור מיקום:", err)
    );
  }, [filterByHour, filterVisited, radius, minRating]);

  useEffect(() => {
    if (location) {
      fetchPlaces(location.lat, location.lng);
    }
  }, [search]);

  const currentTypeLabel = getPlaceLabel(filterByHour ? getPlaceTypeByHour() : 'restaurant');

  return (
    <div className="map-page">
      <div className="main-header">
        <div className="site-title">🍴 RouteBite</div>
        {isLoggedIn ? (
          <button className="profile-btn">👤</button>
        ) : (
          <button className="login-btn" onClick={() => window.location.href = '/login'}>התחבר</button>
        )}
      </div>

      <div className="content-wrapper">
        <div className="sidebar">
          <p>מציג כעת: <strong>{currentTypeLabel}</strong></p>

          <input
            type="text"
            placeholder="חפש מסעדה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="filters">
            <label><input type="checkbox" checked={filterByHour} onChange={() => setFilterByHour(!filterByHour)} /> לפי שעה</label>
            <label>
              <input
                type="checkbox"
                checked={filterVisited}
                onChange={() => {
                  if (!isLoggedIn) {
                    alert("כדי להציג מסעדות שביקרת בהן, עליך להתחבר.");
                    return;
                  }
                  setFilterVisited(!filterVisited);
                }}
              /> רק שביקרתי
            </label>
            <label>
              דירוג מינימלי:
              <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}>
                <option value={0}>ללא סינון</option>
                <option value={4}>⭐ 4+</option>
                <option value={4.5}>⭐ 4.5+</option>
                <option value={5}>⭐ 5 בלבד</option>
              </select>
            </label>
            <label>
              מרחק (מטרים):
              <select value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={2000}>2000</option>
                <option value={5000}>5000</option>
              </select>
            </label>
          </div>
        </div>

        <div className="map-wrapper">
          <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={location || { lat: 32.08, lng: 34.78 }}
              zoom={15}
            >
              {location && (
                <>
                  <Marker position={location} label="אתה כאן" />
                  <Circle
                    key={`radius-${radius}`}
                    center={location}
                    radius={radius}
                    options={{
                      fillColor: '#00bcd4',
                      fillOpacity: 0.1,
                      strokeColor: '#00838f',
                      strokeWeight: 2
                    }}
                  />
                </>
              )}
              {places.map((place, index) => (
                <Marker
                  key={index}
                  position={{ lat: place.lat, lng: place.lng }}
                  title={place.name}
                  icon={{
                    url: `http://maps.google.com/mapfiles/ms/icons/${place.icon_color}-dot.png`
                  }}
                />
              ))}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>

      <div className="results-section">
        <h3>תוצאות:</h3>
        <div className="results-grid">
          {places.map((place, index) => (
            <div key={index} className="place-card">
              <h4>{place.name}</h4>
              <p>⭐ {place.rating || 'N/A'}</p>
              <p>📏 {Math.round(place.distance_in_meters)} מטר</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
