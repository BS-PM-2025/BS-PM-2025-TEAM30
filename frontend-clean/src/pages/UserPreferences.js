// frontend-clean/src/pages/UserPreferences.js - תיקון הפונקציות הבעייתיות

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserPreferences.css';

const UserPreferences = () => {
  const [preferences, setPreferences] = useState({
    preferred_breakfast_time: '09:00',
    preferred_lunch_time: '13:00',
    preferred_dinner_time: '19:00',
    preferred_food_types: [], // 🔧 ודא שזה תמיד מערך
    max_distance_preference: 2000,
    min_rating_preference: 3.0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [currentRecommendation, setCurrentRecommendation] = useState(null);

  const email = localStorage.getItem('userEmail');

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

  useEffect(() => {
    if (!email) {
      window.location.href = '/login';
      return;
    }
    loadPreferences();
  }, [email]);

  // 🔧 פונקציה מתוקנת לטעינת העדפות
  const loadPreferences = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/preferences/?email=${email}`);
      const data = response.data;

      console.log('📥 נתונים שהתקבלו מהשרת:', data);

      // 🔧 ניקוי וטיפול בסוגי האוכל
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

      // עדכון state עם נתונים נקיים
      setPreferences({
        preferred_breakfast_time: data.preferred_breakfast_time || '09:00',
        preferred_lunch_time: data.preferred_lunch_time || '13:00',
        preferred_dinner_time: data.preferred_dinner_time || '19:00',
        preferred_food_types: cleanFoodTypes, // 🔧 ודא שזה מערך
        max_distance_preference: data.max_distance_preference || 2000,
        min_rating_preference: data.min_rating_preference || 3.0
      });

      setLoading(false);
    } catch (error) {
      console.error('שגיאה בטעינת העדפות:', error);
      setLoading(false);
    }
  };

  // 🔧 פונקציה מתוקנת לשמירת העדפות
  const savePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      // ודא שסוגי האוכל הם מערך תקין
      const cleanFoodTypes = Array.isArray(preferences.preferred_food_types)
        ? preferences.preferred_food_types
        : [];

      const dataToSend = {
        email,
        preferred_breakfast_time: preferences.preferred_breakfast_time,
        preferred_lunch_time: preferences.preferred_lunch_time,
        preferred_dinner_time: preferences.preferred_dinner_time,
        preferred_food_types: cleanFoodTypes, // שלח כמערך פשוט
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

  // 🔧 פונקציה מתוקנת לטיפול בסוגי אוכל
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

  if (loading) {
    return <div className="preferences-loading">טוען העדפות...</div>;
  }

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
        {/* הגדרת שעות ארוחות */}
        <section className="preferences-section">
          <h3>🕐 שעות הארוחות המועדפות שלי</h3>

          <div className="meal-times">
            <div className="meal-time-item">
              <label>
                <span className="meal-icon">🌅</span>
                ארוחת בוקר
              </label>
              <input
                type="time"
                value={preferences.preferred_breakfast_time || '09:00'}
                onChange={(e) => handleTimeChange('breakfast', e.target.value)}
              />
            </div>

            <div className="meal-time-item">
              <label>
                <span className="meal-icon">☀️</span>
                ארוחת צהריים
              </label>
              <input
                type="time"
                value={preferences.preferred_lunch_time || '13:00'}
                onChange={(e) => handleTimeChange('lunch', e.target.value)}
              />
            </div>

            <div className="meal-time-item">
              <label>
                <span className="meal-icon">🌙</span>
                ארוחת ערב
              </label>
              <input
                type="time"
                value={preferences.preferred_dinner_time || '19:00'}
                onChange={(e) => handleTimeChange('dinner', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* סוגי אוכל מועדפים */}
        <section className="preferences-section">
          <h3>🍽️ סוגי האוכל המועדפים שלי</h3>

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
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPreferences;