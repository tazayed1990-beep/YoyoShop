import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async (authToken: string) => {
    try {
        // This is a placeholder. A real backend would have a /api/auth/me endpoint
        // to get the current user from the token. For now, we decode it (unsafe client-side).
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        // In a real app, you would fetch user details from an endpoint like /api/users/me
        // For this example, we assume the payload contains enough info.
        setUser({ id: payload.id, name: payload.name, email: payload.email, role: payload.role, createdAt: '' });
    } catch (error) {
        console.error('Failed to fetch user', error);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ token: string }>('/auth/login', { email, password });
    const { token: newToken } = response.data;
    setToken(newToken);
    localStorage.setItem('token', newToken);
    await fetchUser(newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, user, token, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
