
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  MoreVertical, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Ticket {
  id: string;
  numero_ticket: string | null;
  cliente: string;
  tipo_chamado: string;
  status: string;
  status_protocolo: string;
  created_at: string;
}

const STATUS_COLUMNS = [
  { id: 'Em Aberto', label: 'Em Aberto', color: 'bg-orange-500', lightColor: 'bg-orange-50' },
  { id: 'Respondido', label: 'Respondido', color: 'bg-green-500', lightColor: 'bg-green-50' },
  { id: 'Resolvido', label: 'Resolvido', color: 'bg-blue-500', lightColor: 'bg-blue-50' }
];

const KanbanBoard: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userComp } = await supabase
        .from('companies')
        .select('id, user_type')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      let query = supabase.from('tickets').select('*');

      if (userComp) {
        if (userComp.user_type === 'cliente') {
          query = query.eq('company_id', userComp.id);
        } else if (userComp.user_type === 'integrador') {
          // Complex OR filters should be used if needed, but for simplicity:
          const { data: linkedClients } = await supabase
            .from('companies')
            .select('id')
            .eq('integrador_id', userComp.id);
          
          const clientIds = linkedClients?.map(c => c.id) || [];
          query = query.or(`company_id.eq.${userComp.id},company_id.in.(${clientIds.join(',')})`);
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(t => (t.status || 'Em Aberto') === status);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-green-100 border-t-green-600 rounded-full" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-800">Fluxo de <span className="text-green-600">Atendimento</span></h2>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão Visual por Status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {STATUS_COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col gap-4 bg-slate-50/50 p-4 rounded-[2rem] border border-slate-100/50">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                <h3 className="font-black text-slate-700 uppercase text-xs tracking-tighter">{column.label}</h3>
                <span className="bg-white px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-400 shadow-sm border border-slate-100">
                  {getTicketsByStatus(column.id).length}
                </span>
              </div>
              <button className="text-slate-300 hover:text-slate-500 transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
              <AnimatePresence>
                {getTicketsByStatus(column.id).map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md hover:border-green-100 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={14} className="text-green-500" />
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          #{ticket.numero_ticket || ticket.id.slice(0, 6)}
                        </span>
                        <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${
                          ticket.status_protocolo === 'Em Analise' ? 'bg-blue-50 text-blue-600' :
                          ticket.status_protocolo === 'Fechado Procedente' ? 'bg-green-50 text-green-600' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {ticket.status_protocolo}
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-700 leading-tight group-hover:text-green-600 transition-colors">
                        {ticket.tipo_chamado}
                      </h4>
                      
                      <p className="text-[11px] font-bold text-slate-400 line-clamp-1">{ticket.cliente}</p>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-1">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock size={12} />
                          <span className="text-[9px] font-black tracking-tight">
                            {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex -space-x-2">
                           {/* User avatars placeholder */}
                           <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-400">?</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
