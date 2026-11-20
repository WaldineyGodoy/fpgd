import React from 'react';
import { CalendarDays, Printer } from 'lucide-react';

/** Pauta oficial da reunião com a Cosern (03/02/2026). Texto preservado do documento original. */
const DemandsPDF: React.FC = () => (
  <section id="pauta" className="scroll-mt-20 py-24 md:py-32">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 grid lg:grid-cols-[minmax(0,380px)_1fr] gap-10 lg:gap-16 items-start">
      <div className="lg:sticky lg:top-28">
        <h2 className="text-[clamp(1.875rem,3.4vw,2.75rem)] font-extrabold leading-[1.1] tracking-[-0.025em] text-balance">
          Pauta prioritária perante a Cosern
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-fg-2">
          A pauta oficial com os compromissos cobrados da distribuidora e as demandas fundamentais do setor renovável potiguar.
        </p>
        <p className="mt-6 flex items-center gap-2 text-sm text-fg-3"><CalendarDays size={16} /> Reunião realizada em 03/02/2026</p>
        <button onClick={() => window.print()} className="btn btn-secondary mt-6"><Printer size={16} /> Imprimir ou salvar em PDF</button>
      </div>

      <article className="panel p-6 sm:p-10 md:p-14 text-[15.5px] leading-[1.75] text-fg-2 [&_strong]:text-fg [&_strong]:font-semibold">
        <header className="pb-6 mb-8 border-b border-line flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xl font-extrabold text-fg tracking-tight">Pauta da reunião</h3>
          <span className="text-xs text-fg-3">FPGD RN · Fevereiro/2026 · Documento para ciência pública</span>
        </header>

        <p className="mb-5">
          A presente reunião tem como objetivo tratar das <strong>falhas sistêmicas e operacionais relacionadas à compensação de créditos de energia elétrica</strong> provenientes de sistemas de micro e minigeração distribuída, bem como seus impactos diretos sobre integradores e consumidores finais.
        </p>
        <p className="mb-10">
          As partes reconhecem que os representantes da COSERN presentes à reunião não detêm poderes decisórios plenos para deliberação imediata sobre todas as demandas apresentadas, motivo pelo qual busca-se, nesta oportunidade, a formalização de <strong>compromissos objetivos e documentados</strong>, aptos a gerar segurança jurídica e institucional às partes envolvidas.
        </p>

        <h4 className="text-fg font-bold text-lg mb-3">1. Compromissos assumidos pela COSERN</h4>
        <p className="mb-6">Nas tratativas, o intuito é que a COSERN se comprometa formalmente aos seguintes pontos, que deverão constar como deliberações:</p>

        <h5 className="text-fg font-bold mb-2">1.1 Posicionamento formal até 05/02/2026</h5>
        <p className="mb-4">
          A COSERN compromete-se a <strong>apresentar posicionamento formal, por escrito, até o dia 05 de fevereiro de 2026</strong>, por meio de comunicado oficial, contendo informações claras, objetivas e institucionais, no qual deverá constar expressamente:
        </p>
        <ol className="list-[lower-alpha] pl-6 space-y-2 mb-8 marker:text-fg-3">
          <li>O reconhecimento de que as inconsistências verificadas decorrem de <strong>falhas e ajustes no novo sistema da COSERN</strong>, de sua exclusiva responsabilidade;</li>
          <li>A <strong>isenção de qualquer responsabilidade das empresas integradoras</strong> de energia solar quanto aos problemas de faturamento e/ou compensação de créditos enfrentados pelos consumidores;</li>
          <li>O <strong>prazo estimado para regularização do sistema</strong>, bem como a identificação dos pontos críticos prioritários;</li>
          <li>As medidas técnicas e operacionais em andamento para correção das inconsistências verificadas.</li>
        </ol>

        <h5 className="text-fg font-bold mb-2">1.2 Bloqueio de suspensão e cobrança</h5>
        <p className="mb-8">
          A COSERN compromete-se a <strong>bloquear qualquer suspensão de fornecimento de energia elétrica</strong>, bem como a suspender medidas de cobrança coercitiva, em relação a todos os consumidores impactados pelas falhas de faturamento, até que haja a efetiva regularização. Tal compromisso abrange todos os clientes envolvidos, independentemente do grupo tarifário.
        </p>

        <h5 className="text-fg font-bold mb-2">1.3 Instituição de comissão permanente de diálogo</h5>
        <p className="mb-3">
          A COSERN compromete-se a <strong>instituir comissão interna ou designar representantes oficiais</strong>, com atribuição específica para:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 marker:text-fg-3">
          <li>Dialogar diretamente com a Frente Potiguar de Geração Distribuída (FPGD);</li>
          <li>Acompanhar a evolução das correções sistêmicas;</li>
          <li>Prestar esclarecimentos técnicos e institucionais periódicos.</li>
        </ul>
      </article>
    </div>
  </section>
);

export default DemandsPDF;
