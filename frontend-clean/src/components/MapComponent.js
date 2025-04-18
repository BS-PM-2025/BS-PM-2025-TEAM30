import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
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

const MapComponent = () => {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(1000);
  const [filterByHour, setFilterByHour] = useState(true);
  const [filterVisited, setFilterVisited] = useState(false);

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
    });

    if (filterVisited && isLoggedIn && userEmail) {
      query.append('email', userEmail);
    }

    fetch(`http://localhost:8000/api/nearby/?${query.toString()}`)
      .then(res => res.json())
      .then(data => setPlaces(data));
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        fetchPlaces(latitude, longitude);
      },
      (err) => console.error("Error getting location:", err)
    );
  }, [filterByHour, filterVisited, radius]);

  useEffect(() => {
    if (location) {
      fetchPlaces(location.lat, location.lng);
    }
  }, [search]);

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
          <input
            type="text"
            placeholder="חפש מסעדה..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="filters">
            <label><input type="checkbox" checked={filterByHour} onChange={() => setFilterByHour(!filterByHour)} /> לפי שעה</label>
            {isLoggedIn && <label><input type="checkbox" checked={filterVisited} onChange={() => setFilterVisited(!filterVisited)} /> רק שביקרתי</label>}
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

          <div className="places-list">
            {places.map((place, index) => (
              <div key={index} className="place-item">
                <strong>{place.name}</strong><br />
                ⭐ {place.rating || 'N/A'}<br />
                📏 {Math.round(place.distance_in_meters)} מטר
              </div>
            ))}
          </div>
        </div>

        <div className="map-wrapper">
          <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={location || { lat: 32.08, lng: 34.78 }}
              zoom={15}
            >
              {location && <Marker position={location} label="אתה כאן" />}
              {places.map((place, index) => (
                <Marker key={index} position={{ lat: place.lat, lng: place.lng }} title={place.name} />
              ))}
            </GoogleMap>
          </LoadScript>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
