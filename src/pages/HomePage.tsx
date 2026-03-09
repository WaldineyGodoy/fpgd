
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import About from '../components/landing/About';
import Commission from '../components/landing/Commission';
import SchedulingSection from '../components/landing/SchedulingSection';
import FormSection from '../components/landing/FormSection';
import Footer from '../components/landing/Footer';
import DemandsPDF from '../components/landing/DemandsPDF';

const HomePage: React.FC = () => {
  const [showScheduling, setShowScheduling] = useState(false);
  const [showAdesao, setShowAdesao] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const openScheduling = () => {
    setShowScheduling(true);
    setShowAdesao(false); 
    setTimeout(() => {
      const element = document.getElementById('agendamento-cosern');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const openAdesao = () => {
    setShowAdesao(true);
    setShowScheduling(false);
    setTimeout(() => {
      const element = document.getElementById('adesao');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const closeScheduling = () => setShowScheduling(false);
  const closeAdesao = () => setShowAdesao(false);

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white">
      <Header 
        onAgendamentoClick={openScheduling} 
        onAdesaoClick={openAdesao} 
      />
      <main className="flex-grow">
        <Hero 
          onAgendamentoClick={openScheduling} 
          onAdesaoClick={openAdesao} 
        />
        
        {/* Seção de Agendamento - Oculta por padrão */}
        {showScheduling && (
          <SchedulingSection onClose={closeScheduling} />
        )}

        <About />
        <Commission />
        
        <DemandsPDF />

        {/* Seção de Adesão - Oculta por padrão */}
        {showAdesao && (
          <FormSection onClose={closeAdesao} />
        )}
      </main>
      <Footer />

      {/* Modal de Notificação */}
      {showNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(220,38,38,0.3)] max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="bg-gradient-to-br from-red-600 to-rose-700 p-10 flex flex-col items-center text-white relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-[100px]" />
              <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl backdrop-blur-md">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-center leading-none tracking-tighter uppercase">Painel de <br/>Monitoramento</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4 opacity-70">Aviso Prioritário fpgd</p>
            </div>
            
            <div className="p-10">
              <p className="text-slate-500 text-lg text-center leading-relaxed mb-10 font-medium">
                Um portal dedicado para monitorar reclamações e resoluções de protocolos sem solução na concessionária foi estabelecido. 
                <span className="block mt-6 font-black text-slate-800 uppercase tracking-tighter text-2xl">
                  Protocolo sem solução?
                </span>
              </p>
              
              <div className="flex flex-col space-y-4">
                <motion.a
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  href="/#/reclame"
                  className="w-full py-6 px-6 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-black text-center shadow-2xl shadow-red-200 uppercase tracking-widest text-lg border-b-4 border-red-800"
                >
                  RECLAMAR AGORA ✦
                </motion.a>
                <button
                  onClick={() => setShowNotification(false)}
                  className="w-full py-4 px-6 bg-slate-50 text-slate-400 rounded-2xl font-black text-center hover:bg-slate-100 transition-colors uppercase tracking-[0.2em] text-xs"
                >
                  Continuar para o Site
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
