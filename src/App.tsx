import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BlockchainProvider } from './contexts/BlockchainContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { BlockchainStatusBanner } from './components/BlockchainStatusBanner';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { GovLoginPage } from './pages/GovLoginPage';
import { CitizenAuthPage } from './pages/CitizenAuthPage';
import { GovDashboard } from './pages/GovDashboard';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { LandDetailsPage } from './pages/LandDetailsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BlockchainProvider>
          <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
            {/* Live Blockchain Node Status Indicator Banner */}
            <BlockchainStatusBanner />

            {/* Main Application Navbar */}
            <Navbar />

            {/* Application Routes */}
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />

                {/* Unified Login Portal */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/citizen/login" element={<LoginPage />} />
                <Route path="/gov/login" element={<GovLoginPage />} />

                {/* Protected Government Route */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRole="government">
                      <GovDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Citizen Route */}
                <Route
                  path="/citizen/dashboard"
                  element={
                    <ProtectedRoute allowedRole="citizen">
                      <CitizenDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Detailed Land Record & Blockchain Verification Dossier */}
                <Route path="/land/:id" element={<LandDetailsPage />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            {/* Official Footer */}
            <Footer />
          </div>
        </BlockchainProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
