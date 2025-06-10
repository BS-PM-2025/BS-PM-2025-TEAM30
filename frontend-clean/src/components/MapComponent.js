// 📁 MapComponent.js - גרסה משופרת עם הוראות בולטות ומידע נוסף
import React, { useEffect, useState, useRef } from 'react';
import './MapComponent.css';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';
import SearchSidebar from './SearchSidebar';
import FullNavigationMap from './FullNavigationMap/FullNavigationMap';
import axios from 'axios';


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
  // שימוש זמני בנתונים מדומים
  callback({ popular_times: generateBackupPopularity(), is_fake: true });
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
  const [expandedCards, setExpandedCards] = useState({});

  // 🆕 מצב הוראות הנסיעה
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showDirectionsVisible, setShowDirectionsVisible] = useState(true);
const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const mapRef = useRef(null);
  const circleRef = useRef(null);
   const [userPreferences, setUserPreferences] = useState(null);
  const [smartRecommendations, setSmartRecommendations] = useState(null);

 const findBestRestaurantForCurrentTime = (restaurants) => {
  if (!restaurants || restaurants.length === 0) return null;

  const sortedByRating = [...restaurants].sort((a, b) => {
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;
    return ratingB - ratingA;
  });

  const currentHour = new Date().getHours();
  let bestMatch = null;

  if (currentHour < 12) {
    bestMatch = sortedByRating.find(r =>
      r.name.includes('קפה') ||
      r.name.toLowerCase().includes('cafe') ||
      r.name.toLowerCase().includes('coffee')
    );
  } else if (currentHour >= 12 && currentHour < 18) {
    bestMatch = sortedByRating.find(r =>
      !r.name.toLowerCase().includes('bar') &&
      !r.name.toLowerCase().includes('פאב')
    );
  } else {
    bestMatch = sortedByRating.find(r =>
      r.name.toLowerCase().includes('bar') ||
      r.name.toLowerCase().includes('פאב') ||
      r.rating >= 4.0
    );
  }

  return bestMatch || sortedByRating[0];
};
  const loadUserPreferences = async () => {
  const email = localStorage.getItem('userEmail');
  if (!email) {
    setPreferencesLoaded(true);
    return Promise.resolve();
  }

  try {
    console.log('📡 שולח בקשה לטעינת העדפות...');
    const response = await axios.get(`http://localhost:8000/api/preferences/?email=${email}`);

    if (response.data && Object.keys(response.data).length > 0) {
      setUserPreferences(response.data);
      console.log('🎯 העדפות נטענו:', response.data);
    } else {
      console.log('📝 אין העדפות שמורות');
      setUserPreferences(null);
    }

    setPreferencesLoaded(true);
    return Promise.resolve(response.data);
  } catch (error) {
    console.error('❌ שגיאה בטעינת העדפות:', error);
    setUserPreferences(null);
    setPreferencesLoaded(true);
    return Promise.resolve(null);
  }
};

const loadSmartRecommendations = async () => {
  const email = localStorage.getItem('userEmail');
  if (!email || !location) return;

  try {
    const response = await axios.get(
      `http://localhost:8000/api/recommendations/?email=${email}&lat=${location.lat}&lng=${location.lng}`
    );
    setSmartRecommendations(response.data);
    console.log('🤖 המלצות חכמות:', response.data);
  } catch (error) {
    console.error('שגיאה בקבלת המלצות:', error);
  }
};

// עדכון לפונקציית filterByUserPreferences ב-MapComponent.js

