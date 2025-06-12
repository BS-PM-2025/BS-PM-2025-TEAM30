import React, { useState } from 'react';
import './AdminDashboard.css';
import StatisticsDashboard from './StatisticsDashboard';
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
    return <StatisticsDashboard onClose={() => setShowStats(false)} />;
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-header">
        <h1>🔧 לוח ניהול</h1>
        <p>ברוך הבא, מנהל. כאן תוכל לנהל את המערכת.</p>
      </div>

      <div className="admin-dashboard-sections">
        <div className="admin-card" onClick={() => window.location.href = '/docs.djangoproject.com/en/5.2/ref/contrib/admin/'}>
          <span className="admin-icon">🗂️</span>
          <h3>כניסה ל-Django Admin</h3>
          <p>ניהול ביקורות, משתמשים ותוכן.</p>
        </div>

        {/*<div className="admin-card" onClick={() => setShowStats(true)}>*/}
        {/*  <span className="admin-icon">📊</span>*/}
        {/*  <h3>סטטיסטיקות</h3>*/}
        {/*  <p>מעקב אחרי פעילות המשתמשים.</p>*/}
        {/*</div>*/}

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
