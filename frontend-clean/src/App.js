import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import ReportForm from './components/Report/ReportForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/report" element={<ReportForm />} />
      </Routes>
    </Router>
  );
}

export default App;