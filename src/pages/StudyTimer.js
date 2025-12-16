import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Button, Form, Badge, ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaPlay, FaPause, FaRedo, FaForward, FaCoffee, FaBrain } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';
import Footer from '../components/Footer';

const StudyTimer = () => {
  const { user } = useAuth();
  const { courses } = useCourses();

  // Timer states
  const [time, setTime] = useState(25 * 60);
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
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [totalTimeToday, setTotalTimeToday] = useState(0);

  // Refs
  const intervalRef = useRef(null);

  // Load today's sessions from localStorage
  const loadTodaysSessions = useCallback(() => {
    if (!user?.id) return;

    const key = `taskflow_study_sessions_${user.id}`;
    const allSessions = JSON.parse(localStorage.getItem(key) || '[]');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = allSessions.filter(s => {
      const sessionDate = new Date(s.completed_at);
      return sessionDate >= today;
    }).sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    setTodaysSessions(todaySessions);
    setTotalTimeToday(todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0));
  }, [user?.id]);

  useEffect(() => {
    loadTodaysSessions();
  }, [loadTodaysSessions]);

  // Save session to localStorage
  const saveSession = useCallback(() => {
    if (!user?.id) return;

    const key = `taskflow_study_sessions_${user.id}`;
    const allSessions = JSON.parse(localStorage.getItem(key) || '[]');

    const courseName = selectedCourse
      ? courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course'
      : 'General Study';

    const newSession = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: user.id,
      course_id: selectedCourse || null,
      courseName,
      duration_minutes: workDuration,
      session_type: 'pomodoro',
      notes: sessionNotes,
      completed_at: new Date().toISOString()
    };

    allSessions.push(newSession);
    localStorage.setItem(key, JSON.stringify(allSessions));
    loadTodaysSessions();
    toast.success(`Session saved! +${workDuration} minutes`);
  }, [user?.id, selectedCourse, courses, workDuration, sessionNotes, loadTodaysSessions]);

  const handleTimerComplete = useCallback(() => {
    if (!isBreak) {
      // Work session completed
      saveSession();

      if (currentSession % sessionsUntilLongBreak === 0) {
        toast.success('Great work! Time for a long break!');
        setTime(longBreak * 60);
        setIsBreak(true);
      } else {
        toast.success('Session completed! Take a short break.');
        setTime(shortBreak * 60);
        setIsBreak(true);
      }
      setCurrentSession(prev => prev + 1);
    } else {
      toast.info('Break over! Ready for the next session?');
      setTime(workDuration * 60);
      setIsBreak(false);
    }

    setIsActive(false);
    setIsPaused(false);
  }, [isBreak, currentSession, sessionsUntilLongBreak, longBreak, shortBreak, workDuration, saveSession]);

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
  }, [isActive, isPaused, handleTimerComplete]);

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
    const totalSeconds = isBreak
      ? (currentSession % sessionsUntilLongBreak === 0 ? longBreak : shortBreak) * 60
      : workDuration * 60;
    return ((totalSeconds - time) / totalSeconds) * 100;
  };

  return (
    <div className="study-timer-page">
      <section className="course-detail-header">
        <h1 className="course-detail-title">
          {isBreak ? <FaCoffee className="me-3" /> : <FaBrain className="me-3" />}
          Pomodoro Timer
        </h1>
        <p className="course-detail-info">Stay focused and productive with timed study sessions</p>
      </section>

      <Container className="py-4">
        <Row>
          <Col lg={8}>
            {/* Timer Display */}
            <div className="timer-card">
              <div className="timer-status">
                {isBreak ? (
                  <Badge bg="info" className="timer-badge">
                    <FaCoffee className="me-2" /> Break Time
                  </Badge>
                ) : (
                  <Badge bg="warning" className="timer-badge">
                    <FaBrain className="me-2" /> Focus Time
                  </Badge>
                )}
              </div>

              <div className="timer-display">
                {formatTime(time)}
              </div>

              <div className="timer-progress">
                <div
                  className="timer-progress-bar"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>

              <div className="timer-controls">
                {!isActive ? (
                  <Button className="timer-btn timer-btn-start" onClick={handleStart}>
                    <FaPlay className="me-2" /> Start
                  </Button>
                ) : (
                  <Button
                    className={`timer-btn ${isPaused ? 'timer-btn-resume' : 'timer-btn-pause'}`}
                    onClick={handlePause}
                  >
                    {isPaused ? <><FaPlay className="me-2" /> Resume</> : <><FaPause className="me-2" /> Pause</>}
                  </Button>
                )}

                <Button className="timer-btn timer-btn-reset" onClick={handleReset}>
                  <FaRedo className="me-2" /> Reset
                </Button>

                <Button className="timer-btn timer-btn-skip" onClick={handleSkip}>
                  <FaForward className="me-2" /> Skip
                </Button>
              </div>

              <div className="timer-session-info">
                <Badge bg="secondary" className="me-2">
                  Session {currentSession}
                </Badge>
                <Badge bg="success">
                  {todaysSessions.length} Completed Today
                </Badge>
              </div>
            </div>

            {/* Session Tracking */}
            <div className="timer-settings-card mt-4">
              <h5 className="settings-title">Track This Session</h5>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Course (Optional)</Form.Label>
                      <Form.Select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                      >
                        <option value="">General Study</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.code} - {course.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Session Notes (Optional)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="What are you working on?"
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </div>
          </Col>

          <Col lg={4}>
            {/* Timer Settings */}
            <div className="timer-settings-card">
              <h5 className="settings-title">Timer Settings</h5>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Work Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={workDuration}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 25;
                      setWorkDuration(val);
                      if (!isActive && !isBreak) {
                        setTime(val * 60);
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
                    value={shortBreak}
                    onChange={(e) => setShortBreak(parseInt(e.target.value) || 5)}
                    min="1"
                    max="30"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Long Break (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    value={longBreak}
                    onChange={(e) => setLongBreak(parseInt(e.target.value) || 15)}
                    min="5"
                    max="60"
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label>Sessions Until Long Break</Form.Label>
                  <Form.Control
                    type="number"
                    value={sessionsUntilLongBreak}
                    onChange={(e) => setSessionsUntilLongBreak(parseInt(e.target.value) || 4)}
                    min="2"
                    max="10"
                  />
                </Form.Group>
              </Form>
            </div>

            {/* Today's Stats */}
            <div className="timer-settings-card mt-4">
              <h5 className="settings-title">Today's Progress</h5>
              <div className="today-stats">
                <div className="stat-value">{formatTotalTime(totalTimeToday)}</div>
                <div className="stat-label">Total Study Time</div>
              </div>

              <h6 className="mt-4 mb-3">Recent Sessions:</h6>
              <ListGroup variant="flush" className="sessions-list">
                {todaysSessions.slice(0, 5).map((session) => (
                  <ListGroup.Item key={session.id} className="session-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="session-course">{session.courseName}</span>
                        {session.notes && (
                          <small className="d-block text-muted">{session.notes}</small>
                        )}
                      </div>
                      <Badge bg="secondary">{session.duration_minutes}m</Badge>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {todaysSessions.length === 0 && (
                <p className="text-muted text-center py-3">No sessions yet today. Start studying!</p>
              )}
            </div>
          </Col>
        </Row>
      </Container>

      <Footer />
    </div>
  );
};

export default StudyTimer;
