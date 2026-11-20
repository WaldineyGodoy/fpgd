import React, { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Menu, ShieldOff } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Sidebar from './Sidebar';
import Logo from './Logo';
import { useTicketsEnabled } from '../crm/settings';

export type UserRole = 'superadmin' | 'mediador' | 'integrador' | 'cliente';

export interface Session {
  role: UserRole;
  isAdmin: boolean;      // integrador promovido a admin
  canManage: boolean;    // superadmin ou admin: configurações, planos, pagamentos
  isStaff: boolean;      // canManage ou mediador: CRM
  companyId: string | null;
  userName: string;
}
const SessionContext = createContext<Session>({
  role: 'cliente', isAdmin: false, canManage: false, isStaff: false, companyId: null, userName: '',
});
export const useSession = () => useContext(SessionContext);

export type Access = 'staff' | 'manage' | 'root';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Quem acessa: equipe (CRM), gestão (superadmin/admin) ou só o superadmin. Sem valor = qualquer usuário logado. */
  access?: Access;
  /** Rota pertence ao sistema de tickets (some quando ele está oculto). */
  feature?: 'tickets';
}

/** Para onde mandar cada perfil ao entrar. */
export const homeFor = (s: Session, ticketsEnabled: boolean) =>
  s.isStaff ? '/crm' : ticketsEnabled ? '/tickets' : '/associacao';

const AppLayout: React.FC<AppLayoutProps> = ({ children, access, feature }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const ticketsEnabled = useTicketsEnabled();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (!s) { navigate('/login'); return; }
      const { data: company } = await supabase
        .from('companies')
        .select('id, user_type, is_admin, nome_fantasia, razao_social')
        .eq('auth_user_id', s.user.id)
        .maybeSingle();
      if (!alive) return;
      const role = (company?.user_type as UserRole) || 'cliente';
      const isAdmin = company?.is_admin === true;
      const canManage = role === 'superadmin' || isAdmin;
      setSession({
        role, isAdmin, canManage,
        isStaff: canManage || role === 'mediador',
        companyId: company?.id ?? null,
        userName: company?.nome_fantasia || company?.razao_social || s.user.email?.split('@')[0] || 'Usuário',
      });
    })();
    return () => { alive = false; };
  }, [navigate]);

  if (!session || ticketsEnabled === null) {
    return (
      <div className="flex h-screen bg-bg">
        <div className="hidden lg:block w-[264px] bg-sunk border-r border-line" />
        <div className="flex-1 p-8 space-y-4 max-w-7xl">
          <div className="skeleton h-8 w-64" />
          <div className="skeleton h-4 w-96" />
          <div className="skeleton h-72 w-full mt-8" />
        </div>
      </div>
    );
  }

  if (feature === 'tickets' && !ticketsEnabled) return <Navigate to={homeFor(session, false)} replace />;

  const allowed = !access
    || (access === 'staff' && session.isStaff)
    || (access === 'manage' && session.canManage)
    || (access === 'root' && session.role === 'superadmin');

  return (
    <SessionContext.Provider value={session}>
      <div className="flex h-screen w-full bg-bg overflow-hidden text-fg">
        <Sidebar session={session} ticketsEnabled={ticketsEnabled} open={navOpen} onClose={() => setNavOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-line bg-sunk">
            <Logo />
            <button className="btn btn-ghost !px-2" onClick={() => setNavOpen(true)} aria-label="Abrir menu">
              <Menu size={20} />
            </button>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="legacy px-4 py-6 md:px-8 md:py-8 max-w-[1440px] mx-auto">
              {allowed ? children : (
                <div className="panel p-10 max-w-lg mx-auto mt-16 text-center">
                  <ShieldOff className="mx-auto text-fg-3" size={28} />
                  <h1 className="mt-4 text-lg font-bold">Área restrita</h1>
                  <p className="mt-2 text-sm text-fg-2">Seu perfil não tem acesso a esta página. Se precisar, fale com a administração da Frente.</p>
                  <button className="btn btn-secondary mt-6" onClick={() => navigate(homeFor(session, ticketsEnabled))}>Voltar ao início</button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SessionContext.Provider>
  );
};

/** Rota /inicio: decide a página inicial pelo perfil. */
export const HomeRedirect: React.FC = () => {
  const s = useSession();
  const t = useTicketsEnabled();
  if (t === null) return null;
  return <Navigate to={homeFor(s, t)} replace />;
};

export default AppLayout;
