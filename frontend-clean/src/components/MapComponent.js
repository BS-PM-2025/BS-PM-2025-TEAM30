// 📁 MapComponent.js - גרסה מתוקנת עם טיפול בשגיאת GPS, קלט ידני, בחירת יעד
import React, { useEffect, useState, useRef } from 'react';
import './MapComponent.css';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '400px',
};


const fetchPopularData = async (placeName, callback) => {
  // 👇 השבתת Outscraper זמנית כדי לא לבזבז קרדיט
  //לא למחוק שמתי את זה בנתיים בהערה כדי שלא ייגמרו השימושים !!!!!!!!!!!!!!!!!!!!!!!!!!!
  // try {
  //   const res = await fetch(`http://localhost:8000/api/load/?name=${encodeURIComponent(placeName)}`);
  //   const data = await res.json();
  //   if (res.ok) {
  //     callback({ ...data, is_fake: false }); // נתון אמיתי
  //   } else {
  //     callback({ popular_times: generateBackupPopularity() });
  //   }
  // } catch (err) {
  //   console.error("שגיאה בשליפת עומס:", err);
  //   callback({ popular_times: generateBackupPopularity() }); //
  // }

  //  שימוש זמני בנתונים מדומים
  callback({ popular_times: generateBackupPopularity() });
};



const generateBackupPopularity = () => {
  const fakeDay = {
    day: 1,
    day_text: 'Monday',
    popular_times: []
  };

  for (let hour = 6; hour <= 24; hour++) {
    let percent;

    if (hour < 10) {
      percent = Math.floor(Math.random() * 5);
    } else if (hour >= 10 && hour < 12) {
      percent = Math.floor(5 + Math.random() * 10);
    } else if (hour >= 12 && hour < 15) {
      percent = Math.floor(15 + Math.random() * 20);
    } else if (hour >= 15 && hour < 18) {
      percent = Math.floor(20 + Math.random() * 30);
    } else if (hour >= 18 && hour <= 22) {
      percent = Math.floor(50 + Math.random() * 30);
    } else {
      percent = Math.floor(20 + Math.random() * 20);
    }

    fakeDay.popular_times.push({
      hour: hour === 24 ? 0 : hour,
      percentage: percent,
      title: '',
      time: `${hour === 24 ? '00' : hour}:00`
    });
  }

  return [fakeDay];
};



const getTimeBasedPlaceType = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'cafe';
  if (hour >= 12 && hour < 18) return 'meal_takeaway';
  return 'bar';
};

