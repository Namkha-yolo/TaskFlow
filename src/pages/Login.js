import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = ({ setUser }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card className="custom-card shadow">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <h1 className="h3 mb-3">Welcome Back!</h1>
                <p className="text-muted">Sign in to continue to TaskFlow</p>
              </div>

              {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')}>
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    className="form-control-custom"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="form-control-custom"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <Button 
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <Form.Check
                    type="checkbox"
                    label="Remember me"
                    id="rememberMe"
                  />
                  <Link to="/forgot-password" className="text-decoration-none">
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="btn-primary-custom w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>

                <div className="position-relative my-4">
                  <hr />
                  <span 
                    className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-muted"
                    style={{ fontSize: '14px' }}
                  >
                    OR
                  </span>
                </div>

                <Button
                  variant="outline-primary"
                  className="w-100 mb-3 d-flex align-items-center justify-content-center"
                  onClick={handleGoogleLogin}
                >
                  <img 
                    src="https://www.google.com/favicon.ico" 
                    alt="Google"
                    style={{ width: '20px', marginRight: '8px' }}
                  />
                  Continue with Google
                </Button>
              </Form>

              <div className="text-center mt-4">
                <p className="mb-0 text-muted">
                  Don't have an account?{' '}
                  <Link to="/register" className="text-decoration-none">
                    Sign up for free
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>

          <div className="text-center mt-4 text-muted">
            <small>
              By signing in, you agree to our{' '}
              <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>
            </small>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
