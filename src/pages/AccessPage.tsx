import React from 'react';
import { ArrowRight, Search, UserPlus } from 'lucide-react';

/**
 * Consulta de habilitação para o agendamento Cosern. Também é exibida dentro do iframe
 * da seção de agendamento da home, por isso os links abrem na janela principal (_top).
 */
const embedded = typeof window !== 'undefined' && window.self !== window.top;

const AccessPage: React.FC = () => (
  <div className={`w-full max-w-[480px] ${embedded ? 'p-2' : 'panel glow-corner p-7 sm:p-9'}`}>
    <header>
      <Search size={24} className="text-cyan" />
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Consulta FPGD</h1>
      <p className="mt-1.5 text-sm text-fg-2">
        Para consultar sua situação ou fazer um novo agendamento, entre com a conta da sua empresa.
      </p>
    </header>

    <a href="#/login" target="_top" className="btn btn-primary w-full !h-12 mt-7">
      Ir para a área de acesso <ArrowRight size={16} />
    </a>

    <div className="my-6 flex items-center gap-3 text-xs text-fg-3">
      <span className="h-px flex-1 bg-line" /> ainda não tem cadastro? <span className="h-px flex-1 bg-line" />
    </div>

    <a href="#/cadastro" target="_top" className="btn btn-secondary w-full !h-12">
      <UserPlus size={16} /> Cadastrar minha empresa
    </a>
  </div>
);

export default AccessPage;
