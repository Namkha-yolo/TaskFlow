const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const { auth } = require('../middleware/auth');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `syllabus-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Helper function to extract dates from text
const extractDates = (text) => {
  const dates = [];
  // Common date patterns
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // MM/DD/YYYY or MM-DD-YYYY
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/g, // Month DD, YYYY
    /(\d{1,2})\s+(\w+)\s+(\d{4})/g, // DD Month YYYY
  ];
  
  datePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          dates.push({
            original: match[0],
            parsed: date,
            context: text.substring(
              Math.max(0, match.index - 50),
              Math.min(text.length, match.index + match[0].length + 50)
            )
          });
        }
      } catch (e) {
        // Invalid date, skip
      }
    }
  });
  
  return dates;
};

// Helper function to extract assignments from PDF text
const extractAssignments = (text) => {
  const assignments = [];
  const lines = text.split('\n');
  
  // Keywords that indicate assignments
  const assignmentKeywords = [
    'assignment', 'homework', 'hw', 'quiz', 'exam', 'midterm', 'final',
    'project', 'paper', 'presentation', 'lab', 'test', 'due'
  ];
  
  // Keywords for grade weights
  const weightKeywords = ['worth', 'weight', 'percentage', '%', 'points', 'pts'];
  
  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();
    
    // Check if line contains assignment keywords
    const hasAssignmentKeyword = assignmentKeywords.some(keyword => 
      lowerLine.includes(keyword)
    );
    
    if (hasAssignmentKeyword) {
      // Try to extract assignment name
      let name = line.trim();
      
      // Look for dates in this line and nearby lines
      let dueDate = null;
      const nearbyText = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join(' ');
      const dates = extractDates(nearbyText);
      if (dates.length > 0) {
        dueDate = dates[0].parsed;
      }
      
      // Look for weight/points
      let weight = null;
      const weightMatch = line.match(/(\d+(?:\.\d+)?)\s*%/);
      if (weightMatch) {
        weight = parseFloat(weightMatch[1]);
      } else {
        const pointsMatch = line.match(/(\d+)\s*(?:points|pts)/i);
        if (pointsMatch) {
          weight = parseInt(pointsMatch[1]);
        }
      }
      
      // Determine category
      let category = 'Other';
      if (lowerLine.includes('homework') || lowerLine.includes('hw')) {
        category = 'Homework';
      } else if (lowerLine.includes('quiz')) {
        category = 'Quiz';
      } else if (lowerLine.includes('exam') || lowerLine.includes('midterm') || lowerLine.includes('final')) {
        category = 'Exam';
      } else if (lowerLine.includes('project')) {
        category = 'Project';
      } else if (lowerLine.includes('lab')) {
        category = 'Lab';
      } else if (lowerLine.includes('discussion') || lowerLine.includes('participation')) {
        category = 'Discussion';
      }
      
      if (name && name.length > 3) {
        assignments.push({
          name: name.substring(0, 100), // Limit length
          dueDate,
          weight,
          category,
          description: nearbyText.substring(0, 200)
        });
      }
    }
  });
  
  return assignments;
};

// Helper function to extract grade breakdown
const extractGradeBreakdown = (text) => {
  const breakdown = [];
  const lines = text.split('\n');
  
  // Look for grade/grading section
  const gradingSection = lines.findIndex(line => 
    line.toLowerCase().includes('grading') || 
    line.toLowerCase().includes('grade breakdown') ||
    line.toLowerCase().includes('assessment')
  );
  
  if (gradingSection !== -1) {
    // Check next 20 lines for percentages
    for (let i = gradingSection; i < Math.min(gradingSection + 20, lines.length); i++) {
      const line = lines[i];
      const match = line.match(/(.+?)\s*[:=\-]\s*(\d+(?:\.\d+)?)\s*%/);
      if (match) {
        breakdown.push({
          category: match[1].trim(),
          weight: parseFloat(match[2])
        });
      }
    }
  }
  
  // If no breakdown found, look for percentages throughout document
  if (breakdown.length === 0) {
    const percentagePattern = /(.{5,50}?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*%/g;
    const matches = text.matchAll(percentagePattern);
    
    for (const match of matches) {
      const category = match[1].trim();
      // Filter out likely non-grade related percentages
      if (!category.match(/\d{4}/) && // Not a year
          !category.toLowerCase().includes('student') &&
          !category.toLowerCase().includes('attendance') &&
          category.length > 3) {
        breakdown.push({
          category,
          weight: parseFloat(match[2])
        });
      }
    }
  }
  
  return breakdown;
};

// @route   POST /api/syllabus/upload/:courseId
// @desc    Upload and parse syllabus PDF
// @access  Private
router.post('/upload/:courseId', auth, upload.single('syllabus'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { courseId } = req.params;
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, user: req.user._id });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Read and parse PDF
    const pdfPath = req.file.path;
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    
    // Extract information from PDF text
    const assignments = extractAssignments(pdfData.text);
    const gradeBreakdown = extractGradeBreakdown(pdfData.text);
    
    // Update course with syllabus info
    course.syllabus = {
      fileName: req.file.originalname,
      uploadDate: new Date(),
      extractedData: {
        assignments,
        gradeBreakdown
      }
    };
    
    // Update grade breakdown if found
    if (gradeBreakdown.length > 0) {
      course.gradeBreakdown = gradeBreakdown;
    }
    
    await course.save();
    
    // Return extracted data for review/editing
    res.json({
      success: true,
      fileName: req.file.originalname,
      extractedData: {
        assignments,
        gradeBreakdown,
        rawText: pdfData.text.substring(0, 1000) // First 1000 chars for preview
      },
      course
    });
  } catch (error) {
    console.error('Syllabus upload error:', error);
    res.status(500).json({ error: 'Error processing syllabus' });
  }
});

// @route   POST /api/syllabus/confirm/:courseId
// @desc    Confirm and create assignments from extracted syllabus data
// @access  Private
router.post('/confirm/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { assignments, gradeBreakdown } = req.body;
    
    // Verify course belongs to user
    const course = await Course.findOne({ _id: courseId, user: req.user._id });
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Update grade breakdown if provided
    if (gradeBreakdown && gradeBreakdown.length > 0) {
      course.gradeBreakdown = gradeBreakdown;
      await course.save();
    }
    
    // Create assignments
    const createdAssignments = [];
    for (const assignmentData of assignments) {
      // Only create if has name and due date
      if (assignmentData.name && assignmentData.dueDate) {
        const assignment = new Assignment({
          user: req.user._id,
          course: courseId,
          name: assignmentData.name,
          description: assignmentData.description || '',
          category: assignmentData.category || 'Other',
          dueDate: new Date(assignmentData.dueDate),
          weight: assignmentData.weight || 0,
          totalPoints: assignmentData.totalPoints || 100
        });
        
        await assignment.save();
        createdAssignments.push(assignment);
      }
    }
    
    res.json({
      success: true,
      message: `Created ${createdAssignments.length} assignments`,
      assignments: createdAssignments,
      course
    });
  } catch (error) {
    console.error('Syllabus confirmation error:', error);
    res.status(500).json({ error: 'Error creating assignments from syllabus' });
  }
});

// @route   GET /api/syllabus/parse-text
// @desc    Parse syllabus text (for manual input or correction)
// @access  Private
router.post('/parse-text', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }
    
    const assignments = extractAssignments(text);
    const gradeBreakdown = extractGradeBreakdown(text);
    
    res.json({
      success: true,
      extractedData: {
        assignments,
        gradeBreakdown
      }
    });
  } catch (error) {
    console.error('Text parsing error:', error);
    res.status(500).json({ error: 'Error parsing text' });
  }
});

module.exports = router;
