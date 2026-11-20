import React from 'react';
import { Users, TrendingUp, Landmark, HeartHandshake } from 'lucide-react';
import { PHOTOS } from './media';

const PILARES = [
  { icon: Users, title: 'Representatividade', text: 'Damos voz às empresas e trabalhadores do setor renovável perante o governo e os órgãos reguladores.' },
  { icon: TrendingUp, title: 'Desenvolvimento', text: 'Fomentamos o crescimento da cadeia de geração distribuída em todo o Rio Grande do Norte.' },
  { icon: Landmark, title: 'Justiça setorial', text: 'Atuamos para que processos e normas sejam transparentes e justos para todos os players.' },
  { icon: HeartHandshake, title: 'Apoio mútuo', text: 'Uma rede colaborativa, sem fins lucrativos, focada no sucesso compartilhado do setor solar.' },
];

const About: React.FC = () => (
  <section id="sobre" className="scroll-mt-20 py-24 md:py-32">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 grid lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-20 items-center">
      <div className="relative order-2 lg:order-1">
        <img src={PHOTOS.instalador()} alt="Instalador conectando os cabos de um painel solar" loading="lazy"
          className="w-full aspect-[4/5] object-cover rounded-[16px] border border-line" />
        <p className="absolute left-4 bottom-4 right-4 sm:right-auto panel !bg-[#0E1320]/90 backdrop-blur px-4 py-3 text-sm text-fg-2 max-w-[320px]">
          Entidade sem fins lucrativos, sediada em Natal/RN.
        </p>
      </div>
      <div className="order-1 lg:order-2">
        <h2 className="text-[clamp(1.875rem,3.4vw,2.75rem)] font-extrabold leading-[1.1] tracking-[-0.025em] text-balance">
          O elo entre quem instala energia solar e quem decide as regras.
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-fg-2 max-w-[60ch]">
          Somos uma entidade dedicada a fortalecer e representar quem faz parte da matriz energética renovável do RN. Nossa missão é ser a ponte entre a inovação tecnológica e as decisões institucionais.
        </p>
        <dl className="mt-10 grid sm:grid-cols-2 gap-x-10">
          {PILARES.map((p) => (
            <div key={p.title} className="py-5 border-t border-line">
              <dt className="flex items-center gap-2.5 font-bold">
                <p.icon size={18} className="text-cyan" /> {p.title}
              </dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-fg-2">{p.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  </section>
);

export default About;
