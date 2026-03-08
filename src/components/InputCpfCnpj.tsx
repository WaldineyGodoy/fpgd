import React, { useState, useEffect } from 'react';

interface InputCpfCnpjProps {
  label?: string;
  onChange?: (value: string) => void;
  onValidData?: (data: any) => void;
  initialValue?: string;
}

/**
 * InputCpfCnpj Component
 * 
 * Um componente premium e autônomo para entrada de CPF ou CNPJ.
 */
const InputCpfCnpj: React.FC<InputCpfCnpjProps> = ({ 
  label = 'CPF ou CNPJ', 
  onChange, 
  onValidData,
  initialValue = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
  const [type, setType] = useState<'cpf' | 'cnpj' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialValue) {
      const digits = initialValue.replace(/\D/g, '');
      const masked = format(digits);
      setInputValue(masked);
      validate(digits);
    }
  }, [initialValue]);

  // --- Funções Auxiliares de Lógica ---
  const clean = (val: string) => val.replace(/\D/g, '');
  
  const format = (val: string) => {
    const digits = clean(val);
    if (digits.length <= 11) {
      // CPF: 000.000.000-00
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const validateCpf = (cpf: string) => {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0, rev;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (sum % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
  };

  const validateCnpj = (cnpj: string) => {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    let digits = cnpj.substring(size);
    let sum = 0, pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += (numbers.charAt(size - i) as any) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += (numbers.charAt(size - i) as any) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
  };

  const fetchCnpjData = async (cnpj: string) => {
    setStatus('loading');
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setStatus('valid');
      if (onValidData) onValidData(data);
    } catch {
      setStatus('valid'); // Mesmo se a API falhar, o documento é matematicamente válido
    }
  };

  const validate = (digits: string) => {
    if (digits.length === 11) {
      const isValid = validateCpf(digits);
      setType('cpf');
      setStatus(isValid ? 'valid' : 'invalid');
      if (!isValid) setErrorMsg('CPF Inválido');
    } else if (digits.length === 14) {
      const isValid = validateCnpj(digits);
      setType('cnpj');
      if (isValid) {
        fetchCnpjData(digits);
      } else {
        setStatus('invalid');
        setErrorMsg('CNPJ Inválido');
      }
    } else {
      setStatus('idle');
      setType(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = clean(raw).slice(0, 14);
    const masked = format(digits);
    
    setInputValue(masked);
    setErrorMsg('');
    
    if (onChange) onChange(digits);
    validate(digits);
  };

  // --- Estilos Premium ---
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '100%',
      margin: '10px 0'
    },
    label: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#64748b',
      paddingLeft: '4px'
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      paddingRight: '40px',
      borderRadius: '12px',
      border: `2px solid ${status === 'invalid' ? '#dc2626' : status === 'valid' ? '#10b981' : '#e2e8f0'}`,
      fontSize: '16px',
      color: '#1e293b',
      outline: 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: '#fff',
      boxSizing: 'border-box'
    },
    icon: {
      position: 'absolute',
      right: '12px',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    error: {
      fontSize: '12px',
      color: '#dc2626',
      fontWeight: '500',
      paddingLeft: '4px',
      marginTop: '-4px'
    },
    badge: {
      fontSize: '10px',
      textTransform: 'uppercase',
      fontWeight: '800',
      padding: '2px 6px',
      borderRadius: '4px',
      marginLeft: '8px',
      background: type === 'cpf' ? '#002D5E' : '#FF6600',
      color: '#fff'
    }
  };

  return (
    <div style={styles.container}>
      <div style={{display: 'flex', alignItems: 'center'}}>
        <label style={styles.label}>{label}</label>
        {type && <span style={styles.badge}>{type}</span>}
      </div>
      
      <div style={styles.inputWrapper}>
        <input
          type="text"
          style={styles.input}
          placeholder="000.000.000-00"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={(e) => {
            if (status !== 'invalid' && status !== 'valid') e.target.style.borderColor = '#FF6600';
          }}
          onBlur={(e) => {
            if (status !== 'invalid' && status !== 'valid') e.target.style.borderColor = '#e2e8f0';
          }}
        />
        
        <div style={styles.icon}>
          {status === 'loading' && (
            <svg width="18" height="18" viewBox="0 0 24 24" className="animate-spin">
               <path fill="#FF6600" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
            </svg>
          )}
          {status === 'valid' && (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#10b981" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          )}
          {status === 'invalid' && (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#dc2626" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          )}
        </div>
      </div>
      
      {errorMsg && <div style={styles.error}>{errorMsg}</div>}
    </div>
  );
};

export default InputCpfCnpj;
