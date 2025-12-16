import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlus } from 'react-icons/fa';
import { useCourses } from '../context/CourseContext';
import Footer from '../components/Footer';

const Courses = () => {
  const { courses, loading, addCourse, updateCourse, deleteCourse } = useCourses();
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    instructor: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    credits: '',
    color: '#3D2E1F',
    location: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = editingCourse
      ? await updateCourse(editingCourse.id, formData)
      : await addCourse(formData);

    if (result.success) {
      toast.success(editingCourse ? 'Course updated!' : 'Course added!');
      setShowModal(false);
      resetForm();
    } else {
      toast.error(result.error);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      instructor: course.instructor || '',
      semester: course.semester,
      year: course.year,
      credits: course.credits || '',
      color: course.color || '#3D2E1F',
      location: course.location || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this course?')) {
      const result = await deleteCourse(id);
      if (result.success) {
        toast.success('Course deleted');
      } else {
        toast.error(result.error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      instructor: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      credits: '',
      color: '#3D2E1F',
      location: ''
    });
    setEditingCourse(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="courses-page">
      <section className="dashboard-header">
        <h1 className="dashboard-title">My Courses</h1>
      </section>

      <section className="courses-section">
        <Container>
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
                      <div className="d-flex gap-2 mt-3 justify-content-center">
                        <Button size="sm" variant="outline-secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(course); }}>Edit</Button>
                        <Button size="sm" variant="outline-danger" onClick={(e) => handleDelete(course.id, e)}>Delete</Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </Col>
            ))}

            <Col lg={3} md={4} sm={6}>
              <div className="add-course-card" onClick={() => { resetForm(); setShowModal(true); }}>
                <FaPlus className="add-course-icon" />
                <span className="add-course-text">+ Add a class</span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Footer />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingCourse ? 'Edit Course' : 'Add New Course'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Code *</Form.Label>
                  <Form.Control type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Name *</Form.Label>
                  <Form.Control type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Instructor</Form.Label>
                  <Form.Control type="text" value={formData.instructor} onChange={(e) => setFormData({ ...formData, instructor: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester</Form.Label>
                  <Form.Select value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })}>
                    <option>Spring</option>
                    <option>Summer</option>
                    <option>Fall</option>
                    <option>Winter</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Year</Form.Label>
                  <Form.Control type="number" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} required />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Credits</Form.Label>
                  <Form.Control type="number" value={formData.credits} onChange={(e) => setFormData({ ...formData, credits: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="btn-primary" type="submit">{editingCourse ? 'Update' : 'Create'}</Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Courses;
