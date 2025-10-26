const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

// @route   GET /api/courses
// @desc    Get all user's courses
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find({ 
      user: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching courses' });
  }
});

// @route   GET /api/courses/:id
// @desc    Get single course with assignments
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Get assignments for this course
    const assignments = await Assignment.find({
      course: req.params.id,
      user: req.user._id
    }).sort({ dueDate: 1 });
    
    // Calculate current grade
    await course.calculateCurrentGrade();
    
    res.json({
      course,
      assignments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error fetching course' });
  }
});

// @route   POST /api/courses
// @desc    Create new course
// @access  Private
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('semester').trim().notEmpty().withMessage('Semester is required'),
  body('year').isNumeric().withMessage('Valid year is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const {
      name,
      courseCode,
      professor,
      semester,
      year,
      color,
      credits,
      gradeBreakdown,
      schedule,
      targetGrade,
      notes
    } = req.body;
    
    // Validate grade breakdown if provided
    if (gradeBreakdown && gradeBreakdown.length > 0) {
      const totalWeight = gradeBreakdown.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight !== 100) {
        return res.status(400).json({ 
          error: 'Grade breakdown weights must sum to 100%' 
        });
      }
    }
    
    const course = new Course({
      user: req.user._id,
      name,
      courseCode,
      professor,
      semester,
      year,
      color: color || '#7c3aed',
      credits: credits || 3,
      gradeBreakdown: gradeBreakdown || [],
      schedule: schedule || {},
      targetGrade: targetGrade || 90,
      notes
    });
    
    await course.save();
    
    // Add course to user's courses array
    req.user.courses.push(course._id);
    await req.user.save();
    
    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error creating course' });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Validate grade breakdown if provided
    if (req.body.gradeBreakdown && req.body.gradeBreakdown.length > 0) {
      const totalWeight = req.body.gradeBreakdown.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight !== 100) {
        return res.status(400).json({ 
          error: 'Grade breakdown weights must sum to 100%' 
        });
      }
    }
    
    // Update fields
    const updateFields = [
      'name', 'courseCode', 'professor', 'semester', 'year',
      'color', 'credits', 'gradeBreakdown', 'schedule',
      'targetGrade', 'notes', 'isActive'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });
    
    await course.save();
    
    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error updating course' });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course (soft delete - marks as inactive)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Soft delete - mark as inactive
    course.isActive = false;
    await course.save();
    
    // Optionally also mark all assignments as completed or archived
    if (req.query.archiveAssignments === 'true') {
      await Assignment.updateMany(
        { course: req.params.id, user: req.user._id },
        { $set: { completed: true } }
      );
    }
    
    // Remove from user's courses array
    req.user.courses = req.user.courses.filter(
      c => c.toString() !== req.params.id
    );
    await req.user.save();
    
    res.json({ message: 'Course archived successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error deleting course' });
  }
});

// @route   POST /api/courses/:id/calculate-grade
// @desc    Recalculate course grade
// @access  Private
router.post('/:id/calculate-grade', auth, async (req, res) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    const grade = await course.calculateCurrentGrade();
    
    res.json({ 
      course,
      currentGrade: grade
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error calculating grade' });
  }
});

module.exports = router;
