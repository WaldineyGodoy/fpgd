import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink, FileSignature, Mail } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useSession } from '../components/AppLayout';
import { CICLO_LABEL, brl, callFn, dataBR, matriculaLabel, nomeAssociado, type Associado, type Contrato, type Plano } from '../crm/data';
import { PageHeader, StatusChip, contratoMeta } from '../crm/ui';

interface Cob { id: string; valor: number; vencimento: string; status: string; pago_em: string | null; invoice_url: string | null; descricao: string | null }
const PAGO = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'];

const MinhaAssociacaoPage: React.FC = () => {
  const { companyId, role } = useSession();
  const [a, setA] = useState<Associado | null>(null);
  const [plano, setPlano] = useState<Plano | null>(null);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [cobs, setCobs] = useState<Cob[] | null>(null);
  const [preparando, setPreparando] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) { setCobs([]); return null; }
    {
      const { data: c } = await supabase.from('companies').select('*').eq('id', companyId).maybeSingle();
      setA(c as Associado);
      if (c?.plano_id) {
        const { data: p } = await supabase.from('planos').select('*').eq('id', c.plano_id).maybeSingle();
        setPlano(p as Plano);
      }
      const { data: ct } = await supabase.from('contratos').select('*').eq('company_id', companyId).neq('status', 'cancelado')
        .order('created_at', { ascending: false }).limit(1);
      setContrato((ct?.[0] as Contrato) || null);
      const { data: cb } = await supabase.from('cobrancas').select('id, valor, vencimento, status, pago_em, invoice_url, descricao')
        .eq('company_id', companyId).order('vencimento', { ascending: false }).limit(24);
      setCobs((cb || []) as Cob[]);
      return { status: c?.status_associado as string | undefined, temContrato: Boolean(ct?.length), temCobranca: Boolean(cb?.length) };
    }
  }, [companyId]);

  // Primeiro acesso de um inscrito: o servidor gera e envia o termo de adesão e o 1º boleto.
  useEffect(() => {
    (async () => {
      const r = await load();
      if (role !== 'integrador' || !r || r.status !== 'inscrito' || (r.temContrato && r.temCobranca)) return;
      const chave = `fpgd-onboarding-${companyId}`;
      try { if (sessionStorage.getItem(chave)) return; sessionStorage.setItem(chave, '1'); } catch { /* sem storage: segue */ }
      setPreparando(true);
      try { await callFn('crm-onboarding', {}); } catch { /* a equipe vê a pendência no histórico */ }
      setPreparando(false);
      await load();
    })();
  }, [load, role, companyId]);

  if (role !== 'integrador') {
    return (
      <div className="panel p-8 max-w-xl">
        <h1 className="text-xl font-bold">Bem-vindo à FPGD RN</h1>
        <p className="mt-2 text-sm text-fg-2">Sua conta está ativa. Novas áreas aparecem aqui quando a Frente liberar.</p>
      </div>
    );
  }

  const aberta = cobs?.find((c) => c.status === 'OVERDUE') || cobs?.find((c) => c.status === 'PENDING');
  const aviso = preparando ? (
    <div className="panel p-4 mb-4 text-sm text-fg-2" role="status">Preparando seu termo de adesão e o boleto da 1ª mensalidade…</div>
  ) : null;

  return (
    <div className="max-w-[960px]">
      <PageHeader title="Minha associação" description="Situação da sua empresa na Frente Potiguar de Geração Distribuída." />
      {aviso}

      {!a ? <div className="skeleton h-40" /> : (
        <section className="panel glow-corner p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">{nomeAssociado(a)}</h2>
              <p className="mt-1 text-sm text-fg-3 tabular-nums">{matriculaLabel(a.matricula)}{a.data_adesao && <> · associado desde {dataBR(a.data_adesao)}</>}</p>
            </div>
            <StatusChip status={a.status_associado} />
          </div>
          <dl className="mt-6 grid sm:grid-cols-3 gap-4 text-sm">
            <div><dt className="text-xs text-fg-3">Plano</dt><dd className="mt-0.5 font-semibold">{plano ? plano.nome : 'A definir'}</dd></div>
            <div><dt className="text-xs text-fg-3">Mensalidade</dt><dd className="mt-0.5 font-semibold tabular-nums">{plano ? `${brl(Number(plano.valor))} ${CICLO_LABEL[plano.ciclo]}` : '—'}</dd></div>
            <div><dt className="text-xs text-fg-3">Contrato</dt><dd className={`mt-0.5 font-semibold ${contrato ? contratoMeta(contrato.status).cls : 'text-fg-3'}`}>{contrato ? contratoMeta(contrato.status).label : 'Ainda não emitido'}</dd></div>
          </dl>
          {(contrato?.status === 'enviado' && contrato.link_assinatura) || aberta?.invoice_url ? (
            <div className="mt-6 pt-5 border-t border-line flex flex-wrap gap-2">
              {contrato?.status === 'enviado' && contrato.link_assinatura && (
                <a className="btn btn-primary" href={contrato.link_assinatura} target="_blank" rel="noreferrer"><FileSignature size={16} /> Assinar contrato</a>
              )}
              {aberta?.invoice_url && (
                <a className={`btn ${contrato?.status === 'enviado' ? 'btn-secondary' : 'btn-primary'}`} href={aberta.invoice_url} target="_blank" rel="noreferrer">
                  <ExternalLink size={16} /> {aberta.status === 'OVERDUE' ? 'Pagar mensalidade em atraso' : `Pagar mensalidade de ${dataBR(aberta.vencimento)}`}
                </a>
              )}
            </div>
          ) : null}
        </section>
      )}

      <section className="panel mt-5">
        <h2 className="px-5 pt-5 font-bold">Mensalidades</h2>
        {cobs === null ? <div className="p-5"><div className="skeleton h-24" /></div> : cobs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-fg-3">Nenhuma cobrança emitida ainda. Elas aparecem aqui assim que a Frente ativar sua mensalidade.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {cobs.map((c) => (
              <li key={c.id} className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="tabular-nums text-fg-2 w-24">{dataBR(c.vencimento)}</span>
                <span className="tabular-nums font-semibold w-24">{brl(Number(c.valor))}</span>
                <span className={`chip ${PAGO.includes(c.status) ? 'text-st-ativo' : c.status === 'OVERDUE' ? 'text-st-inadimplente' : 'text-st-inscrito'}`}>
                  {PAGO.includes(c.status) ? `Pago em ${dataBR(c.pago_em)}` : c.status === 'OVERDUE' ? 'Em atraso' : 'A pagar'}
                </span>
                {c.invoice_url && !PAGO.includes(c.status) && <a className="ml-auto text-primary hover:underline" href={c.invoice_url} target="_blank" rel="noreferrer">Abrir fatura</a>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-sm text-fg-3 flex items-center gap-2"><Mail size={15} /> Dúvidas sobre sua associação: <a className="text-fg-2 hover:text-fg" href="mailto:fpgd.rn@gmail.com">fpgd.rn@gmail.com</a></p>
    </div>
  );
};

export default MinhaAssociacaoPage;
