
import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Calendar } from 'lucide-react';

interface HeroProps {
  onAgendamentoClick: () => void;
  onAdesaoClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onAgendamentoClick, onAdesaoClick }) => {
  return (
    <section id="home" className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-white">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10">
        <div className="w-[500px] h-[500px] bg-green-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="w-3.5 h-3.5" />
              <span>Fortalecendo o Setor Renovável no RN</span>
            </div>
            <h1 className="text-4xl tracking-tight font-extrabold text-slate-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl mb-6 leading-[1.1]">
              A união que gera <br />
              <span className="text-green-500">Energia e Representação.</span>
            </h1>
            <p className="text-base text-slate-600 sm:text-xl lg:text-lg xl:text-xl mb-10 leading-relaxed">
              Frente Potiguar de Geração Distribuída (FPGD RN). Defendendo os interesses de empresas e trabalhadores perante a Cosern.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onAgendamentoClick}
                className="inline-flex items-center justify-center px-8 py-4 border border-slate-200 text-base font-bold rounded-xl text-slate-600 bg-white hover:bg-slate-50 shadow-sm transition-all md:text-lg group"
              >
                Agendamento Cosern Suspenso
                <Calendar className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <a
                href="/#/reclame"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-200 transition-all md:text-lg animate-pulse"
              >
                Reclame Cosern
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              <a
                href="/#/login"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-bold rounded-xl text-white bg-green-500 hover:bg-[#24b47e] shadow-xl shadow-green-500/20 transition-all md:text-lg"
              >
                Login
                <ShieldCheck className="ml-2 w-5 h-5" />
              </a>
            </div>
            
            <div className="mt-10 flex items-center justify-center lg:justify-start space-x-6 text-slate-400">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium">Sem Fins Lucrativos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium">Energias Limpas</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 lg:mt-0 lg:col-span-5 relative">
            <div className="relative mx-auto w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[2.5rem] shadow-2xl overflow-hidden group border-8 border-white">
              <img
                src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Instalação de painéis solares"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-green-500 mb-2">Impacto RN</p>
                <h3 className="text-2xl font-bold leading-tight">Crescimento sustentável e justo.</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
