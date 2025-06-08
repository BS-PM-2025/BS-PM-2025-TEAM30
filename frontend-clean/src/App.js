// frontend-clean/src/App.js - עדכון הקובץ הקיים
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import MapComponent from './components/MapComponent';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AddRestaurantPage from './pages/AddRestaurantPage';
import DetectRestaurant from './pages/DetectRestaurant';
import PendingRestaurantsPage from './pages/PendingRestaurantsPage';
import SavedRestaurants from './pages/SavedRestaurants';
import UserPreferences from './pages/UserPreferences'; // 🆕 קומפוננט חדש

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapComponent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/restaurants" element={<MapComponent />} />
        <Route path="/addrestaurant" element={<AddRestaurantPage />} />
        <Route path="/detect" element={<DetectRestaurant />} />
        <Route path="/pending" element={<PendingRestaurantsPage />} />
        <Route path="/saved" element={<SavedRestaurants />} />
        {/* 🆕 נתיב חדש להעדפות */}
        <Route path="/preferences" element={<UserPreferences />} />
      </Routes>
    </Router>
  );
}

export default App;