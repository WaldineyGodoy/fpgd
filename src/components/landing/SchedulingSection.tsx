
import React from 'react';
import { Info, X } from 'lucide-react';

interface SchedulingSectionProps {
  onClose: () => void;
}

const SchedulingSection: React.FC<SchedulingSectionProps> = ({ onClose }) => {
  // O fluxo principal começa na página de consulta/acesso
  const accessUrl = '/#/consulta_cadastro';

  return (
    <section 
      id="agendamento-cosern" 
      className="py-16 bg-slate-50 border-y border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-8">
          <div className="text-left">
            <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase mb-2">Pautas Técnicas</h2>
            <p className="text-3xl font-extrabold text-slate-900">
              Agendamento <span className="text-green-600">Cosern</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            title="Fechar"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
          <div className="p-4 sm:p-8 bg-white flex flex-col">
            {/* Explicação do Fluxo */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">1</div>
                <p className="text-xs text-blue-900 font-medium leading-tight">Informe o CNPJ para validar o acesso.</p>
              </div>
              <div className="flex items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">2</div>
                <p className="text-xs text-emerald-900 font-medium leading-tight">Se encontrado, você será levado ao Agendamento.</p>
              </div>
              <div className="flex items-center p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">3</div>
                <p className="text-xs text-orange-900 font-medium leading-tight">Se não encontrado, iniciaremos seu Cadastro.</p>
              </div>
            </div>

            <div className="relative w-full min-h-[600px] overflow-hidden bg-slate-50 rounded-2xl border border-slate-100">
              <iframe 
                src={accessUrl} 
                title="Acesso ao Agendamento FPGD"
                loading="lazy"
                className="absolute top-0 left-0 w-full h-full border-none"
              >
                Carregando portal de acesso…
              </iframe>
            </div>
            
            <div className="mt-6 flex items-center justify-center text-slate-400 text-xs italic">
              <Info className="w-4 h-4 mr-2" />
              O sistema verifica automaticamente duplicidades no banco de dados Supabase.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SchedulingSection;
