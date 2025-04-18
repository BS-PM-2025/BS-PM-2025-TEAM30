import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import MapComponent from './components/MapComponent';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/restaurants" element={
          <div>
            <h2>מסעדות לפי השעה</h2>
            <MapComponent />
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;

