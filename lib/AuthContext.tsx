import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { getApiUrl, apiRequest } from '@/lib/query-client';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  height: number | null;
  weight: number | null;
  age: number | null;
  gender: string | null;
  activityLevel: string | null;
  goal: string | null;
  targetWeight: number | null;
  dailyWaterGoal: number | null;
  darkMode: boolean | null;
  notifications: boolean | null;
  createdAt: string | null;
  lastLoginAt: string | null;
  streakDays: number | null;
  totalMeasurements: number | null;
  totalMealsLogged: number | null;
}

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const url = new URL('/api/auth/me', getApiUrl());
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await apiRequest('/api/auth/login', 'POST', { username, password });
      setUser(res);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Blad logowania' };
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    try {
      const res = await apiRequest('/api/auth/register', 'POST', { username, password });
      setUser(res);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Blad rejestracji' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', 'POST');
    } catch {}
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    try {
      const res = await apiRequest('/api/profile', 'PUT', data);
      setUser(res);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || 'Blad aktualizacji' };
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  }), [user, isLoading, login, register, logout, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
