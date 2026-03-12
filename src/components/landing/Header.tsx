
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
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          <div className="flex-shrink-0">
            <a href="#home" className="flex items-center">
              <img 
                src="https://b2wenergia.com.br/wp-content/uploads/2026/02/FPGD-LOGO.png" 
                alt="FPGD RN Logo" 
                className="h-14 w-auto object-contain"
              />
            </a>
          </div>

          <nav className="hidden lg:flex space-x-6 xl:space-x-8 items-center">
            {navLinks.map((link) => (
              link.onClick ? (
                <button
                  key={link.label}
                  onClick={link.onClick}
                  className={`text-[11px] font-black uppercase tracking-widest ${link.label.includes('Agendamento') ? 'text-slate-400 opacity-60' : 'text-slate-600'} hover:text-[#198754] transition-all duration-300`}
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href?.startsWith('http') && !link.href?.includes('fpgd.site') ? "_blank" : undefined}
                  rel={link.href?.startsWith('http') && !link.href?.includes('fpgd.site') ? "noopener noreferrer" : undefined}
                  className={`text-[11px] font-black uppercase tracking-widest ${link.label === 'Reclame Cosern' ? 'text-red-600' : 'text-slate-600'} hover:text-[#198754] transition-all duration-300`}
                >
                  {link.label}
                </a>
              )
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="/#/login"
              className="bg-[#198754] text-white px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#157347] hover:scale-105 transition-all shadow-xl shadow-green-900/10 flex items-center justify-center min-w-[160px] text-center"
            >
              Fazer Login
            </a>
          </div>

          <div className="lg:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-[#198754] p-2">
              {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              link.onClick ? (
                <button
                  key={link.label}
                  onClick={() => { link.onClick!(); setIsOpen(false); }}
                  className="block w-full text-left px-4 py-3 text-sm font-black text-[#198754] rounded-xl hover:bg-green-50 uppercase tracking-widest"
                >
                  {link.label}
                </button>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 text-sm font-black text-slate-600 rounded-xl hover:text-[#198754] hover:bg-slate-50 uppercase tracking-widest"
                >
                  {link.label}
                </a>
              )
            ))}
            <a
              href="/#/login"
              className="block w-full mt-4 bg-[#198754] text-white px-4 py-4 rounded-xl text-center text-sm font-black uppercase tracking-widest"
            >
              Fazer Login
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
