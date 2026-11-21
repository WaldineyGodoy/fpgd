import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useSession } from '../components/AppLayout';
import { tenantFn } from './data';

export interface Marca { nome_exibicao?: string; logo_url?: string; site?: string; assinatura_email?: string }
export interface Tenant {
  companyId: string | null;
  /** Superadmin operando o CRM de um associado (manutenção). */
  suporte: boolean;
  empresa: { nome: string; cnpj: string | null; cidade: string | null; uf: string | null } | null;
  marca: Marca;
  /** Sufixo para manter o ?t= nos links quando é o superadmin em manutenção. */
  qs: string;
}

const cache = new Map<string, { empresa: Tenant['empresa']; marca: Marca }>();

/** Resolve de quem é o CRM aberto: o próprio associado, ou ?t=<id> quando é o superadmin. */
export function useTenant(): Tenant & { loading: boolean; reloadMarca: () => void } {
  const s = useSession();
  const [params] = useSearchParams();
  const t = params.get('t');
  const suporte = s.role === 'superadmin' && !!t;
  const companyId = suporte ? t : s.crmHabilitado ? s.companyId : null;
  const [info, setInfo] = useState(() => (companyId ? cache.get(companyId) : undefined));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!companyId) return;
    let alive = true;
    (async () => {
      const [{ data: c }, cfg] = await Promise.all([
        supabase.from('companies').select('nome_fantasia, razao_social, cnpj, municipio, uf').eq('id', companyId).maybeSingle(),
        tenantFn<Record<string, any>>(companyId, 'config_get').catch(() => ({} as Record<string, any>)),
      ]);
      const next = {
        empresa: c ? { nome: c.nome_fantasia || c.razao_social || 'Associado', cnpj: c.cnpj, cidade: c.municipio, uf: c.uf } : null,
        marca: (cfg.marca || {}) as Marca,
      };
      cache.set(companyId, next);
      if (alive) setInfo(next);
    })();
    return () => { alive = false; };
  }, [companyId, tick]);

  return {
    companyId,
    suporte,
    empresa: info?.empresa ?? null,
    marca: info?.marca ?? {},
    qs: suporte ? `?t=${t}` : '',
    loading: !!companyId && !info,
    reloadMarca: () => { if (companyId) cache.delete(companyId); setTick((x) => x + 1); },
  };
}

export const nomeMarca = (t: Pick<Tenant, 'marca' | 'empresa'>) => t.marca.nome_exibicao || t.empresa?.nome || 'Minha empresa';
