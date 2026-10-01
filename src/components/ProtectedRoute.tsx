import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../firebase/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
}) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium">Verifying credentials and security permissions...</p>
      </div>
    );
  }

  // Not logged in at all
  if (!user) {
    if (allowedRole === 'government') {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/citizen/login" state={{ from: location }} replace />;
  }

  // Role restriction
  if (allowedRole && role !== allowedRole) {
    if (allowedRole === 'government') {
      return <Navigate to="/login" state={{ unauthorizedRole: true }} replace />;
    }
    if (allowedRole === 'citizen' && role !== 'citizen' && role !== 'government') {
      return <Navigate to="/citizen/login" replace />;
    }
  }

  return <>{children}</>;
};
