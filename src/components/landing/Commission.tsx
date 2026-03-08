
import React from 'react';
import { FileCheck, MessageSquare, Scale, HelpCircle } from 'lucide-react';

const Commission: React.FC = () => {
  const demands = [
    {
      title: 'Agilidade em Pareceres',
      description: 'Redução dos prazos de análise e liberação de projetos de Geração Distribuída.',
      icon: <FileCheck className="w-5 h-5" />,
    },
    {
      title: 'Canal Direto com Cosern',
      description: 'Estabelecimento de um diálogo técnico e fluido para resolução de impasses normativos.',
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      title: 'Transparência nas Regras',
      description: 'Garantia de que as normas aplicadas pela distribuidora sigam rigorosamente a legislação da ANEEL.',
      icon: <Scale className="w-5 h-5" />,
    },
    {
      title: 'Defesa do Integrador',
      description: 'Apoio técnico e jurídico para empresas integradoras em casos de exigências indevidas.',
      icon: <HelpCircle className="w-5 h-5" />,
    },
  ];

  return (
    <section id="comissao" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:flex lg:items-center lg:gap-16">
          <div className="lg:w-1/2 mb-12 lg:mb-0">
            <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase mb-3">Objetivo Central</h2>
            <h3 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-6">
              Comissão de Representação Setorial <span className="text-green-600">Cosern</span>
            </h3>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              O momento exige união. Estamos formando uma comissão técnica e política para levar as demandas reais do mercado de energia solar do RN diretamente à mesa de decisão da Cosern (Neoenergia).
            </p>
            
            <div className="space-y-6">
              {demands.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                      {item.icon}
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-bold text-slate-900">{item.title}</h4>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-600/20 blur-3xl rounded-full"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-600/10 blur-3xl rounded-full"></div>
              
              <div className="relative z-10">
                <h4 className="text-2xl font-bold mb-6">Por que participar?</h4>
                <ul className="space-y-6">
                  <li className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-slate-900 font-bold text-xs">1</div>
                    <p className="text-slate-200">Influencie as políticas locais da distribuidora.</p>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-slate-900 font-bold text-xs">2</div>
                    <p className="text-slate-200">Acesso a informações privilegiadas sobre regulação.</p>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-slate-900 font-bold text-xs">3</div>
                    <p className="text-slate-200">Fortalecimento institucional da sua empresa.</p>
                  </li>
                  <li className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-slate-900 font-bold text-xs">4</div>
                    <p className="text-slate-200">Unificação da linguagem técnica do setor.</p>
                  </li>
                </ul>
                
                <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-sm italic text-slate-300">
                    "A fragmentação do setor é o que permite que dificuldades persistam. Unidos, somos um player impossível de ignorar."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Commission;
