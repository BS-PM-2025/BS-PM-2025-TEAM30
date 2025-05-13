import React, { useEffect, useState } from 'react';

const PendingRestaurantsPage = () => {
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/restaurants/pending/")
      .then(res => res.json())
      .then(data => {
        setPendingRestaurants(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("שגיאה בעת טעינת מסעדות בהמתנה", err);
        setLoading(false);
      });
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch("http://localhost:8000/api/restaurants/approve/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, action }),
      });

      if (!res.ok) throw new Error(`${action} failed`);

      // מסיר את המסעדה מהתצוגה
      setPendingRestaurants(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("שגיאה בפעולה:", err);
      alert("פעולה נכשלה. נסה שוב.");
    }
  };

  const handleApprove = (id) => handleAction(id, "approve");
  const handleReject = (id) => handleAction(id, "reject");

  if (loading) return <p>טוען מסעדות בהמתנה...</p>;
  if (pendingRestaurants.length === 0) return <p>אין מסעדות שממתינות לאישור.</p>;

  return (
    <div style={{ padding: '30px', backgroundColor: '#e4f1f9', minHeight: '100vh' }}>
      <h2 style={{ textAlign: 'right' }}>מסעדות ממתינות לאישור</h2>
      <table style={{ width: '100%', direction: 'rtl', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>שם</th>
            <th>כתובת</th>
            <th>טלפון</th>
            <th>אישור</th>
            <th>סירוב</th>
          </tr>
        </thead>
        <tbody>
          {pendingRestaurants.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.address}</td>
              <td>{r.phone}</td>
              <td>
                <button onClick={() => handleApprove(r.id)} style={{ backgroundColor: '#4CAF50', color: 'white' }}>✅ אשר</button>
              </td>
              <td>
                <button onClick={() => handleReject(r.id)} style={{ backgroundColor: '#f44336', color: 'white' }}>❌ סרב</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PendingRestaurantsPage;