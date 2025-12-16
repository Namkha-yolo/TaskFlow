import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Assignments from './pages/Assignments';
import GradeCalculator from './pages/GradeCalculator';
import StudyTimer from './pages/StudyTimer';
import Login from './pages/Login';
import Register from './pages/Register';
import SyllabusUpload from './pages/SyllabusUpload';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
      <div className="spinner"></div>
    </div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
      <div className="spinner"></div>
    </div>;
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="App">
        <Navigation user={user} />
        <div className="main-container">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            } />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />

            {/* Protected Routes */}
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
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <CourseProvider>
        <AppRoutes />
      </CourseProvider>
    </AuthProvider>
  );
}

export default App;
