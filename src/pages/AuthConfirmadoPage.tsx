import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import Logo from '../components/Logo';

/** Destino do link de confirmação de cadastro: abre a sessão e entra no sistema. */
const AuthConfirmadoPage: React.FC = () => {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<'abrindo' | 'ok' | 'erro'>('abrindo');

  useEffect(() => {
    (async () => {
      const partes = window.location.hash.split('#');
      const params = new URLSearchParams(partes[2] || '');
      if (params.get('error_code')) { setEstado('erro'); return; }
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) { setEstado('erro'); return; }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) { setEstado('erro'); return; }
      }
      setEstado('ok');
      setTimeout(() => navigate('/inicio', { replace: true }), 1800);
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-bg text-fg grid place-items-center px-4">
      <div className="panel w-full max-w-md p-8">
        <Logo />
        {estado === 'abrindo' && <p className="mt-8 text-sm text-fg-2">Confirmando seu e-mail…</p>}
        {estado === 'ok' && (
          <div className="mt-8">
            <CheckCircle2 className="text-ok" size={28} />
            <h1 className="mt-3 text-xl font-bold">E-mail confirmado</h1>
            <p className="mt-2 text-sm text-fg-2">Seu cadastro está ativo. Vamos te levar para a sua área da associação, onde chegam o termo de adesão e o boleto.</p>
          </div>
        )}
        {estado === 'erro' && (
          <div className="mt-8">
            <AlertCircle className="text-[#FF8B95]" size={28} />
            <h1 className="mt-3 text-xl font-bold">Link expirado ou já usado</h1>
            <p className="mt-2 text-sm text-fg-2">Se você já confirmou o e-mail, é só entrar com sua senha.</p>
            <Link to="/login" className="btn btn-primary mt-5">Ir para o login</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthConfirmadoPage;
