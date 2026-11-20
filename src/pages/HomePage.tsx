import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import About from '../components/landing/About';
import Commission from '../components/landing/Commission';
import DemandsPDF from '../components/landing/DemandsPDF';
import Join from '../components/landing/Join';
import Footer from '../components/landing/Footer';
import SchedulingSection from '../components/landing/SchedulingSection';
import { useTicketsEnabled } from '../crm/settings';

const readAviso = () => { try { return sessionStorage.getItem('fpgd.aviso') !== 'fechado'; } catch { return true; } };

const HomePage: React.FC = () => {
  const [aviso, setAviso] = useState(readAviso);
  const [agendamento, setAgendamento] = useState(false);
  const tickets = useTicketsEnabled() === true;

  const fecharAviso = () => {
    setAviso(false);
    try { sessionStorage.setItem('fpgd.aviso', 'fechado'); } catch { /* sem storage */ }
  };

  const abrirAgendamento = () => {
    setAgendamento(true);
    setTimeout(() => document.getElementById('agendamento-cosern')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  return (
    <div id="top" className="min-h-screen bg-bg text-fg overflow-x-clip">
      {aviso && tickets && (
        <div className="relative z-[60] bg-[#2A1416] border-b border-[#5C2A2F] text-sm">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-2.5 flex items-center gap-3">
            <AlertTriangle size={16} className="text-[#FF8B95] shrink-0" />
            <p className="flex-1 text-[#FFD9DC]">
              <b>Protocolo sem solução na Cosern?</b>{' '}
              <span className="hidden sm:inline">O painel de monitoramento da Frente reúne as reclamações e cobra resposta.</span>{' '}
              <a href="#/reclame" className="font-bold underline underline-offset-2 inline-flex items-center gap-1 whitespace-nowrap">Reclamar agora <ArrowRight size={14} /></a>
            </p>
            <button onClick={fecharAviso} className="p-1 text-[#FFB3B9] hover:text-white" aria-label="Fechar aviso"><X size={16} /></button>
          </div>
        </div>
      )}
      <Header tickets={tickets} />
      <main>
        <Hero tickets={tickets} />
        <About />
        <Commission />
        <DemandsPDF />
        <Join />
        {agendamento && (
          <div className="legacy max-w-[1280px] mx-auto px-5 md:px-8 mt-10">
            <SchedulingSection onClose={() => setAgendamento(false)} />
          </div>
        )}
      </main>
      <Footer onAgendamento={abrirAgendamento} tickets={tickets} />
    </div>
  );
};

export default HomePage;
