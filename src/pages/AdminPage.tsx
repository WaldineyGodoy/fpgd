
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, Lock, Trash2, Edit2, Plus } from 'lucide-react';

const AdminPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de <span className="text-green-600">Acessos</span></h2>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Administração de Perfis e Permissões</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User List Table Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-700 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" /> Usuários Cadastrados
            </h3>
            <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-green-100">
              <Plus size={14} /> NOVO USUÁRIO
            </button>
          </div>
          
          <div className="p-8">
            <div className="flex flex-col gap-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <span className="block font-black text-slate-800">Superadmin Master</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acesso Irrestrito</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                  <button className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>

               <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <span className="block font-black text-slate-800">Mediador Comercial</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visão Geral dos Tickets</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                  <button className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Info Card */}
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-8 rounded-[2.5rem] shadow-2xl shadow-green-100 text-white flex flex-col justify-between">
          <div>
            <Lock className="w-12 h-12 mb-6 opacity-50" />
            <h3 className="text-3xl font-black mb-4 leading-tight italic">Segurança <br/> & Hierarquia</h3>
            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Superadmin</p>
                <p className="text-xs font-bold opacity-80 leading-relaxed italic">Controle total sobre faturamento, usuários e métricas globais.</p>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Mediador</p>
                <p className="text-xs font-bold opacity-80 leading-relaxed italic">Visualiza e interage com todos os tickets da rede.</p>
              </div>
            </div>
          </div>
          
          <div className="pt-8">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Governança FPGD © 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
