import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error('Error signing in with Google');
    }
  };

  return (
    <div className="auth-page">
      {/* Auth Header */}
      <section className="auth-header">
        <h1 className="auth-header-title">Welcome back!</h1>
        <p className="auth-header-subtitle">
          Sign in to continue managing your academic tasks
        </p>
      </section>

      {/* Auth Form */}
      <div className="auth-form-container">
        <div className="auth-form-card">
          <h2 className="auth-form-title">Sign in to your account</h2>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="auth-form">
            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Check
                type="checkbox"
                label="Remember me"
                id="rememberMe"
              />
              <Link to="/forgot-password" style={{ color: 'var(--primary-gold)', fontSize: '0.9rem' }}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>

          <div className="position-relative my-4">
            <hr />
            <span
              className="position-absolute top-50 start-50 translate-middle bg-white px-3"
              style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}
            >
              OR
            </span>
          </div>

          <Button
            variant="outline-secondary"
            className="w-100 d-flex align-items-center justify-content-center"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              style={{ width: '20px', marginRight: '8px' }}
            />
            Continue with Google
          </Button>

          <div className="text-center mt-4">
            <p className="text-muted mb-0">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--primary-gold)' }}>
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
