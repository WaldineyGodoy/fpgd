import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Sun, Search, LayoutDashboard, Edit, Trash2, MapPin, Eye, Loader2 } from 'lucide-react';
import Notification, { NotificationType } from '../components/Notification';
import CustomModal from '../components/CustomModal';

interface Usina {
  id: string;
  nome: string;
  nome_cliente: string | null;
  endereco: string;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  potencia_usina: number;
  geracao_media_anual: number;
  created_at: string;
  companies: {
    nome_fantasia: string | null;
    razao_social: string | null;
  } | null;
}

const UsinasList: React.FC = () => {
  const navigate = useNavigate();
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  // States for Modal and Notifications
  const [modalConfig, setModalConfig] = useState<{ show: boolean; id?: string }>({ show: false });
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchUsinas();
  }, []);

  const fetchUsinas = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: companyData } = await supabase
        .from('companies')
        .select('user_type, id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      if (companyData) setUserRole(companyData.user_type);

      const { data, error } = await supabase
        .from('usinas')
        .select(`
          *,
          companies!usinas_company_id_fkey (
            nome_fantasia,
            razao_social
          )
        `)
        .order('nome');

      if (error) throw error;
      if (data) setUsinas(data as any);
    } catch (err) {
      console.error('Erro ao buscar usinas:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!modalConfig.id) return;
    
    setModalConfig({ show: false });
    setLoading(true);
    
    try {
      const { error } = await supabase.from('usinas').delete().eq('id', modalConfig.id);
      if (error) throw error;
      
      setUsinas(usinas.filter(u => u.id !== modalConfig.id));
      
      setNotification({
        show: true,
        type: 'success',
        title: 'Excluído com Sucesso!',
        message: 'A unidade e todos os seus vínculos foram removidos.'
      });
    } catch (err: any) {
      console.error('Erro ao deletar usina:', err);
      setNotification({
        show: true,
        type: 'error',
        title: 'Erro na Exclusão',
        message: err.message || 'Não foi possível excluir a unidade no momento.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setModalConfig({ show: true, id });
  };

  const filteredUsinas = usinas.filter(u => 
    u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.companies?.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
        <div>
            <h1 className="text-3xl font-black text-[#262727] flex items-center gap-3 tracking-tighter uppercase">
              <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Sun className="w-8 h-8 text-[#198754]" />
              </div>
              Minhas <span className="text-[#198754]">Unidades</span>
            </h1>
          <p className="text-slate-400 font-black text-xs mt-1 uppercase tracking-[0.3em] pl-14">
            Gestão de Ativos Solares fpgd
          </p>
        </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/usinas/nova')}
          className="bg-[#198754] text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-green-900/10 transition-all hover:bg-[#157347] uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" strokeWidth={3} /> Adicionar Unidade
        </motion.button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-black text-slate-800">Lista de Unidades</h2>
             <span className="bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full text-sm">
               {filteredUsinas.length}
             </span>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, endereço ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-600 placeholder:text-slate-400 focus:ring-4 focus:ring-[#198754]/10 focus:border-[#198754]/20 transition-all outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#198754] rounded-full animate-spin shadow-sm" />
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Buscando usinas...</p>
          </div>
        ) : filteredUsinas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">
            Nenhuma unidade encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Nome da Unidade</th>
                  {userRole !== 'cliente' && <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Cliente</th>}
                  <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Endereço</th>
                  <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Potência / Consumo</th>
                  <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsinas.map((usina) => (
                  <tr key={usina.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-8">
                      <div className="font-bold text-slate-800">{usina.nome}</div>
                      <div className="text-xs font-bold text-slate-400">ID: {usina.id.substring(0,8)}</div>
                    </td>
                    {userRole !== 'cliente' && (
                      <td className="py-4 px-8">
                        <span className="font-bold text-slate-600">
                          {usina.nome_cliente || usina.companies?.nome_fantasia || usina.companies?.razao_social || 'N/A'}
                        </span>
                      </td>
                    )}
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate max-w-[250px]">
                          {usina.endereco ? (
                            `${usina.endereco}${usina.bairro ? ', ' + usina.bairro : ''} - ${usina.municipio || ''}/${usina.uf || ''}`
                          ) : (
                            'Não preenchido'
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-8">
                      <span className="font-black text-slate-700">{usina.potencia_usina ? `${usina.potencia_usina} kWp` : '-'}</span>
                    </td>
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => navigate(`/usinas/${usina.id}/detalhes`)} className="p-2 bg-green-50 text-[#198754] rounded-lg hover:bg-green-100 transition-colors" title="Detalhes">
                            <Eye className="w-4 h-4" />
                          </button>
                        <button onClick={() => navigate(`/usinas/${usina.id}/editar`)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(usina.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomModal
        show={modalConfig.show}
        type="danger"
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta unidade? Esta ação é irreversível e removerá todos os tickets associados."
        confirmLabel="Excluir Unidade"
        cancelLabel="Vou pensar melhor"
        onConfirm={confirmDelete}
        onCancel={() => setModalConfig({ show: false })}
      />

      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={() => setNotification(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default UsinasList;
