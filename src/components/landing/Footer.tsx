import React from 'react';
import Logo from '../Logo';

const Footer: React.FC<{ onAgendamento: () => void; tickets: boolean }> = ({ onAgendamento, tickets }) => (
  <footer className="mt-16 border-t border-line">
    <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
      <div>
        <Logo />
        <p className="mt-5 text-sm leading-relaxed text-fg-2 max-w-[42ch]">
          Entidade sem fins lucrativos que representa e defende o setor solar e renovável no Rio Grande do Norte.
        </p>
      </div>
      <div>
        <h2 className="text-sm font-bold">Plataforma</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-fg-2">
          {tickets && <li><a className="hover:text-fg" href="#/reclame">Termômetro da Cosern</a></li>}
          <li><a className="hover:text-fg" href="#/login">Entrar</a></li>
          <li><a className="hover:text-fg" href="#/cadastro">Cadastro de integrador</a></li>
          {tickets && <li><a className="hover:text-fg" href="#/cadastro_cliente">Cadastro de cliente</a></li>}
          <li><button className="hover:text-fg text-left" onClick={onAgendamento}>Agendamento Cosern <span className="text-fg-3">(suspenso)</span></button></li>
        </ul>
      </div>
      <div>
        <h2 className="text-sm font-bold">Contato</h2>
        <ul className="mt-4 space-y-2.5 text-sm text-fg-2">
          <li>Frente Potiguar de Geração Distribuída</li>
          <li>Natal/RN, Brasil</li>
          <li><a className="hover:text-fg" href="mailto:fpgd.rn@gmail.com">fpgd.rn@gmail.com</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-line">
      <p className="max-w-[1280px] mx-auto px-5 md:px-8 py-6 text-xs text-fg-3">
        © {new Date().getFullYear()} FPGD RN. Entidade sem fins lucrativos.
      </p>
    </div>
  </footer>
);

export default Footer;
