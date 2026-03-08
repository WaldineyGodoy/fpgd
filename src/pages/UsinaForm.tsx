import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Zap, Settings, MapPin, Hash, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const UsinaForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(isEditing);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    cpf_cnpj: '',
    endereco: '',
    potencia_usina: '',
    qtd_paineis: '',
    potencia_paineis: '',
    qtd_inversor: '',
    potencia_inversor: '',
    ug: '',
    ucs: '',
    geracao_media_anual: '',
  });

  useEffect(() => {
    const init = async () => {
      // 1. Get current auth user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // 2. Get user's company (for company_id reference)
      const { data: company } = await supabase
        .from('companies')
        .select('id, user_type')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (company) setCompanyId(company.id);

      // 3. Load existing data if editing
      if (isEditing && id) {
        setInitialFetch(true);
        const { data, error } = await supabase
          .from('usinas')
          .select('*')
          .eq('id', id)
          .single();

        if (data) {
          setFormData({
            nome: data.nome || '',
            cpf_cnpj: data.cpf_cnpj || '',
            endereco: data.endereco || '',
            potencia_usina: data.potencia_usina?.toString() || '',
            qtd_paineis: data.qtd_paineis?.toString() || '',
            potencia_paineis: data.potencia_paineis?.toString() || '',
            qtd_inversor: data.qtd_inversor?.toString() || '',
            potencia_inversor: data.potencia_inversor?.toString() || '',
            ug: data.ug || '',
            ucs: data.ucs ? data.ucs.join(', ') : '',
            geracao_media_anual: data.geracao_media_anual?.toString() || '',
          });
        }
        setInitialFetch(false);
      }
    };
    init();
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return alert('Autenticação inválida ou empresa não encontrada.');
    setLoading(true);

    try {
      const payload = {
        nome: formData.nome,
        cpf_cnpj: formData.cpf_cnpj,
        endereco: formData.endereco,
        potencia_usina: formData.potencia_usina ? parseFloat(formData.potencia_usina) : null,
        qtd_paineis: formData.qtd_paineis ? parseInt(formData.qtd_paineis, 10) : null,
        potencia_paineis: formData.potencia_paineis ? parseFloat(formData.potencia_paineis) : null,
        qtd_inversor: formData.qtd_inversor ? parseInt(formData.qtd_inversor, 10) : null,
        potencia_inversor: formData.potencia_inversor ? parseFloat(formData.potencia_inversor) : null,
        ug: formData.ug,
        ucs: formData.ucs ? formData.ucs.split(',').map(s => s.trim()).filter(Boolean) : [],
        geracao_media_anual: formData.geracao_media_anual ? parseFloat(formData.geracao_media_anual) : null,
      };

      if (isEditing && id) {
        const { error } = await supabase.from('usinas').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('usinas').insert({ ...payload, company_id: companyId });
        if (error) throw error;
      }

      navigate('/usinas', { replace: true });
    } catch (err: any) {
      console.error('Erro ao salvar usina:', err);
      alert('Erro ao salvar usina: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (initialFetch) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/usinas')}
          className="p-3 bg-white rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {isEditing ? 'Editar Usina' : 'Nova Usina'}
          </h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Preencha as informações do sistema solar
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        {/* Sessão: Informações Gerais */}
        <section>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-green-600" /> Identificação
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Nome da Usina</label>
              <input 
                required
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-green-50 outline-none" 
                placeholder="Ex Ex: Casa de Praia"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">CPF/CNPJ do Titular</label>
              <input 
                name="cpf_cnpj"
                value={formData.cpf_cnpj}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-green-50 outline-none" 
                placeholder="000.000.000-00"
              />
            </div>
          </div>
        </section>

        {/* Sessão: Localização */}
        <section>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-500" /> Localização e Unidades
          </h2>
          <div className="grid grid-cols-1 gap-6">
             <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Endereço de Instalação</label>
              <input 
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-blue-50 outline-none" 
                placeholder="Rua Exemplo, 123 - Cidade/UF"
              />
            </div>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
             <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Unidade Geradora (UG)</label>
              <input 
                name="ug"
                value={formData.ug}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-blue-50 outline-none" 
                placeholder="Nº Contrato UG"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Unidades Consumidoras (UCs)</label>
              <input 
                name="ucs"
                value={formData.ucs}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-blue-50 outline-none" 
                placeholder="Separe por vírgulas (Ex: 1234, 5678)"
              />
            </div>
          </div>
        </section>

        {/* Sessão: Dados Técnicos */}
        <section>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-amber-500" /> Dados Técnicos (Potência)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Potência Usina (kWp)</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.01"
                  name="potencia_usina"
                  value={formData.potencia_usina}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-amber-50 outline-none" 
                />
                <Hash className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
             <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Geração Média (kWh/ano)</label>
               <div className="relative">
                <input 
                  type="number"
                  step="0.01"
                  name="geracao_media_anual"
                  value={formData.geracao_media_anual}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold text-slate-600 focus:ring-4 focus:ring-amber-50 outline-none" 
                />
                <Hash className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
             <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Qtd de Painéis</label>
              <input 
                type="number"
                name="qtd_paineis"
                value={formData.qtd_paineis}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Potência Painel (W)</label>
              <input 
                type="number"
                step="0.1"
                name="potencia_paineis"
                value={formData.potencia_paineis}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Qtd Inversores</label>
              <input 
                type="number"
                name="qtd_inversor"
                value={formData.qtd_inversor}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Potência Inversor (kW)</label>
              <input 
                type="number"
                step="0.1"
                name="potencia_inversor"
                value={formData.potencia_inversor}
                onChange={handleChange}
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-600" 
              />
            </div>
          </div>
        </section>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={() => navigate('/usinas')}
            className="px-6 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
          >
            Cancelar
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-green-100 ring-4 ring-green-50 transition-all hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Salvar Usina
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default UsinaForm;
