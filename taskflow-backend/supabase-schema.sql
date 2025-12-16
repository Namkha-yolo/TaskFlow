-- TaskFlow Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  school VARCHAR(255),
  major VARCHAR(255),
  year VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  instructor VARCHAR(255),
  semester VARCHAR(50),
  year INTEGER,
  credits INTEGER,
  color VARCHAR(20) DEFAULT '#3D2E1F',
  location VARCHAR(255),
  meeting_days TEXT[], -- Array of days like ['Monday', 'Wednesday']
  meeting_time_start TIME,
  meeting_time_end TIME,
  current_grade DECIMAL(5,2),
  target_grade DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'Assignment',
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'not-started',
  priority VARCHAR(20) DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  grade_weight DECIMAL(5,2),
  max_grade DECIMAL(10,2) DEFAULT 100,
  earned_points DECIMAL(10,2),
  reminder_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study sessions table
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  session_type VARCHAR(50) DEFAULT 'pomodoro',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for courses table
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses" ON courses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses" ON courses
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for assignments table
CREATE POLICY "Users can view own assignments" ON assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments" ON assignments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments" ON assignments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assignments" ON assignments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_sessions table
CREATE POLICY "Users can view own study sessions" ON study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions" ON study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions" ON study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions" ON study_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
