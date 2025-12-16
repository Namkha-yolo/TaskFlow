import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Register = ({ setUser }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const result = await register({
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      password: formData.password
    });

    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      setErrors({ general: result.error });
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      {/* Auth Header */}
      <section className="auth-header">
        <h1 className="auth-header-title">Ready to take your academics to the next level?</h1>
        <p className="auth-header-subtitle">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
          tempor incididunt ut labore
        </p>
      </section>

      {/* Auth Form */}
      <div className="auth-form-container">
        <div className="auth-form-card">
          <h2 className="auth-form-title">Sign up for a free account</h2>

          {errors.general && (
            <Alert variant="danger" dismissible onClose={() => setErrors({})}>
              {errors.general}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <Form.Group className="mb-3">
                <Form.Label>First name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  isInvalid={!!errors.firstName}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.firstName}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Last name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  isInvalid={!!errors.lastName}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  {errors.lastName}
                </Form.Control.Feedback>
              </Form.Group>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.email}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Create password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                isInvalid={!!errors.password}
                required
              />
              <Form.Control.Feedback type="invalid">
                {errors.password}
              </Form.Control.Feedback>
            </Form.Group>

            <Button
              type="submit"
              className="btn-auth-submit"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </Form>

          <div className="text-center mt-4">
            <p className="text-muted mb-0">
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary-gold)' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
