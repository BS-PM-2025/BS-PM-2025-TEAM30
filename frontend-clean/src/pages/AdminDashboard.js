import React, { useState } from 'react';
import './AdminDashboard.css';
import SystemLog from './SystemLog';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const email = localStorage.getItem('userEmail');
  const isAdmin = email === 'adistamker88@gmail.com';
  const [showStats, setShowStats] = useState(false);

  if (!isAdmin) {
    return (
      <div className="admin-dashboard-error">
        <h2>⛔ גישה נדחתה</h2>
        <p>רק מנהל יכול לגשת לעמוד זה.</p>
      </div>
    );
  }

  if (showStats) {
    return <SystemLog onClose={() => setShowStats(false)} />;
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <h1>🔧 לוח ניהול</h1>
        <p>ברוך הבא, מנהל. כאן תוכל לנהל את המערכת.</p>
      </div>

      <div className="admin-dashboard-sections">
        <div className="admin-card" onClick={() => window.location.href = 'https://docs.djangoproject.com/en/5.2/ref/contrib/admin/'}>
          <span className="admin-icon">🗂️</span>
          <h3>כניסה ל-Django Admin</h3>
          <p>ניהול ביקורות, משתמשים ותוכן.</p>
        </div>

        <div className="admin-card" onClick={() => window.location.href = '/system-log'}>
  <span className="admin-icon">📘</span>
  <h3>יומן מערכת</h3>
  <p>סקירת פעולות ובדיקת תקלות.</p>
</div>
<div className="admin-card" onClick={() => window.location.href = '/broadcast'}>
  <span className="admin-icon">📢</span>
  <h3>הודעה כללית</h3>
  <p>שליחת הודעה לכל המשתמשים באפליקציה.</p>
</div>


        <div className="admin-card" onClick={() => window.location.href = '/my-reviews'}>
          <span className="admin-icon">💬</span>
          <h3>פידבקים</h3>
          <p>צפייה בפידבק מהמשתמשים.</p>
        </div>

        <div className="admin-card" onClick={() => window.location.href = '/Pending'}>
          <span className="admin-icon">📝</span>
          <h3>מסעדות ממתינות לאישור</h3>
          <p>שליטה על תוכן שיוצג באפליקציה.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
