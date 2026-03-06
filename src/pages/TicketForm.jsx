
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const TicketForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [newUc, setNewUc] = useState('');
  
  const [formData, setFormData] = useState({
    cliente: '',
    mes_referencia: '',
    codigo_cliente_ug: '',
    codigo_cliente_uc: [],
    tipo_uc: 'Geradora',
    tipo_chamado: 'Compensação',
    numero_protocolo: '',
    data_abertura: '',
    status_protocolo: 'Não aberto',
    descricao_reclamacao: '',
    esta_de_acordo: false,
    recurso: 'Abrir novo protocolo'
  });

  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (data) {
        setCompany(data);
      }
    };

    fetchCompany();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

  const removeUc = (uc) => {
    setFormData(prev => ({
      ...prev,
      codigo_cliente_uc: prev.codigo_cliente_uc.filter(item => item !== uc)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!company) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.from('tickets').insert([{
        ...formData,
        company_id: company.id
      }]);

      if (error) throw error;
      navigate('/tickets');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="mb-8 border-b border-gray-100 pb-4 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-gray-800">Novo <span className="text-green-600">Ticket</span></h1>
           <p className="text-sm text-gray-500">Integrador: {company?.nome_fantasia || 'Carregando...'} ({company?.cnpj})</p>
        </div>
        <button onClick={() => navigate('/tickets')} className="text-gray-500 hover:text-green-600 font-semibold transition-colors">Voltar</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nome do Cliente</label>
            <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Mês de Referência</label>
            <input type="month" name="mes_referencia" value={formData.mes_referencia} onChange={handleChange} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Código Cliente UG (Geradora)</label>
            <input type="text" name="codigo_cliente_ug" value={formData.codigo_cliente_ug} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tipo de UC</label>
            <select name="tipo_uc" value={formData.tipo_uc} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all">
              <option value="Geradora">Geradora</option>
              <option value="Beneficiaria">Beneficiaria</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
          <label className="text-sm font-medium text-gray-700">Códigos Cliente UC (Beneficiárias)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newUc} 
              onChange={(e) => setNewUc(e.target.value)} 
              placeholder="Adicionar código UC"
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all" 
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUc())}
            />
            <button type="button" onClick={addUc} className="px-6 py-2 bg-green-100 text-green-700 font-bold rounded-lg hover:bg-green-200 transition-all">Add</button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {formData.codigo_cliente_uc.map(uc => (
              <span key={uc} className="px-3 py-1 bg-white border border-green-200 text-green-700 rounded-full text-sm flex items-center gap-2">
                {uc}
                <button type="button" onClick={() => removeUc(uc)} className="hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Tipo de Chamado</label>
            <select name="tipo_chamado" value={formData.tipo_chamado} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all">
              <option>Compensação</option>
              <option>Desligamento Involuntário</option>
              <option>Vistoria</option>
              <option>Homologação</option>
              <option>Nova Instalação com GD</option>
              <option>Nova Instalação</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Status do Protocolo</label>
            <select name="status_protocolo" value={formData.status_protocolo} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all">
              <option>Não aberto</option>
              <option>Em analise</option>
              <option>Fechado Procedente</option>
              <option>Fechado Improcente</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Número de Protocolo</label>
            <input type="text" name="numero_protocolo" value={formData.numero_protocolo} onChange={handleChange} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Data de Abertura</label>
            <input type="date" name="data_abertura" value={formData.data_abertura} onChange={handleChange} required className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Descrição da Reclamação</label>
          <textarea name="descricao_reclamacao" value={formData.descricao_reclamacao} onChange={handleChange} rows="4" className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <input type="checkbox" name="esta_de_acordo" checked={formData.esta_de_acordo} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <label className="text-sm font-medium text-gray-700">Está de acordo com o resultado?</label>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Recurso Pretendido</label>
            <select name="recurso" value={formData.recurso} onChange={handleChange} className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition-all">
              <option>Abrir novo protocolo</option>
              <option>Ouvidoria</option>
              <option>Aneel</option>
              <option>Judicializar</option>
              <option>Todas as opções</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:transform-none"
        >
          {loading ? 'Salvando...' : 'Abrir Ticket'}
        </button>
      </form>
    </div>
  );
};

export default TicketForm;
