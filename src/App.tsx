
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
import HomePage from './pages/HomePage';
import AppLayout, { HomeRedirect } from './components/AppLayout';
import PagamentosPage from './pages/PagamentosPage';
import MinhaAssociacaoPage from './pages/MinhaAssociacaoPage';
import { useTicketsEnabled } from './crm/settings';
import KanbanBoard from './components/KanbanBoard';
import AdminPage from './pages/AdminPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UsinasList from './pages/UsinasList';
import UsinaForm from './pages/UsinaForm';
import UsinaDetails from './pages/UsinaDetails';
import CrmPage from './pages/CrmPage';
import CrmConfigPage from './pages/CrmConfigPage';
import { ToastProvider } from './crm/ui';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.startsWith('/crm') ? '/crm' : location.pathname}>
        {/* Redirect root to login for the new system */}
        <Route path="/" element={<HomePage />} />

        <Route path="/login" element={<LoginPage />} />


        <Route path="/consulta_cadastro" element={
          <PageWrapper>
            <AccessPage />
          </PageWrapper>
        } />
        
        <Route path="/reclame" element={
          <PageWrapper>
            <TicketsGate><TicketDashboard isPublic={true} /></TicketsGate>
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
          <AppLayout feature="tickets">
            <TicketDashboard view="dashboard" />
          </AppLayout>
        } />

        <Route path="/tickets/lista" element={
          <AppLayout feature="tickets">
            <TicketDashboard view="list" />
          </AppLayout>
        } />

        <Route path="/tickets/kanban" element={
          <AppLayout feature="tickets">
            <KanbanBoard />
          </AppLayout>
        } />

        <Route path="/tickets/novo" element={
          <AppLayout feature="tickets">
            <TicketForm />
          </AppLayout>
        } />

        <Route path="/admin" element={
          <AppLayout access="root">
            <AdminPage />
          </AppLayout>
        } />

        <Route path="/tickets/:id" element={
          <AppLayout feature="tickets">
            <TicketDetails />
          </AppLayout>
        } />

        <Route path="/reset-password" element={
          <PageWrapper>
            <ResetPasswordPage />
          </PageWrapper>
        } />

        {/* CRM de associados */}
        <Route path="/crm" element={
          <AppLayout access="staff">
            <CrmPage />
          </AppLayout>
        } />

        <Route path="/crm/pagamentos" element={
          <AppLayout access="staff">
            <PagamentosPage />
          </AppLayout>
        } />

        <Route path="/associacao" element={
          <AppLayout>
            <MinhaAssociacaoPage />
          </AppLayout>
        } />

        <Route path="/inicio" element={
          <AppLayout>
            <HomeRedirect />
          </AppLayout>
        } />

        <Route path="/crm/configuracoes" element={
          <AppLayout access="staff">
            <CrmConfigPage />
          </AppLayout>
        } />

        {/* Usinas Area */}
        <Route path="/usinas" element={
          <AppLayout feature="tickets">
            <UsinasList />
          </AppLayout>
        } />

        <Route path="/usinas/nova" element={
          <AppLayout feature="tickets">
            <UsinaForm />
          </AppLayout>
        } />

        <Route path="/usinas/:id/editar" element={
          <AppLayout feature="tickets">
            <UsinaForm />
          </AppLayout>
        } />

        <Route path="/usinas/:id/detalhes" element={
          <AppLayout feature="tickets">
            <UsinaDetails />
          </AppLayout>
        } />
      </Routes>
    </AnimatePresence>
  );
};

/** Página pública do sistema de tickets: some quando ele está oculto. */
const TicketsGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const enabled = useTicketsEnabled();
  if (enabled === null) return null;
  return enabled ? <>{children}</> : <Navigate to="/" replace />;
};

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
    className="legacy w-full min-h-screen bg-bg text-fg flex items-center justify-center p-4 py-12"
  >
    {children}
  </motion.div>
);

function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <div className="w-full min-h-screen overflow-x-hidden">
          <AnimatedRoutes />
        </div>
      </ToastProvider>
    </HashRouter>
  );
}

export default App;
