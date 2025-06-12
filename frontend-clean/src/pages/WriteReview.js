import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm/ReviewForm';
import './WriteReview.css';

const WriteReview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // קבלת פרטי המסעדה מה-URL parameters
    const name = searchParams.get('name');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!name || !lat || !lng) {
      alert('חסרים פרטי המסעדה');
      navigate('/restaurants');
      return;
    }

    setRestaurant({
      name: decodeURIComponent(name),
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    });
    setLoading(false);
  }, [searchParams, navigate]);

  const handleGoBack = () => {
    navigate('/restaurants');
  };

  const handleReviewSuccess = (review) => {
    console.log('ביקורת נשמרה:', review);
    alert('✅ הביקורת נשמרה בהצלחה!');
    navigate('/restaurants');
  };

  if (loading) {
    return (
      <div className="write-review-loading">
        <div className="loading-spinner"></div>
        <p>טוען...</p>
      </div>
    );
  }

  return (
    <div className="write-review-page">
      <div className="write-review-header">
        <button onClick={handleGoBack} className="back-btn">
          ← חזרה לעמוד הבית
        </button>
        <h1>✍️ כתיבת ביקורת</h1>
      </div>

      <div className="write-review-content">
        <div className="restaurant-info">
          <h2>🍽️ {restaurant.name}</h2>
          <p>שתף את החוויה שלך ועזור לאחרים לבחור!</p>
        </div>

        <ReviewForm
          restaurant={restaurant}
          onClose={handleGoBack}
          onSubmitSuccess={handleReviewSuccess}
        />
      </div>
    </div>
  );
};

export default WriteReview;