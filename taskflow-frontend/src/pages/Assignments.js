import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Modal, Breadcrumb } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';
import { format } from 'date-fns';

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [filters, setFilters] = useState({
    course: '',
    status: '',
    priority: ''
  });
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course: '',
    type: 'Assignment',
    dueDate: '',
    gradeWeight: '',
    maxGrade: 100,
    reminderDate: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.course) params.append('course', filters.course);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      
      const [assignmentsRes, coursesRes] = await Promise.all([
        axios.get(`/api/assignments?${params}`, { headers }),
        axios.get('/api/courses', { headers })
      ]);
      
      setAssignments(assignmentsRes.data);
      setCourses(coursesRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error loading assignments');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // Find course name
      const selectedCourse = courses.find(c => c._id === formData.course);
      const assignmentData = {
        ...formData,
        courseName: selectedCourse?.name || '',
        gradeWeight: formData.gradeWeight ? parseFloat(formData.gradeWeight) : null
      };
      
      if (editingAssignment) {
        await axios.patch(`/api/assignments/${editingAssignment._id}`, assignmentData, { headers });
        toast.success('Assignment updated successfully');
      } else {
        await axios.post('/api/assignments', assignmentData, { headers });
        toast.success('Assignment created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Error saving assignment');
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description || '',
      course: assignment.course,
      type: assignment.type,
      dueDate: format(new Date(assignment.dueDate), 'yyyy-MM-dd'),
      gradeWeight: assignment.gradeWeight || '',
      maxGrade: assignment.maxGrade || 100,
      reminderDate: assignment.reminderDate ? format(new Date(assignment.reminderDate), 'yyyy-MM-dd') : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/assignments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Assignment deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Error deleting assignment');
      }
    }
  };

  const handleToggleComplete = async (assignment) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/assignments/${assignment._id}`, 
        { completed: !assignment.completed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(assignment.completed ? 'Assignment marked as incomplete' : 'Assignment completed!');
      fetchData();
    } catch (error) {
      toast.error('Error updating assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course: '',
      type: 'Assignment',
      dueDate: '',
      gradeWeight: '',
      maxGrade: 100,
      reminderDate: ''
    });
    setEditingAssignment(null);
  };

  const getStatusBadge = (assignment) => {
    if (assignment.completed) return <Badge bg="success">Completed</Badge>;
    const daysUntil = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return <Badge bg="danger">Overdue</Badge>;
    if (daysUntil === 0) return <Badge bg="warning">Due Today</Badge>;
    if (daysUntil === 1) return <Badge bg="warning">Due Tomorrow</Badge>;
    return <Badge bg="info">Due in {daysUntil} days</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const colors = { high: 'danger', medium: 'warning', low: 'success' };
    return <Badge bg={colors[priority]}>{priority}</Badge>;
  };

  if (loading) {
    return <div className="spinner-custom"></div>;
  }

  return (
    <Container>
      <Breadcrumb className="breadcrumb-custom">
        <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Assignments</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Assignments</h1>
        <Button 
          className="btn-primary-custom"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Assignment
        </Button>
      </div>

      {/* Filters */}
      <Card className="custom-card mb-4">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Course</Form.Label>
                <Form.Select
                  className="form-control-custom"
                  value={filters.course}
                  onChange={(e) => setFilters({...filters, course: e.target.value})}
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Status</Form.Label>
                <Form.Select
                  className="form-control-custom"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Priority</Form.Label>
                <Form.Select
                  className="form-control-custom"
                  value={filters.priority}
                  onChange={(e) => setFilters({...filters, priority: e.target.value})}
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Assignments Table */}
      <Card className="custom-card">
        <Card.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Title</th>
                <th>Course</th>
                <th>Type</th>
                <th>Due Date</th>
                <th>Weight</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(assignment => (
                <tr key={assignment._id}>
                  <td>
                    <div>
                      <strong>{assignment.title}</strong>
                      {assignment.description && (
                        <small className="d-block text-muted">
                          {assignment.description.substring(0, 50)}...
                        </small>
                      )}
                    </div>
                  </td>
                  <td>{assignment.courseName}</td>
                  <td>
                    <Badge bg="secondary">{assignment.type}</Badge>
                  </td>
                  <td>{format(new Date(assignment.dueDate), 'MMM dd, yyyy')}</td>
                  <td>
                    {assignment.gradeWeight ? (
                      <Badge bg="info">{assignment.gradeWeight}%</Badge>
                    ) : '-'}
                  </td>
                  <td>{getStatusBadge(assignment)}</td>
                  <td>{getPriorityBadge(assignment.priority)}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        size="sm"
                        variant={assignment.completed ? 'success' : 'outline-success'}
                        onClick={() => handleToggleComplete(assignment)}
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => handleEdit(assignment)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(assignment._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {assignments.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">No assignments found</p>
              <Button 
                className="btn-primary-custom"
                onClick={() => setShowModal(true)}
              >
                Create Your First Assignment
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    className="form-control-custom"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course *</Form.Label>
                  <Form.Select
                    className="form-control-custom"
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course._id} value={course._id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="form-control-custom"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    className="form-control-custom"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option>Assignment</option>
                    <option>Quiz</option>
                    <option>Exam</option>
                    <option>Project</option>
                    <option>Paper</option>
                    <option>Presentation</option>
                    <option>Lab</option>
                    <option>Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Due Date *</Form.Label>
                  <Form.Control
                    type="date"
                    className="form-control-custom"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Reminder Date</Form.Label>
                  <Form.Control
                    type="date"
                    className="form-control-custom"
                    value={formData.reminderDate}
                    onChange={(e) => setFormData({...formData, reminderDate: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Grade Weight (%)</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={formData.gradeWeight}
                    onChange={(e) => setFormData({...formData, gradeWeight: e.target.value})}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Grade</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={formData.maxGrade}
                    onChange={(e) => setFormData({...formData, maxGrade: e.target.value})}
                    min="1"
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button className="btn-primary-custom" type="submit">
                {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Assignments;
