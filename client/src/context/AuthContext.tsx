import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; phone: string; password: string; college_id: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  selectedCollegeId: string | null;
  setSelectedCollegeId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('campusmart_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [guestCollegeId, setGuestCollegeId] = useState<string | null>(() => localStorage.getItem('campusmart_guest_college'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('campusmart_token');
      if (storedToken) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.error('Failed to restore session:', err);
          localStorage.removeItem('campusmart_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.login({ email, password });
    localStorage.setItem('campusmart_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    college_id: string;
  }): Promise<User> => {
    const res = await api.register(payload);
    localStorage.setItem('campusmart_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('campusmart_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const userData = await api.getMe();
        setUser(userData);
      } catch (err) {
        console.error('Failed to refresh user:', err);
      }
    }
  };

  const setSelectedCollegeId = (id: string | null) => {
    if (id) {
      localStorage.setItem('campusmart_guest_college', id);
    } else {
      localStorage.removeItem('campusmart_guest_college');
    }
    setGuestCollegeId(id);
  };

  // If user is logged in, their locked college is ALWAYS used
  const activeCollegeId = user ? user.college.id : guestCollegeId;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        selectedCollegeId: activeCollegeId,
        setSelectedCollegeId,
      }}
    >
      {children}
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
