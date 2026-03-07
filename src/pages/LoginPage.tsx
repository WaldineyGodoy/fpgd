
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { IMaskInput } from 'react-imask';
import { motion, AnimatePresence } from 'framer-motion';

interface Company {
  id: string;
  cnpj: string;
  nome_fantasia: string | null;
  razao_social: string | null;
  auth_user_id: string | null;
  email: string | null;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [cnpj, setCnpj] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [step, setStep] = useState<'cnpj' | 'login' | 'signup'>('cnpj');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [company, setCompany] = useState<Company | null>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setLoading(true);
    setError('');

    try {
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (authError || !authData.user) throw authError || new Error('Signup failed');

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          auth_user_id: authData.user.id,
          email: email
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

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md p-8 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20"
    >
      <motion.h1
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-4xl font-black text-center text-gray-800 mb-8 pb-4 border-b border-gray-100 flex justify-center items-center gap-2"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-green-600"
        >
          ✦
        </motion.span>
        Login <span className="text-green-600">FPGD</span>
      </motion.h1>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 'cnpj' && (
          <motion.div
            key="cnpj"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">CNPJ da Empresa</label>
              <IMaskInput
                mask="00.000.000/0000-00"
                value={cnpj}
                onAccept={(val: string) => setCnpj(val)}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all placeholder-gray-300 text-lg font-medium"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#15803d' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCnpjCheck}
              disabled={loading || cnpj.length < 18}
              className="w-full py-5 bg-green-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-200 transition-colors disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? 'Verificando...' : 'Continuar'}
            </motion.button>
          </motion.div>
        )}

        {step === 'login' && (
          <motion.form
            key="login"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onSubmit={handleLogin}
            className="space-y-6"
          >
            <div className="p-4 bg-green-50 rounded-2xl">
              <p className="text-sm text-green-800 font-bold">Empresa Identificada:</p>
              <p className="text-green-700 font-medium truncate">{company?.nome_fantasia || company?.razao_social}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all text-lg"
                required
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#15803d' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-green-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Acessar'}
            </motion.button>
            <button
              type="button"
              onClick={() => setStep('cnpj')}
              className="w-full text-sm font-bold text-gray-400 hover:text-green-600 transition-colors"
            >
              ← Voltar
            </button>
          </motion.form>
        )}

        {step === 'signup' && (
          <motion.form
            key="signup"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onSubmit={handleSignup}
            className="space-y-6"
          >
            <div className="p-4 bg-blue-50 rounded-2xl">
              <p className="text-sm text-blue-800 font-bold">Primeiro Acesso para:</p>
              <p className="text-blue-700 font-medium truncate">{company?.nome_fantasia || company?.razao_social}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Email Principal</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all text-lg"
                required
                placeholder="exemplo@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Crie sua Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all text-lg"
                required
                placeholder="Mín. 6 caracteres"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: '#15803d' }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || password.length < 6}
              className="w-full py-5 bg-green-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Configurando...' : 'Finalizar Cadastro'}
            </motion.button>
            <button
              type="button"
              onClick={() => setStep('cnpj')}
              className="w-full text-sm font-bold text-gray-400 hover:text-green-600 transition-colors"
            >
              ← Alterar CNPJ
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LoginPage;
