import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, Badge, ListGroup, Breadcrumb } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axios from 'axios';

const StudyTimer = () => {
  // Timer states
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  
  // Settings
  const [workDuration, setWorkDuration] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [sessionsUntilLongBreak, setSessionsUntilLongBreak] = useState(4);
  
  // Tracking
  const [currentSession, setCurrentSession] = useState(1);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Data
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [totalTimeToday, setTotalTimeToday] = useState(0);
  
  // Refs
  const intervalRef = useRef(null);
  const audioRef = useRef(new Audio('/notification.mp3'));

  useEffect(() => {
    fetchCourses();
    fetchTodaysSessions();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssignments(selectedCourse);
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
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAssignments = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/assignments?course=${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(response.data.filter(a => !a.completed));
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchTodaysSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/timer/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodaysSessions(response.data.sessions);
      setTotalTimeToday(response.data.totalTime);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleTimerComplete = () => {
    // Play notification sound
    audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    
    if (!isBreak) {
      // Work session completed
      saveSession();
      setCompletedSessions(prev => prev + 1);
      
      if (currentSession % sessionsUntilLongBreak === 0) {
        // Long break
        toast.success('Great work! Time for a long break!');
        setTime(longBreak * 60);
        setIsBreak(true);
      } else {
        // Short break
        toast.success('Session completed! Take a short break.');
        setTime(shortBreak * 60);
        setIsBreak(true);
      }
      setCurrentSession(prev => prev + 1);
    } else {
      // Break completed
      toast.info('Break over! Ready for the next session?');
      setTime(workDuration * 60);
      setIsBreak(false);
    }
    
    setIsActive(false);
    setIsPaused(false);
  };

  const saveSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const sessionData = {
        course: selectedCourse || null,
        assignment: selectedAssignment || null,
        duration: workDuration,
        notes: sessionNotes,
        completedAt: new Date()
      };
      
      await axios.post('/api/timer/session', sessionData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchTodaysSessions();
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTime(isBreak ? shortBreak * 60 : workDuration * 60);
  };

  const handleSkip = () => {
    if (isBreak) {
      setTime(workDuration * 60);
      setIsBreak(false);
    } else {
      setTime(shortBreak * 60);
      setIsBreak(true);
    }
    setIsActive(false);
    setIsPaused(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getProgressPercentage = () => {
    const totalSeconds = isBreak ? 
      (currentSession % sessionsUntilLongBreak === 0 ? longBreak : shortBreak) * 60 : 
      workDuration * 60;
    return ((totalSeconds - time) / totalSeconds) * 100;
  };

  return (
    <Container>
      <Breadcrumb className="breadcrumb-custom">
        <Breadcrumb.Item href="/">Dashboard</Breadcrumb.Item>
        <Breadcrumb.Item active>Study Timer</Breadcrumb.Item>
      </Breadcrumb>

      <h1 className="mb-4">Pomodoro Study Timer</h1>

      <Row>
        <Col lg={8}>
          {/* Timer Display */}
          <Card className="custom-card">
            <Card.Body className="text-center py-5">
              <h3 className="mb-3">
                {isBreak ? '☕ Break Time' : '📚 Focus Time'}
              </h3>
              
              <div className="timer-display">
                {formatTime(time)}
              </div>
              
              <div className="progress mt-4 mb-4" style={{ height: '10px' }}>
                <div 
                  className="progress-bar progress-bar-custom"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              
              <div className="timer-controls">
                {!isActive && (
                  <Button 
                    className="btn-primary-custom"
                    size="lg"
                    onClick={handleStart}
                  >
                    Start
                  </Button>
                )}
                
                {isActive && (
                  <>
                    <Button 
                      variant={isPaused ? 'success' : 'warning'}
                      size="lg"
                      onClick={handlePause}
                    >
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                    <Button 
                      variant="secondary"
                      size="lg"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                  </>
                )}
                
                <Button 
                  variant="outline-secondary"
                  size="lg"
                  onClick={handleSkip}
                >
                  Skip
                </Button>
              </div>
              
              <div className="mt-4">
                <Badge bg="info" className="me-2">
                  Session {currentSession}
                </Badge>
                <Badge bg="success">
                  {completedSessions} Completed Today
                </Badge>
              </div>
            </Card.Body>
          </Card>

          {/* Session Tracking */}
          <Card className="custom-card mt-3">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">Track This Session</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Course (Optional)</Form.Label>
                      <Form.Select 
                        className="form-control-custom"
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
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
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Assignment (Optional)</Form.Label>
                      <Form.Select 
                        className="form-control-custom"
                        value={selectedAssignment}
                        onChange={(e) => setSelectedAssignment(e.target.value)}
                        disabled={!selectedCourse}
                      >
                        <option value="">Select Assignment</option>
                        {assignments.map(assignment => (
                          <option key={assignment._id} value={assignment._id}>
                            {assignment.title}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group>
                  <Form.Label>Session Notes (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    className="form-control-custom"
                    placeholder="What are you working on?"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Timer Settings */}
          <Card className="custom-card">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">Timer Settings</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Work Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={workDuration}
                    onChange={(e) => {
                      setWorkDuration(parseInt(e.target.value));
                      if (!isActive && !isBreak) {
                        setTime(parseInt(e.target.value) * 60);
                      }
                    }}
                    min="1"
                    max="60"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Short Break (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={shortBreak}
                    onChange={(e) => setShortBreak(parseInt(e.target.value))}
                    min="1"
                    max="30"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Long Break (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={longBreak}
                    onChange={(e) => setLongBreak(parseInt(e.target.value))}
                    min="5"
                    max="60"
                  />
                </Form.Group>
                
                <Form.Group>
                  <Form.Label>Sessions Until Long Break</Form.Label>
                  <Form.Control
                    type="number"
                    className="form-control-custom"
                    value={sessionsUntilLongBreak}
                    onChange={(e) => setSessionsUntilLongBreak(parseInt(e.target.value))}
                    min="2"
                    max="10"
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Today's Stats */}
          <Card className="custom-card mt-3">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">Today's Progress</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center mb-3">
                <div className="stat-number">{formatTotalTime(totalTimeToday)}</div>
                <div className="stat-label">Total Study Time</div>
              </div>
              
              <h6 className="mb-2">Recent Sessions:</h6>
              <ListGroup variant="flush">
                {todaysSessions.slice(0, 5).map((session, index) => (
                  <ListGroup.Item key={index} className="px-0">
                    <div className="d-flex justify-content-between">
                      <span>
                        {session.courseName || 'General Study'}
                        {session.assignmentTitle && (
                          <small className="d-block text-muted">
                            {session.assignmentTitle}
                          </small>
                        )}
                      </span>
                      <Badge bg="secondary">{session.duration}m</Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              
              {todaysSessions.length === 0 && (
                <p className="text-muted text-center">No sessions yet today</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudyTimer;
