


import React, { useEffect, useState } from 'react';
import './SavedRestaurants.css';
import FullNavigationMap from '../components/FullNavigationMap/FullNavigationMap';

const SavedRestaurants = () => {
  const [saved, setSaved] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [popularityData, setPopularityData] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [userLocation, setUserLocation] = useState(null);

  // 🆕 מצב הניווט המפורט
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  const email = localStorage.getItem('userEmail');

  // פונקציות עזר מעמוד הבית
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

  const fetchPopularData = async (placeName, callback) => {
    // משתמש בנתונים מדומים כמו בעמוד הבית
    callback({ popular_times: generateBackupPopularity(), is_fake: true });
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

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="star-label full">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star-label full">★</span>);
    }

    while (stars.length < 5) {
      stars.push(<span key={`empty-${stars.length}`} className="star-label empty">★</span>);
    }

    return stars;
  };

  const toggleCardExpansion = (placeName) => {
    setExpandedCards(prev => ({
      ...prev,
      [placeName]: !prev[placeName]
    }));
  };

  // קבלת כתובת מקואורדינטות
  const getAddressFromCoords = async (lat, lng) => {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyAakPIsptc8OsiLxO1mIhzEFmd_UuKmlL8`);
      const data = await res.json();
      return data.results?.[0]?.formatted_address || 'כתובת לא זמינה';
    } catch (err) {
      console.error('שגיאה בהבאת כתובת', err);
      return 'כתובת לא זמינה';
    }
  };

  useEffect(() => {
    // קבלת מיקום המשתמש
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.warn('לא הצלחנו לקבל מיקום:', error);
        // מיקום ברירת מחדל (תל אביב)
        setUserLocation({ lat: 32.0853, lng: 34.7818 });
      }
    );

    const fetchSaved = async () => {
      try {
        if (!email) {
          setError('משתמש לא מחובר');
          setLoading(false);
          return;
        }

        const res = await fetch(`http://localhost:8000/api/get-saved/?email=${email}`);
        const data = await res.json();
        if (res.ok) {
          // הוספת כתובות למסעדות שאין להן
          const updatedSaved = await Promise.all(data.map(async (place) => {
            if (!place.address && place.lat && place.lng) {
              const address = await getAddressFromCoords(place.lat, place.lng);
              return { ...place, address, rating: place.rating || 4.0 + Math.random() };
            }
            return { ...place, rating: place.rating || 4.0 + Math.random() };
          }));

          setSaved(updatedSaved);
        } else {
          setError(data.error || 'שגיאה בשליפת מסעדות');
        }
      } catch (err) {
        setError('בעיה בהתחברות לשרת');
      } finally {
        setLoading(false);
      }
    };


    fetchSaved();
  }, [email]);

  // טעינת נתוני עומס לכל מסעדה
  useEffect(() => {
    saved.forEach((place) => {
      if (!popularityData[place.name]) {
        fetchPopularData(place.name, (data) => {
          setPopularityData(prev => ({
            ...prev,
            [place.name]: data
          }));
        });
      }
    });
  }, [saved]);

  // 🆕 פתיחת ניווט מפורט
  const openDetailedNavigation = (restaurant) => {
    if (!userLocation) {
      alert('לא הצלחנו לקבל את המיקום שלך. מפתחים במפות גוגל...');
      handleNavigate(restaurant.lat, restaurant.lng);
      return;
    }

    setSelectedRestaurant(restaurant);
    setShowNavigationModal(true);
  };

  // 🆕 סגירת ניווט מפורט
  const closeNavigationModal = () => {
    setShowNavigationModal(false);
    setSelectedRestaurant(null);
  };

  const handleNavigate = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleRemove = async (restaurant) => {
    if (!window.confirm(`האם אתה בטוח שברצונך להסיר את ${restaurant.name} מהרשימה?`)) {
      return;
    }

    try {
      // נסה את ה-endpoint הקיים תחילה
      let res = await fetch(`http://localhost:8000/api/remove-saved/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: email,
          name: restaurant.name,
          lat: restaurant.lat,
          lng: restaurant.lng
        })
      });


      // אם לא עובד, נסה דרך שונה
      if (!res.ok) {
        res = await fetch(`http://localhost:8000/api/save-restaurant/`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: email,
            name: restaurant.name,
            lat: restaurant.lat,
            lng: restaurant.lng
          })
        });
      }

      if (res.ok) {
        setSaved(prev => prev.filter(item =>
          !(item.name === restaurant.name && item.lat === restaurant.lat && item.lng === restaurant.lng)
        ));
        alert('המסעדה הוסרה בהצלחה ✅');
      } else {
        // אם השרת לא תומך בהסרה, נסיר מקומית
        setSaved(prev => prev.filter(item =>
          !(item.name === restaurant.name && item.lat === restaurant.lat && item.lng === restaurant.lng)
        ));
        alert('המסעדה הוסרה מקומית (השרת עדיין לא תומך בהסרה) ⚠️');
      }
    } catch (err) {
      // אם יש שגיאה, נסיר מקומית
      setSaved(prev => prev.filter(item =>
        !(item.name === restaurant.name && item.lat === restaurant.lat && item.lng === restaurant.lng)
      ));
      alert('המסעדה הוסרה מקומית ⚠️');
    }
  };

  const goToHome = () => {
    window.location.href = '/restaurants';
  };

  if (loading) {
    return (
      <div className="saved-container">
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>טוען מסעדות שמורות...</p>
        </div>
      </div>
    );
  }

  // 🆕 אם מוצג הניווט המפורט
  if (showNavigationModal && selectedRestaurant && userLocation) {
    return (
      <FullNavigationMap
        origin={userLocation}
        destination={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
        restaurantName={selectedRestaurant.name}
        onClose={closeNavigationModal}
      />
    );
  }



  return (
    <div className="saved-container">
      {/* כותרת עם כפתור חזרה */}
      <header className="saved-header">
        <button onClick={goToHome} className="home-button">
          🏠 חזרה לבית
        </button>
        <h1 className="saved-title">🍽️ המסעדות המועדפות שלי</h1>
        <div className="header-spacer"></div>
      </header>

      {/* תוכן ראשי */}
      <div className="saved-content">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            {error === 'משתמש לא מחובר' && (
              <button onClick={() => window.location.href = '/login'} className="login-btn">
                התחבר עכשיו
              </button>
            )}
          </div>
        )}

        {!error && saved.length === 0 && (
          <div className="empty-message">
            <div className="empty-icon">🍽️</div>
            <h3>אין מסעדות שמורות עדיין</h3>
            <p>תתחיל לשמור מסעדות מעמוד הבית ותוכל לראות אותן כאן</p>
            <button onClick={goToHome} className="explore-btn">
              🔍 חפש מסעדות
            </button>
          </div>
        )}

        {!error && saved.length > 0 && (
          <>
            <div className="saved-stats">
              <span className="stats-text">נמצאו {saved.length} מסעדות שמורות</span>
            </div>

            <div className="saved-cards">
              {saved.map((place, index) => {
                const currentLoad = getCurrentLoadInfo(place);
                const isExpanded = expandedCards[place.name];

                return (
                  <div key={index} className="saved-card">
                    {/* ✅ איקס להסרה במקום לב */}
                    <button
                      className="remove-icon"
                      onClick={() => handleRemove(place)}
                      title="הסר מהשמורים"
                    >
                      ×
                    </button>

                    {/* שם המסעדה */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4>{place.name}</h4>
                    </div>

                    {/* כתובת */}
                    {place.address && (
                      <p className="restaurant-address">{place.address}</p>
                    )}

                    {/* מידע משופר - דירוג ועומס */}
                    <div className="enhanced-info-bar">
                      <div className="restaurant-rating">
                        <div className="rating-display">
                          <div className="stars-container">
                            {renderStars(place.rating || 4.0)}
                          </div>
                          <span className="rating-number">({(place.rating || 4.0).toFixed(1)})</span>
                        </div>
                      </div>

                      <div className="current-load-display">
                        <div className={`load-badge ${currentLoad.level}`}>
                          <span className="load-icon">📊</span>
                          <span>עומס: {currentLoad.percentage}%</span>
                        </div>
                      </div>

                      {place.distance_in_meters && (
                        <div className="distance-display">
                          <span className="distance-badge">
                            📍 {Math.round(place.distance_in_meters)}מ'
                          </span>
                        </div>
                      )}

                      {place.icon && (
                        <img src={place.icon} alt="icon" className="place-type-icon" />
                      )}
                    </div>

                    {/* כפתורי פעולה */}
                    <div className="card-actions">
                      <button
                        onClick={() => openDetailedNavigation(place)}
                        className="navigate-btn"
                      >
                        🧭 נווט למסעדה
                      </button>

                      <button
                        onClick={() => {
                          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.name}`;
                          window.open(mapsUrl, '_blank');
                        }}
                        className="visit-btn"
                      >
                        ℹ️ פרטים במפות
                      </button>
                    </div>

                    {/* הרחבת מידע עומס */}
                    <div className="expand-toggle">
                      <p className="expand-text">הצג את שעות העומס לאורך כל היום</p>
                      <button
                        className="expand-button"
                        onClick={() => toggleCardExpansion(place.name)}
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>

                    {/* תצוגת כל השעות */}
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


                    {/* תאריך שמירה */}
                    {place.saved_at && (
                      <div className="saved-date-info">
                        <span className="date-icon">📅</span>
                        <span className="date-text">
                          נשמר ב-{new Date(place.saved_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>


      {/* כפתור צף לחזרה לבית */}
      <button onClick={goToHome} className="floating-home-btn" title="חזרה לעמוד הבית">
        🏠
      </button>
    </div>
  );
};


export default SavedRestaurants;