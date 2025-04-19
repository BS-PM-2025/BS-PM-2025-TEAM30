import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import AddRestaurantPage from './pages/AddRestaurantPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/addrestaurant" element={<AddRestaurantPage />} />
      </Routes>
    </Router>
  );
}

export default App;