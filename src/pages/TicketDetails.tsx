
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

interface Ticket {
  id: string;
  numero_protocolo: string | null;
  cliente: string;
  mes_referencia: string;
  codigo_cliente_ug: string | null;
  codigo_cliente_uc: string[] | null;
  tipo_uc: string;
  tipo_chamado: string;
  status_protocolo: string;
  data_abertura: string;
  descricao_reclamacao: string | null;
  esta_de_acordo: boolean;
  recurso: string;
  companies: {
    nome_fantasia: string | null;
    razao_social: string | null;
    cnpj: string;
  } | null;
}

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*, companies(*)')
          .eq('id', id)
          .single();

        if (error || !data) {
          navigate('/tickets');
          return;
        }

        setTicket(data as any);
      } catch (err) {
        console.error('Error:', err);
        navigate('/tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, navigate]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 pb-8 border-b border-gray-100/50">
        <div>
          <motion.h1
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl font-black text-gray-800"
          >
            Detalhes do <span className="text-green-600">Ticket</span>
          </motion.h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs font-black uppercase tracking-widest">Protocolo</span>
            <p className="text-sm font-bold text-gray-400">{ticket.numero_protocolo}</p>
          </div>
        </div>
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate('/tickets')}
          className="px-6 py-3 text-gray-400 hover:text-green-600 font-bold transition-all flex items-center gap-2 border-2 border-transparent hover:border-green-50 rounded-2xl"
        >
          <span className="text-xl">‹</span> Voltar
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                <motion.span
                  key={i}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                  className="px-4 py-2 bg-white border-2 border-gray-50 text-gray-600 rounded-xl text-sm font-bold shadow-sm"
                >
                  {uc}
                </motion.span>
              ))}
              {(!ticket.codigo_cliente_uc || ticket.codigo_cliente_uc.length === 0) && (
                <p className="text-gray-300 font-bold italic text-sm">Nenhuma beneficiária informada.</p>
              )}
            </div>
          </section>
        </motion.div>

        <motion.div variants={cardVariants} initial="initial" animate="animate" transition={{ delay: 0.2 }} className="space-y-8">
          <section className="p-8 bg-green-600 rounded-[2.5rem] shadow-xl shadow-green-100 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-8xl font-black">✦</div>
            <h3 className="text-xs font-black text-green-200 uppercase tracking-[0.2em] mb-4">Status da Solicitação</h3>
            <div className="space-y-4">
              <span className="inline-block px-5 py-2 bg-white/20 backdrop-blur-md rounded-2xl text-lg font-black">
                {ticket.status_protocolo.toUpperCase()}
              </span>
              <p className="text-xs font-bold text-green-100 mt-2">
                Aberto em: <span className="text-white">{new Date(ticket.data_abertura).toLocaleDateString('pt-BR')}</span>
              </p>
            </div>
          </section>

          <section className="px-2 grid grid-cols-1 gap-6">
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Tipo de Chamado</h3>
              <p className="font-black text-gray-700">{ticket.tipo_chamado}</p>
            </div>
            <div>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Recurso Pretendido</h3>
              <p className="font-black text-gray-700">{ticket.recurso}</p>
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

      <motion.div
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
        className="mt-12 pt-10 border-t border-gray-100/50"
      >
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
    </motion.div>
  );
};

export default TicketDetails;
