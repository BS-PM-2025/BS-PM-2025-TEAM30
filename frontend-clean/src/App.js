import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

      </Routes>
    </Router>
  );
}

export default App;
