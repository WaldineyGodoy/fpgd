import React from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { nomeMarca, type Tenant } from './useTenant';

/** Cabeçalho das telas do CRM do associado: marca do associado (white label) + título da página. */
const TenantHeader: React.FC<{ tenant: Tenant; title: string; description?: string; actions?: React.ReactNode; compact?: boolean }> = ({ tenant, title, description, actions, compact }) => (
  <>
    {tenant.suporte && (
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-st-inadimplente/40 bg-st-inadimplente/10 px-4 py-2.5 text-sm">
        <LifeBuoy size={16} className="text-st-inadimplente shrink-0" />
        <span className="flex-1 min-w-0">Modo suporte: você está no CRM de <b>{nomeMarca(tenant)}</b> como superadmin.</span>
        <Link to="/crm" className="text-primary hover:underline whitespace-nowrap">Voltar aos associados</Link>
      </div>
    )}
    {!compact && <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 mb-2 min-h-7">
          {!tenant.empresa && !tenant.marca.nome_exibicao ? <span className="skeleton h-5 w-40" /> : tenant.marca.logo_url
            ? <img src={tenant.marca.logo_url} alt={nomeMarca(tenant)} className="h-7 max-w-[160px] object-contain" />
            : <span className="size-7 rounded-[8px] bg-raised border border-line grid place-items-center text-xs font-bold text-fg-2">{nomeMarca(tenant).slice(0, 1).toUpperCase()}</span>}
          {(tenant.empresa || tenant.marca.nome_exibicao) && !tenant.marca.logo_url && <span className="text-sm font-semibold text-fg-2 truncate">{nomeMarca(tenant)}</span>}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-2 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>}
  </>
);

export default TenantHeader;
