import React, { useEffect, useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import Logo from '../Logo';

const LINKS = [
  { label: 'A Frente', href: '#sobre' },
  { label: 'O que cobramos', href: '#comissao' },
  { label: 'Pauta Cosern', href: '#pauta' },
  { label: 'Termômetro', href: '#/reclame' },
];

const Header: React.FC<{ tickets: boolean }> = ({ tickets }) => {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = LINKS.filter((l) => tickets || l.href !== '#/reclame');

  const go = (href: string) => (e: React.MouseEvent) => {
    setOpen(false);
    if (href.startsWith('#/')) return; // rota do app
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-200 ${solid || open ? 'bg-bg/95 backdrop-blur-md border-b border-line' : 'bg-transparent border-b border-transparent'}`}>
      <div className="max-w-[1280px] mx-auto h-[72px] px-5 md:px-8 flex items-center gap-8">
        <a href="#/" aria-label="FPGD RN, início" onClick={go('#top')}><Logo /></a>
        <nav className="hidden lg:flex items-center gap-7 ml-4" aria-label="Seções">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={go(l.href)} className="text-sm font-semibold text-fg-2 hover:text-fg transition-colors">{l.label}</a>
          ))}
        </nav>
        <div className="ml-auto hidden md:flex items-center gap-2">
          <a href="#/login" className="btn btn-ghost">Entrar</a>
          <a href="#associe" onClick={go('#associe')} className="btn btn-primary">Associe-se <ArrowRight size={16} /></a>
        </div>
        <button className="md:hidden ml-auto btn btn-ghost !px-2" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="md:hidden px-5 pb-5 flex flex-col gap-1" aria-label="Seções">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={go(l.href)} className="h-11 flex items-center text-base font-semibold text-fg-2">{l.label}</a>
          ))}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a href="#/login" className="btn btn-secondary">Entrar</a>
            <a href="#associe" onClick={go('#associe')} className="btn btn-primary">Associe-se</a>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;
