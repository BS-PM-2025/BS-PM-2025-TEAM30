import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';

const ResetPassword = () => {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('❌ הסיסמאות אינן תואמות');
      return;
    }

    try {
      await axios.post('http://localhost:8000/api/reset-password/', {
        uid,
        token,
        password,
      });
      setMessage('✅ הסיסמה עודכנה בהצלחה!');
    } catch (error) {
      setMessage('❌ הקישור אינו תקף או פג תוקף.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="site-name">🍽 RouteBite</h2>
        <h3 className="login-title">איפוס סיסמה</h3>

        <form onSubmit={handleReset}>
          <input
            type="password"
            placeholder="סיסמה חדשה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="אימות סיסמה"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className="button-base login-button">אפס סיסמה</button>
        </form>

        {message && (
          <p className={message.startsWith('✅') ? 'success-msg' : 'error-msg'}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
