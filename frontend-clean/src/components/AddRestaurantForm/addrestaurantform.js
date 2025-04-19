import React, { useState } from 'react';
import './AddRestaurantForm.css';

const AddRestaurantForm = () => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('http://127.0.0.1:8000/api/restaurants/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          location,
          phone,
          description,
          website,
        }),
      });

      if (res.ok) {
        setStatus('✅ המסעדה נוספה בהצלחה');
        setName('');
        setLocation('');
        setPhone('');
        setDescription('');
        setWebsite('');
      } else {
        setStatus('❌ שגיאה בהוספה');
      }
    } catch (err) {
      setStatus('❌ שגיאת שרת');
    }
  };

  return (
    <div className="form-container">
      <h2>🍽️ הוספת מסעדה חדשה</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="שם מסעדה"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="כתובת / מיקום"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="טלפון"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          type="text"
          placeholder="תיאור קצר"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="url"
          placeholder="כתובת אתר"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <button type="submit" style={{ marginTop: '10px' }}>הוסף</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
};

export default AddRestaurantForm;