const filterByUserPreferences = (places) => {
  console.log('🎯 filterByUserPreferences נקראה');
  console.log('📊 מספר מסעדות לפני סינון:', places.length);
  console.log('👤 העדפות נוכחיות:', userPreferences);

  if (!userPreferences) {
    console.log('❌ אין העדפות משתמש - מציג את כל המסעדות');
    return places;
  }

  // 🆕 קבלת ההעדפות הספציפיות לארוחה הנוכחית
  const currentHour = new Date().getHours();
  let currentMealType = 'lunch';

  if (currentHour < 12) currentMealType = 'breakfast';
  else if (currentHour >= 18) currentMealType = 'dinner';

  console.log(`🕐 שעה נוכחית: ${currentHour}, ארוחה: ${currentMealType}`);

  // 🆕 בחירת סוגי האוכל הרלוונטיים לארוחה הנוכחית
  let preferredFoodTypes = [];

  if (userPreferences.current_meal_food_preferences) {
    // השתמש בהעדפות הנוכחיות מהשרת
    preferredFoodTypes = userPreferences.current_meal_food_preferences;
  } else if (userPreferences[`${currentMealType}_foods`]) {
    // fallback לשדות הישירים
    preferredFoodTypes = userPreferences[`${currentMealType}_foods`];
  } else if (userPreferences.preferred_food_types_list) {
    // fallback להעדפות כלליות
    preferredFoodTypes = userPreferences.preferred_food_types_list;
  }

  console.log(`🍽️ סוגי אוכל מועדפים ל-${currentMealType}:`, preferredFoodTypes);

  if (preferredFoodTypes.length === 0) {
    console.log('📝 אין העדפות אוכל ספציפיות - מציג הכל');
    return places;
  }

  const filteredPlaces = places.filter(place => {
    const placeName = place.name.toLowerCase();

    const hasPreferredFood = preferredFoodTypes.some(foodType => {
      const foodTypeLower = foodType.toLowerCase();

      const matches =
        placeName.includes(foodTypeLower) ||

        // התאמות ספציפיות לארוחת בוקר
        (currentMealType === 'breakfast' && (
          (foodTypeLower === 'cafe' && (placeName.includes('caf') || placeName.includes('קפה'))) ||
          (foodTypeLower === 'bakery' && (placeName.includes('baker') || placeName.includes('מאפי'))) ||
          (foodTypeLower === 'breakfast' && (placeName.includes('breakfast') || placeName.includes('בוקר'))) ||
          (foodTypeLower === 'sandwich' && placeName.includes('sandwich'))
        )) ||

        // התאמות ספציפיות לארוחת צהריים
        (currentMealType === 'lunch' && (
          (foodTypeLower === 'burger' && (placeName.includes('hamburger') || placeName.includes('burger'))) ||
          (foodTypeLower === 'pizza' && placeName.includes('pizz')) ||
          (foodTypeLower === 'falafel' && placeName.includes('falafel')) ||
          (foodTypeLower === 'hummus' && placeName.includes('hummus')) ||
          (foodTypeLower === 'shawarma' && placeName.includes('shawar'))
        )) ||

        // התאמות ספציפיות לארוחת ערב
        (currentMealType === 'dinner' && (
          (foodTypeLower === 'sushi' && placeName.includes('sush')) ||
          (foodTypeLower === 'steak' && placeName.includes('steak')) ||
          (foodTypeLower === 'fish' && (placeName.includes('fish') || placeName.includes('דג'))) ||
          (foodTypeLower === 'bar' && placeName.includes('bar')) ||
          (foodTypeLower === 'wine' && placeName.includes('wine'))
        )) ||

        // התאמות כלליות
        (foodTypeLower === 'asian' && (placeName.includes('asia') || placeName.includes('chinese') || placeName.includes('thai'))) ||
        (foodTypeLower === 'italian' && (placeName.includes('italian') || placeName.includes('pasta'))) ||
        (foodTypeLower === 'mexican' && (placeName.includes('mexic') || placeName.includes('taco')));

      if (matches) {
        console.log(`✅ "${place.name}" תואם "${foodType}" עבור ${currentMealType}`);
      }

      return matches;
    });

    if (!hasPreferredFood) {
      console.log(`❌ "${place.name}" לא תואם העדפות ${currentMealType}: ${preferredFoodTypes.join(', ')}`);
    }

    return hasPreferredFood;
  });

  console.log(`📈 תוצאת סינון (${currentMealType}): ${places.length} -> ${filteredPlaces.length} מסעדות`);
  return filteredPlaces;
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

  // 🆕 פתיחת הוראות נסיעה מפורטות
  const openDetailedDirections = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDirectionsModal(true);
  };

  // 🆕 סגירת הוראות נסיעה
  const closeDirectionsModal = () => {
    setShowDirectionsModal(false);
    setSelectedRestaurant(null);
  };

