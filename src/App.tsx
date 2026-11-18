
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AudioProvider } from './contexts/AudioContext';

// Layouts
import ClinicianLayout from './layouts/ClinicianLayout';
import PatientLayout from './layouts/PatientLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import ClinicianDashboard from './pages/clinician/Dashboard';
import ProtocolLibrary from './pages/clinician/ProtocolLibrary';
import SessionList from './pages/patient/SessionList';
import Player from './pages/patient/Player';

const App: React.FC = () => {
  return (
    <AudioProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth / Role Selection */}
          <Route path="/login" element={<LoginPage />} />

          {/* Clinician Routes */}
          <Route path="/clinician" element={<ClinicianLayout />}>
            <Route index element={<ClinicianDashboard />} />
            <Route path="protocols" element={<ProtocolLibrary />} />
            <Route path="designer" element={<div className="p-10 text-white/50 lowercase font-mono">Session Designer Module - Integration Pending</div>} />
          </Route>

          {/* Patient Routes */}
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<SessionList />} />
            <Route path="play/:sessionId" element={<Player />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AudioProvider>
  );
};

export default App;