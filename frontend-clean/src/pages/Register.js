import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/api/register/', form);
      alert('נרשמת בהצלחה!');
      setForm({ email: '', first_name: '', last_name: '', password: '' });
    } catch (err) {
      console.error(err);
      setError('אירעה שגיאה בהרשמה 😥');
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h1>🍽️ <strong>RouteBite</strong></h1>
        <p>מצא את הדרך המהירה ביותר לאוכל הכי שווה 🍔📍🧭</p>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="אימייל"
            value={form.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="first_name"
            placeholder="שם פרטי"
            value={form.first_name}
            onChange={handleChange}
          />
          <input
            type="text"
            name="last_name"
            placeholder="שם משפחה"
            value={form.last_name}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="סיסמה"
            value={form.password}
            onChange={handleChange}
          />
          <button type="submit">הרשמה</button>
        </form>

        <span className="login-link">👤 כבר רשום? התחבר כאן</span>
      </div>
    </div>
  );
};

export default Register;
