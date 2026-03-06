
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationForm from './components/RegistrationForm';
import AccessPage from './pages/AccessPage';
import SchedulingPage from './pages/SchedulingPage';
import SuccessPage from './pages/SuccessPage';
import LoginPage from './pages/LoginPage';
import TicketDashboard from './pages/TicketDashboard';
import TicketForm from './pages/TicketForm';
import TicketDetails from './pages/TicketDetails';

function App() {
  return (
    <HashRouter>
        <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-4 py-12">
            <Routes>
                {/* Redirect root to login for the new system */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                <Route path="/login" element={<LoginPage />} />
                <Route path="/consulta_cadastro" element={<AccessPage />} />
                <Route path="/agendamento" element={<SchedulingPage />} />
                <Route path="/cadastro" element={<RegistrationForm />} />
                <Route path="/success" element={<SuccessPage />} />
                
                {/* Tickets Area */}
                <Route path="/tickets" element={<TicketDashboard />} />
                <Route path="/tickets/novo" element={<TicketForm />} />
                <Route path="/tickets/:id" element={<TicketDetails />} />
            </Routes>
        </div>
    </HashRouter>
  );
}

export default App;
