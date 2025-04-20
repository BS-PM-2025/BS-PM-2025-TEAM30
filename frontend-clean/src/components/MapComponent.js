// 📁 MapComponent.js - גרסה מתוקנת עם טיפול בשגיאת GPS, קלט ידני, בחירת יעד
import React, { useEffect, useState, useRef } from 'react';
import './MapComponent.css';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const getTimeBasedPlaceType = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'cafe';
  if (hour >= 12 && hour < 18) return 'meal_takeaway';
  return 'bar';
};

const MapComponent = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8',
    libraries,
  });

  const [places, setPlaces] = useState([]);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(1000); // ברירת מחדל אם יש טבעת
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState(0);
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [showCircle, setShowCircle] = useState(false);
  const [useTimeFilter, setUseTimeFilter] = useState(true);
  const [manualAddress, setManualAddress] = useState('');
  const [destination, setDestination] = useState('');
  const [gpsFailed, setGpsFailed] = useState(false);

  const mapRef = useRef(null);
  const onMapLoad = (map) => {
    mapRef.current = map;
    if (location) map.panTo(location);
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const userLocation = { lat: latitude, lng: longitude };
        setLocation(userLocation);
        if (mapRef.current) mapRef.current.panTo(userLocation);
      },
      () => setGpsFailed(true)
    );
  }, []);

  useEffect(() => {
    if (location && (radius || !showCircle)) fetchPlaces();
  }, [location, radius, search, rating, onlyVisited, useTimeFilter, showCircle]);

  const fetchPlaces = async () => {
    try {
      const email = localStorage.getItem('userEmail');
      const type = useTimeFilter ? getTimeBasedPlaceType() : 'restaurant';
      const query = new URLSearchParams({
        lat: location.lat,
        lng: location.lng,
        radius: radius || 1000,
        search,
        min_rating: rating,
        type,
        email: onlyVisited ? email : ''
      }).toString();

      const response = await fetch(`http://localhost:8000/api/nearby/?${query}`);
      const data = await response.json();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('⚠️ Error:', err);
    }
  };

  const geocodeAddress = async (address, callback) => {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8`);
      const data = await res.json();
      const coords = data.results[0]?.geometry.location;
      if (coords) callback({ lat: coords.lat, lng: coords.lng });
    } catch (err) {
      alert('שגיאה בהמרת כתובת למיקום');
    }
  };

  const handleManualSubmit = () => {
    geocodeAddress(manualAddress, (coords) => {
      setLocation(coords);
      if (mapRef.current) mapRef.current.panTo(coords);
    });
  };

  const handleDestinationSearch = () => {
    geocodeAddress(destination, (coords) => {
      if (mapRef.current) mapRef.current.panTo(coords);
    });
  };

  if (!isLoaded) return <div>טוען מפה...</div>;

  if (!location && gpsFailed) {
    return (
      <div className="manual-location">
        <h2>הזן מיקום ידני</h2>
        <input
          type="text"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="הכנס כתובת (למשל באר שבע)"
        />
        <button onClick={handleManualSubmit}>אישור</button>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
  <h1 className="logo">🍴 RouteBite</h1>
  <button
    className="login-button"
    onClick={() => {
      localStorage.removeItem('userEmail');
      window.location.href = '/';
    }}
  >
    התנתק
  </button>
</header>


      <div className="content">
        <aside className="sidebar">
          <input
            type="text"
            placeholder="חפש מסעדה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="לאן תרצה להגיע?"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <button onClick={handleDestinationSearch}>חפש יעד</button>

          <label>
            <input
              type="checkbox"
              checked={onlyVisited}
              onChange={(e) => setOnlyVisited(e.target.checked)}
            />
            רק שביקרתי
          </label>
          <label>
            <input
              type="checkbox"
              checked={useTimeFilter}
              onChange={(e) => setUseTimeFilter(e.target.checked)}
            />
            מיון לפי שעה
          </label>
          <label>
            דירוג מינימלי:
            <select onChange={(e) => setRating(e.target.value)}>
              <option value="0">ללא סינון</option>
              <option value="4">4+</option>
              <option value="4.5">4.5+</option>
              <option value="5">5 בלבד</option>
            </select>
          </label>
          <label>
            מרחק:
            <select value={radius || ''} onChange={(e) => setRadius(parseInt(e.target.value))}>
              <option value="">בחר רדיוס</option>
              <option value="500">500 מטר</option>
              <option value="1000">1000 מטר</option>
              <option value="1500">1500 מטר</option>
              <option value="2000">2000 מטר</option>
              <option value="3000">3000 מטר</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={showCircle}
              onChange={() => setShowCircle(!showCircle)}
            />
            הצג טבעת רדיוס
          </label>
        </aside>

        <main className="map-container">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={location}
            zoom={15}
            onLoad={onMapLoad}
          >
            <Marker position={location} label="אתה כאן" />
            {showCircle && radius && (
              <Circle
                center={location}
                radius={radius}
                options={{ fillColor: '#90caf9', strokeColor: '#1976d2' }}
              />
            )}
            {places.map((place, i) => (
              <Marker
                key={i}
                position={{ lat: place.lat, lng: place.lng }}
                label={place.name}
              />
            ))}
          </GoogleMap>

          <div className="results">
            <h3>תוצאות:</h3>
            {places.length === 0 ? (
              <p>לא נמצאו מסעדות.</p>
            ) : (
              <div className="cards">
                {places.map((place, i) => (
                  <div key={i} className="card">
                    <h4>{place.name}</h4>
                    <p>דירוג: {place.rating || 'אין'}</p>
                    <p>מרחק: {Math.round(place.distance_in_meters)} מטר</p>
                    {place.visited && <p className="visited">✅ ביקרת כאן</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MapComponent;
