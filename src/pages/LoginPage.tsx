
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
      if (err.message === 'email rate limit exceeded') {
        setError('Muitas solicitações seguidas. Por favor, aguarde 1 minuto e tente novamente.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-10 bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(30,64,175,0.2)] border border-white/50"
      >
        <motion.h1
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-4xl font-black text-center text-slate-800 mb-10 pb-6 border-b border-slate-100 flex justify-center items-center gap-2 uppercase tracking-tighter"
        >
          <motion.span
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-blue-600"
          >
            ✦
          </motion.span>
          Login <span className="text-blue-600">FPGD</span>
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
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder-slate-300 text-lg font-black text-slate-700 shadow-inner"
              placeholder="exemplo@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] font-black text-blue-600 hover:text-indigo-700 transition-colors uppercase tracking-widest"
              >
                Esqueci a senha
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-5 pr-14 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg font-black text-slate-700 shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#2563eb' }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-blue-200 transition-all duration-200 disabled:opacity-50 uppercase tracking-[0.2em] border-b-4 border-blue-800"
          >
            {loading ? 'Acessando...' : 'ENTRAR NO SISTEMA ✦'}
          </motion.button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ainda não tem acesso?</p>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSignupModal(true)}
            className="px-10 py-4 bg-white text-blue-600 border-2 border-blue-500 font-black rounded-2xl hover:bg-blue-50 transition-all shadow-[0_4px_20px_-4px_rgba(37,99,235,0.3)] uppercase text-xs tracking-[0.2em]"
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
                  whileHover={{ scale: 1.02, x: 5, borderColor: '#3b82f6' }}
                  onClick={() => navigate('/cadastro_cliente')}
                  className="w-full flex items-center justify-between p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl text-left group transition-all"
                >
                  <div>
                    <span className="block text-xl font-black text-slate-800">Sou Cliente</span>
                    <span className="block text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Gestão e acompanhamento fpgd</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all ring-4 ring-blue-50">👤</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, x: 5, borderColor: '#3b82f6' }}
                  onClick={() => navigate('/cadastro')}
                  className="w-full flex items-center justify-between p-7 bg-slate-50 border-2 border-slate-100 rounded-3xl text-left group transition-all"
                >
                  <div>
                    <span className="block text-xl font-black text-slate-800">Sou Integrador</span>
                    <span className="block text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">Instalador técnico parceiro</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all ring-4 ring-blue-50">🛠️</div>
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
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-100 ring-8 ring-blue-50/50 border-2 border-blue-100/50">
                <Send className="w-12 h-12" />
              </div>
              
              <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter uppercase">E-mail Enviado!</h3>
              <p className="text-slate-400 font-bold text-sm leading-relaxed mb-10 px-4">
                As instruções para redefinir sua senha foram enviadas para o seu e-mail cadastrado.
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
