import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge, Breadcrumb, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const SyllabusUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [newCourse, setNewCourse] = useState({
    name: '',
    code: '',
    instructor: '',
    semester: 'Fall',
    year: new Date().getFullYear()
  });

  useState(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setParsedData(null);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('syllabus', file);
    
    if (selectedCourse) {
      formData.append('courseId', selectedCourse);
    } else {
      formData.append('courseData', JSON.stringify(newCourse));
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/syllabus/parse', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setParsedData(response.data);
      setEditMode(false);
      toast.success('Syllabus parsed successfully!');
    } catch (error) {
      toast.error('Error parsing syllabus. Please check the format and try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleEditAssignment = (index, field, value) => {
    const updatedAssignments = [...parsedData.assignments];
    updatedAssignments[index] = {
      ...updatedAssignments[index],
      [field]: value
    };
    setParsedData({
      ...parsedData,
      assignments: updatedAssignments
    });
  };

  const handleAddAssignment = () => {
    const newAssignment = {
      title: 'New Assignment',
      type: 'Assignment',
      dueDate: new Date().toISOString().split('T')[0],
      gradeWeight: 0,
      description: ''
    };
    setParsedData({
      ...parsedData,
      assignments: [...parsedData.assignments, newAssignment]
    });
  };

  const handleRemoveAssignment = (index) => {
    const updatedAssignments = parsedData.assignments.filter((_, i) => i !== index);
    setParsedData({
      ...parsedData,
      assignments: updatedAssignments
    });
  };

  const handleSaveAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/assignments/bulk', {
        courseId: parsedData.courseId,
        assignments: parsedData.assignments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`${response.data.created} assignments created successfully!`);
      
      // Reset form
      setFile(null);
      setParsedData(null);
      setEditMode(false);
      
      // Clear file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      toast.error('Error saving assignments');
      console.error('Save error:', error);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      'Assignment': 'primary',
      'Quiz': 'info',
      'Exam': 'danger',
      'Project': 'warning',
      'Paper': 'success',
      'Presentation': 'secondary',
      'Lab': 'dark',
      'Other': 'light'
    };
    return colors[type] || 'secondary';
  };

  return (
    <Container>
      <Breadcrumb className="breadcrumb-custom">
        <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Syllabus Upload</Breadcrumb.Item>
      </Breadcrumb>

      <h1 className="mb-4">Upload & Parse Syllabus</h1>

      <Row>
        <Col lg={8}>
          {/* Upload Section */}
          <Card className="custom-card">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">Upload Syllabus PDF</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                {/* Course Selection */}
                <Form.Group className="mb-4">
                  <Form.Label>Select or Create Course</Form.Label>
                  <Form.Check
                    type="radio"
                    id="existing-course"
                    label="Use Existing Course"
                    checked={selectedCourse !== ''}
                    onChange={() => setSelectedCourse(courses[0]?._id || '')}
                  />
                  <Form.Check
                    type="radio"
                    id="new-course"
                    label="Create New Course"
                    checked={selectedCourse === ''}
                    onChange={() => setSelectedCourse('')}
                  />
                </Form.Group>

                {selectedCourse !== '' ? (
                  <Form.Group className="mb-4">
                    <Form.Label>Select Course</Form.Label>
                    <Form.Select
                      className="form-control-custom"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      <option value="">Choose course...</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                ) : (
                  <div className="border rounded p-3 mb-4">
                    <h6 className="mb-3">New Course Details</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Course Code</Form.Label>
                          <Form.Control
                            type="text"
                            className="form-control-custom"
                            placeholder="CS 101"
                            value={newCourse.code}
                            onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Course Name</Form.Label>
                          <Form.Control
                            type="text"
                            className="form-control-custom"
                            placeholder="Introduction to Computer Science"
                            value={newCourse.name}
                            onChange={(e) => setNewCourse({...newCourse, name: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Instructor</Form.Label>
                          <Form.Control
                            type="text"
                            className="form-control-custom"
                            placeholder="Dr. Smith"
                            value={newCourse.instructor}
                            onChange={(e) => setNewCourse({...newCourse, instructor: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Semester</Form.Label>
                          <Form.Select
                            className="form-control-custom"
                            value={newCourse.semester}
                            onChange={(e) => setNewCourse({...newCourse, semester: e.target.value})}
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
                          <Form.Label>Year</Form.Label>
                          <Form.Control
                            type="number"
                            className="form-control-custom"
                            value={newCourse.year}
                            onChange={(e) => setNewCourse({...newCourse, year: e.target.value})}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* File Upload */}
                <Form.Group className="mb-4">
                  <Form.Label>Syllabus PDF File</Form.Label>
                  <Form.Control
                    id="file-input"
                    type="file"
                    accept=".pdf"
                    className="form-control-custom"
                    onChange={handleFileSelect}
                  />
                  <Form.Text className="text-muted">
                    Upload your course syllabus in PDF format. The system will automatically extract assignments and due dates.
                  </Form.Text>
                </Form.Group>

                {file && (
                  <Alert variant="info">
                    <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </Alert>
                )}

                <Button
                  className="btn-primary-custom"
                  onClick={handleUpload}
                  disabled={!file || uploading || (selectedCourse === '' && (!newCourse.code || !newCourse.name))}
                >
                  {uploading ? 'Parsing...' : 'Parse Syllabus'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {/* Parsed Results */}
          {parsedData && (
            <Card className="custom-card mt-3">
              <Card.Header className="card-header-custom d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Extracted Assignments</h5>
                <div>
                  <Button
                    variant="light"
                    size="sm"
                    className="me-2"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode ? 'View Mode' : 'Edit Mode'}
                  </Button>
                  {editMode && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleAddAssignment}
                    >
                      Add Assignment
                    </Button>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {parsedData.courseName && (
                  <Alert variant="success">
                    <strong>Course:</strong> {parsedData.courseName}
                  </Alert>
                )}

                {editMode ? (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Due Date</th>
                        <th>Weight (%)</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.assignments.map((assignment, index) => (
                        <tr key={index}>
                          <td>
                            <Form.Control
                              type="text"
                              size="sm"
                              value={assignment.title}
                              onChange={(e) => handleEditAssignment(index, 'title', e.target.value)}
                            />
                          </td>
                          <td>
                            <Form.Select
                              size="sm"
                              value={assignment.type}
                              onChange={(e) => handleEditAssignment(index, 'type', e.target.value)}
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
                          </td>
                          <td>
                            <Form.Control
                              type="date"
                              size="sm"
                              value={assignment.dueDate ? assignment.dueDate.split('T')[0] : ''}
                              onChange={(e) => handleEditAssignment(index, 'dueDate', e.target.value)}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              size="sm"
                              value={assignment.gradeWeight || ''}
                              onChange={(e) => handleEditAssignment(index, 'gradeWeight', parseFloat(e.target.value))}
                              min="0"
                              max="100"
                              step="0.1"
                            />
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveAssignment(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <ListGroup variant="flush">
                    {parsedData.assignments.map((assignment, index) => (
                      <ListGroup.Item key={index} className="px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{assignment.title}</h6>
                            <div className="d-flex gap-2 align-items-center">
                              <Badge bg={getTypeColor(assignment.type)}>
                                {assignment.type}
                              </Badge>
                              <small className="text-muted">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </small>
                              {assignment.gradeWeight && (
                                <Badge bg="info">
                                  {assignment.gradeWeight}% of grade
                                </Badge>
                              )}
                            </div>
                            {assignment.description && (
                              <p className="mb-0 mt-2 text-muted small">
                                {assignment.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}

                <div className="mt-3 d-flex justify-content-between">
                  <div>
                    <Badge bg="secondary" className="me-2">
                      {parsedData.assignments.length} assignments found
                    </Badge>
                    {parsedData.assignments.filter(a => a.gradeWeight).length > 0 && (
                      <Badge bg="info">
                        Total Weight: {parsedData.assignments.reduce((sum, a) => sum + (a.gradeWeight || 0), 0)}%
                      </Badge>
                    )}
                  </div>
                  <Button
                    className="btn-primary-custom"
                    onClick={handleSaveAssignments}
                    disabled={parsedData.assignments.length === 0}
                  >
                    Save All Assignments
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Help Section */}
        <Col lg={4}>
          <Card className="custom-card">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">📚 How It Works</h5>
            </Card.Header>
            <Card.Body>
              <ol className="ps-3">
                <li className="mb-2">Select an existing course or create a new one</li>
                <li className="mb-2">Upload your syllabus PDF file</li>
                <li className="mb-2">The system extracts assignments and due dates</li>
                <li className="mb-2">Review and edit the extracted information</li>
                <li className="mb-2">Save assignments to your course</li>
              </ol>
            </Card.Body>
          </Card>

          <Card className="custom-card mt-3">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">✨ Tips for Best Results</h5>
            </Card.Header>
            <Card.Body>
              <ul className="ps-3">
                <li className="mb-2">
                  Use clear, text-based PDFs (not scanned images)
                </li>
                <li className="mb-2">
                  Ensure dates are in standard format (MM/DD/YYYY)
                </li>
                <li className="mb-2">
                  Check that assignment names are clearly labeled
                </li>
                <li className="mb-2">
                  Grade weights should be specified as percentages
                </li>
              </ul>
            </Card.Body>
          </Card>

          <Card className="custom-card mt-3">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">⚡ Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" href="/assignments">
                  View All Assignments
                </Button>
                <Button variant="outline-primary" href="/courses">
                  Manage Courses
                </Button>
                <Button variant="outline-primary" href="/grade-calculator">
                  Calculate Grades
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default SyllabusUpload;
