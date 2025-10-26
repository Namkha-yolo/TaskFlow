const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  courseCode: {
    type: String,
    trim: true
  },
  professor: {
    type: String,
    trim: true
  },
  semester: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    default: new Date().getFullYear()
  },
  color: {
    type: String,
    default: '#7c3aed' // Purple default
  },
  credits: {
    type: Number,
    default: 3
  },
  syllabus: {
    fileName: String,
    uploadDate: Date,
    extractedData: {
      assignments: [{
        name: String,
        dueDate: Date,
        weight: Number,
        description: String
      }],
      gradeBreakdown: [{
        category: String,
        weight: Number
      }]
    }
  },
  gradeBreakdown: [{
    category: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    }
  }],
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    startTime: String,
    endTime: String,
    location: String
  },
  currentGrade: {
    type: Number,
    min: 0,
    max: 100
  },
  targetGrade: {
    type: Number,
    min: 0,
    max: 100,
    default: 90
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate current grade based on completed assignments
courseSchema.methods.calculateCurrentGrade = async function() {
  const Assignment = mongoose.model('Assignment');
  const assignments = await Assignment.find({ 
    course: this._id, 
    completed: true 
  });

  if (assignments.length === 0) {
    this.currentGrade = null;
    return null;
  }

  let totalWeight = 0;
  let weightedSum = 0;

  // Group assignments by category
  const categories = {};
  this.gradeBreakdown.forEach(category => {
    categories[category.category] = {
      weight: category.weight,
      assignments: [],
      totalPossible: 0,
      totalEarned: 0
    };
  });

  assignments.forEach(assignment => {
    if (categories[assignment.category]) {
      categories[assignment.category].assignments.push(assignment);
      categories[assignment.category].totalPossible += assignment.totalPoints || 100;
      categories[assignment.category].totalEarned += assignment.earnedPoints || 0;
    }
  });

  // Calculate weighted grade
  Object.values(categories).forEach(category => {
    if (category.assignments.length > 0) {
      const categoryPercentage = (category.totalEarned / category.totalPossible) * 100;
      weightedSum += categoryPercentage * (category.weight / 100);
      totalWeight += category.weight;
    }
  });

  if (totalWeight > 0) {
    this.currentGrade = (weightedSum / totalWeight) * 100;
    await this.save();
    return this.currentGrade;
  }

  return null;
};

module.exports = mongoose.model('Course', courseSchema);
