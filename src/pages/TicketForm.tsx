
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import BuscaIntegrador from '../components/BuscaIntegrador';
import BuscaUsina from '../components/BuscaUsina';
import MonthPicker from '../components/MonthPicker';
import Notification, { NotificationType } from '../components/Notification';
import { PlusCircle } from 'lucide-react';

interface FormData {
  cliente: string;
  status?: string;
  mes_referencia: string;
  codigo_cliente_ug: string;
  codigo_cliente_uc: string[];
  tipo_uc: 'Geradora' | 'Beneficiaria';
  tipo_chamado: string;
  numero_protocolo: string;
  data_abertura: string;
  status_protocolo: string;
  descricao_reclamacao: string;
}

const TicketForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [company, setCompany] = useState<any>(null);
  const [newUc, setNewUc] = useState<string>('');
  const [selectedIntegratorId, setSelectedIntegratorId] = useState<string | null>(null);
  const [selectedIntegratorName, setSelectedIntegratorName] = useState<string | null>(null);
  const [selectedUsinaId, setSelectedUsinaId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: NotificationType;
    title: string;
    message: string;
  }>({
    show: false,
    type: 'info',
    title: '',
    message: ''
  });
  const [usinaContact, setUsinaContact] = useState({
    nome_cliente: '',
    email_contato: '',
    telefone_contato: ''
  });

  const [formData, setFormData] = useState<FormData>({
    cliente: '',
    mes_referencia: new Date().toISOString().slice(0, 7),
    codigo_cliente_ug: '',
    codigo_cliente_uc: [],
    tipo_uc: 'Geradora',
    tipo_chamado: 'Compensação',
    numero_protocolo: '',
    data_abertura: '',
    status_protocolo: 'Sem Protocolo',
    descricao_reclamacao: ''
  });

  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Fetching company for user:', user.id, user.email);
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (data) {
        console.log('Company found by auth_user_id:', data.id);
        setCompany(data);
        if (data.integrador_id) {
          setSelectedIntegratorId(data.integrador_id);
        }
      } else if (user.email) {
        console.log('Auth link not found, searching by email:', user.email);
        // Fallback: search by email to link existing unlinked records
        const { data: emailData } = await supabase
          .from('companies')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (emailData) {
          console.log('Company found by email, auto-linking:', emailData.id);
          // Auto-link for future sessions
          const { error: linkError } = await supabase
            .from('companies')
            .update({ auth_user_id: user.id })
            .eq('id', emailData.id);
          
          if (linkError) console.error('Error auto-linking:', linkError);
          
          setCompany({ ...emailData, auth_user_id: user.id });
          if (emailData.integrador_id) {
            setSelectedIntegratorId(emailData.integrador_id);
          }
        } else {
          console.warn('No company record found for email:', user.email);
        }
      } else {
        console.error('No email available in user object');
      }
    };

    fetchCompany();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';

    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const addUc = () => {
    if (newUc && !formData.codigo_cliente_uc.includes(newUc)) {
      setFormData(prev => ({
        ...prev,
        codigo_cliente_uc: [...prev.codigo_cliente_uc, newUc]
      }));
      setNewUc('');
    }
  };

  const removeUc = (uc: string) => {
    setFormData(prev => ({
      ...prev,
      codigo_cliente_uc: prev.codigo_cliente_uc.filter(item => item !== uc)
    }));
  };

  const generateTicketNumber = () => {
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '');
    return `${random}${dateStr}`;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!company) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Empresa não Identificada',
        message: 'Não foi possível vincular seu usuário a uma empresa. Por favor, tente fazer login novamente ou entre em contato com o suporte.'
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Check if we need to update the company's integrator_id
      if (selectedIntegratorId && selectedIntegratorId !== company.integrador_id) {
        await supabase
          .from('companies')
          .update({ integrador_id: selectedIntegratorId })
          .eq('id', company.id);
      }

      // 2. Create the ticket
      const { error } = await supabase.from('tickets').insert([{
        ...formData,
        mes_referencia: formData.mes_referencia + '-01',
        status: 'Em Aberto',
        numero_ticket: generateTicketNumber(),
        company_id: company.id,
        integrador_id: selectedIntegratorId, // New field for security and scoping
        usina_id: selectedUsinaId // Bind ticket to specific usina for perfect isolation
      }]);

      if (error) throw error;
      
      setNotification({
        show: true,
        type: 'success',
        title: 'Ticket Registrado!',
        message: 'Sua solicitação foi salva com sucesso e já está disponível no seu dashboard.'
      });
      
      setTimeout(() => navigate('/tickets'), 2000);
    } catch (err: any) {
      console.error('Erro detalhado:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Erro no Registro',
        message: err.message || 'Ocorreu um problema ao salvar seu ticket. Tente novamente em instantes.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl p-8 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20"
    >
      <div className="mb-8 border-b border-gray-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <motion.h1
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black text-slate-800 flex items-center gap-4 tracking-tighter uppercase"
          >
            Novo <span className="text-[#198754]">Ticket</span>
            <span className="px-4 py-1.5 bg-[#198754]/10 text-[#198754] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-[#198754]/20 shadow-sm">
              Status: Em Aberto
            </span>
          </motion.h1>
          <p className="text-xs font-black text-slate-400 mt-2 uppercase tracking-[0.3em] pl-1">
            {company?.nome_fantasia || 'IDENTIFICANDO...'} • <span className="text-slate-300 font-bold">{company?.cnpj}</span>
          </p>
        </div>
        <button onClick={() => navigate('/tickets')} className="px-6 py-3 text-slate-400 hover:text-[#198754] font-bold transition-all flex items-center gap-2 group">
          <span className="text-xl group-hover:-translate-x-1 transition-transform">‹</span> Voltar para Listagem
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="space-y-6">
          <h2 className="text-xs font-black text-[#198754] uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="h-1.5 w-10 bg-[#198754] rounded-full"></span>
            Identificação do Cliente
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Selecionar Cliente / Usina</label>
                <BuscaUsina 
                  onSelect={(usina) => {
                    if (usina) {
                      setFormData(prev => ({
                        ...prev,
                        cliente: usina.nome,
                        codigo_cliente_ug: usina.ug || '',
                        codigo_cliente_uc: usina.ucs || [],
                        tipo_uc: usina.tipo_uc || 'Geradora'
                      }));
                      if (usina.integrador_id) {
                        setSelectedIntegratorId(usina.integrador_id);
                        setSelectedIntegratorName(usina.integrador?.nome_fantasia || usina.integrador?.razao_social || 'N/A');
                      }
                      setSelectedUsinaId(usina.id);
                      setUsinaContact({
                        nome_cliente: usina.nome_cliente || '',
                        email_contato: usina.email_contato || '',
                        telefone_contato: usina.telefone_contato || ''
                      });
                    } else {
                      setUsinaContact({
                        nome_cliente: '',
                        email_contato: '',
                        telefone_contato: ''
                      });
                      setSelectedUsinaId(null);
                    }
                  }} 
                />
              </div>
              <div className="w-full md:w-64 space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">Mês de Referência</label>
                <MonthPicker 
                  value={formData.mes_referencia} 
                  onChange={(val) => setFormData(prev => ({ ...prev, mes_referencia: val }))} 
                />
              </div>
            </div>
            
            <motion.button
              whileHover={{ x: 5 }}
              type="button"
              onClick={() => navigate('/usinas')}
              className="text-[10px] font-black uppercase tracking-widest text-[#198754] hover:text-[#157347] flex items-center gap-2 ml-1"
            >
              <PlusCircle className="w-4 h-4" />
              Não encontrou o cliente? Cadastre aqui.
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-gray-50">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <div className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-slate-700 shadow-inner">
                {formData.cliente || <span className="text-slate-300 font-medium italic">Selecione o cliente acima...</span>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Cliente UG</label>
              <div className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-slate-700 shadow-inner">
                {formData.codigo_cliente_ug || <span className="text-slate-300 font-medium italic">Selecione o cliente acima...</span>}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de UG</label>
              <div className="w-full px-5 py-3 rounded-xl bg-green-50 text-[#198754] font-black uppercase text-[10px] tracking-[0.2em] border border-green-100 shadow-sm w-fit">
                {formData.tipo_uc || 'SELECIONE...'}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Integrador / Vendedor Responsável</label>
              <div className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-slate-700 shadow-inner">
                {selectedIntegratorName || <span className="text-slate-300 font-medium italic">Selecione o cliente acima...</span>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Cliente (Proprietário)</label>
              <div className="w-full p-4 rounded-2xl bg-[#F8F6F2] border-2 border-slate-100 font-black text-slate-700 shadow-sm uppercase text-[11px]">
                {usinaContact.nome_cliente || <span className="text-slate-300 font-medium italic">N/A</span>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email de Contato</label>
                <div className="w-full p-4 rounded-2xl bg-[#F8F6F2] border-2 border-slate-100 font-black text-slate-700 text-[10px] truncate shadow-sm">
                  {usinaContact.email_contato || <span className="text-slate-300 font-medium italic">N/A</span>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                <div className="w-full p-4 rounded-2xl bg-[#F8F6F2] border-2 border-slate-100 font-black text-slate-700 text-[10px] shadow-sm tracking-widest">
                  {usinaContact.telefone_contato || <span className="text-slate-300 font-medium italic">N/A</span>}
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#198754] rounded-full animate-pulse" />
            Dados vinculados automaticamente à usina selecionada.
          </p>
        </section>

        <section className="space-y-4 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
          <label className="text-sm font-black text-gray-700 flex items-center gap-2">
            Multi-Beneficiárias (UCs)
          </label>
          {formData.codigo_cliente_uc.length > 0 ? (
            <motion.div layout className="flex flex-wrap gap-2 pt-2">
              <AnimatePresence>
                {formData.codigo_cliente_uc.map(uc => (
                  <motion.span
                    key={uc}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="px-4 py-2 bg-white border border-green-200 text-green-700 rounded-xl font-bold shadow-sm flex items-center gap-3"
                  >
                    {uc}
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <p className="text-sm text-gray-400 font-bold italic ml-1">Nenhuma unidade beneficiária cadastrada nesta usina.</p>
          )}
        </section>

        <section className="space-y-6">
          <h2 className="text-xs font-black text-[#198754] uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="h-1.5 w-10 bg-[#198754] rounded-full"></span>
            Dados do Atendimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Tipo de Chamado</label>
              <select name="tipo_chamado" value={formData.tipo_chamado} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-[#198754] outline-none transition-all font-bold text-gray-600 bg-white">
                <option>Compensação</option>
                <option>Desligamento Involuntário</option>
                <option>Vistoria</option>
                <option>Homologação</option>
                <option>Nova Instalação com GD</option>
                <option>Nova Instalação</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Status do Protocolo</label>
              <select name="status_protocolo" value={formData.status_protocolo} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-[#198754] outline-none transition-all font-bold text-gray-600 bg-white">
                <option value="Sem Protocolo">Sem Protocolo</option>
                <option value="Em Analise">Em Analise</option>
                <option value="Fechado Improcedente">Fechado Improcedente</option>
                <option value="Fechado Procedente">Fechado Procedente</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Número de Protocolo</label>
              <input type="text" name="numero_protocolo" value={formData.numero_protocolo} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-[#198754] outline-none transition-all font-bold text-[#262727]" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Data de Abertura</label>
              <input type="date" name="data_abertura" value={formData.data_abertura} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-[#198754] outline-none transition-all font-bold text-gray-600" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-black text-gray-700 ml-1">Descrição Detalhada</label>
            <textarea name="descricao_reclamacao" value={formData.descricao_reclamacao} onChange={handleChange} rows={5} className="w-full p-4 rounded-3xl border-2 border-gray-100 focus:border-[#198754] outline-none transition-all font-medium resize-none shadow-inner" placeholder="Explique aqui os detalhes da reclamação..." />
          </div>
        </section>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: '#157347' }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-[#198754] text-white font-black text-xl rounded-[2rem] shadow-2xl shadow-green-900/10 transition-all duration-200 disabled:opacity-50 uppercase tracking-[0.2em]"
        >
          {loading ? 'Processando Chamado...' : 'REGISTRAR TICKET ✦'}
        </motion.button>
      </form>

      <Notification 
        {...notification}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </motion.div>
  );
};

export default TicketForm;
