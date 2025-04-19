import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import AddRestaurantPage from './pages/AddRestaurantPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/addrestaurant" element={<AddRestaurantPage />} />
      </Routes>
    </Router>
  );
}

export default App;
