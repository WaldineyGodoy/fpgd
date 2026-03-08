
import React from 'react';
import { Sun, Instagram, Linkedin, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-green-600 p-2 rounded-lg">
                <Sun className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white">
                FPGD <span className="text-green-600">RN</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Entidade sem fins lucrativos que representa e defende o setor solar e renovável no Rio Grande do Norte. Juntos por uma energia limpa, justa e democratizada.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-green-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-green-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-green-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Navegação</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#home" className="hover:text-green-400 transition-colors">Início</a></li>
              <li><a href="#sobre" className="hover:text-green-400 transition-colors">Sobre a FPGD</a></li>
              <li><a href="#comissao" className="hover:text-green-400 transition-colors">A Comissão</a></li>
              <li><a href="#adesao" className="hover:text-green-400 transition-colors">Formulário de Adesão</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Setor Solar RN</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-green-400 transition-colors">Regulação ANEEL</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">Manuais Cosern</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">Notícias do Setor</a></li>
              <li><a href="#" className="hover:text-green-400 transition-colors">Eventos FPGD</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Contato Legal</h4>
            <p className="text-sm mb-4">
              Frente Potiguar de Geração Distribuída
            </p>
            <p className="text-sm mb-2">Natal/RN - Brasil</p>
            <p className="text-sm">fpgd.rn@gmail.com</p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p>© 2024 FPGD RN. Todos os direitos reservados. Entidade Sem Fins Lucrativos.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-green-400">Termos de Uso</a>
            <a href="#" className="hover:text-green-400">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
