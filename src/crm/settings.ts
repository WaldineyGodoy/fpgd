import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

/** Lê se o sistema de tickets está visível (app_settings.tickets.enabled). Padrão: oculto. */
let cache: boolean | null = null;
const listeners = new Set<(v: boolean) => void>();

export async function fetchTicketsEnabled(force = false): Promise<boolean> {
  if (cache !== null && !force) return cache;
  const { data } = await supabase.from('app_settings').select('valor').eq('chave', 'tickets').maybeSingle();
  cache = data?.valor?.enabled === true;
  listeners.forEach((l) => l(cache!));
  return cache;
}

export async function setTicketsEnabled(enabled: boolean) {
  const { error } = await supabase.from('app_settings')
    .upsert({ chave: 'tickets', valor: { enabled }, updated_at: new Date().toISOString() });
  if (error) throw error;
  cache = enabled;
  listeners.forEach((l) => l(enabled));
}

/** null enquanto carrega. */
export function useTicketsEnabled() {
  const [v, setV] = useState<boolean | null>(cache);
  useEffect(() => {
    listeners.add(setV);
    fetchTicketsEnabled().then(setV);
    return () => { listeners.delete(setV); };
  }, []);
  return v;
}