useEffect(() => {
  const email = localStorage.getItem('userEmail');
  setIsLoggedIn(!!email);

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      const userLocation = { lat: latitude, lng: longitude };
      setLocation(userLocation);
      if (mapRef.current) mapRef.current.panTo(userLocation);

      // טען העדפות רק אם יש משתמש מחובר
      if (email) {
        await loadUserPreferences();
      } else {
        setPreferencesLoaded(true);
      }
    },
    () => {
      setGpsFailed(true);
      setPreferencesLoaded(true);
    }
  );
}, []);

  useEffect(() => {
    const checkLoginStatus = () => {
      const email = localStorage.getItem('userEmail');
      setIsLoggedIn(!!email);
    };

    window.addEventListener('focus', checkLoginStatus);
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
  if (!location || !preferencesLoaded) {
    console.log('⏳ מחכה למיקום ולהעדפות...');
    return;
  }

  console.log('🚀 מתחיל חיפוש עם העדפות!');
  if (radius || !showCircle) {
    fetchPlaces();
  }
}, [location, preferencesLoaded, radius, search, rating, onlyVisited, useTimeFilter, showCircle, loadLevelFilter]);

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
useEffect(() => {
  const savedFilters = localStorage.getItem('mapFilters');
  if (savedFilters) {
    try {
      const filters = JSON.parse(savedFilters);
      console.log('🔄 טוען סינונים שמורים:', filters);

      // החל את הסינונים השמורים
      if (filters.search) setSearch(filters.search);
      if (filters.rating) setRating(Number(filters.rating));
      if (filters.radius) setRadius(Number(filters.radius));
      if (filters.loadLevelFilter) setLoadLevelFilter(filters.loadLevelFilter);
      if (filters.useTimeFilter !== undefined) setUseTimeFilter(filters.useTimeFilter);
      if (filters.onlyVisited !== undefined) setOnlyVisited(filters.onlyVisited);
      if (filters.showCircle !== undefined) setShowCircle(filters.showCircle);

      console.log('✅ סינונים הוחלו בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בטעינת סינונים:', error);
      localStorage.removeItem('mapFilters'); // מחק סינונים פגומים
    }
  }
}, []); // רק פעם אחת בטעינת הקומפוננטה
useEffect(() => {
  // חכה שהמיקום יטען לפני שמירה
  if (!location) return;

  const filtersToSave = {
    search,
    rating: Number(rating),
    radius: Number(radius),
    loadLevelFilter,
    useTimeFilter,
    onlyVisited,
    showCircle
  };

  // בדוק אם יש סינונים פעילים
  const hasActiveFilters =
    search.trim() !== '' ||
    Number(rating) > 0 ||
    Number(radius) > 0 ||
    loadLevelFilter !== '' ||
    useTimeFilter !== true ||
    onlyVisited !== false ||
    showCircle !== false;

  if (hasActiveFilters) {
    localStorage.setItem('mapFilters', JSON.stringify(filtersToSave));
    console.log('💾 סינונים נשמרו:', filtersToSave);
  } else {
    // אם אין סינונים פעילים, מחק מהזיכרון
    localStorage.removeItem('mapFilters');
    console.log('🗑️ סינונים נמחקו (ברירת מחדל)');
  }
}, [search, rating, radius, loadLevelFilter, useTimeFilter, onlyVisited, showCircle, location]);
useEffect(() => {
  if (location && (radius || !showCircle)) {
    console.log('🔍 מפעיל חיפוש עם סינונים חדשים');
    fetchPlaces();
  }
}, [location, radius, search, rating, onlyVisited, useTimeFilter, showCircle, loadLevelFilter]);

  useEffect(() => {
  if (location && userPreferences) {
    loadSmartRecommendations();
  }
}, [location, userPreferences]);
const getDefaultRestaurantImage = () => {
  return "data:image/svg+xml," + encodeURIComponent(`
    <svg width="400" height="120" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="120" fill="#f5f5f5"/>
      <text x="200" y="70" text-anchor="middle" font-family="Arial" font-size="40" fill="#999">🍽️</text>
    </svg>
  `);
};
  const fetchPlaces = async () => {

    console.log('🚀 fetchPlaces נקראה עם הפרמטרים הבאים:');
  console.log('📍 מיקום:', location);
  console.log('🔍 חיפוש:', search);
  console.log('⭐ דירוג:', rating);
  console.log('📏 רדיוס:', radius);
  console.log('🏷️ רמת עומס:', loadLevelFilter);
  console.log('👤 רק שביקרתי:', onlyVisited);
  try {
    const email = localStorage.getItem('userEmail');
    let type = useTimeFilter ? getTimeBasedPlaceType() : 'restaurant';

    console.log('🔍 מתחיל חיפוש מסעדות...');
    console.log('👤 משתמש:', email || 'אנונימי');
    console.log('⚙️ העדפות נוכחיות:', userPreferences);

    // 🆕 שימוש בהעדפות לקביעת סוג האוכל
    if (userPreferences && userPreferences.current_meal_preference) {
      const { meal_type } = userPreferences.current_meal_preference;
      if (meal_type === 'breakfast') type = 'cafe';
      else if (meal_type === 'lunch') type = 'meal_takeaway';
      else if (meal_type === 'dinner') type = 'restaurant';
      console.log(`🍽️ סוג ארוחה: ${meal_type} -> ${type}`);
    }

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
          address: p.formatted_address || null,
          icon: p.icon || null
        })));
        return;
      }
    }

    // 🆕 שימוש בהעדפות המשתמש לבניית הפרמטרים
    const searchRadius = userPreferences?.max_distance_preference || radius || 1000;
    const minRating = userPreferences?.min_rating_preference || rating || 0;

    console.log(`📍 רדיוס חיפוש: ${searchRadius}מ' (העדפה: ${userPreferences?.max_distance_preference}, ברירת מחדל: ${radius})`);
    console.log(`⭐ דירוג מינימלי: ${minRating} (העדפה: ${userPreferences?.min_rating_preference}, ברירת מחדל: ${rating})`);

    const query = new URLSearchParams({
      lat: location.lat,
      lng: location.lng,
      radius: searchRadius,  // 🔧 משתמש בהעדפות!
      search,
      min_rating: minRating, // 🔧 משתמש בהעדפות!
      type,
      load_level: loadLevelFilter,
      email: onlyVisited ? email : ''
    }).toString();

    console.log('🌐 שולח בקשה:', `http://localhost:8000/api/nearby/?${query}`);

    const response = await fetch(`http://localhost:8000/api/nearby/?${query}`);
    const data = await response.json();

    console.log(`📥 התקבלו ${Array.isArray(data) ? data.length : 0} מסעדות מהשרת`);

    // 🆕 סינון נוסף לפי סוגי אוכל מועדפים
    const filteredPlaces = filterByUserPreferences(Array.isArray(data) ? data : []);
    setPlaces(filteredPlaces);

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

  const handleDestinationSearch = () => {
    geocodeAddress(destination, (coords) => {
      if (mapRef.current) mapRef.current.panTo(coords);
    });
  };

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
      stars.push(<span key="half" className="star-label full">★</span>);
    }

    while (stars.length < 5) {
      stars.push(<span key={`empty-${stars.length}`} className="star-label empty">★</span>);
    }

    return stars;
  };

  // 🆕 אם מוצג הניווט המפורט
  if (showDirectionsModal && selectedRestaurant && location) {
    return (
      <FullNavigationMap
        origin={location}
        destination={{ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng }}
        restaurantName={selectedRestaurant.name}
        onClose={closeDirectionsModal}
      />
    );
  }

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

          <img
  src={
    recommendedRestaurant.photo
      ? getPhotoUrl(recommendedRestaurant.photo)
      : getDefaultRestaurantImage()
  }
  alt={recommendedRestaurant.name}
  className="recommendation-image"
  onError={(e) => {
    e.target.src = getDefaultRestaurantImage();
  }}
