import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Breadcrumb } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useCourses } from '../context/CourseContext';

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
    color: '#6B46C1',
    meetingDays: [],
    meetingTime: { start: '', end: '' },
    location: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = editingCourse 
      ? await updateCourse(editingCourse._id, formData)
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
      color: course.color || '#6B46C1',
      meetingDays: course.meetingDays || [],
      meetingTime: course.meetingTime || { start: '', end: '' },
      location: course.location || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this course and all its assignments?')) {
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
      color: '#6B46C1',
      meetingDays: [],
      meetingTime: { start: '', end: '' },
      location: ''
    });
    setEditingCourse(null);
  };

  if (loading) {
    return <div className="spinner-custom"></div>;
  }

  return (
    <Container>
      <Breadcrumb className="breadcrumb-custom">
        <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Courses</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Courses</h1>
        <Button 
          className="btn-primary-custom"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Course
        </Button>
      </div>

      <Row>
        {courses.map(course => (
          <Col md={6} lg={4} key={course._id} className="mb-4">
            <Card className="custom-card h-100">
              <Card.Header 
                style={{ 
                  backgroundColor: course.color || '#6B46C1',
                  color: 'white'
                }}
              >
                <h5 className="mb-0">{course.code}</h5>
              </Card.Header>
              <Card.Body>
                <h6>{course.name}</h6>
                <p className="text-muted mb-2">
                  {course.instructor && `Prof. ${course.instructor}`}
                </p>
                <div className="mb-3">
                  <Badge bg="secondary" className="me-2">
                    {course.semester} {course.year}
                  </Badge>
                  {course.credits && (
                    <Badge bg="info">{course.credits} credits</Badge>
                  )}
                </div>
                {course.location && (
                  <p className="small text-muted mb-2">
                    📍 {course.location}
                  </p>
                )}
                <div className="d-flex justify-content-between">
                  <Button 
                    size="sm" 
                    variant="outline-primary"
                    onClick={() => handleEdit(course)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline-danger"
                    onClick={() => handleDelete(course._id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {courses.length === 0 && (
        <Card className="custom-card text-center py-5">
          <Card.Body>
            <h5>No courses yet</h5>
            <p className="text-muted">Add your first course to get started</p>
            <Button 
              className="btn-primary-custom"
              onClick={() => setShowModal(true)}
            >
              Add Your First Course
            </Button>
          </Card.Body>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Code *</Form.Label>
                  <Form.Control
                    type="text"
                    className="form-control-custom"
                    placeholder="CS 101"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Name *</Form.Label>
                  <Form.Control
                    type="text"
                    className="form-control-custom"
                    placeholder="Introduction to Computer Science"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Instructor</Form.Label>
                  <Form.Control
                    type="text"
                    className="form-control-custom"
                    placeholder="Dr. Smith"
                    value={formData.instructor}
                    onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    className="form-control-custom"
                    placeholder="Room 101, Science Building"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester *</Form.Label>
                  <Form.Select
                    className="form-control-custom"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  >
                    <option>Spring</option>
                    <option>Summer</option>
                    <option>Fall</option>
                    <option>Winter</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Year *</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Credits</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={formData.credits}
                    onChange={(e) => setFormData({...formData, credits: e.target.value})}
                    min="0"
                    max="10"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Control
                    type="color"
                    className="form-control-custom"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button className="btn-primary-custom" type="submit">
                {editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Courses;
