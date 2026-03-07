
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Ticket {
  id: string;
  numero_protocolo: string | null;
  mes_referencia: string;
  tipo_chamado: string;
  status_protocolo: string;
  data_abertura: string;
  created_at: string;
  companies: {
    nome_fantasia: string | null;
    cnpj: string;
  } | null;
}

const TicketDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      fetchTickets();
    };

    checkUser();
  }, [navigate]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, companies(nome_fantasia, cnpj)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTickets(data as any);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl p-6 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 pb-6 border-b border-gray-100">
        <div>
          <motion.h1
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-4xl font-black text-gray-800"
          >
            Meus <span className="text-green-600">Tickets</span>
          </motion.h1>
          <p className="text-gray-500 font-medium ml-1 mt-1">Gestão de Qualidade FPGD</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/tickets/novo')}
            className="flex-1 md:flex-none px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
          >
            <span>+</span> Novo Ticket
          </motion.button>
          <button
            onClick={handleLogout}
            className="px-6 py-4 text-gray-400 hover:text-red-600 font-bold transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="h-16 w-16 border-4 border-green-100 border-t-green-600 rounded-full"
          />
          <p className="text-gray-400 font-bold animate-pulse">Carregando seus chamados...</p>
        </div>
      ) : tickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200"
        >
          <div className="text-6xl mb-4 text-gray-200">🎫</div>
          <p className="text-gray-500 font-bold text-xl mb-6">Nenhum ticket encontrado.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/tickets/novo')}
            className="text-white bg-green-600 px-8 py-3 rounded-xl font-black shadow-lg shadow-green-100"
          >
            Começar Agora
          </motion.button>
        </motion.div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-gray-400 text-xs font-black uppercase tracking-widest px-6">
                <th className="px-6 pb-2">Protocolo</th>
                <th className="px-6 pb-2">Mês Ref.</th>
                <th className="px-6 pb-2">Tipo</th>
                <th className="px-6 pb-2">Status</th>
                <th className="px-6 pb-2">Abertura</th>
                <th className="px-6 pb-2 text-right">Ações</th>
              </tr>
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-sm font-medium"
            >
              <AnimatePresence>
                {tickets.map((ticket) => (
                  <motion.tr
                    key={ticket.id}
                    variants={itemVariants}
                    layout
                    whileHover={{ scale: 1.01, backgroundColor: 'rgba(249, 250, 251, 1)' }}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <td className="px-6 py-5 first:rounded-l-2xl border-y border-l border-gray-100">
                      <span className="font-bold text-gray-800">{ticket.numero_protocolo || 'Pendente'}</span>
                    </td>
                    <td className="px-6 py-5 border-y border-gray-100 text-gray-500 italic">
                      {new Date(ticket.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 border-y border-gray-100">
                      <span className="text-gray-700 bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold">{ticket.tipo_chamado}</span>
                    </td>
                    <td className="px-6 py-5 border-y border-gray-100">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm ${ticket.status_protocolo === 'Fechado Procedente' ? 'bg-green-100 text-green-700 shadow-green-50' :
                          ticket.status_protocolo === 'Fechado Improcente' ? 'bg-red-100 text-red-700 shadow-red-50' :
                            ticket.status_protocolo === 'Em analise' ? 'bg-blue-100 text-blue-700 shadow-blue-50' :
                              'bg-gray-100 text-gray-500'
                        }`}>
                        {ticket.status_protocolo?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5 border-y border-gray-100 text-gray-500 font-bold">
                      {new Date(ticket.data_abertura).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-5 last:rounded-r-2xl border-y border-r border-gray-100 text-right">
                      <motion.button
                        whileHover={{ x: 5 }}
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="text-green-600 hover:text-green-800 font-black flex items-center gap-2 ml-auto"
                      >
                        Ver Detalhes <span className="text-xl">›</span>
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
};

export default TicketDashboard;
