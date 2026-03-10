
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Ticket, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  LogOut, 
  UserCircle,
  Shield,
  LayoutDashboard,
  Kanban,
  Plus,
  Sun
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface SidebarProps {
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: company } = await supabase
          .from('companies')
          .select('nome_fantasia, razao_social')
          .eq('auth_user_id', user.id)
          .single();
        setUserName(company?.nome_fantasia || company?.razao_social || user.email?.split('@')[0] || 'Usuário');
      }
    };
    fetchUser();
  }, []);

  const menuItems = [
    { id: 'home', label: 'Satisfação do cliente', icon: LayoutDashboard, path: '/tickets', roles: ['superadmin', 'mediador', 'integrador', 'cliente'], color: 'text-green-500' },
    { id: 'tickets', label: 'Tickets', icon: Ticket, path: '/tickets/lista', roles: ['superadmin', 'mediador', 'integrador', 'cliente'], color: 'text-green-500' },
    { id: 'kanban', label: 'Status dos Tickets', icon: Kanban, path: '/tickets/kanban', roles: ['superadmin', 'mediador', 'integrador', 'cliente'], color: 'text-amber-500' },
    { id: 'usinas', label: 'Minhas Usinas', icon: Sun, path: '/usinas', roles: ['superadmin', 'mediador', 'integrador', 'cliente'], color: 'text-cyan-500' },
    { id: 'admin', label: 'Administração', icon: Shield, path: '/admin', roles: ['superadmin'], color: 'text-purple-500' },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-[#262727] border-r border-white/5 flex flex-col sticky top-0 z-40 transition-all duration-300 shadow-2xl"
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 bg-[#198754] rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-green-900/20">F</div>
            <span className="text-xl font-black text-white tracking-tighter uppercase relative">FPGD<span className="text-[#198754]">.</span></span>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-black mx-auto">F</div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-slate-100 p-1 rounded-full shadow-sm hover:bg-slate-50 transition-colors z-50 text-slate-400"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Create Ticket Button */}
      <div className="px-4 py-4">
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/tickets/novo')}
          className={`w-full bg-[#198754] text-white rounded-2xl font-black flex items-center gap-4 shadow-xl shadow-black/20 transition-all hover:bg-[#157347] ${isCollapsed ? 'p-4 justify-center' : 'p-4'}`}
        >
          <Plus size={22} strokeWidth={3} />
          {!isCollapsed && <span className="text-sm uppercase tracking-widest text-[10px]">Novo Ticket</span>}
        </motion.button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredItems.map((item) => {
          const isReallyActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative ${
                isReallyActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isReallyActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1.5 h-8 bg-[#198754] rounded-r-full"
                />
              )}
              <div className={`${isReallyActive ? 'text-[#198754]' : item.color + ' opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all'}`}>
                <Icon size={22} strokeWidth={isReallyActive ? 3 : 2} />
              </div>
              {!isCollapsed && (
                <span className={`font-bold text-xs uppercase tracking-widest ${isReallyActive ? 'text-white' : ''}`}>{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-50 space-y-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 bg-[#198754]/20 rounded-xl flex items-center justify-center text-[#198754] border border-[#198754]/20">
              <UserCircle size={24} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{userName}</span>
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">{userRole}</span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={22} />
          {!isCollapsed && <span className="font-bold text-sm">Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