const getAddressFromCoords = async (lat, lng) => {
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8`);
    const data = await res.json();
    return data.results?.[0]?.formatted_address || '';
  } catch (err) {
    console.error('שגיאה בהבאת כתובת', err);
    return '';
  }
};
// הזזת הפונקציה הנה לתוך הקומפוננטה




const MapComponent = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: 'AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8',
    libraries,
  });

  const [loadLevelFilter, setLoadLevelFilter] = useState('');
  const [places, setPlaces] = useState([]);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(1000);
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState(0);
  const [onlyVisited, setOnlyVisited] = useState(false);
  const [showCircle, setShowCircle] = useState(false);
  const [useTimeFilter, setUseTimeFilter] = useState(true);
  const [manualAddress, setManualAddress] = useState('');
  const [destination, setDestination] = useState('');
  const [gpsFailed, setGpsFailed] = useState(false);
  const [popularityData, setPopularityData] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [recommendedRestaurant, setRecommendedRestaurant] = useState(null);
  const [showRecommendation, setShowRecommendation] = useState(true);


  const mapRef = useRef(null);
  const circleRef = useRef(null);

  const handleSave = async (place) => {
    console.log('handleSave נקרא עבור:', place.name);
    const email = localStorage.getItem('userEmail');
    const address = await getAddressFromCoords(place.lat, place.lng);

    if (email) {
      try {
        console.log('שומר מסעדה עבור משתמש מחובר:', email);
        const res = await fetch("http://localhost:8000/api/save-restaurant/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: email,
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            address: address
          })
        });

        const data = await res.json();
        alert(data.message || 'נשמר');
      } catch (err) {
        console.error('שגיאה בשמירת מסעדה:', err);
        alert('שגיאה בשמירת המסעדה');
      }
    } else {
      console.log('משתמש לא מחובר, מציג הודעת התחברות');
      setShowLoginMessage(true);
    }
  };

  const onMapLoad = (map) => {
    mapRef.current = map;
    if (location) map.panTo(location);
  };

  const findBestRestaurantForCurrentTime = (restaurants) => {
    if (!restaurants || restaurants.length === 0) return null;

    // מיון המסעדות לפי דירוג (מהגבוה לנמוך)
    const sortedByRating = [...restaurants].sort((a, b) => {
      // אם אין דירוג, הדירוג יהיה 0
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });

    const currentHour = new Date().getHours();

    // פילטור לפי סוג מסעדה מתאים לשעה
    let bestMatch = null;

    // בוקר: בתי קפה (עד 12)
    if (currentHour < 12) {
      bestMatch = sortedByRating.find(r =>
        r.name.includes('קפה') ||
        r.name.toLowerCase().includes('cafe') ||
        r.name.toLowerCase().includes('coffee')
      );
    }
    // צהריים: מסעדות רגילות (12-18)
    else if (currentHour >= 12 && currentHour < 18) {
      bestMatch = sortedByRating.find(r =>
        !r.name.toLowerCase().includes('bar') &&
        !r.name.toLowerCase().includes('פאב')
      );
    }
    // ערב: ברים ומסעדות ערב (18 ומעלה)
    else {
      bestMatch = sortedByRating.find(r =>
        r.name.toLowerCase().includes('bar') ||
        r.name.toLowerCase().includes('פאב') ||
        r.rating >= 4.0
      );
    }

    // אם לא נמצאה התאמה, נחזיר את המסעדה עם הדירוג הגבוה ביותר
    return bestMatch || sortedByRating[0];
  };


  useEffect(() => {
    // בדיקה אם המשתמש מחובר
    const email = localStorage.getItem('userEmail');
    console.log('בדיקת התחברות:', email ? 'מחובר' : 'לא מחובר');
    setIsLoggedIn(!!email);

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

  // כל פעם שהמרכיב מתרנדר, נבדוק אם המשתמש עדיין מחובר
  useEffect(() => {
    const checkLoginStatus = () => {
      const email = localStorage.getItem('userEmail');
      setIsLoggedIn(!!email);
    };

    // בדוק בכל פעם שהעמוד מקבל פוקוס
    window.addEventListener('focus', checkLoginStatus);

    // ניקוי האזנה בעת עזיבת הקומפוננטה
    return () => {
      window.removeEventListener('focus', checkLoginStatus);
    };
  }, []);

  useEffect(() => {
    if (places && places.length > 0) {
      const recommended = findBestRestaurantForCurrentTime(places);
      setRecommendedRestaurant(recommended);
    }
  }, [places]);

  useEffect(() => {
    if (location && (radius || !showCircle)) fetchPlaces();
  }, [location, radius, search, rating, onlyVisited, useTimeFilter, showCircle, loadLevelFilter]);

  useEffect(() => {
    places.forEach((place) => {
      if (!popularityData[place.name]) {
        fetchPopularData(place.name, (data) => {
          setPopularityData(prev => ({
            ...prev,
            [place.name]: data
          }));
        });
      }
    });
  }, [places]);

const fetchPlaces = async () => {
  try {
    const email = localStorage.getItem('userEmail');
    const type = useTimeFilter ? getTimeBasedPlaceType() : 'restaurant';

    const randomLoad = () => {
      const levels = ['low', 'medium', 'high'];
      return levels[Math.floor(Math.random() * levels.length)];
    };

    // fallback לפי עיר אם אין רדיוס, חיפוש או ביקורים
    const isDefaultSearch = !radius && !search && !onlyVisited;
    if (isDefaultSearch && location) {
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8`
      );
      const geoData = await geoRes.json();
      const city = geoData.results[0]?.address_components.find(c =>
        c.types.includes("locality")
      )?.long_name;

        if (city) {
          const cityRes = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+${city}&key=AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8`);
          const cityData = await cityRes.json();
          setPlaces(cityData.results.map(p => ({
            name: p.name,
            lat: p.geometry.location.lat,
            lng: p.geometry.location.lng,
            rating: p.rating || null,
            distance_in_meters: null,
            visited: false,
          })));
          return;
        }
      }

    // בקשת fetch רגילה לפי הפילטרים הרגילים
    const query = new URLSearchParams({
      lat: location.lat,
      lng: location.lng,
      radius: radius || 1000,
      search,
      min_rating: rating,
      type,
      load_level: loadLevelFilter,
      email: onlyVisited ? email : ''
    }).toString();

    const response = await fetch(`http://localhost:8000/api/nearby/?${query}`);
    const data = await response.json();
    setPlaces(
  Array.isArray(data)
    ? data.map(p => ({
        ...p,
        load_level: randomLoad() // 🆕 הוספת העומס לכל מסעדה
      })).filter(p => !loadLevelFilter || p.load_level === loadLevelFilter) // ✅ סינון לפי העומס
    : []
);
  } catch (err) {
    console.error('⚠️ Error:', err);
  }
};


  const markAsVisited = async (place) => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      setShowLoginMessage(true);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/visit/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          restaurant_name: place.name,
          lat: place.lat,
          lng: place.lng,
          rating: place.rating
        })
      });
      const data = await res.json();
      alert(data.message || 'נשמר!');
    } catch (err) {
      console.error(err);
      alert("שגיאה בשמירה");
    }
  };

  const removeVisit = async (place) => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      setShowLoginMessage(true);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/visit/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          restaurant_name: place.name
        })
      });
      const data = await res.json();
      alert(data.message || "הוסר מהרשימה");
      fetchPlaces();
    } catch (err) {
      console.error(err);
      alert("שגיאה בהסרה");
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

  const translateLoadLevel = (level) => {
    switch (level) {
      case 'low': return 'נמוך';
      case 'medium': return 'בינוני';
      case 'high': return 'גבוה';
      default: return 'לא ידוע';
    }
  };

  const handleDestinationSearch = () => {
    geocodeAddress(destination, (coords) => {
      if (mapRef.current) mapRef.current.panTo(coords);
    });
  };

  // פונקציה לטיפול בלחיצה על צ'קבוקס סינון ביקורים
  const handleOnlyVisitedChange = (e) => {
    if (!isLoggedIn && e.target.checked) {
      setShowLoginMessage(true);
      return;
    }
    setOnlyVisited(e.target.checked);
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
        <div className="header-buttons">
          {isLoggedIn ? (
            <button
              className="login-button"
              onClick={() => {
                localStorage.removeItem('userEmail');
                setIsLoggedIn(false);
                window.location.reload();
              }}
            >
              התנתק
            </button>
          ) : (
            <div className="auth-buttons">
              <button
                className="login-button"
                onClick={() => window.location.href = '/login'}
              >
                התחברות
              </button>
              <button
                className="register-button"
                onClick={() => window.location.href = '/register'}
              >
                הרשמה
              </button>
            </div>
          )}
        </div>
      </header>

      {showLoginMessage && (
        <div className="login-message">
          <p>⚠️ פעולה זו דורשת התחברות למערכת</p>
          <button onClick={() => window.location.href = '/login'}>להתחברות</button>
          <button onClick={() => setShowLoginMessage(false)}>סגור</button>
        </div>
      )}

      <div className="content">
        <aside className="sidebar">
            <label>
                רמת עומס:
                <select
                  value={loadLevelFilter}
                  onChange={(e) => setLoadLevelFilter(e.target.value)}
                >
                  <option value="">ללא סינון</option>
                  <option value="low">נמוך</option>
                  <option value="medium">בינוני</option>
                  <option value="high">גבוה</option>
                </select>
          </label>

          <input
            type="text"
            placeholder="הכנס מסעדה או עיר"
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
          <button
            style={{ marginTop: '10px', background: '#ffd700', color: 'black', fontWeight: 'bold' }}
            onClick={() => {
              if (!isLoggedIn) {
                setShowLoginMessage(true);
                return;
              }
              window.location.href = '/saved';
            }}
          >
            ⭐ למסעדות ששמרתי {!isLoggedIn && '(דורש התחברות)'}
          </button>
          <label>
            <input
              type="checkbox"
              checked={onlyVisited}
              onChange={handleOnlyVisitedChange}
            />
            רק שביקרתי {!isLoggedIn && '(דורש התחברות)'}
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
                  onChange={() => {
                    if (showCircle && circleRef.current) {
                      circleRef.current.setMap(null);
                      circleRef.current = null;
                    }
                    setShowCircle(!showCircle);
                  }}
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
              {showCircle && radius > 0 && (
                <Circle
                  center={location}
                  radius={radius}
                  options={{
                    fillColor: '#90caf9',
                    strokeColor: '#1976d2',
                  }}
                  onLoad={circle => {
                    circleRef.current = circle;
                  }}
                  onUnmount={() => {
                    circleRef.current = null;
                  }}
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
                    {isLoggedIn ? (
                      place.visited ? (
                        <button onClick={() => removeVisit(place)}>הסר מהרשימה</button>
                      ) : (
                        <button onClick={() => markAsVisited(place)}>ביקרתי כאן</button>
                      )
                    ) : (
                      <button onClick={() => setShowLoginMessage(true)}>ביקרתי כאן (דורש התחברות)</button>
                    )}
                    <p>עומס: {translateLoadLevel(place.load_level)}</p>
                    <button
                      onClick={() => {
                        console.log('כפתור שמור נלחץ עבור:', place.name);
                        if (!isLoggedIn) {
                          setShowLoginMessage(true);
                          return;
                        }
                        handleSave(place);
                      }}
                    >
                      📌 שמור כתובת {!isLoggedIn && '(דורש התחברות)'}
                    </button>

                    {place.visited && <p className="visited">✅ ביקרת כאן</p>}
                    <div className="popularity">
                      <p><strong>שעות עומס:</strong></p>

                      {(popularityData[place.name]?.popular_times?.[0]?.popular_times ||
                        generateBackupPopularity()[0].popular_times
                      ).map((pt, i) => (
                        <div
                          key={i}
                          style={{
                            marginBottom: '6px',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span style={{ width: '35px', direction: 'ltr' }}>{pt.hour}:00</span>
                          <div style={{
                            background: '#e0e0e0',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            width: '100%',
                            height: '12px'
                          }}>
                            <div style={{
                              width: `${pt.percentage}%`,
                              backgroundColor:
                                pt.percentage > 70 ? '#d32f2f' :
                                pt.percentage > 40 ? '#fbc02d' :
                                '#4caf50',
                              height: '100%'
                            }}></div>
                          </div>
                          <span style={{ width: '40px', textAlign: 'left' }}>{pt.percentage}%</span>
                        </div>
                      ))}
                    </div>
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