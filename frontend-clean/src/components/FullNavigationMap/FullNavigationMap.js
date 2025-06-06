// FullNavigationMap.js - פריסה צד אל צד
import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import './FullNavigationMap.css';

const libraries = ['places'];

// מפה קטנה יותר בצד שמאל
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const FullNavigationMap = ({
  origin,
  destination,
  restaurantName,
  onClose
}) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8',
    libraries,
  });

  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);

  const mapRef = useRef(null);

  // קבלת הוראות נסיעה מפורטות מגוגל
  useEffect(() => {
    if (!isLoaded || !origin || !destination) return;

    const fetchDetailedDirections = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('🚀 מבקש הוראות מפורטות מגוגל...');

        const directionsService = new window.google.maps.DirectionsService();

        const request = {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
          region: 'IL',
          language: 'he',
          avoidHighways: false,
          avoidTolls: false,
          provideRouteAlternatives: false
        };

        directionsService.route(request, (result, status) => {
          console.log('📍 תשובה מגוגל:', status, result);

          if (status === 'OK' && result) {
            setDirections(result);

            const route = result.routes[0];
            const leg = route.legs[0];

            setRouteInfo({
              totalDistance: leg.distance.text,
              totalDuration: leg.duration.text,
              startAddress: leg.start_address,
              endAddress: leg.end_address,
              steps: leg.steps
            });

            console.log('✅ הוראות התקבלו:', {
              steps: leg.steps.length,
              distance: leg.distance.text,
              duration: leg.duration.text
            });

            if (mapRef.current) {
              mapRef.current.fitBounds(route.bounds);
            }
          } else {
            console.error('❌ שגיאה בקבלת הוראות:', status);
            setError(`שגיאה בקבלת הוראות נסיעה: ${status}`);
          }
          setLoading(false);
        });

      } catch (err) {
        console.error('💥 שגיאה כללית:', err);
        setError('שגיאה בחיבור לשירות המפות');
        setLoading(false);
      }
    };

    fetchDetailedDirections();
  }, [isLoaded, origin, destination]);

  // פתיחה במפות גוגל לניווט אמיתי
  const openGoogleMapsNavigation = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving&hl=he`;
    window.open(url, '_blank');
  };

  // קבלת אייקון לפי סוג ההוראה
  const getInstructionIcon = (instruction) => {
    if (!instruction) return '📍';

    const text = instruction.toLowerCase();

    if (text.includes('turn-right') || text.includes('ימינה')) return '➡️';
    if (text.includes('turn-left') || text.includes('שמאלה')) return '⬅️';
    if (text.includes('straight') || text.includes('ישר')) return '⬆️';
    if (text.includes('slight-right')) return '↗️';
    if (text.includes('slight-left')) return '↖️';
    if (text.includes('roundabout')) return '🔄';
    if (text.includes('merge')) return '🔀';
    if (text.includes('fork')) return '🍴';
    if (text.includes('ferry')) return '⛴️';
    if (text.includes('destination')) return '🎯';

    return '📍';
  };

  const formatDistance = (distance) => {
    if (!distance) return '';
    return distance.text || distance;
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    return duration.text || duration;
  };

  if (loading) {
    return (
      <div className="navigation-loading">
        <div className="loading-spinner"></div>
        <h2>🗺️ טוען הוראות נסיעה</h2>
        <p>מקבל הוראות מדויקות מגוגל מפות...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="navigation-error">
        <h2>❌ שגיאה</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={openGoogleMapsNavigation} className="google-maps-btn">
            🗺️ פתח במפות גוגל
          </button>
          <button onClick={onClose} className="close-btn">סגור</button>
        </div>
      </div>
    );
  }

  return (
    <div className="full-navigation-container">
      {/* כותרת עליונה */}
      <div className="navigation-header">
        <div className="nav-info">
          <h2>🧭 נסיעה ל{restaurantName}</h2>
          {routeInfo && (
            <div className="route-stats">
              <span>📏 {routeInfo.totalDistance}</span>
              <span>⏱️ {routeInfo.totalDuration}</span>
              <span>🛣️ {routeInfo.steps.length} שלבים</span>
            </div>
          )}
        </div>

        <div className="nav-controls">
          <button onClick={openGoogleMapsNavigation} className="start-navigation-btn">
            🚗 התחל ניווט בגוגל מפות
          </button>
          <button onClick={onClose} className="close-nav-btn">✕</button>
        </div>
      </div>

      {/* תוכן ראשי - צד אל צד */}
      <div className="navigation-content">
        {/* מפה בצד שמאל */}
        <div className="map-section">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={origin}
            zoom={13}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false
            }}
          >
            <Marker
              position={origin}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
                    <circle cx="10" cy="10" r="3" fill="white"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20),
              }}
              title="המיקום שלך"
            />

            <Marker
              position={destination}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="#EA4335"/>
                    <circle cx="15" cy="15" r="8" fill="white"/>
                    <text x="15" y="20" text-anchor="middle" fill="#EA4335" font-size="12" font-weight="bold">🍽️</text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(30, 40),
              }}
              title={restaurantName}
            />

            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#4285F4',
                    strokeWeight: 6,
                    strokeOpacity: 0.9,
                  },
                }}
              />
            )}
          </GoogleMap>
        </div>

        {/* הוראות בצד ימין */}
        <div className="directions-section">
          {routeInfo && routeInfo.steps && (
            <>
              <div className="directions-header-sidebar">
                <h3>📋 הוראות נסיעה</h3>
                <div className="total-info-sidebar">
                  <div className="total-distance-sidebar">📏 {routeInfo.totalDistance}</div>
                  <div className="total-duration-sidebar">⏱️ {routeInfo.totalDuration}</div>
                </div>
              </div>



              <div className="steps-container-sidebar">
                {routeInfo.steps.map((step, index) => (
                  <div key={index} className="direction-step-sidebar">
                    <div className="step-number-sidebar">{index + 1}</div>

                    <div className="step-icon-sidebar">
                      {getInstructionIcon(step.maneuver)}
                    </div>

                    <div className="step-content-sidebar">
                      <div
                        className="instruction-text-sidebar"
                        dangerouslySetInnerHTML={{
                          __html: step.instructions || step.html_instructions
                        }}
                      />

                      <div className="step-details-sidebar">
                        <span className="step-distance-sidebar">📏 {formatDistance(step.distance)}</span>
                        <span className="step-duration-sidebar">⏱️ {formatDuration(step.duration)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* כפתור ניווט תחתון */}
              <div className="navigation-action-bottom">
                <button
                  onClick={openGoogleMapsNavigation}
                  className="main-navigation-btn-sidebar"
                >
                  🗺️ התחל ניווט במפות גוגל
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullNavigationMap;