
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import AccessPage from './pages/AccessPage';
import SchedulingPage from './pages/SchedulingPage';

function App() {
  return (
    <HashRouter>
      <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Routes>
          <Route path="/" element={<AccessPage />} />
          <Route path="/agendamento" element={<SchedulingPage />} />
          <Route path="/cadastro" element={<RegistrationForm />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
