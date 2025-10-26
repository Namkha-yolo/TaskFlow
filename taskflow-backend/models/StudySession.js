const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  sessionType: {
    type: String,
    enum: ['pomodoro', 'break', 'long-break', 'custom'],
    default: 'pomodoro'
  },
  plannedDuration: {
    type: Number, // in minutes
    required: true,
    default: 25
  },
  actualDuration: {
    type: Number, // in minutes
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  interrupted: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  },
  productivity: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  distractions: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Static method to get study statistics for a user
studySessionSchema.statics.getStatistics = async function(userId, dateRange = {}) {
  const query = { user: userId };
  
  if (dateRange.start || dateRange.end) {
    query.startTime = {};
    if (dateRange.start) query.startTime.$gte = dateRange.start;
    if (dateRange.end) query.startTime.$lte = dateRange.end;
  }
  
  const sessions = await this.find(query).populate('course');
  
  const stats = {
    totalSessions: sessions.length,
    totalMinutes: 0,
    completedSessions: 0,
    averageSessionLength: 0,
    averageProductivity: 0,
    totalDistractions: 0,
    sessionsByCourse: {},
    sessionsByDay: {},
    pomodorosCompleted: 0,
    longestStreak: 0,
    currentStreak: 0
  };
  
  let productivitySum = 0;
  
  sessions.forEach(session => {
    // Total time
    stats.totalMinutes += session.actualDuration;
    
    // Completed sessions
    if (session.completed) {
      stats.completedSessions++;
      if (session.sessionType === 'pomodoro') {
        stats.pomodorosCompleted++;
      }
    }
    
    // Productivity
    productivitySum += session.productivity;
    
    // Distractions
    stats.totalDistractions += session.distractions;
    
    // By course
    if (session.course) {
      const courseName = session.course.name;
      if (!stats.sessionsByCourse[courseName]) {
        stats.sessionsByCourse[courseName] = {
          count: 0,
          totalMinutes: 0
        };
      }
      stats.sessionsByCourse[courseName].count++;
      stats.sessionsByCourse[courseName].totalMinutes += session.actualDuration;
    }
    
    // By day
    const day = session.startTime.toISOString().split('T')[0];
    if (!stats.sessionsByDay[day]) {
      stats.sessionsByDay[day] = {
        count: 0,
        totalMinutes: 0
      };
    }
    stats.sessionsByDay[day].count++;
    stats.sessionsByDay[day].totalMinutes += session.actualDuration;
  });
  
  // Calculate averages
  if (sessions.length > 0) {
    stats.averageSessionLength = Math.round(stats.totalMinutes / sessions.length);
    stats.averageProductivity = Math.round((productivitySum / sessions.length) * 10) / 10;
  }
  
  // Calculate streaks
  const sortedDays = Object.keys(stats.sessionsByDay).sort();
  let currentStreak = 0;
  let maxStreak = 0;
  let lastDate = null;
  
  sortedDays.forEach(day => {
    const currentDate = new Date(day);
    if (lastDate) {
      const dayDiff = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
      maxStreak = 1;
    }
    lastDate = currentDate;
  });
  
  stats.longestStreak = maxStreak;
  stats.currentStreak = currentStreak;
  
  return stats;
};

module.exports = mongoose.model('StudySession', studySessionSchema);
