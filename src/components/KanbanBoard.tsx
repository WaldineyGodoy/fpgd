
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
  { id: 'Em Aberto', label: 'Em Aberto', color: '#FFA600', textColor: 'text-white' },
  { id: 'Respondido', label: 'Respondido', color: '#F1DF3C', textColor: 'text-slate-800' },
  { id: 'Recorrer', label: 'Recorrer', color: '#181818', textColor: 'text-white' },
  { id: 'Resolvido', label: 'Resolvido', color: '#198754', textColor: 'text-white' },
  { id: 'Encerrado', label: 'Encerrado', color: '#198754', textColor: 'text-white' }
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-[#262727] tracking-tight">Kanban <span className="text-[#198754]">Board</span></h2>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest pl-1">Visualização por status</p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-250px)] custom-scrollbar">
        {STATUS_COLUMNS.map((column) => (
          <div key={column.id} className="flex flex-col gap-4 min-w-[320px] flex-1">
            {/* Column Header - Based on Screenshot */}
            <div 
              style={{ backgroundColor: column.color }}
              className={`p-4 rounded-t-2xl shadow-lg flex items-center justify-between ${column.textColor}`}
            >
              <h3 className="font-bold uppercase text-xs tracking-widest">{column.label}</h3>
              <button 
                onClick={() => navigate('/tickets/novo')}
                className="bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-1 transition-all shadow-sm"
              >
                <Plus size={12} strokeWidth={3} /> ADD TASK
              </button>
            </div>

            {/* Column Content Area */}
            <div className="flex-1 bg-white/50 backdrop-blur-sm p-4 rounded-b-2xl border-x-2 border-b-2 border-slate-200/50 space-y-4 overflow-y-auto scrollbar-hide">
              <AnimatePresence>
                {getTicketsByStatus(column.id).map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="bg-white p-5 rounded-2xl shadow-[0_4px_15px_-3px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-xl hover:translate-y-[-2px] transition-all cursor-pointer group relative active:scale-[0.98]"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-slate-400">
                          #{ticket.numero_ticket || ticket.id.slice(0, 6)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-300 font-bold">
                           <MessageSquare size={12} /> 10 <Plus size={8} /> 2
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-[#262727] leading-tight group-hover:text-[#198754] transition-colors">
                        {ticket.tipo_chamado}
                      </h4>
                      
                      <p className="text-[11px] font-bold text-slate-400 line-clamp-2 leading-relaxed">
                        {ticket.cliente}
                      </p>

                      <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
                        <div className="flex -space-x-1.5">
                           <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[7px] font-black text-slate-400">?</div>
                           <div className="w-5 h-5 rounded-full bg-green-50 border-2 border-white flex items-center justify-center text-[7px] font-black text-green-600">!!</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                           <Clock size={12} />
                           <span className="text-[9px] font-black tracking-tight uppercase">
                             {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                           </span>
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
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
