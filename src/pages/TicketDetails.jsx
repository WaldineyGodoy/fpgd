
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*, companies(*)')
        .eq('id', id)
        .single();

      if (error || !data) {
        navigate('/tickets');
        return;
      }

      setTicket(data);
      setLoading(false);
    };

    fetchTicket();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Detalhes do <span className="text-green-600">Ticket</span></h1>
          <p className="text-sm text-gray-500">Protocolo: {ticket.numero_protocolo}</p>
        </div>
        <button onClick={() => navigate('/tickets')} className="text-gray-500 hover:text-green-600 font-semibold transition-colors">Voltar</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Informações do Integrador</h3>
            <p className="text-gray-800 font-medium">{ticket.companies?.nome_fantasia || ticket.companies?.razao_social}</p>
            <p className="text-sm text-gray-500">CNPJ: {ticket.companies?.cnpj}</p>
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Dados do Cliente</h3>
            <p className="text-gray-800 font-medium">{ticket.cliente}</p>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600"><strong>UG:</strong> {ticket.codigo_cliente_ug || 'N/A'}</p>
              <p className="text-sm text-gray-600"><strong>Tipo:</strong> {ticket.tipo_uc}</p>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Beneficiárias (UCs)</h3>
            <div className="flex flex-wrap gap-2">
              {ticket.codigo_cliente_uc?.map((uc, i) => (
                <span key={i} className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-xs">
                  {uc}
                </span>
              ))}
              {(!ticket.codigo_cliente_uc || ticket.codigo_cliente_uc.length === 0) && <p className="text-gray-400 text-sm italic">Nenhuma informada</p>}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Status do Chamado</h3>
            <span className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${
              ticket.status_protocolo === 'Fechado Procedente' ? 'bg-green-100 text-green-700' :
              ticket.status_protocolo === 'Fechado Improcente' ? 'bg-red-100 text-red-700' :
              ticket.status_protocolo === 'Em analise' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {ticket.status_protocolo}
            </span>
            <p className="mt-4 text-sm text-gray-500">
              Aberto em: {new Date(ticket.data_abertura).toLocaleDateString('pt-BR')}
            </p>
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Tipo e Recurso</h3>
            <p className="text-sm text-gray-700"><strong>Tipo:</strong> {ticket.tipo_chamado}</p>
            <p className="text-sm text-gray-700"><strong>Recurso:</strong> {ticket.recurso}</p>
            <p className="text-sm text-gray-700 mt-2"><strong>De acordo:</strong> {ticket.esta_de_acordo ? 'Sim' : 'Não'}</p>
          </section>
        </div>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-50">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Descrição da Reclamação</h3>
        <div className="p-6 bg-gray-50 rounded-2xl text-gray-700 leading-relaxed whitespace-pre-wrap italic">
          "{ticket.descricao_reclamacao || 'Sem descrição.'}"
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;
