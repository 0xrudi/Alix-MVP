// src/context/auth/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupabaseAuthProvider } from '../../services/auth/supabase-auth';

const AuthContext = createContext(null);
const authProvider = new SupabaseAuthProvider();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial user state
    const initializeAuth = async () => {
      try {
        const initialUser = await authProvider.getUser();
        setUser(initialUser);
      } catch (error) {
        console.error('Error getting initial user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const unsubscribe = authProvider.onAuthStateChange((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  const login = async (email) => {
    await authProvider.login(email);
  };

  const logout = async () => {
    await authProvider.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};