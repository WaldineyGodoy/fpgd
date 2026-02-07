
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import AccessPage from './pages/AccessPage';
import SchedulingPage from './pages/SchedulingPage';

function App() {
  return (
    <HashRouter>
      <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Routes>
          {/* Redirect root to new route */}
          <Route path="/" element={<Navigate to="/consulta_cadastro" replace />} />

          <Route path="/consulta_cadastro" element={<AccessPage />} />
          <Route path="/agendamento" element={<SchedulingPage />} />
          <Route path="/cadastro" element={<RegistrationForm />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
