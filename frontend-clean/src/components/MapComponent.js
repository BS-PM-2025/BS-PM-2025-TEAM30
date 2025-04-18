import React, { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import './MapComponent.css';

const containerStyle = {
  width: '50%',
  height: '500px',
  margin: 'auto',
  borderRadius: '20px',
  boxShadow: '0 0 25px rgba(0,0,0,0.15)'
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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const type = getPlaceTypeByHour();

        setLocation({ lat: latitude, lng: longitude });

        fetch(`http://localhost:8000/api/nearby/?lat=${latitude}&lng=${longitude}&type=${type}`)
          .then(res => res.json())
          .then(data => setPlaces(data));
      },
      (err) => console.error("Error getting location:", err)
    );
  }, []);

  return (
    <>
      <div className="main-header">
        <div className="site-title">🍴 RouteBite</div>
        {localStorage.getItem("loggedIn") === "true" ? (
          <button className="profile-btn">👤</button>
        ) : (
          <button className="login-btn" onClick={() => window.location.href = '/login'}>התחבר</button>
        )}
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="חפש מסעדה..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="map-wrapper">
        <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={location || { lat: 32.08, lng: 34.78 }}
            zoom={15}
          >
            {location && <Marker position={location} label="אתה כאן" />}
            {places
              .filter(p => p.name.includes(search))
              .map((place, index) => (
                <Marker
                  key={index}
                  position={{ lat: place.lat, lng: place.lng }}
                  title={place.name}
                />
              ))}
          </GoogleMap>
        </LoadScript>
      </div>
    </>
  );
};

export default MapComponent;
