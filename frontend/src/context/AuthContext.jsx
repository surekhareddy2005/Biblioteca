import React, { createContext, useState, useEffect } from 'react';
import client from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('biblioteca_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('biblioteca_token') || null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('biblioteca_token', token);
    } else {
      localStorage.removeItem('biblioteca_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('biblioteca_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('biblioteca_user');
    }
  }, [user]);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      let response;
      if (role === 'STUDENT') {
        response = await client.post('/auth/login', { email, password, role });
      } else {
        response = await client.post('/auth/login', { email, password, role });
      }

      const { token: jwtToken, user: userData, student: studentData } = response.data;
      const authenticatedUser = userData || { ...studentData, role: 'STUDENT' };

      setToken(jwtToken);
      setUser(authenticatedUser);

      return { success: true, user: authenticatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const registerSuperAdmin = async (name, email, password) => {
    setLoading(true);
    try {
      const response = await client.post('/auth/super-admin', { name, email, password });
      return { success: true, message: response.data.message };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Super Admin registration failed.' };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (registrationData) => {
    setLoading(true);
    try {
      const response = await client.post('/student-auth/register', registrationData);
      const { token: jwtToken, student: studentData } = response.data;
      const authenticatedUser = { ...studentData, role: 'STUDENT' };

      setToken(jwtToken);
      setUser(authenticatedUser);

      return { success: true, user: authenticatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('biblioteca_token');
    localStorage.removeItem('biblioteca_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerUser,
        logout,
        registerSuperAdmin,
        isAuthenticated: !!token && !!user,
        role: user?.role || null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
