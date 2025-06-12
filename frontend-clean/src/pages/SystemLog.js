// src/pages/SystemLog.js
import React from 'react';
import './SystemLog.css';

const logs = [
  { type: 'info', message: 'משתמש חדש נרשם למערכת', time: '2025-06-12 14:32' },
  { type: 'warning', message: 'מסעדה ממתינה לאישור', time: '2025-06-12 12:15' },
  { type: 'error', message: 'שגיאה בשליחת פידבק', time: '2025-06-11 19:00' },
  { type: 'info', message: 'הוספה מסעדה חדשה - "פלאפל גולד"', time: '2025-06-11 16:45' }
];

const getIcon = (type) => {
  switch (type) {
    case 'info': return 'ℹ️';
    case 'warning': return '⚠️';
    case 'error': return '❌';
    default: return '📄';
  }
};

const SystemLog = () => {
  return (
    <div className="system-log-container">
      <h2>📘 יומן מערכת</h2>
      <p>רשימת פעולות אחרונות במערכת</p>
      <ul className="log-list">
        {logs.map((log, index) => (
          <li key={index} className={`log-item ${log.type}`}>
            <span className="log-icon">{getIcon(log.type)}</span>
            <div className="log-content">
              <p className="log-message">{log.message}</p>
              <span className="log-time">{log.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SystemLog;
