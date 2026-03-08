
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area, LabelList
} from 'recharts';
import {
  Plus, LogOut, TrendingUp, Users, MessageSquare, Phone, Globe,
  ClipboardCheck, HardHat, Store, LayoutDashboard, ChevronRight,
  Filter, Calendar, CheckCircle2, XCircle, AlertCircle, Clock,
  Ticket, Smile, Meh, Frown
} from 'lucide-react';

interface TicketData {
  id: string;
  numero_ticket: string | null;
  cliente: string;
  numero_protocolo: string | null;
  mes_referencia: string;
  tipo_chamado: string;
  status_protocolo: string;
  status: string;
  data_abertura: string;
  esta_de_acordo: boolean;
  recurso: string | null;
  descricao_reclamacao: string | null;
  nps_data: any;
  created_at: string;
  codigo_cliente_ug: string | null;
  codigo_cliente_uc: string[] | null;
  companies: {
    nome_fantasia: string | null;
    cnpj: string;
  } | null;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface TicketDashboardProps {
  view?: 'dashboard' | 'list';
}

const TicketDashboard: React.FC<TicketDashboardProps> = ({ view = 'dashboard' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('cliente');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    search: '',
    status: 'All',
    protocolStatus: 'All',
    tipo: 'All'
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        setUser(supabaseUser);
        const { data: company } = await supabase
          .from('companies')
          .select('id, user_type')
          .eq('auth_user_id', supabaseUser.id)
          .maybeSingle();
        
        if (company) {
          setUserRole(company.user_type);
          setCompanyId(company.id);
        }
      }
    };
    checkUser();
    fetchTickets();
  }, []);
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (!supabaseUser) return;

      let query = supabase
        .from('tickets')
        .select('*, companies(nome_fantasia, cnpj, integrador_id)')
        .order('created_at', { ascending: false });

      // Apply RBAC Filtering (Removed to make dashboard global as requested)
      const { data: userComp } = await supabase
        .from('companies')
        .select('id, user_type, integrador_id')
        .eq('auth_user_id', supabaseUser.id)
        .maybeSingle();
      
      // The query will now fetch all tickets regardless of user context.

      const { data, error } = await query;

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
      const scores = tickets.map(t => t.nps_data?.[f.key]).filter(s => s !== undefined && s !== null);
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

  // 6. User Specific Tickets (Meus Tickets)
  const userTickets = useMemo(() => {
    if (!user) return [] as TicketData[];

    return tickets.filter((t: TicketData) => {
      const matchesSearch = t.cliente?.toLowerCase().includes(activeFilters.search.toLowerCase()) ||
        t.codigo_cliente_ug?.toLowerCase().includes(activeFilters.search.toLowerCase()) ||
        t.codigo_cliente_uc?.some(uc => uc.toLowerCase().includes(activeFilters.search.toLowerCase()));
      const matchesStatus = activeFilters.status === 'All' || t.status === activeFilters.status;
      const matchesProtocolStatus = activeFilters.protocolStatus === 'All' || t.status_protocolo === activeFilters.protocolStatus;
      const matchesTipo = activeFilters.tipo === 'All' || t.tipo_chamado === activeFilters.tipo;

      return matchesSearch && matchesStatus && matchesProtocolStatus && matchesTipo;
    });
  }, [tickets, user, activeFilters]);

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
                {view === 'dashboard' ? <LayoutDashboard className="w-8 h-8 text-green-600" /> : <Ticket className="w-8 h-8 text-green-600" />}
              </div>
              {view === 'dashboard' ? (
                <>Termometro <span className="text-green-600">satisfação Cosern</span></>
              ) : (
                <>Lista de <span className="text-green-600">Tickets</span></>
              )}
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest pl-14">
              {view === 'dashboard' ? 'Protocolos e Qualidade fpgd' : 'Todos os registros do sistema'}
            </p>
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
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full" />
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-tighter">Processando Inteligência...</p>
          </div>
        ) : (
          <div className="space-y-6">

            {view === 'dashboard' && (
              <>
                {/* 1. NPS Cards */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Satisfação por canal de atendimento <span className="text-slate-400 font-bold text-xs uppercase tracking-widest ml-2">de 1 a 5</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {npsStats.map((stat, i) => {
                  const numAvg = stat.avg === 'N/A' ? 0 : Number(stat.avg);
                  let iconColor = 'text-slate-300';
                  let bgColor = 'bg-slate-300';
                  let Emote = Meh;
                  
                  if (numAvg >= 4.5) { iconColor = 'text-green-500'; bgColor = 'bg-green-500'; Emote = Smile; }
                  else if (numAvg >= 3.5) { iconColor = 'text-lime-500'; bgColor = 'bg-lime-500'; Emote = Smile; }
                  else if (numAvg >= 2.5) { iconColor = 'text-yellow-400'; bgColor = 'bg-yellow-400'; Emote = Meh; }
                  else if (numAvg >= 1.5) { iconColor = 'text-orange-500'; bgColor = 'bg-orange-500'; Emote = Frown; }
                  else if (numAvg > 0) { iconColor = 'text-red-500'; bgColor = 'bg-red-500'; Emote = Frown; }

                  return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.key}
                    className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-green-200 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 text-slate-400 mb-3 font-black text-[10px] uppercase">
                      {stat.icon} {stat.label}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="text-3xl font-black text-slate-800 flex items-baseline gap-1">
                        {stat.avg}
                        <span className="text-[10px] text-slate-300">/ 5.0</span>
                      </div>
                      {stat.avg !== 'N/A' && (
                        <Emote className={`w-8 h-8 ${iconColor} drop-shadow-sm`} strokeWidth={2.5} />
                      )}
                    </div>
                    <div className="w-full bg-slate-50 h-1.5 rounded-full mt-4 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(numAvg / 5) * 100}%` }}
                        className={`h-full ${bgColor}`}
                      />
                    </div>
                  </motion.div>
                )})}
              </div>
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
                    {[
                      { id: 'week', label: 'SEMANA' },
                      { id: 'month', label: 'MÊS' },
                      { id: 'year', label: 'ANO' }
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => setTimeRange(r.id as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${timeRange === r.id ? 'bg-white shadow-sm text-green-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <Tooltip
                        labelStyle={{ fontWeight: 900, color: '#64748b' }}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '1rem' }}
                        itemStyle={{ fontWeight: 900, color: '#16a34a' }}
                        formatter={(value) => [value, 'Valor']}
                      />
                      <Bar dataKey="value" fill="#22c55e" radius={[10, 10, 0, 0]} />
                    </BarChart>
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
                      <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / (tickets.length || 1)) * 100}%` }}
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
                    <BarChart data={resourceData} layout="vertical" margin={{ right: 30, left: 0, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} width={80} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '1rem', border: 'none', fontWeight: 900 }}
                        formatter={(value) => [value, 'Valor']}
                      />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 10, 10, 0]} barSize={20}>
                        <LabelList dataKey="value" position="insideRight" offset={8} style={{ fill: '#fff', fontSize: 10, fontWeight: 900 }} />
                      </Bar>
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
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                            <span className="text-[8px] font-black text-slate-300 flex items-center gap-1 uppercase">
                              <Clock className="w-2 h-2" /> {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
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
              </div> {/* Closes Grid */}
            </>
          )}

          {/* Meus Tickets Section (Image 1 Reference) */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">Meus Tickets</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase">Gestão pessoal de registros</p>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filtrar por UC, UG ou Cliente..."
                        value={activeFilters.search}
                        onChange={e => setActiveFilters({ ...activeFilters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 ring-green-500/20 outline-none"
                      />
                    </div>
                    <select
                      value={activeFilters.status}
                      onChange={e => setActiveFilters({ ...activeFilters, status: e.target.value })}
                      className="px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 ring-green-500/20 outline-none"
                    >
                      <option value="All">Ticket: Todos</option>
                      <option>Em Aberto</option>
                      <option>Respondido</option>
                      <option>Resolvido</option>
                    </select>
                    <select
                      value={activeFilters.protocolStatus}
                      onChange={e => setActiveFilters({ ...activeFilters, protocolStatus: e.target.value })}
                      className="px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 ring-green-500/20 outline-none"
                    >
                      <option value="All">Protocolo: Todos</option>
                      <option>Sem Protocolo</option>
                      <option>Em Analise</option>
                      <option>Fechado Improcedente</option>
                      <option>Fechado Procedente</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50">
                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase">Ticket ID</th>
                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase">Assunto / Cliente</th>
                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase">Status Ticket</th>
                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase">Status Protocolo</th>
                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase">UG / UC</th>
                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase">Última Atualização</th>
                        <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {userTickets.map((t) => (
                        <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-xs font-black text-slate-400">#{t.numero_ticket || t.id.slice(0, 4)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-700">{t.tipo_chamado}</span>
                              <span className="text-[10px] font-bold text-slate-400">{t.cliente}</span>
                            </div>
                          </td>
                           <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${t.status === 'Em Aberto' ? 'bg-orange-50 text-orange-600' :
                              t.status === 'Respondido' ? 'bg-green-50 text-green-600' :
                                'bg-slate-100 text-slate-400'
                              }`}>
                              {t.status || 'Em Aberto'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${t.status_protocolo === 'Em Analise' ? 'bg-blue-50 text-blue-600' :
                              t.status_protocolo === 'Fechado Procedente' ? 'bg-green-50 text-green-600' :
                                t.status_protocolo === 'Fechado Improcedente' ? 'bg-red-50 text-red-600' :
                                  'bg-slate-100 text-slate-400'
                              }`}>
                              {t.status_protocolo || 'Sem Protocolo'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-600">UG: {t.codigo_cliente_ug || '-'}</span>
                              <span className="text-[9px] font-bold text-slate-400">UC: {t.codigo_cliente_uc?.join(', ') || '-'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase">
                              {new Date(t.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button className="p-2 text-slate-400 hover:text-green-600 transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {userTickets.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                            Nenhum ticket encontrado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
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
        )}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </div>
  );
};

export default TicketDashboard;
