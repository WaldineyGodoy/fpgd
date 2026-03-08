
import React, { useState } from 'react';
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-red-600 p-6 flex flex-col items-center text-white">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-center leading-tight">Painel de Monitoramento</h3>
            </div>
            
            <div className="p-8">
              <p className="text-slate-600 text-lg text-center leading-relaxed mb-8">
                Um painel de monitoramento de reclamações e resoluções de protocolos abertos na concessionária foi criado. 
                <span className="block mt-4 font-semibold text-slate-800">
                  Se você tem um protocolo aberto sem solução, 
                  <a href="/#/reclame" className="text-red-600 hover:underline ml-1">Reclame Aqui.</a>
                </span>
              </p>
              
              <div className="flex flex-col space-y-3">
                <a
                  href="/#/reclame"
                  className="w-full py-4 px-6 bg-red-600 text-white rounded-xl font-bold text-center hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  RECLAMAR AGORA
                </a>
                <button
                  onClick={() => setShowNotification(false)}
                  className="w-full py-3 px-6 bg-slate-100 text-slate-600 rounded-xl font-semibold text-center hover:bg-slate-200 transition-colors"
                >
                  Fechar
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
