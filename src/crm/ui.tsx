import React, { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import type { StatusAssociado, Contrato } from './data';
import { statusLabel } from './data';

export const STATUS_COLOR: Record<StatusAssociado, string> = {
  inscrito: 'text-st-inscrito',
  ativo: 'text-st-ativo',
  inadimplente: 'text-st-inadimplente',
  inativo: 'text-st-inativo',
  cancelado: 'text-st-cancelado',
};
export const STATUS_BG: Record<StatusAssociado, string> = {
  inscrito: 'bg-st-inscrito',
  ativo: 'bg-st-ativo',
  inadimplente: 'bg-st-inadimplente',
  inativo: 'bg-st-inativo',
  cancelado: 'bg-st-cancelado',
};

export const StatusChip: React.FC<{ status: StatusAssociado }> = ({ status }) => (
  <span className={`chip ${STATUS_COLOR[status]}`}>
    <span className={`size-1.5 rounded-full ${STATUS_BG[status]}`} />
    {statusLabel(status)}
  </span>
);

const CONTRATO_META: Record<Contrato['status'], { label: string; cls: string }> = {
  rascunho: { label: 'Contrato em rascunho', cls: 'text-fg-3' },
  enviado: { label: 'Aguardando assinatura', cls: 'text-st-inadimplente' },
  assinado: { label: 'Contrato assinado', cls: 'text-st-ativo' },
  recusado: { label: 'Contrato recusado', cls: 'text-st-cancelado' },
  cancelado: { label: 'Contrato cancelado', cls: 'text-fg-3' },
};
export const contratoMeta = (s: Contrato['status']) => CONTRATO_META[s];

export const PageHeader: React.FC<{ title: string; description?: string; actions?: React.ReactNode }> = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
      {description && <p className="mt-1 text-sm text-fg-2 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

// ---------- Toasts ----------
interface Toast { id: number; kind: 'ok' | 'error'; text: string }
const ToastCtx = createContext<(kind: Toast['kind'], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 4000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 w-[min(380px,calc(100vw-2rem))]" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="panel flex items-start gap-3 p-3.5 pr-2 shadow-[0_12px_32px_-8px_rgb(0_0_0/.6)] animate-[toast-in_.2s_cubic-bezier(.23,1,.32,1)]">
            {t.kind === 'ok'
              ? <CheckCircle2 size={18} className="text-ok shrink-0 mt-0.5" />
              : <AlertTriangle size={18} className="text-danger shrink-0 mt-0.5" />}
            <p className="text-sm text-fg flex-1">{t.text}</p>
            <button className="text-fg-3 hover:text-fg p-1" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} aria-label="Fechar aviso"><X size={14} /></button>
          </div>
        ))}
      </div>
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </ToastCtx.Provider>
  );
};

export const Field: React.FC<{ label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ label, hint, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="label">{label}</span>
    {children}
    {hint && <span className="block mt-1.5 text-xs text-fg-3">{hint}</span>}
  </label>
);