/>

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

      <header className="header">
        <h1 className="logo">🍴 RouteBite</h1>
        <div className="header-buttons">
         {isLoggedIn ? (
  <div className="auth-buttons">
    <button className="preferences-button" onClick={() => window.location.href = '/preferences'}>
      ⚙️ העדפות
    </button>
    <button className="login-button"  onClick={() => {
            localStorage.removeItem('userEmail');
            setIsLoggedIn(false);
            window.location.reload();
          }}>
      התנתק
    </button>
  </div>
) : (
  // כפתורי התחברות/הרשמה
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
      {/* 🆕 הוסף את הקוד הזה כאן - אחרי header ולפני showLoginMessage */}
    {/*{smartRecommendations && (*/}
    {/*  <div className="smart-recommendations">*/}
    {/*    <h3>🤖 המלצה חכמה בהתבסס על ההעדפות שלך</h3>*/}
    {/*    <p>{smartRecommendations.message}</p>*/}
    {/*    <div className="recommendation-details">*/}
    {/*      <span>🍽️ {smartRecommendations.meal_type}</span>*/}
    {/*      <span>⭐ דירוג מינימלי: {smartRecommendations.min_rating}</span>*/}
    {/*      <span>📍 מרחק מקסימלי: {smartRecommendations.max_distance}מ'</span>*/}
    {/*    </div>*/}
    {/*  </div>*/}
    {/*)}*/}
      {!preferencesLoaded && isLoggedIn && (
  <div className="loading-preferences">
    <p>⏳ טוען העדפות...</p>
  </div>
)}
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
            {/* 🆕 כפתור הצגה/הסתרה של הוראות */}
            <div className="directions-toggle-section">
              <button
                className={`directions-toggle-btn ${showDirectionsVisible ? 'active' : ''}`}
                onClick={() => setShowDirectionsVisible(!showDirectionsVisible)}
              >
                {showDirectionsVisible ? '🔽 הסתר הוראות ניווט' : '🔼 הצג הוראות ניווט'}
              </button>

              {showDirectionsVisible && (
                <div className="directions-instructions">
                  <div className="instructions-card">
                    <h4>🧭 איך להשתמש בניווט:</h4>
                    <ul>
                      <li>🎯 <strong>לחץ על "נווט למסעדה"</strong> בכל כרטיס מסעדה</li>
                      <li>🗺️ <strong>יפתח לך ניווט מפורט</strong> עם הוראות צעד אחר צעד</li>
                      <li>📱 <strong>או לחץ "התחל ניווט בגוגל מפס"</strong> לניווט אמיתי</li>
                      <li>⭐ <strong>עומס נוכחי וכוכבים</strong> מוצגים בכל כרטיס</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

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
                    const isExpanded = expandedCards[place.name];

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
                          <p className="restaurant-address">{place.address}</p>
                        )}

                        {/* 🆕 מידע משופר - עומס וכוכבים */}
                        <div className="enhanced-info-bar">
                          <div className="restaurant-rating">
                            <div className="rating-display">
                              <div className="stars-container">
                                {renderStars(place.rating || 0)}
                              </div>
                              <span className="rating-number">({(place.rating || 0).toFixed(1)})</span>
                            </div>
                          </div>

                          <div className="current-load-display">
                            <div className={`load-badge ${currentLoad.level}`}>
                              <span className="load-icon">📊</span>
                              <span>עומס: {currentLoad.percentage}%</span>
                            </div>
                          </div>

                          <div className="distance-display">
                            <span className="distance-badge">
                              📍 {Math.round(place.distance_in_meters)}מ'
                            </span>
                          </div>

                          {place.icon && (
                            <img src={place.icon} alt="icon" className="place-type-icon" />
                          )}
                        </div>

                        {/* כפתורי פעולה */}
                        <div className="card-actions">
                          {isLoggedIn ? (
                            place.visited ? (
                              <button onClick={() => removeVisit(place)} className="visit-btn visited">
                                ✅ הסר מהרשימה
                              </button>
                            ) : (
                              <button onClick={() => markAsVisited(place)} className="visit-btn">
                                🍽️ ביקרתי כאן
                              </button>
                            )
                          ) : (
                            <button onClick={() => setShowLoginMessage(true)} className="visit-btn">
                              🍽️ ביקרתי כאן
                            </button>
                          )}

                          {/* 🆕 כפתור ניווט מפורט */}
                          <button
                            onClick={() => openDetailedDirections(place)}
                            className="navigate-btn"
                          >
                            🧭 נווט למסעדה
                          </button>
                        </div>

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