import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import MapComponent from './components/MapComponent';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AddRestaurantPage from './pages/AddRestaurantPage';
import DetectRestaurant from './pages/DetectRestaurant';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurants" element={<MapComponent />} />
        <Route path="/addrestaurant" element={<AddRestaurantPage />} />
        <Route path="/detect" element={<DetectRestaurant />} />
      </Routes>
    </Router>
  );
}

export default App;

