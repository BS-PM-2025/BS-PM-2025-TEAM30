import React, { useState } from 'react';
import './ReviewForm.css';

const ReviewForm = ({
  restaurant,
  onClose,
  onSubmitSuccess
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userEmail = localStorage.getItem('userEmail');

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userEmail) {
      setError('נדרש להתחבר כדי לכתוב ביקורת');
      return;
    }

    if (formData.rating === 0) {
      setError('נדרש לבחור דירוג');
      return;
    }

    if (formData.content.trim().length < 10) {
      setError('הביקורת חייבת להכיל לפחות 10 תווים');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/reviews/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_email: userEmail,
          restaurant_name: restaurant.name,
          restaurant_lat: restaurant.lat,
          restaurant_lng: restaurant.lng,
          rating: formData.rating,
          title: formData.title.trim(),
          content: formData.content.trim(),
          tags: formData.tags.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ הביקורת נשמרה בהצלחה!');
        if (onSubmitSuccess) onSubmitSuccess(data.review);
        onClose();
      } else {
        setError(data.error || 'שגיאה בשמירת הביקורת');
      }
    } catch (err) {
      setError('שגיאה בהתחברות לשרת');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form-overlay">
      <div className="review-form-container">
        <div className="review-form-header">
          <h2>✍️ כתוב ביקורת על {restaurant.name}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit} className="review-form">
          {/* דירוג בכוכבים */}
          <div className="rating-section">
            <label>איך המסעדה? *</label>
            <div className="stars-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${formData.rating >= star ? 'selected' : ''}`}
                  onClick={() => handleRatingClick(star)}
                >
                  ⭐
                </button>
              ))}
            </div>
            <span className="rating-text">
              {formData.rating === 0 && 'בחר דירוג'}
              {formData.rating === 1 && '⭐ גרוע'}
              {formData.rating === 2 && '⭐⭐ לא טוב'}
              {formData.rating === 3 && '⭐⭐⭐ בסדר'}
              {formData.rating === 4 && '⭐⭐⭐⭐ טוב'}
              {formData.rating === 5 && '⭐⭐⭐⭐⭐ מעולה!'}
            </span>
          </div>

          {/* כותרת (אופציונלי) */}
          <div className="form-group">
            <label htmlFor="title">כותרת לביקורת (אופציונלי)</label>
            <input
              type="text"
              id="title"
              maxLength={100}
              placeholder="למשל: 'שירות מצוין!' או 'אוכל טעים'"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* תוכן הביקורת */}
          <div className="form-group">
            <label htmlFor="content">ספר לנו על החוויה שלך *</label>
            <textarea
              id="content"
              required
              minLength={10}
              maxLength={1000}
              rows={4}
              placeholder="איך היה האוכל? השירות? האווירה? מה היה מיוחד?"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            />
            <small>{formData.content.length}/1000 תווים</small>
          </div>

          {/* תגיות (אופציונלי) */}
          <div className="form-group">
            <label htmlFor="tags">תגיות (אופציונלי)</label>
            <input
              type="text"
              id="tags"
              placeholder="למשל: טעים, מהיר, יקר, כשר"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            />
            <small>הפרד תגיות בפסיקים</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* כפתורי פעולה */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || formData.rating === 0}
              className="submit-btn"
            >
              {loading ? '⏳ שומר...' : '📝 פרסם ביקורת'}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewForm;