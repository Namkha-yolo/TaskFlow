# TaskFlow - Academic Task Management Application

## Project Documentation

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Features & Functionality](#features--functionality)
4. [Application Screenshots](#application-screenshots)
5. [System Architecture](#system-architecture)
6. [Database Schema](#database-schema)
7. [Installation & Setup](#installation--setup)
8. [Deployment](#deployment)
9. [Future Enhancements](#future-enhancements)

---

## Project Overview

**TaskFlow** is a comprehensive academic task management web application designed to help students organize their coursework, track assignments, calculate grades, and manage study time effectively.

### Problem Statement
Students often struggle to keep track of multiple courses, assignments, deadlines, and grades across their academic semester. Existing solutions are either too complex or don't provide the integrated experience needed for effective academic management.

### Solution
TaskFlow provides an all-in-one platform that allows students to:
- Manage all their courses in one place
- Track assignments and due dates
- Calculate current and projected grades
- Use a built-in Pomodoro study timer
- Upload syllabi to automatically extract assignments

### Target Users
- College and university students
- High school students
- Anyone managing academic coursework

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| React Router v6 | Client-side routing |
| React Bootstrap | UI Component library |
| Chart.js | Grade visualization charts |
| React Toastify | Notification system |
| date-fns | Date formatting |
| Axios | HTTP client (legacy) |

### Backend & Database
| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service |
| PostgreSQL | Database (via Supabase) |
| Supabase Auth | User authentication |
| Row Level Security | Data protection |

### Deployment
| Platform | Purpose |
|----------|---------|
| Vercel | Frontend hosting |
| Supabase | Database & Auth hosting |

---

## Features & Functionality

### 1. User Authentication
- **Email/Password Registration**: Secure account creation with validation
- **Email/Password Login**: Persistent sessions with auto-refresh
- **Google OAuth**: One-click sign-in with Google account
- **Password Recovery**: Reset password via email
- **Profile Management**: Update name, school, major, and year

**Screenshot placeholder:** `[Insert login page screenshot]`

### 2. Dashboard
The main hub displaying:
- Personalized welcome message
- Overview of all enrolled courses
- Upcoming assignment due dates (next 4 assignments)
- Quick action buttons for syllabus upload and study timer

**Screenshot placeholder:** `[Insert dashboard screenshot]`

### 3. Course Management
- **Add Courses**: Create new courses with details:
  - Course name and code
  - Instructor name
  - Semester and year
  - Meeting days and times
  - Location
  - Custom color coding
- **Edit Courses**: Modify course details anytime
- **Delete Courses**: Remove courses (cascades to assignments)
- **Course Cards**: Visual representation with color coding

**Screenshot placeholder:** `[Insert courses page screenshot]`

### 4. Assignment Tracking
- **Create Assignments**: Add assignments with:
  - Title and description
  - Associated course
  - Type (Assignment, Quiz, Exam, Project, Paper, Lab)
  - Due date
  - Grade weight and max points
  - Priority level
- **Status Tracking**: Track progress with statuses:
  - Not Started
  - In Progress
  - Completed
- **Filtering**: Filter assignments by status
- **Course Filtering**: View assignments for specific courses

**Screenshot placeholder:** `[Insert assignments page screenshot]`

### 5. Grade Calculator
Comprehensive grade tracking and projection:
- **Current Grade**: Calculate based on completed assignments
- **Projected Grade**: Estimate final grade based on current performance
- **Target Grade**: Set a goal and see what you need to achieve it
- **What-If Scenarios**: See potential outcomes:
  - Perfect scores scenario
  - Good performance (85%)
  - Average performance (75%)
  - Minimum passing (60%)
- **Grade Distribution Chart**: Visual pie chart of grade weights
- **Required Grades**: See what scores you need on remaining assignments

**Screenshot placeholder:** `[Insert grade calculator screenshot]`

### 6. Pomodoro Study Timer
Built-in productivity timer:
- **Work Sessions**: Customizable focus periods (default 25 min)
- **Short Breaks**: Brief rest periods (default 5 min)
- **Long Breaks**: Extended rest after multiple sessions (default 15 min)
- **Session Tracking**: Log study sessions with:
  - Associated course
  - Associated assignment
  - Session notes
- **Daily Statistics**: View total study time and session history
- **Audio Notifications**: Sound alerts when sessions complete

**Screenshot placeholder:** `[Insert study timer screenshot]`

### 7. Syllabus Upload (Backend Required)
- **PDF Upload**: Upload course syllabi
- **Automatic Extraction**: Parse assignments and due dates
- **Review & Confirm**: Edit extracted data before saving
- **Bulk Import**: Create multiple assignments at once

**Screenshot placeholder:** `[Insert syllabus upload screenshot]`

---

## Application Screenshots

> **Instructions**: Replace the placeholders below with actual screenshots from your application.

### Landing Page
![Landing Page](./screenshots/landing.png)
*The landing page welcomes users and provides login/register options*

### Registration Page
![Registration](./screenshots/register.png)
*New users can create an account with email or Google*

### Login Page
![Login](./screenshots/login.png)
*Existing users can sign in with email/password or Google OAuth*

### Dashboard
![Dashboard](./screenshots/dashboard.png)
*Main dashboard showing courses and upcoming assignments*

### Courses Page
![Courses](./screenshots/courses.png)
*Course management with add/edit functionality*

### Assignments Page
![Assignments](./screenshots/assignments.png)
*Assignment tracking with status filters*

### Grade Calculator
![Grade Calculator](./screenshots/grade-calculator.png)
*Grade calculation and projection tool*

### Study Timer
![Study Timer](./screenshots/study-timer.png)
*Pomodoro timer for focused study sessions*

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React Application                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │Dashboard│ │ Courses │ │Assignmt │ │  Timer  │        │    │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │    │
│  │                         │                                  │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │              Context Providers                    │    │    │
│  │  │    AuthContext    │    CourseContext             │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  │                         │                                  │    │
│  │  ┌─────────────────────────────────────────────────┐    │    │
│  │  │           Supabase Client SDK                    │    │    │
│  │  └─────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Auth Service   │  │   PostgreSQL    │  │  Row Level      │ │
│  │   - Email/Pass   │  │   Database      │  │  Security       │ │
│  │   - Google OAuth │  │   - users       │  │  (RLS)          │ │
│  │   - Sessions     │  │   - courses     │  │                 │ │
│  │                  │  │   - assignments │  │                 │ │
│  │                  │  │   - sessions    │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. User interacts with React frontend
2. React components use Context providers for state management
3. Supabase client SDK handles all database operations
4. Supabase Auth manages user sessions
5. Row Level Security ensures users only access their own data

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  school VARCHAR(255),
  major VARCHAR(255),
  year VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE
);
```

### Courses Table
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  instructor VARCHAR(255),
  semester VARCHAR(50),
  year INTEGER,
  credits INTEGER,
  color VARCHAR(20),
  location VARCHAR(255),
  meeting_days TEXT[],
  meeting_time_start TIME,
  meeting_time_end TIME,
  current_grade DECIMAL(5,2),
  target_grade DECIMAL(5,2)
);
```

### Assignments Table
```sql
CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50),
  due_date TIMESTAMP NOT NULL,
  status VARCHAR(50),
  priority VARCHAR(20),
  completed BOOLEAN,
  grade_weight DECIMAL(5,2),
  max_grade DECIMAL(10,2),
  earned_points DECIMAL(10,2)
);
```

### Study Sessions Table
```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  assignment_id UUID REFERENCES assignments(id),
  duration_minutes INTEGER NOT NULL,
  session_type VARCHAR(50),
  notes TEXT,
  completed_at TIMESTAMP
);
```

### Entity Relationship Diagram
```
┌──────────┐       ┌──────────┐       ┌──────────────┐
│  Users   │───┬───│ Courses  │───────│ Assignments  │
└──────────┘   │   └──────────┘       └──────────────┘
               │                              │
               │   ┌────────────────┐         │
               └───│ Study Sessions │─────────┘
                   └────────────────┘
```

---

## Installation & Setup

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Supabase account

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `taskflow-backend/supabase-schema.sql`
   - Enable Row Level Security policies

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Access the application**
   Open http://localhost:3000 in your browser

---

## Deployment

### Deploying to Vercel

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to vercel.com
   - Import your GitHub repository
   - Select the TaskFlow project

3. **Configure environment variables**
   In Vercel dashboard, add:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Access your live application at the provided URL

### Live Application URL
**[Insert your Vercel deployment URL here]**

Example: `https://taskflow-yourname.vercel.app`

---

## Future Enhancements

### Planned Features
1. **Calendar View**: Visual calendar for assignment due dates
2. **Notifications**: Email/push notifications for upcoming deadlines
3. **Mobile App**: React Native version for iOS/Android
4. **Collaboration**: Share courses and assignments with classmates
5. **Analytics**: Detailed study habit analytics and insights
6. **Smart Suggestions**: Assignment prioritization and study recommendations
7. **Export**: Export grades and assignments to PDF/Excel
8. **Dark Mode**: Theme toggle for reduced eye strain

### Technical Improvements
1. **Offline Support**: PWA with service workers
2. **Real-time Updates**: Supabase real-time subscriptions
3. **Performance**: Code splitting and lazy loading
4. **Testing**: Comprehensive unit and integration tests

---

## Credits

**Developed by:** [Your Name]

**Technologies Used:**
- React.js
- Supabase
- Bootstrap
- Chart.js

**Academic Project for:** [Course Name / Institution]

---

## License

This project is created for educational purposes.

---

*Document last updated: December 2024*
