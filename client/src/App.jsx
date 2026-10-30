import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Disasters from './pages/Disasters';
import DisasterDetail from './pages/DisasterDetail';
import CitizenPortal from './pages/CitizenPortal';
import CoordinatorPortal from './pages/CoordinatorPortal';
import VolunteerPortal from './pages/VolunteerPortal';
import DonorPortal from './pages/DonorPortal';
import GISPortal from './pages/GISPortal';
import AnalyticsPortal from './pages/AnalyticsPortal';
import AdminPortal from './pages/AdminPortal';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar />

            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/disasters" element={<Disasters />} />
                <Route path="/disasters/:id" element={<DisasterDetail />} />
                <Route path="/gis" element={<GISPortal />} />
                <Route path="/analytics" element={<AnalyticsPortal />} />
                <Route path="/donor" element={<DonorPortal />} />

                {/* Role Protected Routes (SCRUM-36) */}
                <Route
                  path="/citizen"
                  element={
                    <ProtectedRoute allowedRoles={['Citizen', 'Admin']}>
                      <CitizenPortal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/coordinator"
                  element={
                    <ProtectedRoute allowedRoles={['Coordinator', 'Authority', 'Admin']}>
                      <CoordinatorPortal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/volunteer"
                  element={
                    <ProtectedRoute allowedRoles={['Volunteer', 'Admin']}>
                      <VolunteerPortal />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <AdminPortal />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-brand-600 text-white flex items-center justify-center font-bold text-xs">
                    VO
                  </div>
                  <span className="font-bold text-white tracking-wide">
                    VANGUARD OPS — Disaster Relief Management System
                  </span>
                </div>
                <div>
                  Third Year Semester 1 Engineering Capstone Project | Docker & Node Containerized
                </div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Emergency SOS: 1077 / 112 | 24x7 Control Room
                </div>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
