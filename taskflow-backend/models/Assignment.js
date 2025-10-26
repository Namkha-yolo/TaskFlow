const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['Homework', 'Quiz', 'Exam', 'Project', 'Lab', 'Discussion', 'Participation', 'Other']
  },
  dueDate: {
    type: Date,
    required: true
  },
  reminderDate: {
    type: Date
  },
  weight: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 100
  },
  earnedPoints: {
    type: Number,
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'overdue'],
    default: 'not-started'
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 60
  },
  actualTime: {
    type: Number, // in minutes
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadDate: Date
  }],
  reminderSent: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps and status
assignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-update status based on dates and completion
  if (this.completed) {
    this.status = 'completed';
  } else if (new Date() > this.dueDate) {
    this.status = 'overdue';
  } else if (this.actualTime > 0) {
    this.status = 'in-progress';
  } else {
    this.status = 'not-started';
  }
  
  // Auto-set priority based on due date if not manually set
  const now = new Date();
  const hoursUntilDue = (this.dueDate - now) / (1000 * 60 * 60);
  
  if (!this.isModified('priority')) {
    if (hoursUntilDue < 24) {
      this.priority = 'urgent';
    } else if (hoursUntilDue < 72) {
      this.priority = 'high';
    } else if (hoursUntilDue < 168) { // 1 week
      this.priority = 'medium';
    } else {
      this.priority = 'low';
    }
  }
  
  next();
});

// Calculate grade percentage
assignmentSchema.methods.getGradePercentage = function() {
  if (this.earnedPoints !== null && this.totalPoints > 0) {
    return (this.earnedPoints / this.totalPoints) * 100;
  }
  return null;
};

// Get color based on priority and status
assignmentSchema.methods.getDisplayColor = function() {
  if (this.status === 'completed') {
    return '#10b981'; // green
  } else if (this.status === 'overdue') {
    return '#ef4444'; // red
  } else if (this.priority === 'urgent') {
    return '#f97316'; // orange
  } else if (this.priority === 'high') {
    return '#eab308'; // yellow
  } else if (this.priority === 'medium') {
    return '#7c3aed'; // purple
  } else {
    return '#6b7280'; // gray
  }
};

module.exports = mongoose.model('Assignment', assignmentSchema);
