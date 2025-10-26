import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Assignments from './pages/Assignments';
import GradeCalculator from './pages/GradeCalculator';
import StudyTimer from './pages/StudyTimer';
import Login from './pages/Login';
import Register from './pages/Register';
import SyllabusUpload from './pages/SyllabusUpload';

// Context
import { AuthProvider } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserInfo(token);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  return (
    <AuthProvider>
      <CourseProvider>
        <Router>
          <div className="App">
            <Navigation user={user} setUser={setUser} />
            <Container fluid className="main-container">
              <Routes>
                <Route path="/login" element={<Login setUser={setUser} />} />
                <Route path="/register" element={<Register setUser={setUser} />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/courses" element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                } />
                <Route path="/assignments" element={
                  <ProtectedRoute>
                    <Assignments />
                  </ProtectedRoute>
                } />
                <Route path="/syllabus-upload" element={
                  <ProtectedRoute>
                    <SyllabusUpload />
                  </ProtectedRoute>
                } />
                <Route path="/grade-calculator" element={
                  <ProtectedRoute>
                    <GradeCalculator />
                  </ProtectedRoute>
                } />
                <Route path="/study-timer" element={
                  <ProtectedRoute>
                    <StudyTimer />
                  </ProtectedRoute>
                } />
              </Routes>
            </Container>
            <ToastContainer position="bottom-right" />
          </div>
        </Router>
      </CourseProvider>
    </AuthProvider>
  );
}

export default App;
