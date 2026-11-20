
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Eye, EyeOff, Send, CheckCircle2, X, Wrench, Home, ArrowRight } from 'lucide-react';
import Logo from '../components/Logo';
import { PHOTOS } from '../components/landing/media';
import { useTicketsEnabled } from '../crm/settings';

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
  const tickets = useTicketsEnabled() === true;

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
      navigate('/inicio');
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
    <div className="min-h-screen bg-bg text-fg grid lg:grid-cols-[1.15fr_1fr]">
      <div className="relative hidden lg:block overflow-hidden">
        <img src={PHOTOS.usinaCampo(1800)} alt="Usina solar em campo aberto" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_14_23/.55)_0%,rgb(11_14_23/.15)_45%,rgb(11_14_23/.85)_100%)]" />
        <a href="#/" className="absolute left-10 top-8"><Logo /></a>
        <p className="absolute left-10 bottom-10 right-10 max-w-[30ch] text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em]">
          A Frente dos integradores solares do RN, num só lugar.
        </p>
      </div>

      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-20">
        <div className="absolute inset-0 -z-0 pointer-events-none bg-[radial-gradient(60%_40%_at_100%_0%,rgb(34_221_164/.10),transparent_70%)]" />
        <div className="relative w-full max-w-[400px] mx-auto">
          <a href="#/" className="lg:hidden inline-block mb-10"><Logo /></a>
          <h1 className="text-[28px] font-extrabold tracking-tight">Entrar</h1>
          <p className="mt-1.5 text-sm text-fg-2">Acesse com o e-mail cadastrado na FPGD.</p>

          {error && (
            <div role="alert" className="mt-6 rounded-[10px] border border-danger/40 bg-danger/10 px-3.5 py-3 text-sm text-[#FFB3B9]">{error}</div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <label className="block">
              <span className="label">E-mail</span>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="field !h-12 !text-[15px]" placeholder="voce@empresa.com.br" required />
            </label>
            <label className="block">
              <span className="flex items-center justify-between">
                <span className="label">Senha</span>
                <button type="button" onClick={handleForgotPassword} className="text-[13px] font-semibold text-primary hover:text-primary-hover mb-1.5">Esqueci a senha</button>
              </span>
              <span className="relative block">
                <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password}
                  onChange={(e) => setPassword(e.target.value)} className="field !h-12 !text-[15px] !pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-fg-3 hover:text-fg">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            <button type="submit" disabled={loading} className="btn btn-primary w-full !h-12 !text-[15px]">
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-line flex items-center justify-between gap-4 text-sm">
            <span className="text-fg-2">Ainda não tem acesso?</span>
            <button onClick={() => setShowSignupModal(true)} className="btn btn-secondary">Criar cadastro</button>
          </div>
        </div>
      </div>

      {showSignupModal && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Novo cadastro">
          <div className="absolute inset-0 bg-[rgb(3_5_10/.75)]" onClick={() => setShowSignupModal(false)} />
          <div className="relative panel w-full max-w-[440px] p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">Novo cadastro</h2>
                <p className="text-sm text-fg-2 mt-0.5">Qual é o seu perfil?</p>
              </div>
              <button onClick={() => setShowSignupModal(false)} className="btn btn-ghost !px-2 -mr-2 -mt-1" aria-label="Fechar"><X size={18} /></button>
            </div>
            <div className="mt-5 space-y-2.5">
              <button onClick={() => navigate('/cadastro')} className="w-full text-left rounded-[12px] border border-line bg-raised hover:border-line-strong p-4 flex items-center gap-4 transition-colors">
                <Wrench size={20} className="text-cyan shrink-0" />
                <span className="flex-1"><span className="block font-semibold">Sou integrador</span><span className="block text-sm text-fg-2">Empresa que instala sistemas solares</span></span>
                <ArrowRight size={16} className="text-fg-3" />
              </button>
              {tickets && <button onClick={() => navigate('/cadastro_cliente')} className="w-full text-left rounded-[12px] border border-line bg-raised hover:border-line-strong p-4 flex items-center gap-4 transition-colors">
                <Home size={20} className="text-cyan shrink-0" />
                <span className="flex-1"><span className="block font-semibold">Sou cliente</span><span className="block text-sm text-fg-2">Tenho energia solar no meu imóvel</span></span>
                <ArrowRight size={16} className="text-fg-3" />
              </button>}
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="E-mail enviado">
          <div className="absolute inset-0 bg-[rgb(3_5_10/.75)]" onClick={() => setShowSuccessModal(false)} />
          <div className="relative panel w-full max-w-[400px] p-6 text-center">
            <Send className="mx-auto text-energy" size={28} />
            <h2 className="mt-4 text-lg font-bold">Confira seu e-mail</h2>
            <p className="mt-2 text-sm text-fg-2">Enviamos as instruções para redefinir a senha de {email}.</p>
            <button onClick={() => setShowSuccessModal(false)} className="btn btn-primary w-full mt-6"><CheckCircle2 size={16} /> Entendi</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
