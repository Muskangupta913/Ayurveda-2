// context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/router';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await axios.get<{ user: User }>('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      console.error(err.response?.data?.message || 'Token verification failed');
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post<{ user: User; token: string }>('/api/auth/login', { email, password });
      const { user, token } = response.data;

      localStorage.setItem('token', token);
      setUser(user);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      throw new Error(err.response?.data?.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      await axios.post('/api/auth/register', {
        name,
        email,
        password,
        phone
      });

      // Auto login after successful registration
      await login(email, password);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      throw new Error(err.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
