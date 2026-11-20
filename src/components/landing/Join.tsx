import React from 'react';
import { Mail } from 'lucide-react';
import { PHOTOS } from './media';
import JoinForm from './JoinForm';

const PASSOS = [
  { title: 'Cadastro da empresa', text: 'Informe o CNPJ: buscamos razão social e endereço automaticamente.' },
  { title: 'Contrato digital', text: 'Você recebe o contrato de adesão por WhatsApp e e-mail e assina pelo Autentique.' },
  { title: 'Mensalidade', text: 'A cobrança chega por Pix, boleto ou cartão. Com o primeiro pagamento, você já é associado ativo.' },
];

const Join: React.FC = () => (
  <section id="associe" className="scroll-mt-20 px-3 md:px-5 pb-6">
    <div className="relative isolate overflow-hidden rounded-[24px] border border-line max-w-[1400px] mx-auto">
      <img src={PHOTOS.usinaCampo()} alt="Usina solar em campo aberto" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(11_14_23/.95)_0%,rgb(11_14_23/.88)_45%,rgb(11_14_23/.55)_100%)]" />

      <div className="px-6 py-16 md:px-14 md:py-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div>
          <h2 className="text-[clamp(1.875rem,3.6vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.025em] text-balance max-w-[16ch]">
            Associe sua empresa à Frente
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-fg-2 max-w-[52ch]">
            A pauta só avança com a pressão legítima da categoria. Quanto mais integradores, mais peso a Frente tem para garantir que os compromissos da distribuidora sejam cumpridos.
          </p>
          <JoinForm id="cnpj-join" className="mt-8 max-w-[540px]" />
          <a href="mailto:fpgd.rn@gmail.com" className="mt-6 inline-flex items-center gap-2 text-sm text-fg-2 hover:text-fg">
            <Mail size={16} /> Dúvidas sobre a adesão? fpgd.rn@gmail.com
          </a>
        </div>

        <ol className="space-y-3">
          {PASSOS.map((p, i) => (
            <li key={p.title} className="panel !bg-[#0E1320]/85 backdrop-blur p-5 flex gap-4">
              <span className="size-8 shrink-0 rounded-full bg-energy text-[#04131F] font-extrabold text-sm grid place-items-center tabular-nums">{i + 1}</span>
              <div>
                <h3 className="font-bold">{p.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-fg-2">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

export default Join;
