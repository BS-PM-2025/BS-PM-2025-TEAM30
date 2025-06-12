// src/pages/StatisticsDashboard.js
import React from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const StatisticsDashboard = () => {
  const visitsData = [
    { month: 'ינואר', visits: 100 },
    { month: 'פברואר', visits: 120 },
    { month: 'מרץ', visits: 90 },
    { month: 'אפריל', visits: 140 },
    { month: 'מאי', visits: 180 },
  ];

  const actionsData = [
    { action: 'הזמנות', count: 300 },
    { action: 'צפיות', count: 500 },
    { action: 'תגובות', count: 200 },
    { action: 'שיתופים', count: 100 },
  ];

  const pieData = [
    { name: 'מסעדות', value: 400 },
    { name: 'בתי קפה', value: 300 },
    { name: 'ברים', value: 300 },
    { name: 'חנויות אוכל', value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div style={{ padding: '40px', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      <h1>📊 לוח סטטיסטיקות</h1>

      <div style={{ marginTop: '40px' }}>
        <h2>📈 ביקורים חודשיים</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={visitsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="visits" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>📊 פעולות שבוצעו</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={actionsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="action" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>🥧 סוגי עסקים באפליקציה</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
