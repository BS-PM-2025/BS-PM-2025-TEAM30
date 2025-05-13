// src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import {useNavigate} from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/api/login/', form);
      localStorage.setItem('userEmail', form.email);
      setSuccess(res.data.message || 'התחברת בהצלחה!');
      navigate('restaurants');

    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בהתחברות 😥');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🔐 התחברות</h1>
        <input
          type="email"
          name="email"
          placeholder="אימייל"
          value={form.email}
          onChange={handleChange}
        />
        <input
          type="password"
          name="password"
          placeholder="סיסמה"
          value={form.password}
          onChange={handleChange}
        />
        <button onClick={handleSubmit}>התחבר</button>
        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}
        <p>
        <a href="/forgot-password">?שכחת סיסמה</a>
        </p>
        <span className="register-link">לא רשום עדיין? <a href="/register">הירשם כאן</a> 📝</span>
      </div>
    </div>
  );
};

export default Login;
