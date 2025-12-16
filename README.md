# TaskFlow - Academic Task Management System

TaskFlow is a comprehensive academic task management web application designed to help students organize their courses, track assignments, manage their time effectively, and calculate grades. Built with React and featuring a modern, elegant brown/gold design theme inspired by StudySync.

## Overview

TaskFlow provides students with a centralized platform to manage their academic life. The application runs entirely in the browser using localStorage for data persistence, making it easy to deploy without requiring a backend server.

## Features

### 1. User Authentication
- **Registration**: Create an account with name, email, and password
- **Login**: Secure sign-in with email and password
- **Session Management**: Persistent login sessions stored in localStorage
- **Protected Routes**: Dashboard and features only accessible to authenticated users

### 2. Dashboard
- **Personalized Welcome**: Displays user's name with a customized greeting
- **Course Overview**: Visual grid of all enrolled courses with color-coded cards
- **Upcoming Due Dates**: Table showing the next 5 assignments due
- **Quick Actions**: Easy access to add courses or view all assignments

### 3. Course Management
- **Add Courses**: Create courses with:
  - Course code (e.g., CS101)
  - Course name
  - Instructor name
  - Location
  - Semester and year
  - Credit hours
  - Custom color for visual identification
- **Edit Courses**: Update any course information
- **Delete Courses**: Remove courses with confirmation
- **Visual Cards**: Each course displays as a color-coded card for easy recognition

### 4. Assignment Tracking
- **Create Assignments**: Add assignments with:
  - Title and description
  - Associated course
  - Assignment type (Assignment, Quiz, Exam, Project)
  - Due date
  - Status tracking
- **Status Management**:
  - Not Started: Default state for new assignments
  - In Progress: Mark when actively working
  - Completed: Mark when finished
- **Filtering**: View assignments by status (All, In Progress, Not Started, Completed)
- **Course Filtering**: View assignments for a specific course
- **Edit & Update**: Modify assignment details at any time

### 5. Grade Calculator
- **Course Selection**: Calculate grades per course
- **Grade Components**: Define grading categories with:
  - Category name (Homework, Exams, Projects, etc.)
  - Weight percentage
  - Score earned
  - Maximum possible score
- **Real-time Calculation**:
  - Current grade based on completed work
  - Target grade setting
  - Required grade on remaining work to achieve target
- **What-If Scenarios**: See projected final grades for:
  - Perfect scores (100%)
  - Great work (90%)
  - Good work (80%)
  - Passing (70%)
- **Letter Grade Display**: Automatic conversion to letter grades (A through F)
- **Progress Visualization**: Visual progress bar showing current standing
- **Persistent Storage**: Grade data saved per course in localStorage

### 6. Pomodoro Study Timer
- **Customizable Timer**:
  - Work duration (default 25 minutes)
  - Short break (default 5 minutes)
  - Long break (default 15 minutes)
  - Sessions until long break (default 4)
- **Timer Controls**:
  - Start/Pause/Resume
  - Reset to beginning
  - Skip to next phase
- **Session Tracking**:
  - Link sessions to specific courses
  - Add session notes
  - View today's completed sessions
  - Total study time display
- **Visual Feedback**:
  - Large countdown display
  - Progress bar
  - Break/Focus mode indicators
  - Session counter
- **Automatic Transitions**: Timer automatically switches between work and break periods

### 7. Landing Page
- **Hero Section**: Welcoming message with call-to-action
- **Feature Highlights**: Overview of key application features
- **Navigation**: Easy access to login and registration

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **React Router v6**: Client-side routing with protected routes
- **React Bootstrap**: UI component library
- **React Icons**: Icon library (Font Awesome icons)
- **date-fns**: Date formatting and manipulation
- **react-toastify**: Toast notifications for user feedback

### Styling
- **Custom CSS**: Comprehensive design system with CSS variables
- **Google Fonts**: Playfair Display (headings) and Inter (body)
- **Responsive Design**: Mobile-first approach with breakpoints

### Data Storage
- **localStorage**: Browser-based persistence for:
  - User authentication
  - Courses
  - Assignments
  - Study sessions
  - Grade calculations
- **Supabase Mock**: API-compatible interface using localStorage

## Design System

### Color Palette
- **Primary Dark**: #2D2013 (Dark brown)
- **Primary Brown**: #3D2E1F (Medium brown)
- **Primary Gold**: #D4A017 (Accent gold)
- **Background Cream**: #F5F0E8
- **Background Tan**: #C4A77D

### Typography
- **Headings**: Playfair Display (serif, italic for emphasis)
- **Body Text**: Inter (sans-serif)

### Components
- Gradient headers with gold titles
- Rounded cards with subtle shadows
- Gold accent buttons
- Status badges with icons

## Project Structure

```
TaskFlow/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navigation.js      # Top navigation bar
│   │   └── Footer.js          # Page footer
│   ├── config/
│   │   └── supabase.js        # localStorage mock API
│   ├── context/
│   │   ├── AuthContext.js     # Authentication state
│   │   └── CourseContext.js   # Course management state
│   ├── pages/
│   │   ├── Landing.js         # Public landing page
│   │   ├── Login.js           # User login
│   │   ├── Register.js        # User registration
│   │   ├── Dashboard.js       # Main dashboard
│   │   ├── Courses.js         # Course management
│   │   ├── Assignments.js     # Assignment tracking
│   │   ├── GradeCalculator.js # Grade calculations
│   │   └── StudyTimer.js      # Pomodoro timer
│   ├── App.js                 # Main app with routing
│   ├── App.css                # Global styles
│   └── index.js               # Entry point
├── package.json
├── .gitignore
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Deployment

The application can be deployed to any static hosting service:

- **Vercel**: Connect repository for automatic deployments
- **Netlify**: Drag and drop build folder or connect repository
- **GitHub Pages**: Use gh-pages package
- **AWS S3**: Host as static website

### Vercel Deployment
A `vercel.json` configuration file is included for optimal deployment:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Usage

### Getting Started
1. Visit the landing page
2. Click "Sign Up" to create an account
3. Fill in your name, email, and password
4. You'll be automatically logged in and redirected to the dashboard

### Adding Your First Course
1. From the dashboard, click "Add Course" or the "+ Add a class" card
2. Fill in the course details
3. Click "Create" to save

### Tracking Assignments
1. Navigate to "Assignments" from the navigation bar
2. Click "+ Add Assignment"
3. Select the course, add title, type, and due date
4. Use status buttons to track progress

### Using the Grade Calculator
1. Go to "Grade Calculator" from the navigation
2. Select a course from the dropdown
3. Customize grade categories and weights
4. Enter your scores as you receive them
5. View your current grade and projections

### Study Sessions with Pomodoro Timer
1. Navigate to "Study Timer"
2. Optionally select a course to track
3. Click "Start" to begin a 25-minute focus session
4. Take breaks as prompted
5. View your study progress in the sidebar

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Data Persistence

All data is stored in the browser's localStorage:
- `taskflow_user`: Current user session
- `taskflow_users`: Registered users
- `taskflow_courses`: User courses
- `taskflow_assignments`: User assignments
- `taskflow_study_sessions_[userId]`: Study timer sessions
- `taskflow_grades_[userId]_[courseId]`: Grade calculator data

**Note**: Clearing browser data will remove all stored information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is created for educational purposes.

## Acknowledgments

- Design inspired by StudySync theme
- Built with React and React Bootstrap
- Icons from React Icons (Font Awesome)
