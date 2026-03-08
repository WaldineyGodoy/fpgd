
import React from 'react';
import { Users, Landmark, HeartHandshake, TrendingUp } from 'lucide-react';

const About: React.FC = () => {
  const values = [
    {
      title: 'Representatividade',
      description: 'Damos voz às empresas e trabalhadores do setor renovável perante o governo e órgãos reguladores.',
      icon: <Users className="w-6 h-6 text-white" />,
    },
    {
      title: 'Desenvolvimento',
      description: 'Fomentamos o crescimento da cadeia produtiva de geração distribuída em todo o Rio Grande do Norte.',
      icon: <TrendingUp className="w-6 h-6 text-white" />,
    },
    {
      title: 'Justiça Setorial',
      description: 'Atuamos para garantir que os processos e normas sejam transparentes e justos para todos os players.',
      icon: <Landmark className="w-6 h-6 text-white" />,
    },
    {
      title: 'Apoio Mútuo',
      description: 'Uma rede colaborativa sem fins lucrativos focada no sucesso compartilhado do setor solar.',
      icon: <HeartHandshake className="w-6 h-6 text-white" />,
    },
  ];

  return (
    <section id="sobre" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase mb-3">Quem Somos</h2>
          <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-6">
            A Frente Potiguar de Geração Distribuída
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            Somos uma entidade sem fins lucrativos dedicada a fortalecer e representar todos que fazem parte da matriz energética renovável do RN. Nossa missão é ser o elo entre a inovação tecnológica e as decisões institucionais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((item, index) => (
            <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="bg-green-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-600/30">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
