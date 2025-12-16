import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { FaPlus } from 'react-icons/fa';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import { supabase } from '../config/supabase';
import Footer from '../components/Footer';

const Dashboard = () => {
  const { user } = useAuth();
  const { courses, loading: coursesLoading } = useCourses();
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*, courses(name)')
          .eq('user_id', user.id)
          .eq('completed', false)
          .gte('due_date', new Date().toISOString())
          .order('due_date', { ascending: true })
          .limit(5);

        if (error) throw error;
        setUpcomingAssignments(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user?.id]);

  if (loading || coursesLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <h1 className="dashboard-title">{user?.name?.split(' ')[0] || 'Student'}'s Dashboard</h1>
      </section>

      <section className="courses-section">
        <Container>
          <h2 className="section-title">Courses</h2>
          <p className="section-subtitle">Here is an overview of your classes</p>
          <Row className="g-4">
            {courses.map(course => (
              <Col key={course.id} lg={3} md={4} sm={6}>
                <Link to={`/assignments?course=${course.id}`} style={{ textDecoration: 'none' }}>
                  <div className="course-card">
                    <div className="course-card-image" style={{ backgroundColor: course.color || '#3D2E1F' }} />
                    <div className="course-card-body">
                      <h3 className="course-card-title">{course.name}</h3>
                      <p className="course-card-code">{course.code}</p>
                      <p className="course-card-professor">{course.instructor ? `Prof. ${course.instructor}` : 'TBA'}</p>
                    </div>
                  </div>
                </Link>
              </Col>
            ))}
            <Col lg={3} md={4} sm={6}>
              <Link to="/courses" style={{ textDecoration: 'none' }}>
                <div className="add-course-card">
                  <FaPlus className="add-course-icon" />
                  <span className="add-course-text">+ Add a class</span>
                </div>
              </Link>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="due-dates-section">
        <Container>
          <h2 className="due-dates-title">Upcoming Due Dates</h2>
          <div className="due-dates-table">
            <table>
              <thead>
                <tr><th>Date</th><th>Class</th><th>Assignment</th></tr>
              </thead>
              <tbody>
                {upcomingAssignments.length > 0 ? upcomingAssignments.map(a => (
                  <tr key={a.id}>
                    <td>{format(new Date(a.due_date), 'MM-dd-yyyy')}</td>
                    <td>{a.courses?.name || 'N/A'}</td>
                    <td>{a.title}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>No upcoming assignments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <section className="cta-section">
        <div className="cta-buttons">
          <Link to="/courses" className="btn-cta-primary">Add Course</Link>
          <Link to="/assignments" className="btn-cta-secondary">View Assignments</Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Dashboard;
