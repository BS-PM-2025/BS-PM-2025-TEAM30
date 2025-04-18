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
    <div className="forgot-password-container">
      <form onSubmit={handleSubmit} className="form-box">
        <h2>שחזור סיסמה</h2>
        <input
          type="email"
          placeholder="הכנס אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">שלח קישור</button>
        <p className="message">{message}</p>
                <span className="login-link">נזכרת? <a href="/login">התחבר כאן</a> </span>
      </form>

    </div>

  );
};

export default ForgotPassword;
