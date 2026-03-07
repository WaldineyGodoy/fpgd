
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  cliente: string;
  mes_referencia: string;
  codigo_cliente_ug: string;
  codigo_cliente_uc: string[];
  tipo_uc: 'Geradora' | 'Beneficiaria';
  tipo_chamado: string;
  numero_protocolo: string;
  data_abertura: string;
  status_protocolo: string;
  descricao_reclamacao: string;
  esta_de_acordo: boolean;
  recurso: string;
}

const TicketForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [company, setCompany] = useState<any>(null);
  const [newUc, setNewUc] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
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
      if (!user) return;

      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (data) {
        setCompany(data);
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl p-8 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20"
    >
      <div className="mb-8 border-b border-gray-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black text-gray-800"
          >
            Novo <span className="text-green-600">Ticket</span>
          </motion.h1>
          <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">
            {company?.nome_fantasia || 'IDENTIFICANDO...'} • {company?.cnpj}
          </p>
        </div>
        <button onClick={() => navigate('/tickets')} className="px-6 py-2 text-gray-400 hover:text-green-600 font-bold transition-all flex items-center gap-2">
          <span>‹</span> Voltar para Listagem
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="space-y-6">
          <h2 className="text-xs font-black text-green-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="h-1 w-8 bg-green-600 rounded-full"></span>
            Identificação do Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Nome Completo</label>
              <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-medium" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Mês de Referência</label>
              <input type="month" name="mes_referencia" value={formData.mes_referencia} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-600" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Código Cliente UG</label>
              <input type="text" name="codigo_cliente_ug" value={formData.codigo_cliente_ug} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Tipo de UG</label>
              <select name="tipo_uc" value={formData.tipo_uc} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-600 bg-white">
                <option value="Geradora">Geradora</option>
                <option value="Beneficiaria">Beneficiaria</option>
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
          <label className="text-sm font-black text-gray-700 flex items-center gap-2">
            Multi-Beneficiárias (UCs)
            <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">Opcional</span>
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newUc}
              onChange={(e) => setNewUc(e.target.value)}
              placeholder="Digite o código da UC..."
              className="flex-1 p-4 rounded-2xl border-2 border-white focus:border-green-500 outline-none transition-all shadow-sm bg-white"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUc())}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={addUc}
              className="px-8 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-lg shadow-green-100 border-b-4 border-green-800"
            >
              Add
            </motion.button>
          </div>
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
                  <button type="button" onClick={() => removeUc(uc)} className="text-red-400 hover:text-red-600 font-black">×</button>
                </motion.span>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xs font-black text-green-600 uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="h-1 w-8 bg-green-600 rounded-full"></span>
            Dados do Atendimento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Tipo de Chamado</label>
              <select name="tipo_chamado" value={formData.tipo_chamado} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-600 bg-white">
                <option>Compensação</option>
                <option>Desligamento Involuntário</option>
                <option>Vistoria</option>
                <option>Homologação</option>
                <option>Nova Instalação com GD</option>
                <option>Nova Instalação</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Status Atual</label>
              <select name="status_protocolo" value={formData.status_protocolo} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-600 bg-white">
                <option>Não aberto</option>
                <option>Em analise</option>
                <option>Fechado Procedente</option>
                <option>Fechado Improcente</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Número de Protocolo</label>
              <input type="text" name="numero_protocolo" value={formData.numero_protocolo} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Data de Abertura</label>
              <input type="date" name="data_abertura" value={formData.data_abertura} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-600" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-black text-gray-700 ml-1">Descrição Detalhada</label>
            <textarea name="descricao_reclamacao" value={formData.descricao_reclamacao} onChange={handleChange} rows={5} className="w-full p-4 rounded-3xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-medium resize-none shadow-inner" placeholder="Explique aqui os detalhes da reclamação..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <motion.label
              whileHover={{ backgroundColor: '#f0fdf4' }}
              className="flex items-center gap-4 p-5 rounded-3xl border-2 border-gray-100 cursor-pointer transition-colors select-none"
            >
              <input type="checkbox" name="esta_de_acordo" checked={formData.esta_de_acordo} onChange={handleChange} className="w-8 h-8 rounded-xl border-2 border-gray-200 text-green-600 focus:ring-green-500 transition-all" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-gray-800 leading-none">Concordância</span>
                <span className="text-xs text-gray-400 font-bold mt-1">Está de acordo com o resultado?</span>
              </div>
            </motion.label>
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-700 ml-1">Recurso Pretendido</label>
              <select name="recurso" value={formData.recurso} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-600 bg-white">
                <option>Abrir novo protocolo</option>
                <option>Ouvidoria</option>
                <option>Aneel</option>
                <option>Judicializar</option>
                <option>Todas as opções</option>
              </select>
            </div>
          </div>
        </section>

        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: '#15803d' }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-6 bg-green-600 text-white font-black text-xl rounded-3xl shadow-2xl shadow-green-200 transition-all duration-200 disabled:opacity-50 border-b-8 border-green-800"
        >
          {loading ? 'Processando Chamado...' : 'REGISTRAR TICKET ✦'}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default TicketForm;
