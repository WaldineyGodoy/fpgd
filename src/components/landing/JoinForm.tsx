import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { ArrowRight } from 'lucide-react';

/** Entrada da adesão: o CNPJ segue para o cadastro de integrador já preenchido. */
const JoinForm: React.FC<{ id: string; className?: string }> = ({ id, className = '' }) => {
  const navigate = useNavigate();
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) { setError('Digite os 14 números do CNPJ da sua empresa.'); return; }
    navigate('/cadastro', { state: { initialCnpj: digits } });
  };

  return (
    <form onSubmit={submit} className={className} noValidate>
      <label htmlFor={id} className="block text-sm font-semibold text-fg-2 mb-2">CNPJ da sua empresa</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <IMaskInput
          id={id}
          mask="00.000.000/0000-00"
          value={cnpj}
          onAccept={(v: string) => { setCnpj(v); setError(''); }}
          inputMode="numeric"
          placeholder="00.000.000/0000-00"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="field !h-12 !text-base tabular-nums sm:flex-1 !bg-[#0E1320]/80"
        />
        <button type="submit" className="btn btn-primary !h-12 !px-6 !text-[15px]">Quero me associar <ArrowRight size={18} /></button>
      </div>
      {error && <p id={`${id}-err`} className="mt-2 text-sm text-[#FF8B95]">{error}</p>}
    </form>
  );
};

export default JoinForm;
