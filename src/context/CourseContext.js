import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchCourses();
    }
  }, [isAuthenticated, token]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const addCourse = async (courseData) => {
    try {
      const response = await axios.post('/api/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const newCourse = response.data;
      setCourses([...courses, newCourse]);
      return { success: true, course: newCourse };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to add course' 
      };
    }
  };

  const updateCourse = async (courseId, updates) => {
    try {
      const response = await axios.put(`/api/courses/${courseId}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedCourse = response.data;
      setCourses(courses.map(course => 
        course._id === courseId ? updatedCourse : course
      ));
      return { success: true, course: updatedCourse };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update course' 
      };
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await axios.delete(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(courses.filter(course => course._id !== courseId));
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to delete course' 
      };
    }
  };

  const getCourseById = (courseId) => {
    return courses.find(course => course._id === courseId);
  };

  const getCourseStats = async (courseId) => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { success: true, stats: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to get course statistics' 
      };
    }
  };

  const value = {
    courses,
    loading,
    error,
    fetchCourses,
    addCourse,
    updateCourse,
    deleteCourse,
    getCourseById,
    getCourseStats
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

export default CourseContext;
