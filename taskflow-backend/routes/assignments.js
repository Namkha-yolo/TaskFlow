const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// @route   GET /api/assignments
// @desc    Get all assignments for user (with optional filters)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { course, status, priority } = req.query;

    let query = supabase
      .from('assignments')
      .select(`
        *,
        courses (
          id,
          name,
          code,
          color
        )
      `)
      .eq('user_id', req.user.id)
      .order('due_date', { ascending: true });

    // Apply filters
    if (course) {
      query = query.eq('course_id', course);
    }
    if (status) {
      if (status === 'completed') {
        query = query.eq('completed', true);
      } else if (status === 'pending') {
        query = query.eq('completed', false);
      } else if (status === 'overdue') {
        query = query
          .eq('completed', false)
          .lt('due_date', new Date().toISOString());
      }
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: assignments, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error fetching assignments' });
    }

    // Transform data to match frontend expectations
    const transformedAssignments = assignments.map(a => ({
      _id: a.id,
      title: a.title,
      description: a.description,
      course: a.course_id,
      courseName: a.courses?.name,
      type: a.type,
      dueDate: a.due_date,
      status: a.status,
      priority: a.priority,
      completed: a.completed,
      gradeWeight: a.grade_weight,
      maxGrade: a.max_grade,
      earnedPoints: a.earned_points,
      createdAt: a.created_at
    }));

    res.json(transformedAssignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching assignments' });
  }
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('course').notEmpty().withMessage('Course is required'),
  body('dueDate').notEmpty().withMessage('Due date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      course,
      courseName,
      type,
      dueDate,
      status,
      priority,
      gradeWeight,
      maxGrade,
      reminderDate
    } = req.body;

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        user_id: req.user.id,
        course_id: course,
        title,
        description,
        type: type || 'Assignment',
        due_date: dueDate,
        status: status || 'not-started',
        priority: priority || 'medium',
        grade_weight: gradeWeight,
        max_grade: maxGrade || 100,
        reminder_date: reminderDate
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error creating assignment' });
    }

    // Transform to match frontend expectations
    const transformedAssignment = {
      _id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      course: assignment.course_id,
      courseName: courseName,
      type: assignment.type,
      dueDate: assignment.due_date,
      status: assignment.status,
      priority: assignment.priority,
      completed: assignment.completed,
      gradeWeight: assignment.grade_weight,
      maxGrade: assignment.max_grade,
      createdAt: assignment.created_at
    };

    res.status(201).json(transformedAssignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating assignment' });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get a single assignment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(`
        *,
        courses (
          id,
          name,
          code,
          color
        )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching assignment' });
  }
});

// @route   PATCH /api/assignments/:id
// @desc    Update an assignment
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    // First check if assignment belongs to user
    const { data: existingAssignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const {
      title,
      description,
      course,
      type,
      dueDate,
      status,
      priority,
      completed,
      gradeWeight,
      maxGrade,
      earnedPoints,
      reminderDate
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (course !== undefined) updateData.course_id = course;
    if (type !== undefined) updateData.type = type;
    if (dueDate !== undefined) updateData.due_date = dueDate;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (completed !== undefined) updateData.completed = completed;
    if (gradeWeight !== undefined) updateData.grade_weight = gradeWeight;
    if (maxGrade !== undefined) updateData.max_grade = maxGrade;
    if (earnedPoints !== undefined) updateData.earned_points = earnedPoints;
    if (reminderDate !== undefined) updateData.reminder_date = reminderDate;

    const { data: assignment, error } = await supabase
      .from('assignments')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error updating assignment' });
    }

    res.json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating assignment' });
  }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete an assignment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // First check if assignment belongs to user
    const { data: existingAssignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error deleting assignment' });
    }

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting assignment' });
  }
});

// @route   POST /api/assignments/bulk
// @desc    Create multiple assignments (for syllabus import)
// @access  Private
router.post('/bulk', auth, async (req, res) => {
  try {
    const { assignments, courseId } = req.body;

    if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ message: 'Assignments array is required' });
    }

    // Prepare assignments for insertion
    const assignmentsToInsert = assignments.map(a => ({
      user_id: req.user.id,
      course_id: courseId || a.course,
      title: a.title,
      description: a.description,
      type: a.type || 'Assignment',
      due_date: a.dueDate,
      status: 'not-started',
      priority: a.priority || 'medium',
      grade_weight: a.gradeWeight,
      max_grade: a.maxGrade || 100
    }));

    const { data: createdAssignments, error } = await supabase
      .from('assignments')
      .insert(assignmentsToInsert)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error creating assignments' });
    }

    res.status(201).json({
      message: `${createdAssignments.length} assignments created successfully`,
      assignments: createdAssignments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating assignments' });
  }
});

module.exports = router;
