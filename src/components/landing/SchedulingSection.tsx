import React from 'react';
import { Info, X } from 'lucide-react';

interface SchedulingSectionProps {
  onClose: () => void;
}

const PASSOS = [
  'Entre com a conta da sua empresa.',
  'Consulte sua situação ou peça o agendamento.',
  'Sem cadastro? Cadastre a empresa pelo CNPJ.',
];

const SchedulingSection: React.FC<SchedulingSectionProps> = ({ onClose }) => {
  // O fluxo principal começa na página de consulta/acesso
  const accessUrl = '/#/consulta_cadastro';

  return (
    <section id="agendamento-cosern" className="scroll-mt-24 panel p-5 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Agendamento Cosern</h2>
          <p className="mt-1 text-sm text-fg-2">O agendamento presencial está suspenso pela distribuidora. A consulta abaixo continua disponível.</p>
        </div>
        <button onClick={onClose} className="btn btn-ghost !px-2 -mr-2" aria-label="Fechar agendamento"><X size={20} /></button>
      </div>

      <ol className="mt-6 grid md:grid-cols-3 gap-3">
        {PASSOS.map((p, i) => (
          <li key={p} className="flex items-center gap-3 rounded-[10px] bg-raised border border-line p-3.5 text-sm text-fg-2">
            <span className="size-7 shrink-0 rounded-full bg-field border border-line-strong grid place-items-center text-xs font-bold text-fg tabular-nums">{i + 1}</span>
            {p}
          </li>
        ))}
      </ol>

      <div className="relative mt-2 w-full h-[400px] overflow-hidden">
        <iframe src={accessUrl} title="Acesso ao agendamento FPGD" scrolling="no" className="absolute inset-0 size-full border-none">
          Carregando portal de acesso…
        </iframe>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-fg-3">
        <Info size={14} /> O sistema verifica automaticamente se o CNPJ já está cadastrado.
      </p>
    </section>
  );
};

export default SchedulingSection;
