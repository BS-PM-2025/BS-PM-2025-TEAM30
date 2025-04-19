import './ReportForm.css';
import React, { useState } from 'react';

console.log("📩 ReportForm loaded");

const ReportForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/report/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
      });

      const result = await res.json();
      setStatus(result.status || result.error || 'התקבלה תגובה');
      setEmail('');
      setMessage('');
    } catch (err) {
      setStatus('שגיאה בשליחה לשרת');
    }
  };

  return (
  <div className="report-form-container">
    <h2>📢 דווח על תקלה</h2>
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="המייל שלך"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <br />
      <textarea
        placeholder="מה התקלה?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <br />
      <button type="submit">שלח דיווח</button>
    </form>
    {status && <p>{status}</p>}
  </div>
  );
};

export default ReportForm;