import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Sun, Search, LayoutDashboard, Edit, Trash2, MapPin, Eye } from 'lucide-react';

interface Usina {
  id: string;
  nome: string;
  endereco: string;
  potencia_usina: number;
  geracao_media_anual: number;
  created_at: string;
  companies: {
    nome_fantasia: string | null;
  } | null;
}

const UsinasList: React.FC = () => {
  const navigate = useNavigate();
  const [usinas, setUsinas] = useState<Usina[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

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
        .select(`*, companies(nome_fantasia)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setUsinas(data as any);
    } catch (err) {
      console.error('Erro ao buscar usinas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta usina?')) return;
    
    try {
      const { error } = await supabase.from('usinas').delete().eq('id', id);
      if (error) throw error;
      setUsinas(usinas.filter(u => u.id !== id));
    } catch (err) {
      console.error('Erro ao deletar usina:', err);
      alert('Erro ao excluir a usina.');
    }
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
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-2xl">
              <Sun className="w-8 h-8 text-green-600" />
            </div>
            Minhas <span className="text-green-600">Usinas</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest pl-14">
            Gestão de Ativos Solares
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/usinas/nova')}
          className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-green-100 ring-4 ring-green-50 transition-all hover:bg-green-700"
        >
          <Plus className="w-5 h-5" /> Adicionar Usina
        </motion.button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <h2 className="text-xl font-black text-slate-800">Lista de Usinas</h2>
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
              className="w-full bg-slate-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-600 placeholder:text-slate-400 focus:ring-4 focus:ring-green-50 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
          </div>
        ) : filteredUsinas.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">
            Nenhuma usina encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Nome da Usina</th>
                  {userRole !== 'cliente' && <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Cliente</th>}
                  <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Endereço</th>
                  <th className="py-4 px-8 text-xs font-black text-slate-400 uppercase tracking-wider">Potência</th>
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
                        <span className="font-bold text-slate-600">{usina.companies?.nome_fantasia || 'N/A'}</span>
                      </td>
                    )}
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate max-w-[200px]">{usina.endereco || 'Não preenchido'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-8">
                      <span className="font-black text-slate-700">{usina.potencia_usina ? `${usina.potencia_usina} kWp` : '-'}</span>
                    </td>
                    <td className="py-4 px-8">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => navigate(`/usinas/${usina.id}/detalhes`)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Detalhes">
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
    </div>
  );
};

export default UsinasList;
