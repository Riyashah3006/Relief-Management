import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If role check specified and user doesn't have it: render 403 Forbidden (SCRUM-36 AC2)
  if (allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-1 rounded">
            HTTP 403 Forbidden
          </span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2 mb-2">Access Restricted</h2>
          <p className="text-slate-600 text-sm mb-6">
            Your current role <strong className="text-slate-900 underline">{user.role}</strong> does not have permission to access this portal.
          </p>
          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 mb-6 text-left border border-slate-200">
            <strong>Required Roles:</strong> {allowedRoles.join(', ')}
          </div>
          <div className="flex justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Safety
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
