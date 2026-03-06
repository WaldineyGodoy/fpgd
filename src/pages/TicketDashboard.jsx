
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const TicketDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      fetchTickets();
    };

    checkUser();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*, companies(nome_fantasia, cnpj)')
      .order('created_at', { ascending: false });

    if (!error) {
      setTickets(data);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="w-full max-w-6xl p-6 bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Meus <span className="text-green-600">Tickets</span>
          </h1>
          <p className="text-gray-500 text-sm">Acompanhamento de qualidade de atendimento</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/tickets/novo')}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all"
          >
             Novo Ticket
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-3 text-gray-500 hover:text-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center p-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 mb-4">Nenhum ticket encontrado.</p>
          <button onClick={() => navigate('/tickets/novo')} className="text-green-600 font-semibold hover:underline">Abrir meu primeiro ticket</button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4">Protocolo</th>
                <th className="px-6 py-4">Mês Ref.</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Abertura</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{ticket.numero_protocolo || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(ticket.mes_referencia).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</td>
                  <td className="px-6 py-4 text-gray-600">{ticket.tipo_chamado}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ticket.status_protocolo === 'Fechado Procedente' ? 'bg-green-100 text-green-700' :
                      ticket.status_protocolo === 'Fechado Improcente' ? 'bg-red-100 text-red-700' :
                      ticket.status_protocolo === 'Em analise' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.status_protocolo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{new Date(ticket.data_abertura).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="text-green-600 hover:text-green-800 font-semibold transition-colors"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TicketDashboard;
