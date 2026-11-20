
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
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
  company_id: string;
  usina_id: string | null;
  codigo_cliente_ug: string | null;
  codigo_cliente_uc: string[] | null;
  companies: {
    nome_fantasia: string | null;
    cnpj: string;
    integrador_id: string | null;
    user_type: string | null;
  } | null;
  integrador_id: string | null;
}

const COLORS = ['#198754', '#FFA600', '#F1DF3C', '#181818', '#0D6EFD', '#6C757D'];

interface TicketDashboardProps {
  view?: 'dashboard' | 'list';
  isPublic?: boolean;
}

const TicketDashboard: React.FC<TicketDashboardProps> = ({ view = 'dashboard', isPublic = false }) => {
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
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (!supabaseUser) {
          // Se não houver usuário logado (ex: dashboard público)
          const { data, error } = await supabase
            .from('tickets')
            .select('*, companies:tickets_company_id_fkey(nome_fantasia, cnpj, integrador_id, user_type)')
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          setTickets(data || []);
          return;
        }

        setUser(supabaseUser);

        // Busca paralela de perfil da empresa e tickets
        const [companyResult, ticketsResult] = await Promise.all([
          supabase
            .from('companies')
            .select('id, user_type')
            .eq('auth_user_id', supabaseUser.id)
            .maybeSingle(),
          supabase
            .from('tickets')
            .select('*, companies:tickets_company_id_fkey(nome_fantasia, cnpj, integrador_id, user_type)')
            .order('created_at', { ascending: false })
        ]);

        if (companyResult.data) {
          setUserRole(companyResult.data.user_type);
          setCompanyId(companyResult.data.id);
        }

        if (ticketsResult.error) throw ticketsResult.error;
        setTickets(ticketsResult.data || []);

      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isPublic]);

  const fetchTickets = async () => {
    // Mantido apenas para compatibilidade ou refresh manual, mas otimizado
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, companies:tickets_company_id_fkey(nome_fantasia, cnpj, integrador_id, user_type)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
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
      // 1. RBAC Check (Mandatory)
      let hasAccess = false;
      if (userRole === 'mediador' || userRole === 'superadmin' || isPublic) {
        hasAccess = true;
      } else if (userRole === 'cliente') {
        hasAccess = t.company_id === companyId;
      } else if (userRole === 'integrador') {
        // Integrator sees tickets specifically assigned to them OR tickets from their linked companies
        hasAccess = t.company_id === companyId || 
                    t.integrador_id === companyId || 
                    t.companies?.integrador_id === companyId;
      }

      if (!hasAccess) return false;

      // 2. UI Filters
      const matchesSearch = (t.cliente?.toLowerCase() || '').includes(activeFilters.search.toLowerCase()) ||
        (t.codigo_cliente_ug?.toLowerCase() || '').includes(activeFilters.search.toLowerCase()) ||
        t.codigo_cliente_uc?.some(uc => uc.toLowerCase().includes(activeFilters.search.toLowerCase()));
      const matchesStatus = activeFilters.status === 'All' || t.status === activeFilters.status;
      const matchesProtocolStatus = activeFilters.protocolStatus === 'All' || t.status_protocolo === activeFilters.protocolStatus;
      const matchesTipo = activeFilters.tipo === 'All' || t.tipo_chamado === activeFilters.tipo;

      return matchesSearch && matchesStatus && matchesProtocolStatus && matchesTipo;
    });
  }, [tickets, user, activeFilters, userRole, companyId, isPublic]);

  // 5. Agreement Percentages
  const agreementData = useMemo(() => {
    const agreedCount = tickets.filter(t => t.esta_de_acordo).length;
    const total = tickets.length || 1;
    const pAgreed = (agreedCount / total) * 100;
    const pDisagreed = 100 - pAgreed;

    let colorAgreed = '#36405A'; // Cor base (cinza claro)
    let colorDisagreed = '#36405A'; // Cor base (preto/dark)

    if (pAgreed > 69) {
      colorAgreed = '#198754'; // Verde
    } else if (pDisagreed > 70) {
      colorDisagreed = '#ef4444'; // Vermelho
    } else {
      colorAgreed = '#f59e0b'; // Laranja
    }

    return [
      { name: 'De Acordo', value: agreedCount, color: colorAgreed },
      { name: 'Discorda', value: tickets.length - agreedCount, color: colorDisagreed }
    ];
  }, [tickets]);

  return (
    <div className={`font-sans ${isPublic ? 'w-full max-w-7xl self-start' : ''}`}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        {isPublic && (
          <div className="flex items-center justify-between gap-4 pb-2">
            <a href="#/" aria-label="FPGD RN, início"><Logo /></a>
            <a href="#/login" className="btn btn-ghost">Entrar</a>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-fg">
              {view === 'dashboard' ? 'Termômetro de satisfação com a Cosern' : 'Tickets'}
            </h1>
            <p className="mt-1.5 text-sm text-fg-2 max-w-2xl">
              {view === 'dashboard'
                ? 'Qualidade do atendimento e das respostas aos protocolos, a partir dos tickets abertos por associados e clientes da Frente.'
                : 'Todos os registros que você pode acompanhar.'}
            </p>
          </div>
          <button onClick={() => navigate('/tickets/novo')} className="btn btn-primary !h-11 w-full md:w-auto">
            <Plus size={18} /> {isPublic ? 'Registrar reclamação' : 'Abrir novo ticket'}
          </button>
        </div>

        {loading ? (
          <div className="space-y-6" aria-busy="true" aria-label="Carregando dados">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">{[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton h-36" />)}</div>
            <div className="grid lg:grid-cols-3 gap-6"><div className="skeleton h-80 lg:col-span-2" /><div className="skeleton h-80" /></div>
          </div>
        ) : (
          <div className="space-y-6">

            {view === 'dashboard' && (
              <React.Fragment>
                {/* 1. NPS Cards */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-fg flex items-baseline gap-2">
                Satisfação por canal de atendimento <span className="text-sm font-medium text-fg-3">nota média de 1 a 5</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {npsStats.map((stat) => {
                  const numAvg = stat.avg === 'N/A' ? 0 : Number(stat.avg);
                  let color = '#7F899C';
                  let label = 'Sem avaliações';
                  if (numAvg >= 4.5) { color = '#198754'; label = 'Excelente'; }
                  else if (numAvg >= 3.5) { color = '#84cc16'; label = 'Bom'; }
                  else if (numAvg >= 2.5) { color = '#facc15'; label = 'Neutro'; }
                  else if (numAvg >= 1.5) { color = '#f59e0b'; label = 'Ruim'; }
                  else if (numAvg > 0) { color = '#ef4444'; label = 'Péssimo'; }

                  return (
                  <div key={stat.key} className="panel glow-corner p-5 flex flex-col">
                    <div className="flex items-center gap-2 text-sm font-semibold text-fg-2">
                      <span className="text-fg-3">{stat.icon}</span> {stat.label}
                    </div>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-[32px] leading-none font-extrabold tabular-nums text-fg">{stat.avg === 'N/A' ? '–' : String(stat.avg).replace('.', ',')}</span>
                      <span className="text-sm text-fg-3">/ 5</span>
                    </div>
                    <div className="mt-4 h-1.5 rounded-full bg-raised overflow-hidden">
                      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${(numAvg / 5) * 100}%`, backgroundColor: color }} />
                    </div>
                    <p className="mt-2 text-xs font-semibold" style={{ color }}>{label}</p>
                  </div>
                )})}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 4. Volume Chart */}
              <div className="lg:col-span-2 panel glow-corner p-6 md:p-8 relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-fg">Volume de Registros</h3>
                    <p className="text-sm text-fg-3">Chamados abertos por período</p>
                  </div>
                  <div className="flex bg-slate-50 p-1 rounded-xl">
                    {[
                      { id: 'week', label: 'Semana' },
                      { id: 'month', label: 'Mês' },
                      { id: 'year', label: 'Ano' }
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => setTimeRange(r.id as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === r.id ? 'bg-raised text-fg shadow-sm' : 'text-fg-3 hover:text-fg-2'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#283044" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#7F899C' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#7F899C' }} />
                      <Tooltip
                        labelStyle={{ fontWeight: 700, color: '#AFB8C8' }}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #283044', background: '#1B2130', color: '#EEF2F8', padding: '0.75rem' }}
                        itemStyle={{ fontWeight: 900, color: '#198754' }}
                        formatter={(value) => [value, 'Valor']}
                      />
                      <Bar dataKey="value" fill="#2F8CFF" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 5. Agreement Chart */}
              <div className="panel p-6 md:p-8">
                <h3 className="text-lg font-bold text-fg mb-1">Satisfação com Concessionária</h3>
                <p className="text-sm text-fg-3 mb-8">Acordo vs. Desacordo</p>
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
                    <span className="text-2xl font-bold text-slate-800">
                      {tickets.length > 0 ? Math.round((tickets.filter(t => t.esta_de_acordo).length / tickets.length) * 100) : 0}%
                    </span>
                    <span className="text-xs text-fg-3">de acordo</span>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  {agreementData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-slate-600">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 & 7. Ticket Types Breakdown */}
              <div className="panel p-6 md:p-8">
                <h3 className="text-lg font-bold text-fg mb-1">Motivações (Tickets)</h3>
                <p className="text-sm text-fg-3 mb-8">Principais reclamações</p>
                <div className="space-y-4">
                  {typeData.sort((a, b) => b.value - a.value).map((item, i) => (
                    <div key={item.name} className="group cursor-default">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-600 truncate mr-2">{item.name}</span>
                        <span className="text-xs font-bold text-fg-2 tabular-nums">{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / (tickets.length || 1)) * 100}%` }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Resource Channels */}
              <div className="panel p-6 md:p-8">
                <h3 className="text-lg font-bold text-fg mb-1">Canais de Recurso</h3>
                <p className="text-sm text-fg-3 mb-8">Onde os pleitos serão submetidos</p>
                {resourceData.length === 0 ? (
                  <p className="h-64 grid place-items-center text-center text-sm text-fg-3 px-6 border border-dashed border-line rounded-[10px]">Nenhum recurso registrado ainda. Os canais aparecem aqui quando um ticket for para recurso.</p>
                ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={resourceData} layout="vertical" margin={{ right: 30, left: 0, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#283044" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#AFB8C8' }} width={96} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                        contentStyle={{ borderRadius: '10px', border: '1px solid #283044', background: '#1B2130', color: '#EEF2F8' }}
                        formatter={(value) => [value, 'Valor']}
                      />
                      <Bar dataKey="value" fill="#FFA600" radius={[0, 10, 10, 0]} barSize={20}>
                        <LabelList dataKey="value" position="insideRight" offset={8} style={{ fill: '#fff', fontSize: 10, fontWeight: 900 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                )}
              </div>

              {/* 6. Timeline */}
              <div className="panel p-6 md:p-8 overflow-hidden lg:col-span-1">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-lg font-bold text-fg">Linha do tempo</h3>
                  <p className="text-sm text-fg-3">Atividades recentes</p>
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
                        {t.esta_de_acordo ? (
                          <CheckCircle2 className="w-4 h-4 text-[#198754]" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                            {t.companies?.user_type === 'cliente' ? t.cliente : (t.companies?.nome_fantasia || 'Integrador')}
                          </h4>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-xs font-bold text-slate-300">{new Date(t.created_at).toLocaleDateString('pt-BR')}</span>
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                              <Clock className="w-2 h-2" /> {new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-xs font-bold rounded-md border border-slate-100">{t.tipo_chamado}</span>
                          {t.recurso && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-md border border-amber-100">{t.recurso}</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/tickets/lista')}
                  className="w-full mt-6 py-4 text-blue-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Ver Todos Registros <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </React.Fragment>
        )}

          {/* Meus Tickets Section (Image 1 Reference) */}
            {user && !isPublic && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel p-6 md:p-8 space-y-8"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800">Meus Tickets</h3>
                    <p className="text-sm text-fg-3">Gestão pessoal de registros</p>
                  </div>
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filtrar por UC, UG ou Cliente..."
                        value={activeFilters.search}
                        onChange={e => setActiveFilters({ ...activeFilters, search: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 ring-[#198754]/20 outline-none"
                      />
                    </div>
                    <select
                      value={activeFilters.status}
                      onChange={e => setActiveFilters({ ...activeFilters, status: e.target.value })}
                      className="px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 ring-[#198754]/20 outline-none"
                    >
                      <option value="All">Ticket: Todos</option>
                      <option>Em Aberto</option>
                      <option>Respondido</option>
                      <option>Recorrer</option>
                      <option>Resolvido</option>
                      <option>Encerrado</option>
                    </select>
                    <select
                      value={activeFilters.protocolStatus}
                      onChange={e => setActiveFilters({ ...activeFilters, protocolStatus: e.target.value })}
                      className="px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 ring-[#198754]/20 outline-none"
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
                        <th className="pb-4 px-4 text-xs font-bold text-slate-400">Ticket ID</th>
                        <th className="pb-4 px-4 text-xs font-bold text-slate-400">Assunto / Cliente</th>
                        <th className="pb-4 px-4 text-xs font-bold text-slate-400">Status Ticket</th>
                        <th className="pb-4 px-4 text-xs font-bold text-slate-400">Status Protocolo</th>
                        <th className="pb-4 px-4 text-xs font-bold text-slate-400">UG / UC</th>
                        <th className="pb-4 px-4 text-xs font-bold text-slate-400">Última Atualização</th>
                        <th className="pb-4 px-4 text-xs font-bold text-slate-400 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {userTickets.map((t) => (
                        <tr key={t.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <span className="text-xs font-bold text-slate-400">#{t.numero_ticket || t.id.slice(0, 4)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-700">{t.tipo_chamado}</span>
                              <span className="text-xs font-bold text-slate-400">{t.cliente}</span>
                            </div>
                          </td>
                           <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              t.status === 'Em Aberto' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              t.status === 'Respondido' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              t.status === 'Recorrer' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              t.status === 'Resolvido' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                              t.status === 'Encerrado' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                              'bg-slate-100 text-slate-400'
                              }`}>
                              {t.status || 'Em Aberto'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.status_protocolo === 'Em Analise' ? 'bg-slate-100 text-slate-600' :
                              t.status_protocolo === 'Fechado Procedente' ? 'bg-green-50 text-[#198754]' :
                                t.status_protocolo === 'Fechado Improcedente' ? 'bg-[#181818]/5 text-[#181818]' :
                                  'bg-slate-100 text-slate-400'
                              }`}>
                              {t.status_protocolo || 'Sem Protocolo'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-600">UG: {t.codigo_cliente_ug || '-'}</span>
                              <span className="text-xs font-bold text-slate-400">UC: {t.codigo_cliente_uc?.join(', ') || '-'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-xs font-bold text-slate-500">
                              {new Date(t.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button className="p-2 text-slate-400 hover:text-[#198754] transition-colors">
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {userTickets.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-300 font-bold text-xs">
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
              <p className="text-xs font-bold text-slate-300 mb-2">Conselho Gestor de Qualidade FPGD</p>
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
