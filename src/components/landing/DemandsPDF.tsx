
import React from 'react';
import { FileText, Download, Calendar, ArrowRight } from 'lucide-react';

const DemandsPDF: React.FC = () => {
  return (
    <section id="demandas" className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase mb-3">Transparência e Luta</h2>
          <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-6">
            Pautas Prioritárias perante a Cosern
          </p>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Confira abaixo a pauta oficial contendo os compromissos assumidos pela distribuidora e as demandas fundamentais do setor renovável potiguar.
          </p>
        </div>

        {/* PDF Visual Container */}
        <div className="bg-slate-50 rounded-3xl p-4 sm:p-8 md:p-12 shadow-inner border border-slate-200">
          <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-300 max-h-[800px] overflow-y-auto scrollbar-hide">
            <div className="p-10 md:p-16 text-slate-800 font-serif leading-relaxed text-sm md:text-base">
              
              {/* Logo no Documento */}
              <div className="flex justify-center mb-8">
                <img 
                  src="https://b2wenergia.com.br/wp-content/uploads/2026/02/FPGD-LOGO.png" 
                  alt="Logo FPGD" 
                  className="h-24 w-auto grayscale opacity-80"
                />
              </div>

              <div className="text-center mb-12">
                <h1 className="text-xl md:text-2xl font-bold uppercase mb-4 tracking-tight">PAUTA DA REUNIÃO</h1>
              </div>

              <p className="mb-6">
                A presente reunião tem como objetivo tratar das <strong>falhas sistêmicas e operacionais relacionadas à compensação de créditos de energia elétrica</strong> provenientes de sistemas de micro e minigeração distribuída, bem como seus impactos diretos sobre integradores e consumidores finais.
              </p>

              <p className="mb-8">
                As partes reconhecem que os representantes da COSERN presente à reunião não detêm poderes decisórios plenos para deliberação imediata sobre todas as demandas apresentadas, motivo pelo qual busca-se, nesta oportunidade, a formalização de <strong>compromissos objetivos e documentados</strong>, aptos a gerar segurança jurídica e institucional às partes envolvidas.
              </p>

              <div className="mb-8">
                <h3 className="text-lg font-bold border-b border-slate-300 pb-2 mb-4">1. COMPROMISSOS ASSUMIDOS PELA COSERN</h3>
                <p className="mb-4 italic">Nas tratativas, o intuito é a COSERN compromete-se formalmente aos seguintes pontos, os quais deverão constar como deliberações:</p>
                
                <h4 className="font-bold mb-3">1.1 Posicionamento Formal até 05/02/2026</h4>
                <p className="mb-4">
                  A COSERN compromete-se a <strong>apresentar posicionamento formal, por escrito, até o dia 05 de fevereiro de 2026</strong>, por meio de comunicado oficial, contendo informações claras, objetivas e institucionais, no qual deverá constar expressamente:
                </p>
                <ul className="list-[lower-alpha] pl-8 space-y-3 mb-6">
                  <li>O reconhecimento de que as inconsistências verificadas decorrem de <strong>falhas e ajustes no novo sistema da COSERN</strong>, de sua exclusiva responsabilidade;</li>
                  <li>A <strong>isenção de qualquer responsabilidade das empresas integradoras</strong> de energia solar quanto aos problemas de faturamento e/ou compensação de créditos enfrentados pelos consumidores;</li>
                  <li>O <strong>prazo estimado para regularização do sistema</strong>, bem como a identificação dos pontos críticos prioritários;</li>
                  <li>As medidas técnicas e operacionais em andamento para correção das inconsistências verificadas;</li>
                </ul>

                <h4 className="font-bold mb-3">1.2 Bloqueio de Suspensão e Cobrança</h4>
                <p className="mb-6">
                  A COSERN compromete-se a <strong>bloquear qualquer suspensão de fornecimento de energia elétrica</strong>, bem como a suspender medidas de cobrança coercitiva, em relação a todos os consumidores impactados pelas falhas de faturamento, até que haja a efetiva regularização. Tal compromisso abrange todos os clientes envolvidos, independentemente do grupo tarifário.
                </p>

                <h4 className="font-bold mb-3">3.3 Instituição de Comissão Permanente de Diálogo</h4>
                <p className="mb-4">
                  A COSERN compromete-se a <strong>instituir comissão interna ou designar representantes oficiais</strong>, com atribuição específica para:
                </p>
                <ul className="list-disc pl-8 space-y-2 mb-6">
                  <li>Dialogar diretamente com a Frente Potiguar de Geração Distribuída (FPGD);</li>
                  <li>Acompanhar a evolução das correções sistêmicas;</li>
                  <li>Prestar esclarecimentos técnicos e institucionais periódicos.</li>
                </ul>
              </div>

              <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-400">
                <span>DOCUMENTO PARA CIÊNCIA PÚBLICA</span>
                <span>FPGD RN - FEVEREIRO/2026</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-4 text-slate-600">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Reunião realizada em: 03/02/2026</span>
            </div>
            <div className="flex space-x-4">
              <button className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 hover:text-green-600 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Baixar Pauta em PDF
              </button>
            </div>
          </div>
        </div>

        {/* CTA Button at the end of the section */}
        <div className="mt-16 text-center">
          <div className="bg-emerald-50 rounded-3xl p-8 md:p-12 border border-emerald-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Fortaleça esta representação</h3>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
              Esta pauta só avança com a pressão legítima da nossa categoria. Junte-se à FPGD RN para garantir que os compromissos da distribuidora sejam cumpridos.
            </p>
            <a
              href="#adesao"
              className="inline-flex items-center justify-center px-10 py-5 border border-transparent text-lg font-bold rounded-2xl text-white bg-green-600 hover:bg-green-700 shadow-2xl shadow-green-600/30 transition-all group"
            >
              Participar do movimento
              <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemandsPDF;
