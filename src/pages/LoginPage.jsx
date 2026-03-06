
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { IMaskInput } from 'react-imask';

const LoginPage = () => {
  const navigate = useNavigate();
  const [cnpj, setCnpj] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // Only used for registration
  const [step, setStep] = useState('cnpj'); // 'cnpj', 'login', 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);

  const handleCnpjCheck = async () => {
    setLoading(true);
    setError('');
    const cleanCnpj = cnpj.replace(/\D/g, '');
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('cnpj', cleanCnpj)
        .single();

      if (error || !data) {
        // Redirecionar para cadastro se não existir
        navigate('/cadastro', { state: { initialCnpj: cnpj } });
        return;
      }

      setCompany(data);
      if (data.auth_user_id) {
        setStep('login');
      } else {
        setStep('signup');
      }
    } catch (err) {
      setError('Erro ao verificar CNPJ. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In a real scenario, we'd need to know the email associated with this company
      // For this flow, we might need to store email in companies table as well
      // For now, let's assume we use the email from the company record if it exists
      if (!company.email) {
        setError('Nenhum email associado a esta empresa. Contate o suporte.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: company.email,
        password: password,
      });

      if (error) throw error;
      navigate('/tickets');
    } catch (err) {
      setError('Senha incorreta ou erro no login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      // Update company with auth_user_id and email if needed
      const { error: updateError } = await supabase
        .from('companies')
        .update({ 
          auth_user_id: authData.user.id,
          email: email // Update email to the one used for login
        })
        .eq('id', company.id);

      if (updateError) throw updateError;

      navigate('/tickets');
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 pb-4 border-b border-gray-100">
        Login <span className="text-green-600">FPGD</span>
      </h1>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {step === 'cnpj' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">CNPJ da Empresa</label>
            <IMaskInput
              mask="00.000.000/0000-00"
              value={cnpj}
              onAccept={(val) => setCnpj(val)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              placeholder="00.000.000/0000-00"
            />
          </div>
          <button
            onClick={handleCnpjCheck}
            disabled={loading || cnpj.length < 18}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Continuar'}
          </button>
        </div>
      )}

      {step === 'login' && (
        <form onSubmit={handleLogin} className="space-y-6">
          <p className="text-sm text-gray-600">Empresa: <span className="font-semibold">{company?.nome_fantasia || company?.razao_social}</span></p>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <button 
            type="button"
            onClick={() => setStep('cnpj')}
            className="w-full text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            Voltar
          </button>
        </form>
      )}

      {step === 'signup' && (
        <form onSubmit={handleSignup} className="space-y-6">
          <p className="text-sm text-gray-600">Crie seu acesso para: <span className="font-semibold">{company?.nome_fantasia || company?.razao_social}</span></p>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email de Acesso</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              required
              placeholder="seu@email.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Crie uma Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              required
              placeholder="No mínimo 6 caracteres"
            />
          </div>
          <button
            type="submit"
            disabled={loading || password.length < 6}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? 'Criando Conta...' : 'Criar Acesso'}
          </button>
          <button 
            type="button"
            onClick={() => setStep('cnpj')}
            className="w-full text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            Voltar
          </button>
        </form>
      )}
    </div>
  );
};

export default LoginPage;
