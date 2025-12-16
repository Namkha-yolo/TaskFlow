const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const { auth } = require('../middleware/auth');
const supabase = require('../config/supabase');

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
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g,
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})/g,
    /(\d{1,2})\s+(\w+)\s+(\d{4})/g,
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

  const assignmentKeywords = [
    'assignment', 'homework', 'hw', 'quiz', 'exam', 'midterm', 'final',
    'project', 'paper', 'presentation', 'lab', 'test', 'due'
  ];

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase();

    const hasAssignmentKeyword = assignmentKeywords.some(keyword =>
      lowerLine.includes(keyword)
    );

    if (hasAssignmentKeyword) {
      let name = line.trim();

      let dueDate = null;
      const nearbyText = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join(' ');
      const dates = extractDates(nearbyText);
      if (dates.length > 0) {
        dueDate = dates[0].parsed;
      }

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

      let category = 'Assignment';
      if (lowerLine.includes('homework') || lowerLine.includes('hw')) {
        category = 'Assignment';
      } else if (lowerLine.includes('quiz')) {
        category = 'Quiz';
      } else if (lowerLine.includes('exam') || lowerLine.includes('midterm') || lowerLine.includes('final')) {
        category = 'Exam';
      } else if (lowerLine.includes('project')) {
        category = 'Project';
      } else if (lowerLine.includes('lab')) {
        category = 'Lab';
      } else if (lowerLine.includes('paper')) {
        category = 'Paper';
      }

      if (name && name.length > 3) {
        assignments.push({
          title: name.substring(0, 100),
          dueDate: dueDate ? dueDate.toISOString() : null,
          gradeWeight: weight,
          type: category,
          description: nearbyText.substring(0, 200)
        });
      }
    }
  });

  return assignments;
};

// @route   POST /api/syllabus/upload
// @desc    Upload and parse syllabus PDF
// @access  Private
router.post('/upload', auth, upload.single('syllabus'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read and parse PDF
    const pdfPath = req.file.path;
    const pdfBuffer = await fs.readFile(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);

    // Extract information from PDF text
    const assignments = extractAssignments(pdfData.text);

    // Clean up uploaded file
    await fs.unlink(pdfPath).catch(() => {});

    res.json({
      success: true,
      fileName: req.file.originalname,
      extractedData: {
        assignments,
        rawText: pdfData.text.substring(0, 2000)
      }
    });
  } catch (error) {
    console.error('Syllabus upload error:', error);
    res.status(500).json({ message: 'Error processing syllabus' });
  }
});

// @route   POST /api/syllabus/confirm
// @desc    Confirm and create assignments from extracted syllabus data
// @access  Private
router.post('/confirm', auth, async (req, res) => {
  try {
    const { courseId, assignments } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    // Verify course belongs to user
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name')
      .eq('id', courseId)
      .eq('user_id', req.user.id)
      .single();

    if (courseError || !course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Create assignments
    const assignmentsToInsert = assignments
      .filter(a => a.title && a.dueDate)
      .map(a => ({
        user_id: req.user.id,
        course_id: courseId,
        title: a.title,
        description: a.description || '',
        type: a.type || 'Assignment',
        due_date: a.dueDate,
        grade_weight: a.gradeWeight,
        max_grade: a.maxGrade || 100,
        status: 'not-started',
        priority: 'medium'
      }));

    if (assignmentsToInsert.length === 0) {
      return res.status(400).json({ message: 'No valid assignments to create' });
    }

    const { data: createdAssignments, error } = await supabase
      .from('assignments')
      .insert(assignmentsToInsert)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: 'Error creating assignments' });
    }

    res.json({
      success: true,
      message: `Created ${createdAssignments.length} assignments`,
      assignments: createdAssignments,
      course
    });
  } catch (error) {
    console.error('Syllabus confirmation error:', error);
    res.status(500).json({ message: 'Error creating assignments from syllabus' });
  }
});

// @route   POST /api/syllabus/parse-text
// @desc    Parse syllabus text (for manual input)
// @access  Private
router.post('/parse-text', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'No text provided' });
    }

    const assignments = extractAssignments(text);

    res.json({
      success: true,
      extractedData: {
        assignments
      }
    });
  } catch (error) {
    console.error('Text parsing error:', error);
    res.status(500).json({ message: 'Error parsing text' });
  }
});

module.exports = router;
