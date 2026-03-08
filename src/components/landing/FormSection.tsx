
import React from 'react';
import { Mail, CheckCircle2, X } from 'lucide-react';

interface FormSectionProps {
  onClose: () => void;
}

const FormSection: React.FC<FormSectionProps> = ({ onClose }) => {
  // Para Adesão, vamos direto para a página de cadastro (/cadastro)
  const registrationUrl = '/#/cadastro';

  return (
    <section id="adesao" className="py-24 bg-slate-50 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-12">
          <div className="text-left">
            <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase mb-3">Seja um Membro</h2>
            <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Ficha de <span className="text-green-600">Cadastro FPGD RN</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            title="Fechar formulário"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-8 w-full">
            <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 relative p-2 sm:p-4">
              <div className="relative w-full overflow-hidden pt-[140%] md:pt-[110%] bg-transparent">
                <iframe 
                  src={registrationUrl} 
                  title="Cadastro Direto FPGD"
                  loading="lazy"
                  className="absolute top-0 left-0 w-full h-full border-none rounded-lg"
                >
                  Carregando ficha de adesão…
                </iframe>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-green-600 p-8 rounded-[2rem] text-white shadow-xl shadow-green-600/20">
              <h4 className="text-xl font-bold mb-4 flex items-center">
                <CheckCircle2 className="w-6 h-6 mr-2" />
                Vantagens da Adesão
              </h4>
              <ul className="space-y-4 text-emerald-50 text-sm">
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Acesso prioritário a agendamentos com a Cosern.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Recebimento de informativos técnicos e jurídicos.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Participação no grupo exclusivo de WhatsApp.</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2">•</span>
                  <span>Certificado de empresa apoiadora do setor renovável.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-slate-100 p-3 rounded-xl">
                  <Mail className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900">Suporte Técnico</h5>
                  <p className="text-xs text-slate-500">Dificuldades no cadastro?</p>
                </div>
              </div>
              <a 
                href="mailto:fpgd.rn@gmail.com" 
                className="block w-full text-center py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                fpgd.rn@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormSection;
