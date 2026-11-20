import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { PHOTOS } from './media';
import JoinForm from './JoinForm';

const CANAIS = [
  { key: 'agencias', label: 'Agências' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'portal_gd', label: 'Portal GD' },
  { key: 'equipe_campo_vistoria', label: 'Vistorias' },
];

// Escala NPS 1–5 padronizada do projeto (cores de dado, não de marca)
const npsColor = (v: number) => (v >= 4.5 ? '#198754' : v >= 3.5 ? '#84cc16' : v >= 2.5 ? '#facc15' : v >= 1.5 ? '#f59e0b' : '#ef4444');

interface Termo { total: number; desacordo: number | null; canais: { label: string; media: number | null; n: number }[] }

const Termometro: React.FC = () => {
  const [t, setT] = useState<Termo | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    supabase.from('tickets').select('nps_data, esta_de_acordo').then(({ data, error }) => {
      if (error || !data) { setFailed(true); return; }
      const avaliados = data.filter((d) => d.esta_de_acordo !== null);
      setT({
        total: data.length,
        desacordo: avaliados.length ? Math.round((avaliados.filter((d) => d.esta_de_acordo === false).length / avaliados.length) * 100) : null,
        canais: CANAIS.map((c) => {
          const notas = data.map((d) => Number(d.nps_data?.[c.key])).filter((n) => n >= 1 && n <= 5);
          return { label: c.label, n: notas.length, media: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null };
        }),
      });
    });
  }, []);

  if (failed) return null;

  return (
    <a href="#/reclame" className="group block panel glow-corner !bg-[#0E1320]/85 backdrop-blur-md p-5 w-full max-w-[400px] hover:border-line-strong transition-colors">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold">Termômetro da Cosern</h2>
        <span className="text-xs text-fg-3 tabular-nums">{t ? `${t.total} tickets` : '…'}</span>
      </div>
      <p className="text-xs text-fg-3 mt-1">Nota média de 1 a 5 dada por associados e clientes, por canal de atendimento.</p>
      <ul className="mt-4 space-y-2.5">
        {(t?.canais || CANAIS.map((c) => ({ label: c.label, media: null, n: 0 }))).map((c) => (
          <li key={c.label} className="grid grid-cols-[84px_1fr_34px] items-center gap-3 text-sm">
            <span className="text-fg-2">{c.label}</span>
            <span className="h-2 rounded-full bg-raised overflow-hidden">
              {t ? (
                <span className="block h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: c.media ? `${(c.media / 5) * 100}%` : '0%', background: c.media ? npsColor(c.media) : undefined }} />
              ) : <span className="block h-full skeleton" />}
            </span>
            <span className="text-right font-bold tabular-nums">{c.media ? c.media.toFixed(1).replace('.', ',') : '–'}</span>
          </li>
        ))}
      </ul>
      {t?.desacordo != null && (
        <p className="mt-4 pt-4 border-t border-line text-sm text-fg-2">
          <b className="text-fg tabular-nums">{t.desacordo}%</b> discordam da resposta da distribuidora.
        </p>
      )}
      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:text-primary-hover">
        Ver o painel completo <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
};

const Hero: React.FC<{ tickets: boolean }> = ({ tickets }) => (
  <section className="relative isolate -mt-[72px] pt-[72px] min-h-[min(100svh,920px)] flex items-end overflow-hidden">
    <img src={PHOTOS.usinaCeu()} alt="Fileiras de painéis solares de uma usina sob céu aberto" className="absolute inset-0 -z-20 size-full object-cover object-[60%_center]" fetchPriority="high" />
    <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(11_14_23/.96)_0%,rgb(11_14_23/.86)_38%,rgb(11_14_23/.35)_70%,rgb(11_14_23/.2)_100%)]" />
    <div className="absolute inset-x-0 bottom-0 h-40 -z-10 bg-gradient-to-t from-bg to-transparent" />

    <div className="w-full max-w-[1280px] mx-auto px-5 md:px-8 pb-16 md:pb-24 pt-16 grid lg:grid-cols-[minmax(0,1fr)_400px] gap-12 items-end">
      <div className="max-w-[720px]">
        <h1 className="text-[clamp(2.25rem,5vw,4.25rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-balance">
          Integrador do RN não negocia sozinho com a Cosern.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-fg-2 max-w-[560px]">
          A Frente Potiguar de Geração Distribuída reúne integradores e instaladores de energia solar do Rio Grande do Norte para cobrar a distribuidora com dados, pauta e representação coletiva.
        </p>
        <JoinForm id="cnpj-hero" className="mt-8 max-w-[560px]" />
        {tickets && (
          <p className="mt-4 text-sm text-fg-3">
            Teve crédito que não compensou ou protocolo sem resposta?{' '}
            <a href="#/reclame" className="font-semibold text-fg-2 underline decoration-line-strong hover:text-fg hover:decoration-fg">Registre a reclamação</a>
          </p>
        )}
      </div>
      {tickets && (
        <div className="lg:justify-self-end w-full flex lg:block justify-start">
          <Termometro />
        </div>
      )}
    </div>
  </section>
);

export default Hero;
