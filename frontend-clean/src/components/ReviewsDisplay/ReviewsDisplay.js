import React, { useState, useEffect } from 'react';
import './ReviewsDisplay.css';

const ReviewsDisplay = ({ restaurant, onClose }) => {
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [restaurant]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        restaurant_name: restaurant.name,
        restaurant_lat: restaurant.lat.toString(),
        restaurant_lng: restaurant.lng.toString()
      });

      const response = await fetch(`http://localhost:8000/api/reviews/restaurant/?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReviewsData(data);
      } else {
        setError(data.error || 'שגיאה בטעינת ביקורות');
      }
    } catch (err) {
      setError('שגיאה בהתחברות לשרת');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : 'empty'}`}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'היום';
    if (diffDays === 2) return 'אתמול';
    if (diffDays <= 7) return `לפני ${diffDays} ימים`;
    if (diffDays <= 30) return `לפני ${Math.ceil(diffDays / 7)} שבועות`;

    return date.toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="reviews-overlay">
        <div className="reviews-container">
          <div className="loading-reviews">
            <div className="loading-spinner"></div>
            <p>טוען ביקורות...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-overlay">
      <div className="reviews-container">
        <div className="reviews-header">
          <h2>📝 ביקורות על {restaurant.name}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error ? (
          <div className="reviews-error">
            <p>{error}</p>
            <button onClick={fetchReviews} className="retry-btn">נסה שוב</button>
          </div>
        ) : (
          <div className="reviews-content">
            {/* סיכום כללי */}
            <div className="reviews-summary">
              <div className="summary-rating">
                <div className="average-rating">
                  <span className="rating-number">{reviewsData.average_rating}</span>
                  <div className="rating-stars">
                    {renderStars(Math.round(reviewsData.average_rating))}
                  </div>
                </div>
                <p className="total-reviews">
                  {reviewsData.total_reviews} ביקורות מהאתר שלנו
                </p>
              </div>

              {/* פילוח דירוגים */}
              <div className="rating-breakdown">
                <h4>פילוח דירוגים:</h4>
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = reviewsData.rating_breakdown[rating.toString()] || 0;
                  const percentage = reviewsData.total_reviews > 0
                    ? (count / reviewsData.total_reviews * 100).toFixed(0)
                    : 0;

                  return (
                    <div key={rating} className="rating-bar">
                      <span className="rating-label">{rating} ⭐</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="rating-count">({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* רשימת ביקורות */}
            <div className="reviews-list">
              <h3>ביקורות אחרונות:</h3>

              {reviewsData.recent_reviews.length === 0 ? (
                <div className="no-reviews">
                  <div className="no-reviews-icon">📝</div>
                  <p>עדיין אין ביקורות על המסעדה הזאת</p>
                  <p>היה הראשון לכתוב ביקורת!</p>
                </div>
              ) : (
                <div className="reviews-cards">
                  {reviewsData.recent_reviews.map((review) => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <span className="reviewer-name">
                            {review.user_first_name}
                          </span>
                          <span className="review-date">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        <div className="review-rating">
                          {renderStars(review.rating)}
                        </div>
                      </div>

                      {review.title && (
                        <h4 className="review-title">{review.title}</h4>
                      )}

                      <p className="review-content">{review.content}</p>

                      {review.tags && (
                        <div className="review-tags">
                          {review.tags.split(',').map((tag, index) => (
                            <span key={index} className="tag">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsDisplay;