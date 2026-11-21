import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, Kanban, Sun, Users, Settings, Shield, LogOut, Plus, X, Wallet, BadgeCheck, Contact, FileBarChart, Calculator, SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import Logo from './Logo';
import type { Session } from './AppLayout';

interface Item { label: string; icon: React.ElementType; path: string; end?: boolean; show: boolean }
interface Group { title: string; items: Item[]; action?: React.ReactNode }

interface SidebarProps { session: Session; ticketsEnabled: boolean; open: boolean; onClose: () => void }

const ROLE_LABEL: Record<Session['role'], string> = {
  superadmin: 'Superadmin', mediador: 'Mediador', integrador: 'Integrador', cliente: 'Cliente',
};

const Sidebar: React.FC<SidebarProps> = ({ session, ticketsEnabled, open, onClose }) => {
  const navigate = useNavigate();
  const { isStaff, role, isAdmin, userName, crmHabilitado } = session;
  const tenant = crmHabilitado && !isStaff;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const groups: Group[] = [
    {
      title: 'Meu CRM',
      items: [
        { label: 'Clientes', icon: Contact, path: '/meu-crm', end: true, show: tenant },
        { label: 'Propostas', icon: FileBarChart, path: '/meu-crm/propostas', show: tenant },
        { label: 'Dimensionamento', icon: Calculator, path: '/meu-crm/proposta/nova', show: tenant },
        { label: 'Configurações', icon: SlidersHorizontal, path: '/meu-crm/configuracoes', show: tenant },
      ],
    },
    {
      title: tenant ? 'FPGD' : 'CRM',
      items: [
        { label: 'Associados', icon: Users, path: '/crm', end: true, show: isStaff },
        { label: 'Pagamentos', icon: Wallet, path: '/crm/pagamentos', show: isStaff },
        { label: 'Configurações', icon: Settings, path: '/crm/configuracoes', show: isStaff },
        { label: 'Minha associação', icon: BadgeCheck, path: '/associacao', show: !isStaff && role === 'integrador' },
      ],
    },
    {
      title: 'Tickets',
      items: [
        { label: 'Satisfação Cosern', icon: LayoutDashboard, path: '/tickets', end: true, show: ticketsEnabled },
        { label: 'Tickets', icon: Ticket, path: '/tickets/lista', show: ticketsEnabled },
        { label: 'Status dos tickets', icon: Kanban, path: '/tickets/kanban', show: ticketsEnabled },
        { label: 'Unidades', icon: Sun, path: '/usinas', show: ticketsEnabled },
      ],
      action: ticketsEnabled && (
        <button onClick={() => { navigate('/tickets/novo'); onClose(); }} className="ml-auto mr-1 btn btn-ghost btn-sm !h-7 !px-2" aria-label="Novo ticket" title="Novo ticket">
          <Plus size={15} />
        </button>
      ),
    },
    {
      title: 'Sistema',
      items: [{ label: 'Acessos', icon: Shield, path: '/admin', show: role === 'superadmin' }],
    },
  ];

  return (
    <>
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed lg:static z-50 inset-y-0 left-0 w-[264px] shrink-0 flex flex-col bg-sunk border-r border-line
          transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="relative h-[72px] flex items-center justify-between px-5 overflow-hidden">
          <div className="absolute -left-10 -top-16 w-56 h-40 rounded-full bg-[radial-gradient(closest-side,rgb(0_222_234/.22),transparent)]" aria-hidden />
          <Logo className="relative" />
          <button className="lg:hidden btn btn-ghost !px-2 relative" onClick={onClose} aria-label="Fechar menu"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 pr-3" aria-label="Principal">
          {groups.map((g) => {
            const items = g.items.filter((i) => i.show);
            if (!items.length) return null;
            return (
              <div key={g.title} className="mt-4 first:mt-1">
                <div className="flex items-center pl-5 pb-1.5">
                  <p className="text-xs font-semibold text-fg-3">{g.title}</p>
                  {g.action}
                </div>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `flex items-center gap-3 h-11 pl-5 pr-3 rounded-r-[10px] text-sm font-semibold transition-colors ${
                            isActive ? 'bg-energy text-[#04131F]' : 'text-fg-2 hover:text-fg hover:bg-raised'
                          }`}
                      >
                        <item.icon size={18} strokeWidth={2} />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-line">
          <div className="flex items-center gap-3">
            <div className="size-9 shrink-0 rounded-full bg-raised border border-line grid place-items-center text-sm font-bold text-fg-2">
              {userName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{userName}</p>
              <p className="text-xs text-fg-3">{ROLE_LABEL[role]}{isAdmin && role !== 'superadmin' ? ' · Admin' : ''}</p>
            </div>
            <button onClick={logout} className="btn btn-ghost !px-2" aria-label="Sair" title="Sair"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
