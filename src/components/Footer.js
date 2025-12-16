import React from 'react';
import { Link } from 'react-router-dom';
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <div className="footer-column">
            <h4>Mobile app</h4>
            <Link to="/features">Features</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
          <div className="footer-column">
            <h4>Community</h4>
            <Link to="/blog">Blog</Link>
            <Link to="/forum">Forum</Link>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/careers">Careers</Link>
          </div>
          <div className="footer-column">
            <h4>Help desk</h4>
            <Link to="/support">Support</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-column">
            <h4>Blog</h4>
            <Link to="/blog/tips">Study Tips</Link>
            <Link to="/blog/news">News</Link>
          </div>
          <div className="footer-column">
            <h4>Resources</h4>
            <Link to="/guides">Guides</Link>
            <Link to="/tutorials">Tutorials</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
              <FaTwitter />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <FaFacebook />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <FaLinkedin />
            </a>
          </div>
          <p className="footer-copyright">
            &copy; TaskFlow, Inc. {new Date().getFullYear()}. We love our users!
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
