import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Table, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { FaCalculator, FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import Footer from '../components/Footer';

const GradeCalculator = () => {
  const { user } = useAuth();
  const { courses } = useCourses();
  const [selectedCourse, setSelectedCourse] = useState('');
  const [targetGrade, setTargetGrade] = useState(90);
  const [gradeItems, setGradeItems] = useState([]);
  const [currentGrade, setCurrentGrade] = useState(null);

  // Load saved grade items from localStorage
  useEffect(() => {
    if (selectedCourse && user?.id) {
      const saved = localStorage.getItem(`taskflow_grades_${user.id}_${selectedCourse}`);
      if (saved) {
        setGradeItems(JSON.parse(saved));
      } else {
        // Start with empty items
        setGradeItems([
          { id: 1, name: 'Homework', weight: 20, score: '', maxScore: 100 },
          { id: 2, name: 'Midterm Exam', weight: 25, score: '', maxScore: 100 },
          { id: 3, name: 'Final Exam', weight: 30, score: '', maxScore: 100 },
          { id: 4, name: 'Projects', weight: 25, score: '', maxScore: 100 }
        ]);
      }
    }
  }, [selectedCourse, user?.id]);

  // Calculate grade whenever items change
  useEffect(() => {
    calculateGrade();
    // Save to localStorage
    if (selectedCourse && user?.id && gradeItems.length > 0) {
      localStorage.setItem(`taskflow_grades_${user.id}_${selectedCourse}`, JSON.stringify(gradeItems));
    }
    // eslint-disable-next-line
  }, [gradeItems]);

  const calculateGrade = () => {
    const itemsWithScores = gradeItems.filter(item => item.score !== '' && item.score !== null);
    if (itemsWithScores.length === 0) {
      setCurrentGrade(null);
      return;
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    itemsWithScores.forEach(item => {
      const percentage = (parseFloat(item.score) / parseFloat(item.maxScore)) * 100;
      totalWeightedScore += percentage * (parseFloat(item.weight) / 100);
      totalWeight += parseFloat(item.weight);
    });

    const grade = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0;
    setCurrentGrade(grade);
  };

  const addItem = () => {
    const newId = Math.max(...gradeItems.map(i => i.id), 0) + 1;
    setGradeItems([...gradeItems, { id: newId, name: '', weight: 0, score: '', maxScore: 100 }]);
  };

  const removeItem = (id) => {
    setGradeItems(gradeItems.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setGradeItems(gradeItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
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

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'success';
    if (grade >= 80) return 'info';
    if (grade >= 70) return 'warning';
    return 'danger';
  };

  const calculateRequiredGrade = () => {
    const itemsWithScores = gradeItems.filter(item => item.score !== '' && item.score !== null);
    const itemsWithoutScores = gradeItems.filter(item => item.score === '' || item.score === null);

    if (itemsWithoutScores.length === 0) return null;

    let earnedPoints = 0;
    itemsWithScores.forEach(item => {
      const percentage = (parseFloat(item.score) / parseFloat(item.maxScore)) * 100;
      earnedPoints += percentage * (parseFloat(item.weight) / 100);
    });

    const remainingWeight = itemsWithoutScores.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0);
    if (remainingWeight === 0) return null;

    const neededPoints = targetGrade - earnedPoints;
    const requiredAverage = (neededPoints / remainingWeight) * 100;

    return Math.min(100, Math.max(0, requiredAverage));
  };

  const totalWeight = gradeItems.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
  const requiredGrade = calculateRequiredGrade();

  const selectedCourseName = courses.find(c => c.id === selectedCourse)?.name || '';

  return (
    <div className="grade-calculator-page">
      <section className="course-detail-header">
        <h1 className="course-detail-title">Grade Calculator</h1>
        <p className="course-detail-info">Calculate your current and projected grades</p>
      </section>

      <Container className="py-4">
        {/* Course Selection */}
        <div className="grade-calc-card mb-4">
          <Row className="align-items-end">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Select Course</Form.Label>
                <Form.Select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">Choose a course...</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Target Grade (%)</Form.Label>
                <Form.Control
                  type="number"
                  value={targetGrade}
                  onChange={(e) => setTargetGrade(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              {totalWeight !== 100 && (
                <Alert variant="warning" className="mb-0 py-2">
                  Total weight: {totalWeight}% (should be 100%)
                </Alert>
              )}
            </Col>
          </Row>
        </div>

        {selectedCourse && (
          <>
            {/* Grade Summary Cards */}
            <Row className="mb-4">
              <Col md={4}>
                <div className="grade-summary-card">
                  <h6>Current Grade</h6>
                  <div className="grade-value">
                    {currentGrade !== null ? `${currentGrade.toFixed(1)}%` : '--'}
                  </div>
                  {currentGrade !== null && (
                    <Badge bg={getGradeColor(currentGrade)} className="grade-badge">
                      {getLetterGrade(currentGrade)}
                    </Badge>
                  )}
                </div>
              </Col>
              <Col md={4}>
                <div className="grade-summary-card">
                  <h6>Target Grade</h6>
                  <div className="grade-value">{targetGrade}%</div>
                  <Badge bg={getGradeColor(targetGrade)} className="grade-badge">
                    {getLetterGrade(targetGrade)}
                  </Badge>
                </div>
              </Col>
              <Col md={4}>
                <div className="grade-summary-card">
                  <h6>Required on Remaining</h6>
                  <div className="grade-value">
                    {requiredGrade !== null ? `${requiredGrade.toFixed(1)}%` : '--'}
                  </div>
                  {requiredGrade !== null && requiredGrade > 100 && (
                    <Badge bg="danger" className="grade-badge">Not Achievable</Badge>
                  )}
                  {requiredGrade !== null && requiredGrade <= 100 && (
                    <Badge bg={getGradeColor(requiredGrade)} className="grade-badge">
                      {getLetterGrade(requiredGrade)}
                    </Badge>
                  )}
                </div>
              </Col>
            </Row>

            {/* Progress Bar */}
            {currentGrade !== null && (
              <div className="grade-calc-card mb-4">
                <h6 className="mb-3">Grade Progress</h6>
                <ProgressBar>
                  <ProgressBar
                    variant={getGradeColor(currentGrade)}
                    now={currentGrade}
                    label={`${currentGrade.toFixed(1)}%`}
                    key={1}
                  />
                </ProgressBar>
                <div className="d-flex justify-content-between mt-2">
                  <small className="text-muted">0%</small>
                  <small className="text-muted">Target: {targetGrade}%</small>
                  <small className="text-muted">100%</small>
                </div>
              </div>
            )}

            {/* Grade Items Table */}
            <div className="grade-calc-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <FaCalculator className="me-2" />
                  Grade Components - {selectedCourseName}
                </h5>
                <Button variant="outline-primary" size="sm" onClick={addItem}>
                  <FaPlus className="me-1" /> Add Item
                </Button>
              </div>

              <Table responsive hover className="grade-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ width: '100px' }}>Weight (%)</th>
                    <th style={{ width: '100px' }}>Score</th>
                    <th style={{ width: '100px' }}>Max</th>
                    <th style={{ width: '100px' }}>Percentage</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {gradeItems.map(item => {
                    const percentage = item.score !== '' && item.maxScore > 0
                      ? (parseFloat(item.score) / parseFloat(item.maxScore)) * 100
                      : null;
                    return (
                      <tr key={item.id}>
                        <td>
                          <Form.Control
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            placeholder="Category name"
                            size="sm"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            value={item.weight}
                            onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                            min="0"
                            max="100"
                            size="sm"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            value={item.score}
                            onChange={(e) => updateItem(item.id, 'score', e.target.value)}
                            placeholder="--"
                            min="0"
                            size="sm"
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            value={item.maxScore}
                            onChange={(e) => updateItem(item.id, 'maxScore', e.target.value)}
                            min="1"
                            size="sm"
                          />
                        </td>
                        <td className="text-center">
                          {percentage !== null ? (
                            <Badge bg={getGradeColor(percentage)}>
                              {percentage.toFixed(1)}%
                            </Badge>
                          ) : (
                            <span className="text-muted">--</span>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              {gradeItems.length === 0 && (
                <Alert variant="info" className="text-center">
                  No grade items. Click "Add Item" to start tracking your grades.
                </Alert>
              )}
            </div>

            {/* What-If Scenarios */}
            <div className="grade-calc-card mt-4">
              <h5 className="mb-3">What-If Scenarios</h5>
              <Row>
                {[
                  { name: 'Perfect Scores', desc: '100% on remaining', mult: 1.0, color: 'success' },
                  { name: 'Great Work', desc: '90% on remaining', mult: 0.9, color: 'info' },
                  { name: 'Good Work', desc: '80% on remaining', mult: 0.8, color: 'warning' },
                  { name: 'Passing', desc: '70% on remaining', mult: 0.7, color: 'secondary' }
                ].map((scenario, idx) => {
                  const itemsWithScores = gradeItems.filter(i => i.score !== '' && i.score !== null);
                  const itemsWithoutScores = gradeItems.filter(i => i.score === '' || i.score === null);

                  let earned = 0;
                  itemsWithScores.forEach(item => {
                    const pct = (parseFloat(item.score) / parseFloat(item.maxScore)) * 100;
                    earned += pct * (parseFloat(item.weight) / 100);
                  });

                  let projected = earned;
                  itemsWithoutScores.forEach(item => {
                    projected += (scenario.mult * 100) * (parseFloat(item.weight || 0) / 100);
                  });

                  return (
                    <Col md={3} key={idx}>
                      <div className="scenario-card">
                        <h6>{scenario.name}</h6>
                        <p className="text-muted small mb-2">{scenario.desc}</p>
                        <div className="scenario-grade">
                          {projected.toFixed(1)}%
                        </div>
                        <Badge bg={scenario.color}>{getLetterGrade(projected)}</Badge>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </>
        )}

        {!selectedCourse && (
          <Alert variant="info" className="text-center py-5">
            <FaCalculator size={48} className="mb-3 text-muted" />
            <h5>Select a course to start calculating grades</h5>
            <p className="text-muted mb-0">Choose a course from the dropdown above to begin.</p>
          </Alert>
        )}
      </Container>

      <Footer />
    </div>
  );
};

export default GradeCalculator;
