import React from 'react';
import { X } from 'lucide-react';

/** Moldura dos modais do CRM: folha lateral à direita sobre véu de 70%. */
const Sheet: React.FC<{
  title: string;
  subtitle?: React.ReactNode;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  aside?: React.ReactNode;
}> = ({ title, subtitle, onClose, panelRef, children, aside }) => (
  <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
    <div className="absolute inset-0 bg-[rgb(3_5_10/.7)] animate-[fade_.15s_ease-out]" onClick={onClose} />
    <div ref={panelRef} tabIndex={-1}
      className="relative w-full max-w-[760px] h-full bg-panel border-l border-line flex flex-col outline-none animate-[sheet_.24s_cubic-bezier(.23,1,.32,1)]">
      <header className="glow-corner px-6 pt-5 pb-4 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold tracking-tight truncate">{title}</h2>
          {subtitle && <div className="mt-2 text-xs text-fg-3">{subtitle}</div>}
        </div>
        {aside}
        <button className="btn btn-ghost !px-2 -mr-2" onClick={onClose} aria-label="Fechar"><X size={20} /></button>
      </header>
      {children}
    </div>
    <style>{`@keyframes sheet{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}@keyframes fade{from{opacity:0}}`}</style>
  </div>
);

export default Sheet;

/** Abas do modal: texto 600, barra de energia de 3px sob a ativa. */
export function SheetTabs<T extends string>({ tabs, value, onChange }: {
  tabs: { id: T; label: string; icon: React.ElementType; disabled?: boolean }[];
  value: T;
  onChange: (t: T) => void;
}) {
  return (
    <div className="px-6 border-b border-line flex gap-1 overflow-x-auto overflow-y-hidden" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} disabled={t.disabled} onClick={() => onChange(t.id)}
          className={`relative h-11 px-3 inline-flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${value === t.id ? 'text-fg' : 'text-fg-3 hover:text-fg-2'}`}>
          <t.icon size={15} /> {t.label}
          {value === t.id && <span className="absolute left-2 right-2 -bottom-px h-[3px] rounded-full bg-energy" />}
        </button>
      ))}
    </div>
  );
}

/** Trava rolagem do corpo, foca o painel e fecha com Esc. */
export function useSheetBehavior(panelRef: React.RefObject<HTMLDivElement | null>, onClose: () => void) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose, panelRef]);
}
