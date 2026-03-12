import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit, Trash2, MapPin, Zap, Hash, Sun, 
  BarChart as BarChartIcon, Settings, Calendar, Mail, Phone
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface Usina {
  id: string;
  nome: string;
  cpf_cnpj: string;
  endereco: string;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  potencia_usina: number;
  qtd_paineis: number;
  potencia_paineis: number;
  qtd_inversor: number;
  potencia_inversor: number;
  ug: string;
  ucs: string[];
  nome_cliente: string | null;
  email_contato: string | null;
  telefone_contato: string | null;
  geracao_media_anual: number;
  created_at: string;
  client: {
    nome_fantasia: string | null;
    razao_social: string | null;
  } | null;
  integrator: {
    nome_fantasia: string | null;
    razao_social: string | null;
  } | null;
}

const UsinaDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [usina, setUsina] = useState<Usina | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetalhes = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('usinas')
          .select('*, client:companies!usinas_company_id_fkey(nome_fantasia, razao_social), integrator:companies!usinas_integrador_id_fkey(nome_fantasia, razao_social)')
          .eq('id', id)
          .single();

        if (error) throw error;
        setUsina(data);
      } catch (err) {
        console.error('Erro ao buscar usina:', err);
        alert('Usina não encontrada ou sem permissão de acesso.');
        navigate('/usinas');
      } finally {
        setLoading(false);
      }
    };

    fetchDetalhes();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!usina || !window.confirm('Excluir esta usina permanentemente?')) return;
    try {
      const { error } = await supabase.from('usinas').delete().eq('id', usina.id);
      if (error) throw error;
      navigate('/usinas');
    } catch (err) {
      console.error(err);
      alert('Erro ao deletar usina.');
    }
  };

  const chartData = useMemo(() => {
    if (!usina || !usina.geracao_media_anual) return [];
    const avgMensal = usina.geracao_media_anual / 12;
    // Criando um mock de variação sazonal baseada na média
    const factor = [0.9, 0.85, 0.95, 1.05, 1.1, 1.15, 1.2, 1.15, 1.1, 1.0, 0.85, 0.9];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((m, i) => ({
      name: m,
      geracao: Math.round(avgMensal * factor[i])
    }));
  }, [usina]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin shadow-lg shadow-blue-100" />
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Carregando detalhes da usina...</p>
      </div>
    );
  }

  if (!usina) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER E AÇÕES */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/usinas')}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl shadow-sm transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tighter uppercase">
                {usina.nome}
              </h1>
              <p className="text-xs font-black text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#198754]" /> Usina Solar Fotovoltaica
              </p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <motion.button onClick={() => navigate(`/usinas/${usina.id}/editar`)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-amber-50 text-amber-600 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
              <Edit className="w-5 h-5" /> Editar
            </motion.button>
            <motion.button onClick={handleDelete} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1 bg-red-50 text-red-600 px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
              <Trash2 className="w-5 h-5" /> Excluir
            </motion.button>
          </div>
        </div>

        {/* HEADER DE IDENTIFICAÇÃO (MODIFICADO) */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-green-900/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-50/50 rounded-full -translate-y-1/2 translate-x-1/3 -z-0" />
          
          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular / Cliente</p>
            <p className="text-lg font-black text-slate-800 leading-tight">
              {usina.nome_cliente || usina.client?.nome_fantasia || usina.client?.razao_social || 'N/A'}
            </p>
            <div className="flex flex-col gap-1 mt-2">
               <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 line-clamp-1">
                 <Mail className="w-3.5 h-3.5 text-[#198754]" /> {usina.email_contato || 'E-mail não informado'}
               </span>
               <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                 <Phone className="w-3.5 h-3.5 text-[#198754]" /> {usina.telefone_contato || 'Telefone não informado'}
               </span>
            </div>
          </div>

          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento e Contrato</p>
            <p className="text-sm font-black text-slate-700">CPF/CNPJ: <span className="text-slate-500 font-bold">{usina.cpf_cnpj || 'N/A'}</span></p>
            <p className="text-sm font-black text-slate-700">Nº Geradora (UG): <span className="text-[#198754]">{usina.ug || 'Sem contrato'}</span></p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-black bg-green-50 text-[#198754] px-2 py-1 rounded-lg border border-green-100 uppercase tracking-tighter">Conexão Ativa</span>
            </div>
          </div>

          <div className="relative z-10 space-y-1 md:col-span-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização e Unidades</p>
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-[#198754] flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                {usina.endereco ? (
                  `${usina.endereco}${usina.bairro ? ', ' + usina.bairro : ''} - ${usina.municipio || ''}/${usina.uf || ''}`
                ) : (
                  'Endereço não informado'
                )}
              </p>
            </div>
            <div className="mt-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unidades Consumidoras Vinculadas</p>
              <div className="flex flex-wrap gap-1.5">
                {(!usina.ucs || usina.ucs.length === 0) ? (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Nenhuma UC vinculada</span>
                ) : (
                  usina.ucs.map((uc, i) => (
                    <span key={i} className="px-2.5 py-1 bg-green-50 text-[#198754] font-black text-[10px] rounded-lg border border-green-100 shadow-sm">{uc}</span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUNA ESQUERDA: INFORMAÇÕES TÉCNICAS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-green-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-[100px] -z-0 group-hover:scale-110 transition-transform duration-700" />
            <h3 className="text-lg font-black text-slate-800 relative z-10">Potência Declarada</h3>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">Capacidade da Unidade fpgd</p>
            <div className="mt-8 relative z-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-[#198754] tracking-tighter">{usina.potencia_usina || 0}</span>
              <span className="text-lg font-black text-slate-300">kWp</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="text-xs font-black text-[#198754] uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
              <Settings className="w-5 h-5" /> Equipamentos
            </h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd. Painéis</span>
                  <span className="font-black text-slate-700">{usina.qtd_paineis || 0} un</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pt. Painéis (W)</span>
                  <span className="font-black text-slate-700">{usina.potencia_paineis || 0} W</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qtd. Inversores</span>
                  <span className="font-black text-slate-700">{usina.qtd_inversor || 0} un</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50/50 border border-slate-100/50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pt. Inversor (kW)</span>
                  <span className="font-black text-slate-700">{usina.potencia_inversor || 0} kW</span>
                </div>
            </div>
          </div>

          </div>
        </div>

        {/* COLUNA DIREITA: GRÁFICOS E MÉDIAS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-start mb-8">
               <div>
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tighter">
                    <BarChartIcon className="w-6 h-6 text-[#198754]" /> Gráfico de Geração
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-[0.3em]">
                    Projeção Estimada Mensal (kWh) fpgd
                  </p>
               </div>
               <div className="text-right">
                  <span className="block text-3xl font-black text-[#198754] tracking-tighter leading-none">{usina.geracao_media_anual || 0}</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Anual Estimado</span>
               </div>
             </div>

             <div className="h-80">
                {usina.geracao_media_anual ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} width={45} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 900, color: '#198754' }}
                        formatter={(value) => [`${value} kWh`, 'Estimativa Mensal']}
                      />
                      <Bar dataKey="geracao" fill="#198754" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                    <Sun className="w-12 h-12 text-slate-300" />
                    <span className="font-bold">Informe a "Geração Média (kWh/ano)" na edição da usina para visualizar os gráficos.</span>
                  </div>
                )}
             </div>
          </div>

          {/* Cards informativos secundários (Opcional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#262727] text-white p-6 rounded-[2.5rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px]" />
               <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Média Diária</h4>
               <div className="flex items-baseline gap-2 text-3xl font-black text-white">
                 {usina.geracao_media_anual ? Math.round(usina.geracao_media_anual / 365) : 0} <span className="text-lg text-slate-400">kWh</span>
               </div>
            </div>
            {usina.integrator && (
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                 <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Integradora Responsável</h4>
                    <p className="font-black text-slate-700">{usina.integrator.nome_fantasia || usina.integrator.razao_social}</p>
                 </div>
                 <div className="w-12 h-12 bg-green-50 text-[#198754] rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                 </div>
               </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UsinaDetails;
