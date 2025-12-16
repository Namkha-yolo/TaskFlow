import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaBook } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <Navbar className="navbar-taskflow" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to={isAuthenticated ? "/dashboard" : "/"}>
          <FaBook className="brand-icon me-2" />
          TaskFlow
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbar-nav" />

        <Navbar.Collapse id="navbar-nav">
          {isAuthenticated ? (
            <>
              <Nav className="mx-auto">
                <Nav.Link as={Link} to="/dashboard" className={isActive('/dashboard')}>
                  Overview
                </Nav.Link>
                <Nav.Link as={Link} to="/courses" className={isActive('/courses')}>
                  Schedule
                </Nav.Link>
                <Nav.Link as={Link} to="/assignments" className={isActive('/assignments')}>
                  Assignments
                </Nav.Link>
              </Nav>

              <Nav>
                <div
                  className="user-avatar"
                  onClick={handleLogout}
                  style={{ cursor: 'pointer' }}
                  title="Click to logout"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="user-avatar"
                    />
                  ) : (
                    <div className="user-avatar d-flex align-items-center justify-content-center">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </Nav>
            </>
          ) : (
            <>
              <Nav className="mx-auto">
                <Nav.Link as={Link} to="/" className={isActive('/')}>
                  Overview
                </Nav.Link>
                <Nav.Link as={Link} to="/features">
                  Schedule
                </Nav.Link>
                <Nav.Link as={Link} to="/about">
                  Assignments
                </Nav.Link>
              </Nav>
              <Nav>
                <Nav.Link as={Link} to="/login" className="btn-login">
                  Log in
                </Nav.Link>
              </Nav>
            </>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
