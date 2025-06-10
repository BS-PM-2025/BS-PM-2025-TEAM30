// frontend-clean/src/pages/UserPreferences.js - עדכון זהיר עם בחירת אוכל לכל ארוחה

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserPreferences.css';

const UserPreferences = () => {
  const [preferences, setPreferences] = useState({
    preferred_breakfast_time: '09:00',
    preferred_lunch_time: '13:00',
    preferred_dinner_time: '19:00',
    preferred_food_types: [], // 🔧 ודא שזה תמיד מערך
    // 🆕 הוספת העדפות אוכל לכל ארוחה
    breakfast_foods: [],
    lunch_foods: [],
    dinner_foods: [],
    max_distance_preference: 2000,
    min_rating_preference: 3.0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentRecommendation, setCurrentRecommendation] = useState(null);
  // 🆕 הוספת מצב לטאבים
  const [activeTab, setActiveTab] = useState('breakfast');

  const email = localStorage.getItem('userEmail');

  // 🆕 ברירות מחדל לשעות
  const defaultTimes = {
    breakfast: '09:00',
    lunch: '13:00',
    dinner: '19:00'
  };

  const foodTypes = [
    { value: 'pizza', label: 'פיצה', emoji: '🍕' },
    { value: 'burger', label: 'המבורגר', emoji: '🍔' },
    { value: 'sushi', label: 'סושי', emoji: '🍣' },
    { value: 'cafe', label: 'קפה', emoji: '☕' },
    { value: 'italian', label: 'איטלקי', emoji: '🍝' },
    { value: 'asian', label: 'אסייתי', emoji: '🥡' },
    { value: 'mexican', label: 'מקסיקני', emoji: '🌮' },
    { value: 'falafel', label: 'פלאפל', emoji: '🧆' },
    { value: 'hummus', label: 'חומוס', emoji: '🍽️' },
    { value: 'shawarma', label: 'שווארמה', emoji: '🌯' }
  ];

  // 🆕 סוגי אוכל מחולקים לקטגוריות
  const foodTypesByCategory = {
    breakfast: [
      { value: 'cafe', label: 'קפה', emoji: '☕' },
      { value: 'bakery', label: 'מאפייה', emoji: '🥐' },
      { value: 'breakfast', label: 'ארוחת בוקר', emoji: '🍳' },
      { value: 'sandwich', label: 'כריך', emoji: '🥪' },
      { value: 'pastry', label: 'מאפה', emoji: '🧁' },
      { value: 'juice', label: 'מיץ', emoji: '🧃' }
    ],
    lunch: [
      { value: 'falafel', label: 'פלאפל', emoji: '🧆' },
      { value: 'hummus', label: 'חומוס', emoji: '🍽️' },
      { value: 'shawarma', label: 'שווארמה', emoji: '🌯' },
      { value: 'burger', label: 'המבורגר', emoji: '🍔' },
      { value: 'pizza', label: 'פיצה', emoji: '🍕' },
      { value: 'salad', label: 'סלט', emoji: '🥗' },
      { value: 'asian', label: 'אסייתי', emoji: '🥡' },
      { value: 'italian', label: 'איטלקי', emoji: '🍝' }
    ],
    dinner: [
      { value: 'steak', label: 'סטייק', emoji: '🥩' },
      { value: 'fish', label: 'דגים', emoji: '🐟' },
      { value: 'sushi', label: 'סושי', emoji: '🍣' },
      { value: 'italian', label: 'איטלקי', emoji: '🍝' },
      { value: 'mexican', label: 'מקסיקני', emoji: '🌮' },
      { value: 'burger', label: 'המבורגר', emoji: '🍔' },
      { value: 'pizza', label: 'פיצה', emoji: '🍕' },
      { value: 'bar', label: 'בר', emoji: '🍺' },
      { value: 'wine', label: 'יין', emoji: '🍷' }
    ]
  };

  useEffect(() => {
    if (!email) {
      window.location.href = '/login';
      return;
    }
    loadPreferences();
  }, [email]);

  // 🔧 פונקציה מתוקנת לטעינת העדפות - עם תמיכה בשדות חדשים
  const loadPreferences = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/preferences/?email=${email}`);
      const data = response.data;

      console.log('📥 נתונים שהתקבלו מהשרת:', data);

      // 🔧 ניקוי וטיפול בסוגי האוכל (קוד קיים)
      let cleanFoodTypes = [];

      if (data.preferred_food_types_list && Array.isArray(data.preferred_food_types_list)) {
        cleanFoodTypes = data.preferred_food_types_list;
      } else if (data.preferred_food_types) {
        try {
          // נסה לפרק JSON אם זה string
          if (typeof data.preferred_food_types === 'string') {
            // ניקוי של escape characters
            let cleanedString = data.preferred_food_types;
            // הסרת escape characters מיותרים
            cleanedString = cleanedString.replace(/\\+"/g, '"');
            cleanedString = cleanedString.replace(/^"(.*)"$/, '$1');

            const parsed = JSON.parse(cleanedString);
            cleanFoodTypes = Array.isArray(parsed) ? parsed : [];
          } else if (Array.isArray(data.preferred_food_types)) {
            cleanFoodTypes = data.preferred_food_types;
          }
        } catch (e) {
          console.warn('⚠️ לא הצלחנו לפרק את סוגי האוכל, משתמשים במערך ריק');
          cleanFoodTypes = [];
        }
      }

      console.log('🍽️ סוגי אוכל נקיים:', cleanFoodTypes);

      // עדכון state עם נתונים נקיים - כולל השדות החדשים
      setPreferences({
        preferred_breakfast_time: data.preferred_breakfast_time || defaultTimes.breakfast,
        preferred_lunch_time: data.preferred_lunch_time || defaultTimes.lunch,
        preferred_dinner_time: data.preferred_dinner_time || defaultTimes.dinner,
        preferred_food_types: cleanFoodTypes, // 🔧 ודא שזה מערך
        // 🆕 העדפות אוכל לכל ארוחה
        breakfast_foods: data.breakfast_foods || [],
        lunch_foods: data.lunch_foods || [],
        dinner_foods: data.dinner_foods || [],
        max_distance_preference: data.max_distance_preference || 2000,
        min_rating_preference: data.min_rating_preference || 3.0
      });

      setLoading(false);
    } catch (error) {
      console.error('שגיאה בטעינת העדפות:', error);
      setLoading(false);
    }
  };

  // 🔧 פונקציה מתוקנת לשמירת העדפות - עם השדות החדשים
  const savePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      // ודא שסוגי האוכל הם מערך תקין (קוד קיים)
      const cleanFoodTypes = Array.isArray(preferences.preferred_food_types)
        ? preferences.preferred_food_types
        : [];

      const dataToSend = {
        email,
        preferred_breakfast_time: preferences.preferred_breakfast_time,
        preferred_lunch_time: preferences.preferred_lunch_time,
        preferred_dinner_time: preferences.preferred_dinner_time,
        preferred_food_types: cleanFoodTypes, // שלח כמערך פשוט
        // 🆕 הוספת השדות החדשים
        breakfast_foods: preferences.breakfast_foods || [],
        lunch_foods: preferences.lunch_foods || [],
        dinner_foods: preferences.dinner_foods || [],
        max_distance_preference: parseInt(preferences.max_distance_preference),
        min_rating_preference: parseFloat(preferences.min_rating_preference)
      };

      console.log('📤 שולח נתונים:', dataToSend);

      const response = await axios.post('http://localhost:8000/api/preferences/', dataToSend);

      setMessage(response.data.message || '✅ ההעדפות נשמרו בהצלחה');
      loadCurrentRecommendation();

    } catch (error) {
      setMessage('❌ שגיאה בשמירת ההעדפות');
      console.error('שגיאה בשמירה:', error);
    } finally {
      setSaving(false);
    }
  };

  const loadCurrentRecommendation = async () => {
    try {
      const lat = 32.0853;
      const lng = 34.7818;

      const response = await axios.get(
        `http://localhost:8000/api/recommendations/?email=${email}&lat=${lat}&lng=${lng}`
      );
      setCurrentRecommendation(response.data);
    } catch (error) {
      console.error('שגיאה בקבלת המלצות:', error);
    }
  };

  const handleTimeChange = (mealType, time) => {
    setPreferences(prev => ({
      ...prev,
      [`preferred_${mealType}_time`]: time
    }));
  };

  // 🆕 פונקציה לאיפוס שעת ארוחה לברירת מחדל
  const resetMealTime = (mealType) => {
    const defaultTime = defaultTimes[mealType];
    setPreferences(prev => ({
      ...prev,
      [`preferred_${mealType}_time`]: defaultTime
    }));

    setMessage(`🔄 שעת ${mealType === 'breakfast' ? 'ארוחת בוקר' : mealType === 'lunch' ? 'ארוחת צהריים' : 'ארוחת ערב'} אופסה ל-${defaultTime}`);
    setTimeout(() => setMessage(''), 3000);
  };

  // 🆕 פונקציה לאיפוס כל השעות
  const resetAllMealTimes = () => {
    setPreferences(prev => ({
      ...prev,
      preferred_breakfast_time: defaultTimes.breakfast,
      preferred_lunch_time: defaultTimes.lunch,
      preferred_dinner_time: defaultTimes.dinner
    }));

    setMessage('🔄 כל שעות הארוחות אופסו לברירת המחדל');
    setTimeout(() => setMessage(''), 3000);
  };

  // 🔧 פונקציה מתוקנת לטיפול בסוגי אוכל (קוד קיים - ללא שינוי)
  const handleFoodTypeToggle = (foodType) => {
    setPreferences(prev => {
      // ודא שזה תמיד מערך
      const currentTypes = Array.isArray(prev.preferred_food_types)
        ? prev.preferred_food_types
        : [];

      console.log('🔄 סוגי אוכל נוכחיים:', currentTypes);
      console.log('🎯 מתגלגל:', foodType);

      let newTypes;
      if (currentTypes.includes(foodType)) {
        // הסר את סוג האוכל
        newTypes = currentTypes.filter(type => type !== foodType);
        console.log('➖ מסיר:', foodType);
      } else {
        // הוסף את סוג האוכל
        newTypes = [...currentTypes, foodType];
        console.log('➕ מוסיף:', foodType);
      }

      console.log('🍽️ מערך חדש:', newTypes);

      return {
        ...prev,
        preferred_food_types: newTypes
      };
    });
  };

  // 🆕 פונקציה לטיפול בסוגי אוכל לכל ארוחה
  const handleMealFoodToggle = (mealType, foodType) => {
    const fieldName = `${mealType}_foods`;

    setPreferences(prev => {
      const currentTypes = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];

      console.log(`🔄 ${mealType} - סוגי אוכל נוכחיים:`, currentTypes);
      console.log(`🎯 מתגלגל: ${foodType}`);

      let newTypes;
      if (currentTypes.includes(foodType)) {
        newTypes = currentTypes.filter(type => type !== foodType);
        console.log(`➖ מסיר ${foodType} מ-${mealType}`);
      } else {
        newTypes = [...currentTypes, foodType];
        console.log(`➕ מוסיף ${foodType} ל-${mealType}`);
      }

      console.log(`🍽️ מערך חדש ל-${mealType}:`, newTypes);

      return {
        ...prev,
        [fieldName]: newTypes
      };
    });
  };

  // 🆕 פונקציות עזר
  const getCurrentMealType = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'breakfast';
    if (hour < 18) return 'lunch';
    return 'dinner';
  };

  const getMealIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      default: return '🍽️';
    }
  };

  const getMealName = (mealType) => {
    switch (mealType) {
      case 'breakfast': return 'ארוחת בוקר';
      case 'lunch': return 'ארוחת צהריים';
      case 'dinner': return 'ארוחת ערב';
      default: return 'ארוחה';
    }
  };

  if (loading) {
    return <div className="preferences-loading">טוען העדפות...</div>;
  }

  const currentMeal = getCurrentMealType();

  return (
    <div className="preferences-container">
      <div className="preferences-header">
        <h1>⚙️ ההעדפות שלי</h1>
        <p>הגדר את ההעדפות שלך לקבלת המלצות מותאמות אישית</p>
      </div>

      {/* המלצה נוכחית */}
      {currentRecommendation && (
        <div className="current-recommendation">
          <h3>🎯 ההמלצה שלך כרגע</h3>
          <p>{currentRecommendation.message}</p>
          <div className="recommendation-tags">
            <span className="tag">{currentRecommendation.meal_type}</span>
            <span className="tag">⭐ {currentRecommendation.min_rating}+</span>
            <span className="tag">📍 עד {currentRecommendation.max_distance}מ'</span>
          </div>
        </div>
      )}

      <div className="preferences-form">
        {/* הגדרת שעות ארוחות - עם כפתורי איפוס */}
        <section className="preferences-section">
          <div className="section-header">
            <h3>🕐 שעות הארוחות המועדפות שלי</h3>
            <button
              onClick={resetAllMealTimes}
              className="reset-all-btn"
              title="איפוס כל השעות לברירת מחדל"
            >
              🔄 איפוס כל השעות
            </button>
          </div>

          <div className="meal-times">
            <div className="meal-time-item">
              <div className="meal-time-header">
                <label>
                  <span className="meal-icon">🌅</span>
                  ארוחת בוקר
                </label>
                <button
                  onClick={() => resetMealTime('breakfast')}
                  className="reset-time-btn"
                  title="איפוס לברירת מחדל (09:00)"
                >
                  🔄
                </button>
              </div>
              <input
                type="time"
                value={preferences.preferred_breakfast_time || defaultTimes.breakfast}
                onChange={(e) => handleTimeChange('breakfast', e.target.value)}
              />
              <span className="default-hint">ברירת מחדל: {defaultTimes.breakfast}</span>
            </div>

            <div className="meal-time-item">
              <div className="meal-time-header">
                <label>
                  <span className="meal-icon">☀️</span>
                  ארוחת צהריים
                </label>
                <button
                  onClick={() => resetMealTime('lunch')}
                  className="reset-time-btn"
                  title="איפוס לברירת מחדל (13:00)"
                >
                  🔄
                </button>
              </div>
              <input
                type="time"
                value={preferences.preferred_lunch_time || defaultTimes.lunch}
                onChange={(e) => handleTimeChange('lunch', e.target.value)}
              />
              <span className="default-hint">ברירת מחדל: {defaultTimes.lunch}</span>
            </div>

            <div className="meal-time-item">
              <div className="meal-time-header">
                <label>
                  <span className="meal-icon">🌙</span>
                  ארוחת ערב
                </label>
                <button
                  onClick={() => resetMealTime('dinner')}
                  className="reset-time-btn"
                  title="איפוס לברירת מחדל (19:00)"
                >
                  🔄
                </button>
              </div>
              <input
                type="time"
                value={preferences.preferred_dinner_time || defaultTimes.dinner}
                onChange={(e) => handleTimeChange('dinner', e.target.value)}
              />
              <span className="default-hint">ברירת מחדל: {defaultTimes.dinner}</span>
            </div>
          </div>
        </section>

        {/* 🆕 סוגי אוכל מועדפים לכל ארוחה */}
        <section className="preferences-section">
          <h3>🍽️ מה אני אוהב לאכול בכל ארוחה?</h3>
          <p className="meal-foods-description">
            בחר את סוגי האוכל המועדפים עליך לכל ארוחה בנפרד. כך נוכל לתת לך המלצות מדויקות יותר!
          </p>

          {/* טאבים לבחירת ארוחה */}
          <div className="meal-tabs">
            {['breakfast', 'lunch', 'dinner'].map(meal => (
              <button
                key={meal}
                className={`meal-tab ${activeTab === meal ? 'active' : ''}`}
                onClick={() => setActiveTab(meal)}
              >
                {getMealIcon(meal)} {getMealName(meal)}
                {preferences[`${meal}_foods`] && preferences[`${meal}_foods`].length > 0 && (
                  <span className="food-count">({preferences[`${meal}_foods`].length})</span>
                )}
              </button>
            ))}
          </div>

          {/* רשת סוגי אוכל לארוחה הנבחרת */}
          <div className="food-types-grid">
            {foodTypesByCategory[activeTab].map(food => {
              const currentTypes = Array.isArray(preferences[`${activeTab}_foods`])
                ? preferences[`${activeTab}_foods`]
                : [];
              const isSelected = currentTypes.includes(food.value);

              return (
                <button
                  key={`${activeTab}-${food.value}`}
                  className={`food-type-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleMealFoodToggle(activeTab, food.value)}
                >
                  <span className="food-emoji">{food.emoji}</span>
                  <span className="food-label">{food.label}</span>
                </button>
              );
            })}
          </div>

          {/* סיכום בחירות עבור הארוחה הנוכחית */}
          {preferences[`${activeTab}_foods`] && preferences[`${activeTab}_foods`].length > 0 && (
            <div className="selected-foods-summary">
              <h4>✅ הבחירות שלך ל{getMealName(activeTab)}:</h4>
              <div className="selected-foods">
                {preferences[`${activeTab}_foods`].map(foodValue => {
                  const food = foodTypesByCategory[activeTab].find(f => f.value === foodValue);
                  return food ? (
                    <span key={foodValue} className="selected-food-tag">
                      {food.emoji} {food.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </section>

        {/* סוגי אוכל מועדפים - הקוד המקורי נשאר */}
        <section className="preferences-section">
          <h3>🍽️ סוגי האוכל המועדפים שלי (כללי)</h3>

          <div className="food-types-grid">
            {foodTypes.map(food => {
              // 🔧 ודא שבדיקה בטוחה
              const currentTypes = Array.isArray(preferences.preferred_food_types)
                ? preferences.preferred_food_types
                : [];
              const isSelected = currentTypes.includes(food.value);

              return (
                <button
                  key={food.value}
                  className={`food-type-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleFoodTypeToggle(food.value)}
                >
                  <span className="food-emoji">{food.emoji}</span>
                  <span className="food-label">{food.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* העדפות נוספות */}
        <section className="preferences-section">
          <h3>🎯 העדפות נוספות</h3>

          <div className="additional-preferences">
            <div className="preference-item">
              <label>
                📍 מרחק מקסימלי (מטרים)
              </label>
              <select
                value={preferences.max_distance_preference || 2000}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  max_distance_preference: parseInt(e.target.value)
                }))}
              >
                <option value={500}>500 מטר</option>
                <option value={1000}>1 ק"מ</option>
                <option value={2000}>2 ק"מ</option>
                <option value={3000}>3 ק"מ</option>
                <option value={5000}>5 ק"מ</option>
              </select>
            </div>

            <div className="preference-item">
              <label>
                ⭐ דירוג מינימלי
              </label>
              <select
                value={preferences.min_rating_preference || 3.0}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  min_rating_preference: parseFloat(e.target.value)
                }))}
              >
                <option value={0}>ללא דרישה</option>
                <option value={3.0}>3 כוכבים ומעלה</option>
                <option value={3.5}>3.5 כוכבים ומעלה</option>
                <option value={4.0}>4 כוכבים ומעלה</option>
                <option value={4.5}>4.5 כוכבים ומעלה</option>
              </select>
            </div>
          </div>
        </section>

        {/* כפתורי פעולה */}
        <div className="preferences-actions">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="save-btn"
          >
            {saving ? '💾 שומר...' : '💾 שמור העדפות'}
          </button>
          <button
            onClick={() => window.location.href = '/restaurants'}
            className="home-btn"
          >
            🏠 חזרה לעמוד הבית
          </button>
          <button
            onClick={() => window.history.back()}
            className="cancel-btn"
          >
            ביטול
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') || message.includes('🔄') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPreferences;