import React, { useState, useEffect } from 'react';
import './MyReviews.css';

const MyReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReview, setEditingReview] = useState(null);

  const userEmail = localStorage.getItem('userEmail');

  useEffect(() => {
    if (!userEmail) {
      window.location.href = '/login';
      return;
    }
    fetchMyReviews();
  }, [userEmail]);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/reviews/all/?user_email=${userEmail}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
      } else {
        setError('שגיאה בטעינת הביקורות');
      }
    } catch (err) {
      setError('שגיאה בהתחברות לשרת');
    } finally {
      setLoading(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview({
      ...review,
      originalRating: review.rating,
      originalContent: review.content,
      originalTitle: review.title || ''
    });
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/reviews/update/${editingReview.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: userEmail,
          rating: editingReview.rating,
          title: editingReview.title,
          content: editingReview.content
        }),
      });

      if (response.ok) {
        alert('✅ הביקורת עודכנה בהצלחה!');
        setEditingReview(null);
        fetchMyReviews();
      } else {
        const data = await response.json();
        alert(`❌ שגיאה: ${data.error || 'לא הצלחנו לעדכן'}`);
      }
    } catch (err) {
      alert('❌ שגיאה בעדכון הביקורת');
    }
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
  };

  const handleDeleteReview = async (reviewId, restaurantName) => {
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את הביקורת על ${restaurantName}?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/reviews/delete/${reviewId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email: userEmail }),
      });

      if (response.ok) {
        alert('✅ הביקורת נמחקה בהצלחה!');
        fetchMyReviews();
      } else {
        const data = await response.json();
        alert(`❌ שגיאה: ${data.error || 'לא הצלחנו למחוק'}`);
      }
    } catch (err) {
      alert('❌ שגיאה במחיקת הביקורת');
    }
  };

  const renderStars = (rating, isEditing = false, onChange = null) => {
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : 'empty'} ${isEditing ? 'editable' : ''}`}
            onClick={isEditing ? () => onChange(star) : undefined}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  if (loading) {
    return (
      <div className="my-reviews-loading">
        <div className="loading-spinner"></div>
        <p>טוען את הביקורות שלך...</p>
      </div>
    );
  }

  return (
    <div className="my-reviews-container">
      <div className="my-reviews-header">
        <button
          onClick={() => window.location.href = '/restaurants'}
          className="back-btn"
        >
          ← חזרה לעמוד הבית
        </button>
        <h1>📝 הביקורות שלי</h1>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchMyReviews} className="retry-btn">נסה שוב</button>
        </div>
      )}

      {!error && reviews.length === 0 && (
        <div className="no-reviews">
          <div className="no-reviews-icon">✍️</div>
          <h3>עדיין לא כתבת ביקורות</h3>
          <p>לך לעמוד הבית וכתוב ביקורת על מסעדה שביקרת בה!</p>
          <button
            onClick={() => window.location.href = '/restaurants'}
            className="explore-btn"
          >
            🔍 חפש מסעדות
          </button>
        </div>
      )}

      {!error && reviews.length > 0 && (
        <div className="reviews-content">
          <div className="reviews-stats">
            <p>כתבת {reviews.length} ביקורות עד כה</p>
          </div>

          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <h3>{review.restaurant_name}</h3>
                  <span className="review-date">{formatDate(review.created_at)}</span>
                </div>

                {editingReview && editingReview.id === review.id ? (
                  // מצב עריכה
                  <div className="edit-mode">
                    <div className="edit-rating">
                      <label>דירוג:</label>
                      {renderStars(
                        editingReview.rating,
                        true,
                        (rating) => setEditingReview({...editingReview, rating})
                      )}
                    </div>

                    <div className="edit-title">
                      <label>כותרת:</label>
                      <input
                        type="text"
                        value={editingReview.title}
                        onChange={(e) => setEditingReview({...editingReview, title: e.target.value})}
                        placeholder="כותרת לביקורת"
                        maxLength={100}
                      />
                    </div>

                    <div className="edit-content">
                      <label>תוכן הביקורת:</label>
                      <textarea
                        value={editingReview.content}
                        onChange={(e) => setEditingReview({...editingReview, content: e.target.value})}
                        placeholder="ספר על החוויה שלך..."
                        rows={4}
                        maxLength={1000}
                      />
                    </div>

                    <div className="edit-actions">
                      <button onClick={handleSaveEdit} className="save-btn">
                        💾 שמור שינויים
                      </button>
                      <button onClick={handleCancelEdit} className="cancel-btn">
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  // מצב צפייה רגיל
                  <div className="view-mode">
                    <div className="review-rating">
                      {renderStars(review.rating)}
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

                    <div className="review-actions">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="edit-btn"
                      >
                        ✏️ ערוך
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id, review.restaurant_name)}
                        className="delete-btn"
                      >
                        🗑️ מחק
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviews;