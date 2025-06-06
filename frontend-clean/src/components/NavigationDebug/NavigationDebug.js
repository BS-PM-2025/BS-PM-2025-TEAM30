// frontend-clean/src/components/NavigationDebug/NavigationDebug.js
import React, { useState } from 'react';

const NavigationDebug = ({
  origin,
  destination,
  directions,
  isNavigating,
  userLocation,
  error
}) => {
  const [showDebug, setShowDebug] = useState(false);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      zIndex: 3000
    }}>
      <button
        onClick={() => setShowDebug(!showDebug)}
        style={{
          background: '#2196f3',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        🔧 דיבוג ניווט
      </button>

      {showDebug && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '0',
          background: 'rgba(0,0,0,0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          fontSize: '12px',
          minWidth: '300px',
          fontFamily: 'monospace'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#4caf50' }}>🔍 מצב הניווט</h4>

          <div style={{ marginBottom: '8px' }}>
            <strong>📍 מיקום מוצא:</strong><br/>
            {origin ? `${origin.lat.toFixed(6)}, ${origin.lng.toFixed(6)}` : '❌ לא זמין'}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong>🎯 יעד:</strong><br/>
            {destination ? `${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}` : '❌ לא זמין'}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong>👤 מיקום נוכחי:</strong><br/>
            {userLocation ? `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}` : '❌ לא זמין'}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong>🗺️ מסלול:</strong><br/>
            {directions ? (
              <span style={{ color: '#4caf50' }}>
                ✅ נטען ({directions.routes[0].legs[0].steps.length} שלבים)
              </span>
            ) : (
              <span style={{ color: '#f44336' }}>❌ לא נטען</span>
            )}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong>🚗 מצב ניווט:</strong><br/>
            <span style={{ color: isNavigating ? '#4caf50' : '#ff9800' }}>
              {isNavigating ? '✅ פעיל' : '⏸️ מושהה'}
            </span>
          </div>

          {error && (
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#f44336' }}>❌ שגיאה:</strong><br/>
              <span style={{ color: '#f44336' }}>{error}</span>
            </div>
          )}

          <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #333' }}>
            <strong>🔧 פעולות דיבוג:</strong><br/>
            <button
              onClick={() => {
                console.log('🔍 DEBUG INFO:', {
                  origin,
                  destination,
                  userLocation,
                  directions,
                  isNavigating,
                  error,
                  googleMaps: window.google?.maps ? '✅ זמין' : '❌ לא זמין'
                });
              }}
              style={{
                background: '#ff9800',
                color: 'white',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '10px',
                marginTop: '5px'
              }}
            >
              📋 הדפס לקונסול
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationDebug;