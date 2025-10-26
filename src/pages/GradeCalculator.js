import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Badge, Breadcrumb, ProgressBar } from 'react-bootstrap';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { toast } from 'react-toastify';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const GradeCalculator = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseData, setCourseData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [currentGrade, setCurrentGrade] = useState(null);
  const [projectedGrade, setProjectedGrade] = useState(null);
  const [targetGrade, setTargetGrade] = useState(90);
  const [requiredGrades, setRequiredGrades] = useState([]);
  const [whatIfScenarios, setWhatIfScenarios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseData(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      toast.error('Error fetching courses');
    }
  };

  const fetchCourseData = async (courseId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [courseRes, assignmentsRes] = await Promise.all([
        axios.get(`/api/courses/${courseId}`, { headers }),
        axios.get(`/api/assignments?course=${courseId}`, { headers })
      ]);
      
      setCourseData(courseRes.data);
      setAssignments(assignmentsRes.data);
      setTargetGrade(courseRes.data.targetGrade || 90);
      
      calculateGrades(assignmentsRes.data);
      setLoading(false);
    } catch (error) {
      toast.error('Error fetching course data');
      setLoading(false);
    }
  };

  const calculateGrades = (assignmentsList) => {
    // Calculate current grade based on completed assignments
    const completedAssignments = assignmentsList.filter(a => a.gradeReceived !== null);
    let earnedPoints = 0;
    let totalWeight = 0;
    
    completedAssignments.forEach(assignment => {
      const percentage = (assignment.gradeReceived / assignment.maxGrade) * 100;
      earnedPoints += percentage * (assignment.gradeWeight / 100);
      totalWeight += assignment.gradeWeight;
    });
    
    const current = totalWeight > 0 ? (earnedPoints / totalWeight) * 100 : null;
    setCurrentGrade(current);
    
    // Calculate projected grade (assuming current performance continues)
    const remainingWeight = 100 - totalWeight;
    const projected = current !== null ? 
      (earnedPoints + (current / 100) * remainingWeight) : null;
    setProjectedGrade(projected);
    
    // Calculate required grades for remaining assignments
    calculateRequiredGrades(assignmentsList, earnedPoints, totalWeight);
    
    // Generate what-if scenarios
    generateWhatIfScenarios(assignmentsList, earnedPoints, totalWeight);
  };

  const calculateRequiredGrades = (assignmentsList, earnedPoints, completedWeight) => {
    const incompleteAssignments = assignmentsList.filter(
      a => a.gradeReceived === null && a.gradeWeight
    );
    
    const remainingWeight = incompleteAssignments.reduce(
      (sum, a) => sum + a.gradeWeight, 0
    );
    
    if (remainingWeight === 0) {
      setRequiredGrades([]);
      return;
    }
    
    // Calculate what's needed for target grade
    const pointsNeeded = targetGrade - earnedPoints;
    const requiredAverage = (pointsNeeded / remainingWeight) * 100;
    
    const requirements = incompleteAssignments.map(assignment => ({
      ...assignment,
      requiredGrade: Math.min(100, Math.max(0, requiredAverage))
    }));
    
    setRequiredGrades(requirements);
  };

  const generateWhatIfScenarios = (assignmentsList, earnedPoints, completedWeight) => {
    const incompleteAssignments = assignmentsList.filter(
      a => a.gradeReceived === null && a.gradeWeight
    );
    
    const remainingWeight = incompleteAssignments.reduce(
      (sum, a) => sum + a.gradeWeight, 0
    );
    
    if (remainingWeight === 0) {
      setWhatIfScenarios([]);
      return;
    }
    
    const scenarios = [
      {
        name: 'Perfect Scores',
        description: 'If you get 100% on all remaining assignments',
        grade: earnedPoints + remainingWeight,
        color: 'success'
      },
      {
        name: 'Good Performance',
        description: 'If you maintain 85% on remaining work',
        grade: earnedPoints + (0.85 * remainingWeight),
        color: 'info'
      },
      {
        name: 'Average Performance',
        description: 'If you maintain 75% on remaining work',
        grade: earnedPoints + (0.75 * remainingWeight),
        color: 'warning'
      },
      {
        name: 'Minimum Passing',
        description: 'If you get 60% on remaining work',
        grade: earnedPoints + (0.60 * remainingWeight),
        color: 'danger'
      }
    ];
    
    setWhatIfScenarios(scenarios);
  };

  const updateAssignmentGrade = async (assignmentId, grade, maxGrade) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/assignments/${assignmentId}`, 
        { gradeReceived: grade, maxGrade: maxGrade },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh data
      fetchCourseData(selectedCourse);
      toast.success('Grade updated successfully');
    } catch (error) {
      toast.error('Error updating grade');
    }
  };

  const handleGradeChange = (assignmentId, value, field) => {
    const updatedAssignments = assignments.map(a => {
      if (a._id === assignmentId) {
        return { ...a, [field]: parseFloat(value) || null };
      }
      return a;
    });
    setAssignments(updatedAssignments);
    calculateGrades(updatedAssignments);
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'danger';
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 63) return 'D';
    if (percentage >= 60) return 'D-';
    return 'F';
  };

  // Chart data for grade distribution
  const gradeDistributionData = {
    labels: assignments.filter(a => a.gradeWeight).map(a => a.title),
    datasets: [{
      label: 'Grade Weight (%)',
      data: assignments.filter(a => a.gradeWeight).map(a => a.gradeWeight),
      backgroundColor: [
        '#6B46C1',
        '#9F7AEA',
        '#FFD700',
        '#48BB78',
        '#4299E1',
        '#ED8936'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const gradeProgressData = {
    labels: ['Earned', 'Remaining'],
    datasets: [{
      label: 'Grade Progress',
      data: [
        currentGrade || 0,
        100 - (currentGrade || 0)
      ],
      backgroundColor: ['#48BB78', '#E2E8F0']
    }]
  };

  return (
    <Container>
      <Breadcrumb className="breadcrumb-custom">
        <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Grade Calculator</Breadcrumb.Item>
      </Breadcrumb>

      <h1 className="mb-4">Grade Calculator</h1>

      {/* Course Selection */}
      <Card className="custom-card">
        <Card.Body>
          <Form>
            <Row>
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Select Course</Form.Label>
                  <Form.Select
                    className="form-control-custom"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">Choose a course...</option>
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
                  <Form.Label>Target Grade (%)</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={targetGrade}
                    onChange={(e) => {
                      setTargetGrade(parseFloat(e.target.value));
                      if (assignments.length > 0) {
                        calculateGrades(assignments);
                      }
                    }}
                    min="0"
                    max="100"
                    step="1"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {selectedCourse && !loading && (
        <>
          {/* Current Grade Summary */}
          <Row className="mt-4">
            <Col md={3}>
              <Card className="custom-card text-center">
                <Card.Body>
                  <h6 className="text-muted mb-2">Current Grade</h6>
                  <div className="stat-number">
                    {currentGrade ? `${currentGrade.toFixed(1)}%` : 'N/A'}
                  </div>
                  {currentGrade && (
                    <Badge bg={getGradeColor(currentGrade)}>
                      {getLetterGrade(currentGrade)}
                    </Badge>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="custom-card text-center">
                <Card.Body>
                  <h6 className="text-muted mb-2">Projected Grade</h6>
                  <div className="stat-number">
                    {projectedGrade ? `${projectedGrade.toFixed(1)}%` : 'N/A'}
                  </div>
                  {projectedGrade && (
                    <Badge bg={getGradeColor(projectedGrade)}>
                      {getLetterGrade(projectedGrade)}
                    </Badge>
                  )}
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="custom-card text-center">
                <Card.Body>
                  <h6 className="text-muted mb-2">Target Grade</h6>
                  <div className="stat-number">{targetGrade}%</div>
                  <Badge bg={getGradeColor(targetGrade)}>
                    {getLetterGrade(targetGrade)}
                  </Badge>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="custom-card text-center">
                <Card.Body>
                  <h6 className="text-muted mb-2">Completion</h6>
                  <div className="stat-number">
                    {assignments.length > 0 
                      ? `${assignments.filter(a => a.completed).length}/${assignments.length}`
                      : '0/0'
                    }
                  </div>
                  <Badge bg="secondary">Assignments</Badge>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            {/* Grade Input Table */}
            <Col lg={8}>
              <Card className="custom-card">
                <Card.Header className="card-header-custom">
                  <h5 className="mb-0">Assignment Grades</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Assignment</th>
                        <th>Weight</th>
                        <th>Score</th>
                        <th>Max</th>
                        <th>Percentage</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(assignment => (
                        <tr key={assignment._id}>
                          <td>
                            <div>
                              {assignment.title}
                              <small className="d-block text-muted">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </small>
                            </div>
                          </td>
                          <td>
                            <Badge bg="info">
                              {assignment.gradeWeight || 0}%
                            </Badge>
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              size="sm"
                              value={assignment.gradeReceived || ''}
                              onChange={(e) => handleGradeChange(assignment._id, e.target.value, 'gradeReceived')}
                              style={{ width: '80px' }}
                              min="0"
                              max={assignment.maxGrade}
                              step="0.1"
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              size="sm"
                              value={assignment.maxGrade || 100}
                              onChange={(e) => handleGradeChange(assignment._id, e.target.value, 'maxGrade')}
                              style={{ width: '80px' }}
                              min="1"
                              step="1"
                            />
                          </td>
                          <td>
                            {assignment.gradeReceived !== null ? (
                              <Badge bg={getGradeColor((assignment.gradeReceived / assignment.maxGrade) * 100)}>
                                {((assignment.gradeReceived / assignment.maxGrade) * 100).toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted">--</span>
                            )}
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => updateAssignmentGrade(
                                assignment._id,
                                assignment.gradeReceived,
                                assignment.maxGrade
                              )}
                              disabled={assignment.gradeReceived === null}
                            >
                              Save
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  
                  {assignments.length === 0 && (
                    <Alert variant="info">
                      No assignments found for this course. Add assignments to start calculating grades.
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* What-If Scenarios */}
              <Card className="custom-card mt-3">
                <Card.Header className="card-header-custom">
                  <h5 className="mb-0">What-If Scenarios</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    {whatIfScenarios.map((scenario, index) => (
                      <Col md={6} key={index} className="mb-3">
                        <Card>
                          <Card.Body>
                            <h6>{scenario.name}</h6>
                            <p className="text-muted small mb-2">{scenario.description}</p>
                            <div className="d-flex align-items-center">
                              <h4 className="mb-0 me-2">
                                {scenario.grade.toFixed(1)}%
                              </h4>
                              <Badge bg={scenario.color}>
                                {getLetterGrade(scenario.grade)}
                              </Badge>
                            </div>
                            <ProgressBar 
                              className="mt-2"
                              now={scenario.grade}
                              variant={scenario.color}
                              style={{ height: '8px' }}
                            />
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Charts and Required Grades */}
            <Col lg={4}>
              {/* Grade Distribution Chart */}
              <Card className="custom-card">
                <Card.Header className="card-header-custom">
                  <h5 className="mb-0">Grade Distribution</h5>
                </Card.Header>
                <Card.Body>
                  {assignments.filter(a => a.gradeWeight).length > 0 ? (
                    <Pie 
                      data={gradeDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              boxWidth: 12
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <Alert variant="info">
                      No grade weights assigned to assignments yet.
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Required Grades */}
              <Card className="custom-card mt-3">
                <Card.Header className="card-header-custom">
                  <h5 className="mb-0">Required for {targetGrade}%</h5>
                </Card.Header>
                <Card.Body>
                  {requiredGrades.length > 0 ? (
                    <ListGroup variant="flush">
                      {requiredGrades.map((assignment, index) => (
                        <ListGroup.Item key={index} className="px-0">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <small className="d-block">{assignment.title}</small>
                              <Badge 
                                bg={assignment.requiredGrade > 90 ? 'danger' : 
                                    assignment.requiredGrade > 80 ? 'warning' : 'success'}
                              >
                                Need {assignment.requiredGrade.toFixed(1)}%
                              </Badge>
                            </div>
                            <small className="text-muted">
                              {assignment.gradeWeight}% weight
                            </small>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <Alert variant="success">
                      All assignments completed or no remaining assignments with weights.
                    </Alert>
                  )}
                  
                  {requiredGrades.some(a => a.requiredGrade > 100) && (
                    <Alert variant="danger" className="mt-3">
                      <strong>Warning:</strong> Achieving {targetGrade}% is not possible with current grades.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {loading && <div className="spinner-custom"></div>}
    </Container>
  );
};

export default GradeCalculator;
