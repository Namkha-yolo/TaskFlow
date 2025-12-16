import React, { useState, useEffect } from 'react';
import { Row, Col, Modal, Form, Button } from 'react-bootstrap';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { FaCheck, FaClock, FaCircle } from 'react-icons/fa';
import Footer from '../components/Footer';
import { supabase } from '../config/supabase';
import { useAuth } from '../context/AuthContext';
import { useCourses } from '../context/CourseContext';

const Assignments = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');
  const { user } = useAuth();
  const { courses } = useCourses();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', course_id: '', type: 'Assignment', due_date: '', status: 'not-started'
  });

  useEffect(() => {
    fetchAssignments();
    // eslint-disable-next-line
  }, [user?.id, courseId]);

  const fetchAssignments = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      let query = supabase.from('assignments').select('*, courses(id, name, code)').eq('user_id', user.id);
      if (courseId) query = query.eq('course_id', courseId);
      const { data, error } = await query.order('due_date', { ascending: true });
      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error loading assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    try {
      if (editingAssignment) {
        const { error } = await supabase.from('assignments').update({
          title: formData.title, description: formData.description, course_id: formData.course_id,
          type: formData.type, due_date: formData.due_date, status: formData.status, completed: formData.status === 'completed'
        }).eq('id', editingAssignment.id).eq('user_id', user.id);
        if (error) throw error;
        toast.success('Assignment updated');
      } else {
        const { error } = await supabase.from('assignments').insert({
          user_id: user.id, course_id: formData.course_id, title: formData.title, description: formData.description,
          type: formData.type, due_date: formData.due_date, status: 'not-started', priority: 'medium'
        });
        if (error) throw error;
        toast.success('Assignment created');
      }
      setShowModal(false);
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error saving assignment');
    }
  };

  const handleStatusChange = async (assignment, newStatus) => {
    try {
      const { error } = await supabase.from('assignments').update({ status: newStatus, completed: newStatus === 'completed' })
        .eq('id', assignment.id).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Status updated');
      fetchAssignments();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', course_id: courseId || '', type: 'Assignment', due_date: '', status: 'not-started' });
    setEditingAssignment(null);
  };

  const handleEdit = (a) => {
    setEditingAssignment(a);
    setFormData({
      title: a.title, description: a.description || '', course_id: a.course_id,
      type: a.type, due_date: format(new Date(a.due_date), 'yyyy-MM-dd'), status: a.status || 'not-started'
    });
    setShowModal(true);
  };

  const filtered = assignments.filter(a => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed') return a.completed;
    if (activeFilter === 'in-progress') return a.status === 'in-progress';
    return !a.completed && a.status !== 'in-progress';
  });

  const selectedCourse = courseId ? courses.find(c => c.id === courseId) : null;

  if (loading) return <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}><div className="spinner-border"></div></div>;

  return (
    <div className="assignments-page">
      <section className="course-detail-header">
        <h1 className="course-detail-title">{selectedCourse ? selectedCourse.name : 'All Assignments'}</h1>
        {selectedCourse && <p className="course-detail-info">{selectedCourse.code}</p>}
      </section>

      <div className="filter-tabs bg-tan">
        <button className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>All</button>
        <button className={`filter-tab ${activeFilter === 'in-progress' ? 'active' : ''}`} onClick={() => setActiveFilter('in-progress')}><FaClock className="me-1" />In Progress</button>
        <button className={`filter-tab ${activeFilter === 'not-started' ? 'active' : ''}`} onClick={() => setActiveFilter('not-started')}><FaCircle className="me-1" style={{ fontSize: '0.5rem' }} />Not Started</button>
        <button className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`} onClick={() => setActiveFilter('completed')}><FaCheck className="me-1" />Completed</button>
        <Button className="btn-primary ms-auto" onClick={() => { resetForm(); setShowModal(true); }}>+ Add Assignment</Button>
      </div>

      <div className="assignments-grid">
        {filtered.length > 0 ? filtered.map(a => (
          <div key={a.id} className="assignment-card">
            <span className={`assignment-status-badge ${a.completed ? 'completed' : a.status === 'in-progress' ? 'in-progress' : 'not-started'}`}>
              {a.completed ? <><FaCheck className="me-1" />Completed</> : a.status === 'in-progress' ? <><FaClock className="me-1" />In Progress</> : <><FaCircle className="me-1" style={{ fontSize: '0.5rem' }} />Not Started</>}
            </span>
            <h3 className="assignment-card-title">{a.title}</h3>
            <p className="assignment-card-course">{a.courses?.name || 'Unknown'}</p>
            <p className="assignment-card-due">Due: {format(new Date(a.due_date), 'MM-dd-yyyy')}</p>
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Button size="sm" variant="outline-secondary" onClick={() => handleEdit(a)}>Edit</Button>
              {!a.completed && (
                <div className="d-flex gap-1">
                  {a.status !== 'in-progress' && <Button size="sm" variant="outline-secondary" onClick={() => handleStatusChange(a, 'in-progress')}>Start</Button>}
                  <Button size="sm" variant="outline-success" onClick={() => handleStatusChange(a, 'completed')}>Complete</Button>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="text-center py-5" style={{ gridColumn: '1 / -1' }}>
            <p>No assignments found</p>
            <Button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>Create Assignment</Button>
          </div>
        )}
      </div>

      <Footer />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{editingAssignment ? 'Edit' : 'Add'} Assignment</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Title *</Form.Label><Form.Control type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Course *</Form.Label><Form.Select value={formData.course_id} onChange={(e) => setFormData({ ...formData, course_id: e.target.value })} required>
                <option value="">Select</option>{courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
              </Form.Select></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Form.Group>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Type</Form.Label><Form.Select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option>Assignment</option><option>Quiz</option><option>Exam</option><option>Project</option></Form.Select></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Due Date *</Form.Label><Form.Control type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Status</Form.Label><Form.Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}><option value="not-started">Not Started</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></Form.Select></Form.Group></Col>
            </Row>
            <div className="d-flex justify-content-end gap-2"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit">{editingAssignment ? 'Update' : 'Create'}</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Assignments;
