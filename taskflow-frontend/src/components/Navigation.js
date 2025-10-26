import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const Navigation = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <Navbar className="navbar-custom" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          📚 TaskFlow
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbar-nav" />
        
        <Navbar.Collapse id="navbar-nav">
          {user ? (
            <>
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/dashboard" className={isActive('/dashboard')}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/courses" className={isActive('/courses')}>
                  Courses
                </Nav.Link>
                <Nav.Link as={Link} to="/assignments" className={isActive('/assignments')}>
                  Assignments
                </Nav.Link>
                <Nav.Link as={Link} to="/syllabus-upload" className={isActive('/syllabus-upload')}>
                  Upload Syllabus
                </Nav.Link>
                <NavDropdown title="Tools" id="tools-dropdown">
                  <NavDropdown.Item as={Link} to="/grade-calculator">
                    Grade Calculator
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/study-timer">
                    Study Timer
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
              
              <Nav>
                <NavDropdown 
                  title={
                    <span>
                      {user.avatar && (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            marginRight: '8px'
                          }}
                        />
                      )}
                      {user.name}
                    </span>
                  } 
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/settings">
                    Settings
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </Nav>
            </>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login" className={isActive('/login')}>
                Login
              </Nav.Link>
              <Nav.Link as={Link} to="/register" className={isActive('/register')}>
                <Badge bg="warning" text="dark">Sign Up</Badge>
              </Nav.Link>
            </Nav>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
