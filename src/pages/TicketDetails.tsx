
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import Notification, { NotificationType } from '../components/Notification';

interface Ticket {
  id: string;
  numero_ticket: string | null;
  numero_protocolo: string | null;
  cliente: string;
  mes_referencia: string;
  codigo_cliente_ug: string | null;
  codigo_cliente_uc: string[] | null;
  tipo_uc: string;
  tipo_chamado: string;
  status_protocolo: string;
  status: string;
  data_abertura: string;
  descricao_reclamacao: string | null;
  esta_de_acordo: boolean;
  recurso: string;
  resposta: string | null;
  replica: string | null;
  company_id: string;
  companies: {
    nome_fantasia: string | null;
    razao_social: string | null;
    cnpj: string;
    user_type: string;
  } | null;
}

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  
  // States for interactive fields
  const [localResposta, setLocalResposta] = useState('');
  const [localReplica, setLocalReplica] = useState('');
  const [localConcordancia, setLocalConcordancia] = useState<boolean | null>(null);
  const [localRecurso, setLocalRecurso] = useState('Abrir novo protocolo');

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

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // 1. Get Ticket Data
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .select('*, companies(*)')
          .eq('id', id)
          .single();

        if (ticketError || !ticketData) {
          navigate('/tickets');
          return;
        }

        const t = ticketData as Ticket;
        setTicket(t);
        setLocalResposta(t.resposta || '');
        setLocalReplica(t.replica || '');
        setLocalConcordancia(t.esta_de_acordo);
        setLocalRecurso(t.recurso || 'Abrir novo protocolo');

        // 2. Get User Role for current session
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('user_type')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          
          setUserRole(companyData?.user_type || 'cliente');
        }
      } catch (err) {
        console.error('Error:', err);
        navigate('/tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleUpdateTicket = async () => {
    if (!ticket || !id) return;
    setSaving(true);
    try {
      const updates: any = {};
      
      // Admin/Mediador update Resposta
      if (isAdminOrMediator) {
        updates.resposta = localResposta;
        // Optionally update status too if needed
      } 
      
      // Cliente/Integrador update Replica + Agreement
      if (isClientOrIntegrator) {
        if (canEditReplica) {
          updates.replica = localReplica;
        }
        if (canEditAgreement) {
          updates.esta_de_acordo = localConcordancia;
          updates.recurso = localConcordancia ? 'Sem recurso' : localRecurso;
        }
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setNotification({
        show: true,
        type: 'success',
        title: 'Atualizado!',
        message: 'As informações do ticket foram salvas com sucesso.'
      });
      
      // Refresh local state
      setTicket({ ...ticket, ...updates });
    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Erro ao Salvar',
        message: err.message || 'Não foi possível atualizar o ticket.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="h-16 w-16 border-4 border-green-100 border-t-green-600 rounded-full"
        />
        <p className="text-gray-400 font-bold animate-pulse">Carregando detalhes...</p>
      </div>
    );
  }

  if (!ticket) return null;

  const isAdminOrMediator = userRole === 'admin' || userRole === 'mediador';
  const isClientOrIntegrator = userRole === 'cliente' || userRole === 'integrador';
  const hasResposta = !!ticket.resposta;
  
  const canEditResposta = isAdminOrMediator;
  const canEditReplica = isClientOrIntegrator && hasResposta;
  const canEditAgreement = isClientOrIntegrator && hasResposta;

  const cardVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl p-8 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 pb-8 border-b border-gray-100/50">
        <div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft size={24} />
            </button>
            <motion.h1 className="text-4xl font-black text-gray-800">
              Detalhes do <span className="text-green-600">Ticket</span>
            </motion.h1>
          </div>
          <div className="flex items-center gap-2 mt-2 ml-12">
            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">Ticket #{ticket.numero_ticket || ticket.id.slice(0, 4)}</span>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-black uppercase tracking-widest">Protocolo</span>
            <p className="text-sm font-bold text-gray-400">{ticket.numero_protocolo}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="px-6 py-3 text-gray-400 hover:text-green-600 font-bold transition-all flex items-center gap-2 border-2 border-transparent hover:border-green-50 rounded-2xl"
        >
          <span className="text-xl">‹</span> Voltar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Info */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" transition={{ delay: 0.1 }} className="space-y-8">
          <section className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
            <h3 className="text-xs font-black text-green-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="h-1 w-4 bg-green-600 rounded-full"></span>
              Integrador
            </h3>
            <p className="text-xl font-black text-gray-800 leading-tight mb-1">
              {ticket.companies?.nome_fantasia || ticket.companies?.razao_social}
            </p>
            <p className="text-sm font-bold text-gray-400">CNPJ: {ticket.companies?.cnpj}</p>
          </section>

          <section className="px-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Informações do Cliente</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-tighter">Nome do Cliente</p>
                <p className="text-lg font-black text-gray-700">{ticket.cliente}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-tighter">Código UG</p>
                  <p className="font-bold text-gray-600">{ticket.codigo_cliente_ug || '---'}</p>
                </div>
                <div>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-tighter">Tipo UG</p>
                  <span className="inline-block mt-1 px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-black">{ticket.tipo_uc.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </section>

          <section className="px-2">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Beneficiárias (UCs)</h3>
            <div className="flex flex-wrap gap-2">
              {ticket.codigo_cliente_uc?.map((uc, i) => (
                <span key={i} className="px-4 py-2 bg-white border-2 border-gray-50 text-gray-600 rounded-xl text-sm font-bold shadow-sm">
                  {uc}
                </span>
              ))}
              {(!ticket.codigo_cliente_uc || ticket.codigo_cliente_uc.length === 0) && (
                <p className="text-gray-300 font-bold italic text-sm">Nenhuma beneficiária informada.</p>
              )}
            </div>
          </section>
        </motion.div>

        {/* Right Column: Status & Interactive Area */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" transition={{ delay: 0.2 }} className="space-y-8">
          <section className="p-8 bg-green-600 rounded-[2.5rem] shadow-xl shadow-green-100 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl font-black">✦</div>
            <h3 className="text-xs font-black text-green-200 uppercase tracking-[0.2em] mb-4">Status da Solicitação</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-green-100 uppercase tracking-widest">Ticket</span>
                <span className="inline-block px-5 py-2 bg-white/20 backdrop-blur-md rounded-2xl text-lg font-black w-fit uppercase">
                  {ticket.status}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-green-100 uppercase tracking-widest">Protocolo</span>
                <span className="inline-block px-5 py-2 bg-white/20 backdrop-blur-md rounded-2xl text-lg font-black w-fit uppercase text-wrap max-w-full">
                  {ticket.status_protocolo}
                </span>
              </div>
              <p className="text-xs font-bold text-green-100 mt-2">
                Aberto em: <span className="text-white">{new Date(ticket.data_abertura).toLocaleDateString('pt-BR')}</span>
              </p>
            </div>
          </section>

          <section className="px-2 grid grid-cols-1 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Tipo</h3>
                <p className="font-black text-gray-700">{ticket.tipo_chamado}</p>
              </div>
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Recurso</h3>
                <p className="font-black text-gray-700">{ticket.recurso || 'Não informado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className={`w-3 h-3 rounded-full ${ticket.esta_de_acordo ? 'bg-green-500 shadow-lg shadow-green-100' : 'bg-red-400'}`}></div>
              <p className="text-sm font-bold text-gray-600">
                {ticket.esta_de_acordo ? 'De acordo com o resultado' : 'Em desacordo com o resultado'}
              </p>
            </div>
          </section>
        </motion.div>
      </div>

      {/* Description Section */}
      <motion.div variants={cardVariants} initial="initial" animate="animate" transition={{ delay: 0.3 }} className="mt-12 pt-10 border-t border-gray-100/50">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <span className="h-1 w-4 bg-gray-200 rounded-full"></span>
          Descrição da Ocorrência
        </h3>
        <div className="p-8 bg-gray-50/80 backdrop-blur-sm rounded-[2rem] text-gray-600 font-medium leading-relaxed italic relative">
          <span className="absolute -top-4 left-6 text-6xl text-gray-200 font-serif leading-none">“</span>
          {ticket.descricao_reclamacao || 'Nenhum detalhe adicional fornecido.'}
          <span className="absolute -bottom-10 right-6 text-6xl text-gray-200 font-serif leading-none rotate-180">“</span>
        </div>
      </motion.div>

      {/* INTERACTIVE SECTIONS */}
      <div className="mt-12 space-y-12 pb-12">
        
        {/* RESPOSTA (ADMIN/MEDIADOR) */}
        <section className="animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
             Resposta <span className="text-green-600">Mediador</span>
          </h3>
          <div className="relative group">
            <textarea
              readOnly={!canEditResposta}
              value={localResposta}
              onChange={(e) => setLocalResposta(e.target.value)}
              placeholder={canEditResposta ? "Escreva aqui a resposta oficial da mediação..." : "Aguardando resposta do mediador..."}
              className={`w-full p-8 rounded-[2rem] border-2 transition-all min-h-[150px] font-medium leading-relaxed ${
                canEditResposta 
                ? 'bg-white border-green-100 focus:border-green-500 outline-none shadow-xl shadow-green-50' 
                : 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed italic'
              }`}
            />
            {canEditResposta && (
              <div className="absolute top-4 right-4 text-green-600 opacity-20">✦</div>
            )}
          </div>
        </section>

        {/* RÉPLICA (CLIENTE/INTEGRADOR) */}
        <AnimatePresence>
          {hasResposta && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="animate-in fade-in slide-in-from-bottom-4"
            >
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
                 Sua <span className="text-green-600">Réplica</span>
              </h3>
              <textarea
                readOnly={!canEditReplica}
                value={localReplica}
                onChange={(e) => setLocalReplica(e.target.value)}
                placeholder={canEditReplica ? "Caso não concorde, escreva aqui seus argumentos técnicos..." : "Campo reservado para a réplica do cliente."}
                className={`w-full p-8 rounded-[2rem] border-2 transition-all min-h-[150px] font-medium leading-relaxed ${
                  canEditReplica 
                  ? 'bg-white border-gray-200 focus:border-green-500 outline-none shadow-xl' 
                  : 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed italic'
                }`}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* CONCORDÂNCIA E RECURSO (CLIENTE/INTEGRADOR) - MIGRADO DO FORM */}
        <AnimatePresence>
          {(canEditAgreement || hasResposta) && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-8 rounded-[3rem] border-2 transition-all ${
                canEditAgreement ? 'bg-white border-green-50 shadow-2xl shadow-green-100/20' : 'bg-gray-50 border-transparent opacity-80'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                <div className="space-y-4">
                  <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-widest">
                    Concordância com o resultado?
                  </label>
                  <div className="flex gap-4">
                    <button
                      disabled={!canEditAgreement}
                      onClick={() => setLocalConcordancia(true)}
                      className={`flex-1 py-5 rounded-2xl font-black transition-all border-b-4 ${
                        localConcordancia === true
                        ? 'bg-green-600 text-white border-green-800 shadow-lg shadow-green-100' 
                        : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                      } ${!canEditAgreement && 'cursor-not-allowed'}`}
                    >
                      SIM
                    </button>
                    <button
                      disabled={!canEditAgreement}
                      onClick={() => setLocalConcordancia(false)}
                      className={`flex-1 py-5 rounded-2xl font-black transition-all border-b-4 ${
                        localConcordancia === false
                        ? 'bg-red-600 text-white border-red-800 shadow-lg shadow-red-100' 
                        : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                      } ${!canEditAgreement && 'cursor-not-allowed'}`}
                    >
                      NÃO
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-black text-gray-700 ml-1 uppercase tracking-widest">
                    Recurso Pretendido
                  </label>
                  <select 
                    disabled={!canEditAgreement || localConcordancia === true}
                    value={localRecurso} 
                    onChange={(e) => setLocalRecurso(e.target.value)}
                    className={`w-full p-5 rounded-2xl border-2 outline-none transition-all font-bold ${
                      canEditAgreement && localConcordancia === false
                      ? 'bg-white border-gray-200 focus:border-green-500' 
                      : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <option>Abrir novo protocolo</option>
                    <option>Ouvidoria</option>
                    <option>Aneel</option>
                    <option>Judicializar</option>
                    <option>Todas as opções</option>
                  </select>
                </div>
              </div>
              
              {!hasResposta && (
                <div className="mt-6 flex items-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">
                  <AlertCircle size={16} />
                  Estes campos serão desbloqueados assim que o mediador enviar uma resposta.
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* SAVE BUTTON */}
        {(canEditResposta || canEditReplica || canEditAgreement) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end pt-8"
          >
            <button
              onClick={handleUpdateTicket}
              disabled={saving}
              className="px-12 py-5 bg-green-600 text-white font-black text-lg rounded-2xl shadow-2xl shadow-green-200 hover:bg-green-700 transition-all flex items-center gap-4 border-b-8 border-green-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
              <Send size={20} />
            </button>
          </motion.div>
        )}
      </div>

      <Notification 
        {...notification}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </motion.div>
  );
};

export default TicketDetails;
