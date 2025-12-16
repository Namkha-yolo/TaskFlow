const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { auth } = require('../middleware/auth');

// @route   GET /api/courses
// @desc    Get all courses for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error fetching courses' });
    }

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('code').trim().notEmpty().withMessage('Course code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      code,
      instructor,
      semester,
      year,
      credits,
      color,
      location,
      meetingDays,
      meetingTime
    } = req.body;

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        user_id: req.user.id,
        name,
        code,
        instructor,
        semester,
        year,
        credits,
        color: color || '#3D2E1F',
        location,
        meeting_days: meetingDays,
        meeting_time_start: meetingTime?.start,
        meeting_time_end: meetingTime?.end
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error creating course' });
    }

    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating course' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get a single course
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching course' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name,
      code,
      instructor,
      semester,
      year,
      credits,
      color,
      location,
      meetingDays,
      meetingTime,
      currentGrade,
      targetGrade
    } = req.body;

    // First check if course belongs to user
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (instructor !== undefined) updateData.instructor = instructor;
    if (semester !== undefined) updateData.semester = semester;
    if (year !== undefined) updateData.year = year;
    if (credits !== undefined) updateData.credits = credits;
    if (color !== undefined) updateData.color = color;
    if (location !== undefined) updateData.location = location;
    if (meetingDays !== undefined) updateData.meeting_days = meetingDays;
    if (meetingTime?.start !== undefined) updateData.meeting_time_start = meetingTime.start;
    if (meetingTime?.end !== undefined) updateData.meeting_time_end = meetingTime.end;
    if (currentGrade !== undefined) updateData.current_grade = currentGrade;
    if (targetGrade !== undefined) updateData.target_grade = targetGrade;

    const { data: course, error } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error updating course' });
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating course' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // First check if course belongs to user
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingCourse) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Delete course (assignments will cascade delete due to FK)
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error deleting course' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting course' });
  }
});

// @route   GET /api/courses/:id/stats
// @desc    Get course statistics
// @access  Private
router.get('/:id/stats', auth, async (req, res) => {
  try {
    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get assignments for this course
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', req.params.id);

    if (assignmentsError) {
      return res.status(500).json({ message: 'Error fetching assignments' });
    }

    // Calculate stats
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(a => a.completed).length;
    const pendingAssignments = totalAssignments - completedAssignments;

    // Calculate grade if there are graded assignments
    const gradedAssignments = assignments.filter(a => a.earned_points !== null && a.max_grade);
    let currentGrade = null;
    if (gradedAssignments.length > 0) {
      const totalEarned = gradedAssignments.reduce((sum, a) => sum + a.earned_points, 0);
      const totalPossible = gradedAssignments.reduce((sum, a) => sum + a.max_grade, 0);
      currentGrade = (totalEarned / totalPossible) * 100;
    }

    res.json({
      course,
      stats: {
        totalAssignments,
        completedAssignments,
        pendingAssignments,
        currentGrade
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error getting course stats' });
  }
});

module.exports = router;
