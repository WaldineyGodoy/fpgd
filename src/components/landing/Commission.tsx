import React from 'react';
import { FileCheck, MessageSquare, Scale, ShieldCheck, Check } from 'lucide-react';
import { PHOTOS } from './media';

const DEMANDAS = [
  { icon: FileCheck, title: 'Agilidade em pareceres', text: 'Redução dos prazos de análise e liberação de projetos de geração distribuída.' },
  { icon: MessageSquare, title: 'Canal direto com a Cosern', text: 'Diálogo técnico e fluido para resolver impasses normativos.' },
  { icon: Scale, title: 'Transparência nas regras', text: 'Normas aplicadas pela distribuidora seguindo rigorosamente a legislação da ANEEL.' },
  { icon: ShieldCheck, title: 'Defesa do integrador', text: 'Apoio técnico e jurídico em casos de exigências indevidas.' },
];

const MOTIVOS = [
  'Influencie as políticas locais da distribuidora.',
  'Acesso a informações sobre regulação em primeira mão.',
  'Fortalecimento institucional da sua empresa.',
  'Unificação da linguagem técnica do setor.',
];

const Commission: React.FC = () => (
  <section id="comissao" className="scroll-mt-20 relative isolate overflow-hidden py-24 md:py-32">
    <img src={PHOTOS.aerea()} alt="" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover opacity-30" />
    <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,var(--color-bg)_0%,rgb(11_14_23/.82)_30%,rgb(11_14_23/.82)_70%,var(--color-bg)_100%)]" />

    <div className="max-w-[1280px] mx-auto px-5 md:px-8">
      <div className="max-w-[760px]">
        <h2 className="text-[clamp(1.875rem,3.4vw,2.75rem)] font-extrabold leading-[1.1] tracking-[-0.025em] text-balance">
          Comissão de Representação Setorial na Cosern
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-fg-2">
          O momento exige união. A comissão técnica e política da Frente leva as demandas reais do mercado solar do RN direto à mesa de decisão da Cosern (Neoenergia).
        </p>
      </div>

      <div className="mt-14 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <ul className="grid sm:grid-cols-2 gap-px bg-line border border-line rounded-[16px] overflow-hidden">
          {DEMANDAS.map((d) => (
            <li key={d.title} className="p-6 md:p-7 bg-panel/95">
              <d.icon size={22} className="text-energy" />
              <h3 className="mt-4 font-bold text-lg">{d.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-fg-2">{d.text}</p>
            </li>
          ))}
        </ul>
        <div className="panel glow-corner !bg-raised/90 backdrop-blur p-6 md:p-8 flex flex-col">
          <h3 className="text-lg font-bold">Por que participar</h3>
          <ul className="mt-5 space-y-4">
            {MOTIVOS.map((m) => (
              <li key={m} className="flex gap-3 text-[15px] text-fg-2">
                <Check size={18} className="text-energy shrink-0 mt-0.5" /> {m}
              </li>
            ))}
          </ul>
          <p className="mt-auto pt-8 text-[15px] leading-relaxed text-fg font-semibold border-t border-line">
            A fragmentação do setor é o que permite que as dificuldades persistam. Unidos, somos um player impossível de ignorar.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default Commission;
