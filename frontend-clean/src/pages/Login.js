import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import { useNavigate, Link } from "react-router-dom";

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
      navigate('/restaurants');
    } catch (err) {
      console.error('שגיאת התחברות:', err);
      setError(err.response?.data?.error || 'שגיאה בהתחברות 😥');
    }
  };

  const skipLogin = () => {
    navigate('/restaurants');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="site-name">🍽 RouteBite</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="אימייל"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="סיסמה"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" className="button-base login-button">התחבר</button>
          <button type="button" onClick={skipLogin} className="button-base skip-login-button">המשך ללא התחברות</button>
        </form>

        {error && <p className="error-msg">{error}</p>}
        {success && <p className="success-msg">{success}</p>}

        {/* ✅ לינקים בשורה אחת */}
       <div className="login-links-row">
  <Link to="/forgot-password" className="login-link">שכחת סיסמה?</Link>
  <span className="register-link">לא רשום עדיין? <Link to="/register">הירשם כאן 📝</Link></span>
</div>

      </div>
    </div>
  );
};

export default Login;
