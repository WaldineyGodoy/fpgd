
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { IMaskInput } from 'react-imask';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Send, CheckCircle2 } from 'lucide-react';

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
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showSignupModal, setShowSignupModal] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/tickets');
    } catch (err: any) {
      setError('Credenciais inválidas ou erro no login.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Por favor, informe seu e-mail para recuperar a senha.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname + '#/reset-password',
      });
      if (error) throw error;
      setShowSuccessModal(true);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
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
              <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium text-center">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all placeholder-gray-300 text-lg font-medium"
              placeholder="exemplo@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-bold text-gray-700">Senha</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
              >
                Esqueci a senha
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 pr-12 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all text-lg font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#15803d' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-green-600 text-white font-black text-lg rounded-2xl shadow-xl shadow-green-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </motion.button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
          <p className="text-sm font-bold text-gray-400">Não tem uma conta?</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSignupModal(true)}
            className="px-8 py-3 bg-white text-green-600 border-2 border-green-500 font-black rounded-2xl hover:bg-green-50 transition-all shadow-sm"
          >
            CADASTRE-SE AGORA
          </motion.button>
        </div>
      </motion.div>

      {/* Registration Selection Modal */}
      <AnimatePresence>
        {showSignupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-white p-10 rounded-[3rem] max-w-md w-full shadow-inner relative"
            >
              <button 
                onClick={() => setShowSignupModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <motion.span whileHover={{ scale: 1.2 }}>✕</motion.span>
              </button>

              <h3 className="text-3xl font-black text-gray-800 text-center mb-2">Novo Cadastro</h3>
              <p className="text-gray-400 font-bold text-center mb-10 text-xs uppercase tracking-widest">Selecione seu perfil</p>
              
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02, x: 5 }}
                  onClick={() => navigate('/cadastro_cliente')}
                  className="w-full flex items-center justify-between p-6 bg-slate-50 border-2 border-transparent hover:border-green-500 rounded-2xl text-left group transition-all"
                >
                  <div>
                    <span className="block text-lg font-black text-gray-800">Sou Cliente</span>
                    <span className="block text-xs font-bold text-gray-400 uppercase">Gestão e acompanhamento</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-sm text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">👤</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 5 }}
                  onClick={() => navigate('/cadastro')}
                  className="w-full flex items-center justify-between p-6 bg-slate-50 border-2 border-transparent hover:border-blue-500 rounded-2xl text-left group transition-all"
                >
                  <div>
                    <span className="block text-lg font-black text-gray-800">Sou Integrador</span>
                    <span className="block text-xs font-bold text-gray-400 uppercase">Instalador técnico</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">🛠️</div>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal for Forgot Password */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[60]"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-white p-10 rounded-[3rem] max-w-sm w-full shadow-2xl relative text-center"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-50 ring-8 ring-green-50/50">
                <Send className="w-10 h-10" />
              </div>
              
              <h3 className="text-2xl font-black text-gray-800 mb-4">E-mail Enviado!</h3>
              <p className="text-gray-500 font-bold text-sm leading-relaxed mb-8">
                Instruções de recuperação foram enviadas para:<br/>
                <span className="text-green-600 break-all font-black">{email}</span>
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} /> ENTENDI
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
