
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
  Plus, LogOut, TrendingUp, Users, MessageSquare, Phone, Globe,
  ClipboardCheck, HardHat, Store, LayoutDashboard, ChevronRight,
  Filter, Calendar, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';

interface Ticket {
  id: string;
  cliente: string;
  numero_protocolo: string | null;
  mes_referencia: string;
  tipo_chamado: string;
  status_protocolo: string;
  data_abertura: string;
  esta_de_acordo: boolean;
  recurso: string | null;
  descricao_reclamacao: string | null;
  nps_data: any;
  created_at: string;
  companies: {
    nome_fantasia: string | null;
    cnpj: string;
  } | null;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TicketDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchTickets();
  }, []);

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

  // 1. NPS Averages
  const npsStats = useMemo(() => {
    const fields = [
      { key: 'agencias', label: 'Agências', icon: <Store className="w-4 h-4" /> },
      { key: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" /> },
      { key: 'telefone', label: 'Telefone', icon: <Phone className="w-4 h-4" /> },
      { key: 'portal_gd', label: 'Portal GD', icon: <Globe className="w-4 h-4" /> },
      { key: 'equipe_campo_vistoria', label: 'Vistorias', icon: <HardHat className="w-4 h-4" /> }
    ];

    return fields.map(f => {
      const scores = tickets.map(t => t.nps_data?.[f.key]).filter(s => s !== undefined);
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 'N/A';
      return { ...f, avg };
    });
  }, [tickets]);

  // 2. Ticket Types Distribution
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.tipo_chamado] = (counts[t.tipo_chamado] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  // 3. Resource Channels
  const resourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      if (t.recurso) {
        counts[t.recurso] = (counts[t.recurso] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  // 4. Time Series (Volume)
  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    tickets.forEach(t => {
      const date = new Date(t.created_at);
      let key = '';
      if (timeRange === 'week') key = date.toLocaleDateString('pt-BR', { weekday: 'short' });
      else if (timeRange === 'month') key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      else key = date.toLocaleDateString('pt-BR', { month: 'short' });

      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value })).reverse().slice(-10);
  }, [tickets, timeRange]);

  // 5. Agreement Percentages
  const agreementData = useMemo(() => {
    const agreed = tickets.filter(t => t.esta_de_acordo).length;
    const disagreed = tickets.length - agreed;
    return [
      { name: 'De Acordo', value: agreed, color: '#22c55e' },
      { name: 'Discorda', value: disagreed, color: '#ef4444' }
    ];
  }, [tickets]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-2xl">
                <LayoutDashboard className="w-8 h-8 text-green-600" />
              </div>
              Dashboard <span className="text-green-600">Analítico</span>
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest pl-14">Protocolos e Qualidade fpgd</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/tickets/novo')}
              className="flex-1 bg-green-600 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-green-100 ring-4 ring-green-50 transition-all hover:bg-green-700"
            >
              <Plus className="w-5 h-5" /> Abrir Novo Ticket
            </motion.button>
            <button
              onClick={() => { supabase.auth.signOut().then(() => navigate('/login')) }}
              className="p-4 bg-white text-slate-400 hover:text-red-500 rounded-2xl border border-slate-100 transition-all shadow-sm"
              title="Sair"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full" />
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-tighter">Processando Inteligência...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* 1. NPS Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {npsStats.map((stat, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={stat.key}
                  className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-green-200 transition-all"
                >
                  <div className="flex items-center gap-2 text-slate-400 mb-3 font-black text-[10px] uppercase">
                    {stat.icon} {stat.label}
                  </div>
                  <div className="text-3xl font-black text-slate-800 flex items-baseline gap-1">
                    {stat.avg}
                    <span className="text-[10px] text-slate-300">/ 5.0</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1 rounded-full mt-4 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(Number(stat.avg) / 5) * 100}%` }}
                      className="h-full bg-green-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 4. Volume Chart */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Volume de Registros</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">Chamados abertos por período</p>
                  </div>
                  <div className="flex bg-slate-50 p-1 rounded-xl">
                    {['week', 'month', 'year'].map(r => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${timeRange === r ? 'bg-white shadow-sm text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '1rem' }}
                        itemStyle={{ fontWeight: 900, color: '#16a34a' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 5. Agreement Chart */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-1">Satisfação com Concessionária</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mb-8">Acordo vs. Desacordo</p>
                <div className="h-48 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={agreementData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {agreementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-slate-800">
                      {tickets.length > 0 ? Math.round((tickets.filter(t => t.esta_de_acordo).length / tickets.length) * 100) : 0}%
                    </span>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Acordo Total</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  {agreementData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-black text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-slate-400">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 & 7. Ticket Types Breakdown */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-1">Motivações (Tickets)</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mb-8">Principais reclamações</p>
                <div className="space-y-4">
                  {typeData.sort((a, b) => b.value - a.value).map((item, i) => (
                    <div key={item.name} className="group cursor-default">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-slate-600 truncate mr-2">{item.name}</span>
                        <span className="text-xs font-black text-green-600">{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / tickets.length) * 100}%` }}
                          className="h-full bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Resource Channels */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-1">Canais de Recurso</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mb-8">Onde os pleitos serão submetidos</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resourceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} width={80} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', fontWeight: 900 }} />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 10, 10, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 6. Timeline */}
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden lg:col-span-1">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-black text-slate-800">Time Line</h3>
                  <p className="text-[10px] font-black text-slate-300 uppercase">Atividades Recentes</p>
                </div>
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {tickets.slice(0, 5).map((t, i) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 relative"
                    >
                      {i !== 4 && <div className="absolute left-[11px] top-8 w-[2px] h-full bg-slate-50" />}
                      <div className={`w-6 h-6 rounded-full flex-shrink-0 z-10 flex items-center justify-center ${t.esta_de_acordo ? 'bg-green-100' : 'bg-red-100'}`}>
                        {t.esta_de_acordo ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-xs font-black text-slate-800 truncate max-w-[150px]">{t.companies?.nome_fantasia || 'Integrador'}</h4>
                          <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-2 italic mb-2">"{t.descricao_reclamacao || 'Sem relato disponível'}"</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-bold rounded-md border border-slate-100">{t.tipo_chamado}</span>
                          {t.recurso && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-bold rounded-md border border-amber-100">{t.recurso}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/tickets/lista')}
                  className="w-full mt-6 py-4 text-blue-500 font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Ver Todos Registros <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

        <footer className="text-center pb-12">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Conselho Gestor de Qualidade FPGD</p>
          <div className="flex justify-center gap-4 text-slate-300">
            <TrendingUp className="w-4 h-4 opacity-30" />
            <ClipboardCheck className="w-4 h-4 opacity-30" />
            <Users className="w-4 h-4 opacity-30" />
          </div>
        </footer>

      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TicketDashboard;
