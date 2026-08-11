import React, { createContext, useContext, useState } from 'react';
import { User } from '../types/chat';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('chat_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('chat_token');
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('chat_token', newToken);
    localStorage.setItem('chat_user', JSON.stringify(newUser));
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const newObj = { ...prev, ...updatedFields };
      localStorage.setItem('chat_user', JSON.stringify(newObj));
      return newObj;
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, updateUser, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
