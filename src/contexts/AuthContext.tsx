import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../firebase/types';
import { authService } from '../firebase/authService';
import { firestoreService } from '../firebase/firestoreService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  loading: boolean;
  loginGovernmentGoogle: () => Promise<void>;
  loginCitizenGoogle: (rawGovId?: string) => Promise<void>;
  loginCitizenEmail: (email: string, pass: string) => Promise<void>;
  registerCitizenEmail: (
    email: string,
    pass: string,
    displayName: string,
    govId: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const current = authService.getCurrentUser();
    if (current) {
      setUser(current);
    }
    setLoading(false);
  }, []);

  const loginGovernmentGoogle = async () => {
    setLoading(true);
    try {
      const res = await authService.loginGovernmentWithGoogle();
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginCitizenGoogle = async (rawGovId?: string) => {
    setLoading(true);
    try {
      const res = await authService.loginCitizenWithGoogle(rawGovId);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const loginCitizenEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const profile = await authService.loginCitizenWithEmail(email, pass);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const registerCitizenEmail = async (
    email: string,
    pass: string,
    displayName: string,
    govId: string
  ) => {
    setLoading(true);
    try {
      const profile = await authService.registerCitizenWithEmail(email, pass, displayName, govId);
      setUser(profile);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const updated = await firestoreService.getUserProfile(user.uid);
    if (updated) {
      setUser(updated);
    }
  };

  const role: UserRole = user ? user.role : 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginGovernmentGoogle,
        loginCitizenGoogle,
        loginCitizenEmail,
        registerCitizenEmail,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
