
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RegistrationForm from './components/RegistrationForm';
import ClientRegistrationForm from './components/ClientRegistrationForm';
import AccessPage from './pages/AccessPage';
import SchedulingPage from './pages/SchedulingPage';
import SuccessPage from './pages/SuccessPage';
import LoginPage from './pages/LoginPage';
import TicketDashboard from './pages/TicketDashboard';
import TicketForm from './pages/TicketForm';
import TicketDetails from './pages/TicketDetails';
import LandingPageDemo from './pages/LandingPageDemo';
import AppLayout from './components/AppLayout';
import KanbanBoard from './components/KanbanBoard';
import AdminPage from './pages/AdminPage';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Redirect root to login for the new system */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={
          <PageWrapper>
            <LoginPage />
          </PageWrapper>
        } />

        <Route path="/demo" element={
          <PageWrapper>
            <LandingPageDemo />
          </PageWrapper>
        } />

        <Route path="/consulta_cadastro" element={
          <PageWrapper>
            <AccessPage />
          </PageWrapper>
        } />

        <Route path="/agendamento" element={
          <PageWrapper>
            <SchedulingPage />
          </PageWrapper>
        } />

        <Route path="/cadastro" element={
          <PageWrapper>
            <RegistrationForm />
          </PageWrapper>
        } />

        <Route path="/cadastro_cliente" element={
          <PageWrapper>
            <ClientRegistrationForm />
          </PageWrapper>
        } />

        <Route path="/success" element={
          <PageWrapper>
            <SuccessPage />
          </PageWrapper>
        } />

        {/* Tickets Area */}
        <Route path="/tickets" element={
          <AppLayout>
            <TicketDashboard />
          </AppLayout>
        } />

        <Route path="/tickets/kanban" element={
          <AppLayout>
            <KanbanBoard />
          </AppLayout>
        } />

        <Route path="/tickets/novo" element={
          <AppLayout>
            <TicketForm />
          </AppLayout>
        } />

        <Route path="/admin" element={
          <AppLayout>
            <AdminPage />
          </AppLayout>
        } />

        <Route path="/tickets/:id" element={
          <AppLayout>
            <TicketDetails />
          </AppLayout>
        } />
      </Routes>
    </AnimatePresence>
  );
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.02 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    className="w-full flex justify-center items-center"
  >
    {children}
  </motion.div>
);

function App() {
  return (
    <HashRouter>
      <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center p-4 py-12 overflow-x-hidden">
        <AnimatedRoutes />
      </div>
    </HashRouter>
  );
}

export default App;
