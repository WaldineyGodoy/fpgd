
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleSession = async () => {
      // With HashRouter, the URL looks like /#/reset-password#access_token=...
      // We need to parse the second part of the hash
      const hash = window.location.hash;
      if (hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.split('#')[2]); // Get the part after the second #
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Error setting session:', error.message);
            setError('O link de recuperação parece inválido ou expirou.');
          }
        }
      } else {
        // Check if there is already a session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Sessão não encontrada. Por favor, solicite um novo link de recuperação.');
        }
      }
    };
    
    handleSession();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha. O link pode ter expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 relative overflow-hidden"
      >
        {/* Decorativo */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-blue-500" />
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-green-50 ring-8 ring-green-50/50">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Nova <span className="text-green-600">Senha</span></h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Segurança FPGD</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-4"
            >
              <div className="flex justify-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 animate-bounce" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-slate-800">Senha Alterada!</h2>
                <p className="text-slate-500 font-medium">Sua nova senha foi salva com sucesso. Redirecionando para o login...</p>
              </div>
              <div className="flex justify-center gap-1.5 pt-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleReset}
              className="space-y-6"
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-5 pr-14 rounded-2xl border-2 border-slate-100 focus:border-green-500 outline-none transition-all font-bold text-slate-700 bg-slate-50/30"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-green-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-5 pr-14 rounded-2xl border-2 border-slate-100 focus:border-green-500 outline-none transition-all font-bold text-slate-700 bg-slate-50/30"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-green-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-green-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-green-100 border-b-8 border-green-800 disabled:opacity-50 transition-all uppercase tracking-widest flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>Atualizando...</>
                ) : (
                  <>
                    Salvar Nova Senha <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2 text-slate-400 font-bold text-xs uppercase hover:text-slate-600 transition-colors"
              >
                Voltar ao Login
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
