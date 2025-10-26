import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, ProgressBar, Badge, Button } from 'react-bootstrap';
import { 
  FaBook, 
  FaTasks, 
  FaClock, 
  FaChartLine, 
  FaCalendarAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaGraduationCap
} from 'react-icons/fa';
import { format, isToday, isTomorrow, isThisWeek, differenceInDays } from 'date-fns';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { fetchCourses } from '../store/slices/courseSlice';
import { fetchAssignments } from '../store/slices/assignmentSlice';
import { getStudyStats } from '../store/slices/timerSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { courses, loading: coursesLoading } = useSelector(state => state.courses);
  const { assignments, loading: assignmentsLoading } = useSelector(state => state.assignments);
  const { stats: studyStats } = useSelector(state => state.timer);
  
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [overdueAssignments, setOverdueAssignments] = useState([]);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [weekOverview, setWeekOverview] = useState({
    totalAssignments: 0,
    completedAssignments: 0,
    totalStudyMinutes: 0,
    averageGrade: 0
  });

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchCourses());
    dispatch(fetchAssignments());
    dispatch(getStudyStats({ range: 'week' }));
  }, [dispatch]);

  useEffect(() => {
    if (assignments) {
      // Process assignments for different views
      const now = new Date();
      
      // Upcoming deadlines (next 7 days)
      const upcoming = assignments
        .filter(a => !a.completed && new Date(a.dueDate) > now)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);
      setUpcomingDeadlines(upcoming);
      
      // Overdue assignments
      const overdue = assignments
        .filter(a => !a.completed && new Date(a.dueDate) < now)
        .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
      setOverdueAssignments(overdue);
      
      // Today's tasks
      const today = assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return !a.completed && isToday(dueDate);
      });
      setTodaysTasks(today);
      
      // Week overview
      const thisWeek = assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return isThisWeek(dueDate);
      });
      
      const completed = thisWeek.filter(a => a.completed);
      const graded = completed.filter(a => a.earnedPoints !== null);
      const averageGrade = graded.length > 0
        ? graded.reduce((sum, a) => sum + (a.earnedPoints / a.totalPoints) * 100, 0) / graded.length
        : 0;
      
      setWeekOverview({
        totalAssignments: thisWeek.length,
        completedAssignments: completed.length,
        totalStudyMinutes: studyStats?.totalMinutes || 0,
        averageGrade: Math.round(averageGrade)
      });
    }
  }, [assignments, studyStats]);

  const getPriorityColor = (dueDate, completed) => {
    if (completed) return 'success';
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = differenceInDays(due, now);
    
    if (daysUntilDue < 0) return 'danger';
    if (daysUntilDue <= 1) return 'warning';
    if (daysUntilDue <= 3) return 'info';
    return 'secondary';
  };

  const formatDueDate = (dueDate) => {
    const due = new Date(dueDate);
    if (isToday(due)) return 'Today';
    if (isTomorrow(due)) return 'Tomorrow';
    if (isThisWeek(due)) return format(due, 'EEEE');
    return format(due, 'MMM d');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <Container fluid className="p-4">
      {/* Welcome Header */}
      <div className="mb-4">
        <h1 className="display-5 fw-bold">
          {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Quick Stats Row */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <div className="stat-card purple">
            <div className="stat-icon">
              <FaBook />
            </div>
            <h3>{courses?.length || 0}</h3>
            <p className="text-muted mb-0">Active Courses</p>
          </div>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <div className="stat-card gold">
            <div className="stat-icon">
              <FaTasks />
            </div>
            <h3>{weekOverview.totalAssignments}</h3>
            <p className="text-muted mb-0">Tasks This Week</p>
            <ProgressBar 
              now={(weekOverview.completedAssignments / weekOverview.totalAssignments) * 100 || 0}
              className="mt-2"
              style={{ height: '4px' }}
            />
          </div>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <div className="stat-card purple">
            <div className="stat-icon">
              <FaClock />
            </div>
            <h3>{Math.round(weekOverview.totalStudyMinutes / 60)}h</h3>
            <p className="text-muted mb-0">Study Time This Week</p>
          </div>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <div className="stat-card gold">
            <div className="stat-icon">
              <FaChartLine />
            </div>
            <h3>{weekOverview.averageGrade}%</h3>
            <p className="text-muted mb-0">Average Grade</p>
          </div>
        </Col>
      </Row>

      <Row>
        {/* Upcoming Deadlines */}
        <Col lg={8}>
          {/* Today's Tasks */}
          {todaysTasks.length > 0 && (
            <Card className="mb-4">
              <Card.Header className="bg-warning bg-opacity-10 border-0">
                <h5 className="mb-0">
                  <FaCalendarAlt className="me-2" />
                  Today's Tasks
                </h5>
              </Card.Header>
              <Card.Body>
                {todaysTasks.map(task => (
                  <div key={task._id} className="d-flex align-items-center justify-content-between p-3 border rounded mb-2">
                    <div className="d-flex align-items-center">
                      <div className="form-check me-3">
                        <input 
                          type="checkbox" 
                          className="form-check-input"
                          checked={task.completed}
                          onChange={() => {/* Handle completion */}}
                        />
                      </div>
                      <div>
                        <h6 className="mb-1">{task.name}</h6>
                        <small className="text-muted">
                          {task.course?.name} • {format(new Date(task.dueDate), 'h:mm a')}
                        </small>
                      </div>
                    </div>
                    <Badge bg={getPriorityColor(task.dueDate, task.completed)}>
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Overdue Assignments Alert */}
          {overdueAssignments.length > 0 && (
            <Card className="mb-4 border-danger">
              <Card.Header className="bg-danger bg-opacity-10 border-0">
                <h5 className="mb-0 text-danger">
                  <FaExclamationTriangle className="me-2" />
                  Overdue Assignments ({overdueAssignments.length})
                </h5>
              </Card.Header>
              <Card.Body>
                {overdueAssignments.slice(0, 3).map(assignment => (
                  <div key={assignment._id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <div>
                      <h6 className="mb-1">{assignment.name}</h6>
                      <small className="text-muted">
                        {assignment.course?.name} • Due {format(new Date(assignment.dueDate), 'MMM d')}
                      </small>
                    </div>
                    <Link to={`/assignments/${assignment._id}`}>
                      <Button size="sm" variant="outline-danger">
                        Complete Now
                      </Button>
                    </Link>
                  </div>
                ))}
                {overdueAssignments.length > 3 && (
                  <div className="text-center mt-3">
                    <Link to="/assignments?filter=overdue">
                      View all {overdueAssignments.length} overdue assignments
                    </Link>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Upcoming Deadlines */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaCalendarAlt className="me-2" />
                Upcoming Deadlines
              </h5>
            </Card.Header>
            <Card.Body>
              {upcomingDeadlines.length > 0 ? (
                <div className="timeline">
                  {upcomingDeadlines.map((assignment, index) => (
                    <div key={assignment._id} className="timeline-item mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <Badge 
                              bg={getPriorityColor(assignment.dueDate, assignment.completed)}
                              className="me-2"
                            >
                              {formatDueDate(assignment.dueDate)}
                            </Badge>
                            <h6 className="mb-0">{assignment.name}</h6>
                          </div>
                          <small className="text-muted">
                            {assignment.course?.name} • {assignment.category}
                            {assignment.weight && ` • ${assignment.weight}% of grade`}
                          </small>
                        </div>
                        <Link to={`/assignments/${assignment._id}`}>
                          <Button size="sm" variant="outline-primary">
                            View
                          </Button>
                        </Link>
                      </div>
                      {index < upcomingDeadlines.length - 1 && <hr className="my-3" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-4">
                  No upcoming assignments. Great job staying on top of things!
                </p>
              )}
            </Card.Body>
            <Card.Footer className="bg-transparent">
              <Link to="/calendar" className="text-decoration-none">
                View Full Calendar →
              </Link>
            </Card.Footer>
          </Card>
        </Col>

        {/* Right Sidebar */}
        <Col lg={4}>
          {/* Course Progress */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaGraduationCap className="me-2" />
                Course Progress
              </h5>
            </Card.Header>
            <Card.Body>
              {courses?.slice(0, 4).map(course => (
                <div key={course._id} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-medium">{course.name}</span>
                    <small className="text-muted">
                      {course.currentGrade ? `${Math.round(course.currentGrade)}%` : 'N/A'}
                    </small>
                  </div>
                  <ProgressBar 
                    now={course.currentGrade || 0}
                    variant={course.currentGrade >= 90 ? 'success' : course.currentGrade >= 70 ? 'warning' : 'danger'}
                    style={{ height: '6px' }}
                  />
                </div>
              ))}
              <div className="text-center mt-3">
                <Link to="/grades">
                  <Button variant="outline-primary" size="sm">
                    View All Grades
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>

          {/* Study Streak */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FaClock className="me-2" />
                Study Streak
              </h5>
            </Card.Header>
            <Card.Body className="text-center">
              <div style={{ width: '150px', margin: '0 auto' }}>
                <CircularProgressbar
                  value={studyStats?.currentStreak || 0}
                  maxValue={30}
                  text={`${studyStats?.currentStreak || 0} days`}
                  styles={buildStyles({
                    textColor: '#7c3aed',
                    pathColor: '#7c3aed',
                    trailColor: '#e5e7eb',
                  })}
                />
              </div>
              <p className="mt-3 mb-2">
                <strong>{studyStats?.pomodorosCompleted || 0}</strong> pomodoros completed
              </p>
              <p className="text-muted small">
                {Math.round((studyStats?.totalMinutes || 0) / 60)} total hours studied
              </p>
              <Link to="/timer">
                <Button variant="primary" className="w-100 mt-2">
                  Start Study Session
                </Button>
              </Link>
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Link to="/assignments/new">
                  <Button variant="outline-primary" className="w-100">
                    <FaTasks className="me-2" />
                    Add Assignment
                  </Button>
                </Link>
                <Link to="/courses/new">
                  <Button variant="outline-secondary" className="w-100">
                    <FaBook className="me-2" />
                    Add Course
                  </Button>
                </Link>
                <Link to="/timer">
                  <Button variant="outline-info" className="w-100">
                    <FaClock className="me-2" />
                    Study Timer
                  </Button>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
