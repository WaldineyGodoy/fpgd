
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onAgendamentoClick: () => void;
  onAdesaoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAgendamentoClick, onAdesaoClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Início', href: '#home' },
    { label: 'Sobre a FPGD', href: '#sobre' },
    { label: 'A Comissão', href: '#comissao' },
    { label: 'Agendamento Cosern Suspenso', onClick: onAgendamentoClick },
    { label: 'Reclame Cosern', href: '/#/reclame' },
    { label: 'Login', href: '/#/login' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <a href="#home" className="flex items-center">
              <img 
                src="https://b2wenergia.com.br/wp-content/uploads/2026/02/FPGD-LOGO.png" 
                alt="FPGD RN Logo" 
                className="h-12 w-auto object-contain"
              />
            </a>
          </div>

          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              link.onClick ? (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className={`text-sm font-bold ${link.label.includes('Agendamento') ? 'text-green-500' : 'text-slate-600'} hover:text-[#34b27b] transition-colors`}
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href?.startsWith('http') && !link.href?.includes('fpgd.site') ? "_blank" : undefined}
                  rel={link.href?.startsWith('http') && !link.href?.includes('fpgd.site') ? "noopener noreferrer" : undefined}
                  className={`text-sm ${link.label === 'Reclame Cosern' ? 'font-bold text-red-600' : 'font-medium text-slate-600'} hover:text-[#3ecf8e] transition-colors`}
                >
                  {link.label}
                </a>
              )
            ))}
          </nav>

          <div className="hidden md:block">
            <a
              href="/#/login"
              className="bg-green-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-[#24b47e] transition-all shadow-sm shadow-green-500/20"
            >
              Login
            </a>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-[#3ecf8e]">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              link.onClick ? (
                <button
                  key={link.label}
                  onClick={() => { link.onClick!(); setIsOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-base font-bold text-green-500 rounded-md hover:bg-emerald-50"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-slate-600 rounded-md hover:text-[#3ecf8e] hover:bg-slate-50"
                >
                  {link.label}
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
