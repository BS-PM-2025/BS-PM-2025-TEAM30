// 📁 MapComponent.js - גרסה מתוקנת עם טיפול בשגיאת GPS, קלט ידני, בחירת יעד
import React, { useEffect, useState, useRef } from 'react';
import './MapComponent.css';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';
import SearchSidebar from './SearchSidebar';

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

  const getPhotoUrl = (photoReference, maxWidth = 400) =>
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8`;


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
  const [expandedCards, setExpandedCards] = useState({}); // מצב פתיחת כרטיסים




  const mapRef = useRef(null);
  const circleRef = useRef(null);

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

  const getCurrentLoadInfo = (place) => {
    const nowHour = new Date().getHours();
    const popular = popularityData[place.name]?.popular_times?.[0]?.popular_times ||
                   generateBackupPopularity()[0].popular_times;
    const hourData = popular.find((pt) => pt.hour === nowHour);

  if (!hourData || hourData.percentage === undefined) {
  return { percentage: 0, level: 'המקום סגור' };
}




    const percentage = hourData.percentage;
    let level = 'נמוך';
    if (percentage > 50) level = 'גבוה';
    else if (percentage > 30) level = 'בינוני';

    return { percentage, level };
  };

  const toggleCardExpansion = (placeName) => {
    setExpandedCards(prev => ({
      ...prev,
      [placeName]: !prev[placeName]
    }));
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
      // const randomLoad = () => {
      //   const levels = ['low', 'medium', 'high'];
      //   return levels[Math.floor(Math.random() * levels.length)];
      // };

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
            address: p.formatted_address || null,     // ✅ שורת כתובת
            icon: p.icon || null                      // ✅ אייקון עגול
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
      setPlaces(Array.isArray(data) ? data : []);
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

      // ✅ תוסיף את זה כאן כדי לעדכן את המסעדה ל־visited
      fetchPlaces();
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
      const res = await fetch('http://localhost:8000/api/visit/remove/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          restaurant_name: place.name  // 💥 הכי חשוב!
        })
      });
      const data = await res.json();
      alert(data.message || "הוסר מהרשימה");

      fetchPlaces(); // ✅ מרענן תצוגה
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
const renderStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;

  for (let i = 0; i < fullStars; i++) {
    stars.push(<span key={`full-${i}`} className="star-label full">★</span>);
  }

  if (hasHalfStar) {
    stars.push(<span key="half" className="star-label full">★</span>); // לא שקוף!
  }

  while (stars.length < 5) {
    stars.push(<span key={`empty-${stars.length}`} className="star-label empty">★</span>);
  }

  return stars;
};

return (
<div className="container">
  {/* התחלת קוד ההתראה */}
  {recommendedRestaurant && showRecommendation && (
    <div className="restaurant-recommendation">
      <div className="recommendation-header">
        <h3>🍽️ מומלץ עכשיו!</h3>
        <button
          onClick={() => setShowRecommendation(false)}
          className="close-recommendation"
        >
          ×
        </button>
      </div>

      {/* ✅ תמונת המסעדה */}
      <img
        src={
          recommendedRestaurant.photo
            ? getPhotoUrl(recommendedRestaurant.photo)
            : "/images/default-restaurant.jpg"
        }
        alt={recommendedRestaurant.name}
        className="recommendation-image"
      />

      {/* ✅ שם */}
      <div className="recommendation-title-with-logo">
        <p className="recommendation-title">{recommendedRestaurant.name}</p>
        {recommendedRestaurant.icon && (
          <img
            src={recommendedRestaurant.icon}
            alt="icon"
            className="restaurant-icon"
          />
        )}
      </div>

      <p className="recommendation-subtitle">
        {recommendedRestaurant.address || "כתובת לא ידועה"}
      </p>

      {/* ✅ תגיות מידע בצורה עיצובית */}
      <div className="recommendation-tags">
        <div className="tag green">
          {(() => {
            const hourNow = new Date().getHours();
            const pt =
              popularityData[recommendedRestaurant.name]?.popular_times?.[0]
                ?.popular_times?.find((p) => p.hour === hourNow);
            const percent = pt?.percentage ?? "לא ידוע";
            return typeof percent === "number"
              ? `${percent}% עומס כעת`
              : `עומס: ${percent}`;
          })()}
        </div>

        <div className="tag blue">
          {Math.round(recommendedRestaurant.distance_in_meters)} מטר
        </div>

        <div className="tag blue">
          {"⭐".repeat(Math.round(recommendedRestaurant.rating || 0))}
        </div>

      </div>

      {/* ✅ כפתורים */}
      <div className="recommendation-buttons">
        <button
          className="circle-button"
          onClick={() => handleSave(recommendedRestaurant)}
          title="שמור מסעדה למועדפים"
        >
          🤍
        </button>
        {recommendedRestaurant.visited ? (
          <button className="yellow-button">ביקרתי כאן כבר</button>
        ) : (
          <button
            className="yellow-button"
            onClick={() => markAsVisited(recommendedRestaurant)}
          >
            ביקרתי כאן
          </button>
        )}
      </div>
    </div>
  )}
  {/* סוף קוד ההתראה */}


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
          <SearchSidebar
          search={search}
          setSearch={setSearch}
          destination={destination}
          setDestination={setDestination}
          isLoggedIn={isLoggedIn}
          setShowLoginMessage={setShowLoginMessage}
          handleDestinationSearch={handleDestinationSearch}
          setRating={setRating}
          loadLevelFilter={loadLevelFilter}
          setLoadLevelFilter={setLoadLevelFilter}
          radius={radius}
          setRadius={setRadius}
          showCircle={showCircle}
          setShowCircle={setShowCircle}
          circleRef={circleRef}
          useTimeFilter={useTimeFilter}
          setUseTimeFilter={setUseTimeFilter}
          onlyVisited={onlyVisited}
          handleOnlyVisitedChange={handleOnlyVisitedChange}
    />



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
                {places
                  .filter((place) => {
                    if (!loadLevelFilter) return true;

                    const nowHour = new Date().getHours();
                    const popular = popularityData[place.name]?.popular_times?.[0]?.popular_times || [];
                    const hourData = popular.find((pt) => pt.hour === nowHour);

                    if (!hourData) return true;

                    const percent = hourData.percentage;

                    if (loadLevelFilter === 'low') return percent <= 30;
                    if (loadLevelFilter === 'medium') return percent > 30 && percent <= 50;
                    if (loadLevelFilter === 'high') return percent > 50;

                    return true;
                  })
                  .map((place, i) => {
                    const currentLoad = getCurrentLoadInfo(place);
                    const isExpanded = expandedCards[place.name]; // שינוי לשם המסעדה במקום אינדקס

                    return (
                      <div key={i} className="card">
                                 <button
  className={`heart-icon ${place.saved ? 'filled' : ''}`}
  onClick={() => {
    if (!isLoggedIn) {
      setShowLoginMessage(true);
      return;
    }

    handleSave(place);

    setPlaces(prev =>
      prev.map(p =>
        p.name === place.name ? { ...p, saved: true } : p
      )
    );
  }}
  title={place.saved ? 'הוסר מהשמורים' : 'שמור למסעדה'}
>
  {place.saved ? '❤️' : '🤍'}
</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4>{place.name}</h4>

                        </div>
                                             {place.address && (
    <p className="restaurant-address"> {place.address}</p>
  )}
<div className="card-info-bar">
  <div className="distance-label">{Math.round(place.distance_in_meters)} מטר</div>
  <div className="rating-stars-label">{renderStars(place.rating || 0)}</div>
  {currentLoad.percentage !== null && (
    <div className={`load-tag ${currentLoad.level}`}>
      עומס נוכחי {currentLoad.percentage}%
    </div>
  )}
  {place.icon && (
    <img src={place.icon} alt="icon" className="icon" />
  )}
</div>






  {isLoggedIn ? (
    place.visited ? (
      <button onClick={() => removeVisit(place)} className="visit-btn">הסר מהרשימה</button>
    ) : (
      <button onClick={() => markAsVisited(place)} className="visit-btn">ביקרתי כאן</button>
    )
  ) : (
    <button onClick={() => setShowLoginMessage(true)} className="visit-btn">ביקרתי כאן</button>
  )}

 <div className="expand-toggle">
  <p className="expand-text">הצג את שעות העומס לאורך כל היום</p>
  <button
    className="expand-button"
    onClick={() => toggleCardExpansion(place.name)}
  >
    {isExpanded ? '▲' : '▼'}
  </button>
</div>





                        {/* תצוגת כל השעות (רק אם מורחב) */}
                        {isExpanded && (
                          <div className="popularity">
                            <p><strong>שעות עומס ליום:</strong></p>
                            {(popularityData[place.name]?.popular_times?.[0]?.popular_times ||
                              generateBackupPopularity()[0].popular_times
                            ).map((pt, ptIndex) => (
                              <div
                                key={ptIndex}
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
                                      pt.percentage > 50 ? '#d32f2f' :
                                      pt.percentage > 40 ? '#fbc02d' :
                                      '#4caf50',
                                    height: '100%'
                                  }}></div>
                                </div>
                                <span style={{ width: '40px', textAlign: 'left' }}>{pt.percentage}%</span>
                              </div>
                            ))}
                          </div>
                        )}



                        {place.visited && <p className="visited">✅ ביקרת כאן</p>}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MapComponent;