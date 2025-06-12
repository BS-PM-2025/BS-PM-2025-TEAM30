// src/pages/BroadcastMessage.js
import React, { useState } from 'react';
import './BroadcastMessage.css';

const BroadcastMessage = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setTitle('');
    setMessage('');
  };

  return (
    <div className="broadcast-container">
      <h2>📢 שליחת הודעה מערכתית</h2>
      <form onSubmit={handleSubmit}>
        <label>כותרת ההודעה:</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <label>תוכן ההודעה:</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required />

        <button type="submit">שלח הודעה</button>
      </form>

      {sent && <div className="success-msg">✅ ההודעה נשלחה בהצלחה </div>}
    </div>
  );
};

export default BroadcastMessage;
