
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: company } = await supabase
        .from('companies')
        .select('user_type')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (company) {
        setUserRole(company.user_type);
      } else {
        // Default role if not found (shouldn't happen with correct registration)
        setUserRole('cliente');
      }
      setLoading(false);
    };

    getSession();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full shadow-lg shadow-blue-100" 
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] overflow-hidden">
      <Sidebar userRole={userRole || 'cliente'} />
      <main className="flex-1 overflow-y-auto scroll-smooth">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
