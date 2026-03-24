import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'staff' | string[];
  openingBalanceAccess?: boolean;
}

const roleHierarchy: { [key: string]: number } = {
  staff: 1,
  manager: 2,
  admin: 4
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, openingBalanceAccess }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check opening balance access specifically
  if (openingBalanceAccess) {
    if (user.role !== 'admin') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="text-6xl text-red-500 mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              Opening Balance access is restricted to Admin users only.
            </p>
            <p className="text-sm text-gray-500">
              Your role: <span className="font-semibold">{user.role}</span>
            </p>
            <p className="text-sm text-gray-500">
              Required role: <span className="font-semibold">Admin</span>
            </p>
          </div>
        </div>
      );
    }
  }

  if (requiredRole && typeof requiredRole === 'string') {
    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 99;

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="text-6xl text-red-500 mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required role: <span className="font-medium capitalize">{requiredRole}</span><br />
              Your role: <span className="font-medium capitalize">{user.role}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;