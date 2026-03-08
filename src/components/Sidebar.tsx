
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
  Plus
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
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard, path: '/tickets', roles: ['superadmin', 'mediador', 'integrador', 'cliente'] },
    { id: 'tickets', label: 'Lista de Tickets', icon: Ticket, path: '/tickets', roles: ['superadmin', 'mediador', 'integrador', 'cliente'] },
    { id: 'kanban', label: 'Quadro Kanban', icon: Kanban, path: '/tickets/kanban', roles: ['superadmin', 'mediador', 'integrador', 'cliente'] },
    { id: 'admin', label: 'Administração', icon: Shield, path: '/admin', roles: ['superadmin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 80 : 280 }}
      className="h-screen bg-white border-r border-slate-100 flex flex-col sticky top-0 z-40 transition-all duration-300"
    >
      {/* Logo Area */}
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-black">F</div>
            <span className="text-xl font-black text-slate-800 tracking-tighter">FPGD<span className="text-green-600">.</span></span>
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
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/tickets/novo')}
          className={`w-full bg-green-600 text-white rounded-2xl font-black flex items-center gap-4 shadow-lg shadow-green-100 ring-4 ring-green-50 transition-all hover:bg-green-700 ${isCollapsed ? 'p-4 justify-center' : 'p-4'}`}
        >
          <Plus size={22} />
          {!isCollapsed && <span className="text-sm">Novo Ticket</span>}
        </motion.button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredItems.map((item) => {
          const isActive = item.id === 'home' 
            ? location.pathname === '/tickets' 
            : location.pathname.startsWith(item.path) && (item.path !== '/tickets' || location.pathname === '/tickets');
          
          // Actually, let's keep it simple: exact match for /tickets as Dashboard, everything else as startsWith
          const isReallyActive = item.path === '/tickets' 
            ? location.pathname === '/tickets' 
            : location.pathname.startsWith(item.path);
          
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
                isReallyActive 
                  ? 'bg-green-50 text-green-600 shadow-sm shadow-green-50' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            >
              <div className={`${isReallyActive ? 'text-green-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                <Icon size={22} />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-sm tracking-tight">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-slate-50 space-y-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
              <UserCircle size={24} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-black text-slate-800 truncate">{userName}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userRole}</span>
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
