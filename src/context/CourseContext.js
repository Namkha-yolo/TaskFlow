import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

const CourseContext = createContext();

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses must be used within CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCourses = useCallback(async () => {
    if (!user?.id) {
      setCourses([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const addCourse = async (courseData) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          name: courseData.name,
          code: courseData.code,
          instructor: courseData.instructor || null,
          semester: courseData.semester,
          year: parseInt(courseData.year) || new Date().getFullYear(),
          credits: courseData.credits ? parseInt(courseData.credits) : null,
          color: courseData.color || '#3D2E1F',
          location: courseData.location || null
        })
        .select()
        .single();

      if (error) throw error;
      setCourses(prev => [data, ...prev]);
      return { success: true, course: data };
    } catch (err) {
      console.error('Error adding course:', err);
      return { success: false, error: err.message };
    }
  };

  const updateCourse = async (courseId, updates) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('courses')
        .update({
          name: updates.name,
          code: updates.code,
          instructor: updates.instructor || null,
          semester: updates.semester,
          year: parseInt(updates.year) || new Date().getFullYear(),
          credits: updates.credits ? parseInt(updates.credits) : null,
          color: updates.color || '#3D2E1F',
          location: updates.location || null
        })
        .eq('id', courseId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setCourses(prev => prev.map(c => c.id === courseId ? data : c));
      return { success: true, course: data };
    } catch (err) {
      console.error('Error updating course:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteCourse = async (courseId) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId)
        .eq('user_id', user.id);

      if (error) throw error;
      setCourses(prev => prev.filter(c => c.id !== courseId));
      return { success: true };
    } catch (err) {
      console.error('Error deleting course:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <CourseContext.Provider value={{
      courses,
      loading,
      fetchCourses,
      addCourse,
      updateCourse,
      deleteCourse
    }}>
      {children}
    </CourseContext.Provider>
  );
};

export default CourseContext;
