import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/forgot-password/', { email });
      setMessage('✔ קישור לשחזור נשלח למייל שלך');
    } catch (error) {
      setMessage('✖ שגיאה בשליחה. ודא שהמייל תקין.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="site-name">🍽 RouteBite</h2>
        <h3 className="login-title">שחזור סיסמה</h3>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="הכנס את האימייל שלך"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="button-base login-button">שלח קישור</button>
        </form>

        {message && (
          <p className={message.startsWith('✔') ? 'success-msg' : 'error-msg'}>{message}</p>
        )}

        <div className="login-links-row">
          <a href="/login">נזכרת? התחבר כאן</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
