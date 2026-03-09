
import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Calendar } from 'lucide-react';

interface HeroProps {
  onAgendamentoClick: () => void;
  onAdesaoClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onAgendamentoClick, onAdesaoClick }) => {
  return (
    <section id="home" className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-white">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-20">
        <div className="w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] animate-pulse"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-blue-600" />
              <span>Fortalecendo o Setor Renovável no RN fpgd</span>
            </div>
            <h1 className="text-5xl tracking-tighter font-black text-slate-800 sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl mb-8 leading-[0.9] uppercase">
              A união que gera <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Energia e Representação.</span>
            </h1>
            <p className="text-lg text-slate-500 sm:text-xl lg:text-lg xl:text-xl mb-12 leading-relaxed font-medium max-w-xl">
              Frente Potiguar de Geração Distribuída (FPGD RN). Defendendo os interesses de empresas e trabalhadores perante a Cosern.
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onAgendamentoClick}
                className="inline-flex items-center justify-center px-10 py-5 border-2 border-slate-100 text-sm font-black uppercase tracking-widest rounded-2xl text-slate-500 bg-white hover:bg-slate-50 shadow-xl shadow-slate-200 transition-all md:text-base group"
              >
                Agendamento Cosern
                <Calendar className="ml-3 w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
              <a
                href="/#/reclame"
                className="inline-flex items-center justify-center px-10 py-5 border-2 border-red-500 text-sm font-black uppercase tracking-widest rounded-2xl text-white bg-red-600 hover:bg-red-700 shadow-2xl shadow-red-200 transition-all md:text-base group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Reclame AGORA
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/#/login"
                className="inline-flex items-center justify-center px-10 py-5 border-2 border-blue-500 text-sm font-black uppercase tracking-widest rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-blue-500 shadow-2xl shadow-blue-200 transition-all md:text-base"
              >
                Acessar Login
                <ShieldCheck className="ml-3 w-5 h-5" />
              </a>
            </div>
            
            <div className="mt-10 flex items-center justify-center lg:justify-start space-x-6 text-slate-400">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <span className="text-xs font-black uppercase tracking-widest">Sem Fins Lucrativos</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-widest">Energias Limpas</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 lg:mt-0 lg:col-span-5 relative">
            <div className="relative mx-auto w-full aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-[3rem] shadow-[0_48px_80px_-16px_rgba(30,64,175,0.25)] overflow-hidden group border-[12px] border-white ring-1 ring-slate-100">
              <img
                src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Instalação de painéis solares"
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-10 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-3">Impacto RN fpgd</p>
                <h3 className="text-3xl font-black leading-tight tracking-tighter uppercase">Crescimento <br/>sustentável e justo.</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
