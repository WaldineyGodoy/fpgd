import React from 'react';

/**
 * Marca tipográfica provisória da FPGD RN. O logo oficial (b2wenergia.com.br/.../FPGD-LOGO.png)
 * está fora do ar; quando o arquivo existir em public/assets/fpgd-logo.png, troque aqui.
 */
const Logo: React.FC<{ compact?: boolean; className?: string }> = ({ compact, className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
    <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="fpgd-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1BFBB6" />
          <stop offset=".4" stopColor="#00DEEA" />
          <stop offset="1" stopColor="#2B7CFF" />
        </linearGradient>
      </defs>
      {/* painel solar estilizado: 3x2 células sob um sol */}
      <circle cx="23" cy="8" r="4" fill="url(#fpgd-g)" />
      <path d="M4 14h18l4 14H8z" fill="none" stroke="url(#fpgd-g)" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M10.4 14l2.6 14M16.2 14l3.6 14M6 21h19" stroke="url(#fpgd-g)" strokeWidth="1.6" />
    </svg>
    {!compact && (
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-tight text-fg">FPGD RN</span>
        <span className="block text-[10px] font-semibold text-fg-3 mt-1 whitespace-nowrap">Frente Potiguar de Geração Distribuída</span>
      </span>
    )}
  </span>
);

export default Logo;
