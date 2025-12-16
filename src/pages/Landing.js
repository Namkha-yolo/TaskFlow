import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Footer from '../components/Footer';

const Landing = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">TaskFlow</h1>
          <p className="hero-subtitle">
            A task management platform specifically for college students
            that integrates with course syllabi and provides intelligent
            deadline management
          </p>
          <Link to="/register" className="btn-signup">
            Sign Up
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <Container>
          <h2 className="features-title">
            TaskFlow features to address student's academic needs
          </h2>

          <div className="row">
            <div className="col-lg-4">
              <div className="feature-item">
                <h3>Weekly Schedule</h3>
                <p>
                  Keep track of all your classes and commitments with our intuitive
                  weekly schedule view. Never miss a class or important meeting again
                  with automatic reminders and notifications.
                </p>
                <button className="btn-learn-more">Learn more</button>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="feature-item">
                <h3>Syllabus Reference</h3>
                <p>
                  Upload your course syllabi and let TaskFlow automatically extract
                  all assignments, exams, and important dates. Edit and customize
                  as needed for complete accuracy.
                </p>
                <button className="btn-learn-more">Learn more</button>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="feature-item">
                <h3>Assignments Tracker</h3>
                <p>
                  Stay on top of all your assignments with our comprehensive tracker.
                  Filter by course, status, or priority. Track your progress and
                  never miss a deadline.
                </p>
                <button className="btn-learn-more">Learn more</button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <p className="cta-text">
          Lorem ipsum dolor sit amet, consectetur adipiscing
          elit, sed do eiusmod tempor incididunt ut labore
        </p>
        <div className="cta-buttons">
          <Link to="/register" className="btn-cta-primary">
            Join Today
          </Link>
          <Link to="/contact" className="btn-cta-secondary">
            Contact us
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
