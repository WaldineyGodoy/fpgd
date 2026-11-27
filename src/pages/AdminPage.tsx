import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Shield, Headset, Building2, KeyRound, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatCnpj, matriculaLabel } from '../crm/data';
import { PageHeader, useToast } from '../crm/ui';

interface Acesso {
  id: string; nome: string | null; razao_social: string | null; cnpj: string; matricula: number | null;
  user_type: 'superadmin' | 'mediador' | 'integrador' | 'cliente'; is_admin: boolean; status_associado: string;
  email: string | null; telefone: string | null; tem_login: boolean; login_email: string | null;
  email_confirmado_em: string | null; ultimo_acesso_em: string | null; login_criado_em: string | null;
}

type Perfil = 'superadmin' | 'admin' | 'mediador' | 'integrador' | 'cliente';
const perfilDe = (a: Acesso): Perfil => (a.user_type === 'integrador' && a.is_admin ? 'admin' : a.user_type);

const PERFIS: { id: Perfil; nome: string; icon: React.ElementType; cls: string; ve: string }[] = [
  { id: 'superadmin', nome: 'Superadmin', icon: ShieldCheck, cls: 'text-energy', ve: 'Tudo, inclusive credenciais, API keys e esta tela.' },
  { id: 'admin', nome: 'Admin', icon: Shield, cls: 'text-primary', ve: 'Todas as empresas, contratos, cobranças e Pagamentos; altera planos e configurações. Não vê credenciais.' },
  { id: 'mediador', nome: 'Mediador', icon: Headset, cls: 'text-st-inscrito', ve: 'Consulta o CRM e os tickets. Não altera configurações.' },
  { id: 'integrador', nome: 'Integrador', icon: Building2, cls: 'text-fg-2', ve: 'Só a própria empresa: situação, contrato e mensalidades.' },
];

type Filtro = 'login' | 'equipe' | 'integradores' | 'sem_login' | 'pendentes';
const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'login', label: 'Com login' },
  { id: 'equipe', label: 'Equipe e admins' },
  { id: 'integradores', label: 'Integradores' },
  { id: 'pendentes', label: 'E-mail não confirmado' },
  { id: 'sem_login', label: 'Sem login' },
];

const quando = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const dias = Math.floor((Date.now() - d.getTime()) / 864e5);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  return d.toLocaleDateString('pt-BR');
};

const AdminPage: React.FC = () => {
  const toast = useToast();
  const [rows, setRows] = useState<Acesso[] | null>(null);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('login');
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('acessos_lista');
    if (error) { setErro(error.message); setRows([]); return; }
    setErro(''); setRows((data || []) as Acesso[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const contagem = useMemo(() => {
    const r = rows || [];
    return {
      login: r.filter((a) => a.tem_login).length,
      equipe: r.filter((a) => perfilDe(a) !== 'integrador' && perfilDe(a) !== 'cliente').length,
      integradores: r.filter((a) => a.user_type === 'integrador').length,
      pendentes: r.filter((a) => a.tem_login && !a.email_confirmado_em).length,
      sem_login: r.filter((a) => !a.tem_login).length,
    } as Record<Filtro, number>;
  }, [rows]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    return (rows || []).filter((a) => {
      const p = perfilDe(a);
      if (filtro === 'login' && !a.tem_login) return false;
      if (filtro === 'equipe' && (p === 'integrador' || p === 'cliente')) return false;
      if (filtro === 'integradores' && a.user_type !== 'integrador') return false;
      if (filtro === 'pendentes' && !(a.tem_login && !a.email_confirmado_em)) return false;
      if (filtro === 'sem_login' && a.tem_login) return false;
      if (!q) return true;
      return [a.nome, a.razao_social, a.login_email, a.email, matriculaLabel(a.matricula)].some((v) => (v || '').toLowerCase().includes(q))
        || (digits.length >= 3 && a.cnpj?.replace(/\D/g, '').includes(digits));
    });
  }, [rows, filtro, busca]);

  const mudarPerfil = async (a: Acesso, admin: boolean) => {
    const msg = admin
      ? `Tornar ${a.nome} admin? A empresa passa a ver todas as empresas e os pagamentos da FPGD.`
      : `Tirar o acesso de admin de ${a.nome}? Ela volta a ver só a própria empresa.`;
    if (!confirm(msg)) return;
    setSalvando(a.id);
    const { error } = await supabase.from('companies').update({ is_admin: admin }).eq('id', a.id);
    if (!error) await supabase.from('crm_eventos').insert({ company_id: a.id, tipo: 'status', descricao: admin ? 'Promovido a administrador da FPGD.' : 'Acesso de administrador removido.' });
    setSalvando(null);
    if (error) { toast('error', error.message); return; }
    toast('ok', admin ? `${a.nome} agora é admin.` : `${a.nome} voltou a integrador.`);
    load();
  };

  const redefinirSenha = async (a: Acesso) => {
    if (!a.login_email || !confirm(`Enviar um link de redefinição de senha para ${a.login_email}?`)) return;
    setSalvando(a.id);
    const { error } = await supabase.auth.resetPasswordForEmail(a.login_email, { redirectTo: `${window.location.origin}/` });
    setSalvando(null);
    if (error) toast('error', error.message);
    else toast('ok', `Link de redefinição enviado para ${a.login_email}.`);
  };

  return (
    <div className="max-w-[1180px]">
      <PageHeader title="Gestão de acessos"
        description="Quem entra no sistema e o que cada um vê. Promova integradores a admin ou devolva-os ao perfil de integrador, e envie link de nova senha para quem perdeu o acesso."
        actions={<button className="btn btn-secondary" onClick={() => { setRows(null); load(); }}><RefreshCw size={16} /> Atualizar</button>} />

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-px bg-line rounded-[16px] overflow-hidden border border-line mb-6">
        {PERFIS.map((p) => {
          const n = (rows || []).filter((a) => perfilDe(a) === p.id && (p.id !== 'integrador' || a.tem_login)).length;
          return (
            <div key={p.id} className="bg-panel p-4">
              <p className={`flex items-center gap-2 text-sm font-bold ${p.cls}`}><p.icon size={16} /> {p.nome}
                <span className="ml-auto text-fg tabular-nums">{rows ? n : '–'}</span></p>
              <p className="mt-1.5 text-xs text-fg-3 leading-relaxed">{p.ve}</p>
            </div>
          );
        })}
      </section>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-4">
        <div className="flex gap-1 overflow-x-auto pb-px" role="tablist">
          {FILTROS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filtro === f.id} onClick={() => setFiltro(f.id)}
              className={`shrink-0 rounded-[10px] px-3 h-9 text-sm font-semibold transition-colors ${filtro === f.id ? 'bg-energy-soft text-fg' : 'text-fg-2 hover:bg-raised hover:text-fg'}`}>
              {f.label} <span className="ml-1 text-fg-3 tabular-nums">{rows ? contagem[f.id] : ''}</span>
            </button>
          ))}
        </div>
        <label className="relative lg:ml-auto lg:w-[320px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
          <input className="field !pl-9" placeholder="Empresa, e-mail, CNPJ ou matrícula" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </label>
      </div>

      {erro && <div className="panel p-4 mb-4 text-sm">Não foi possível carregar os acessos: {erro}</div>}

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-xs text-fg-3 border-b border-line">
              <th className="px-4 py-3 font-semibold">Empresa</th>
              <th className="px-4 py-3 font-semibold">Login</th>
              <th className="px-4 py-3 font-semibold">Último acesso</th>
              <th className="px-4 py-3 font-semibold">Perfil</th>
              <th className="px-4 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows === null ? (
              Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="skeleton h-9" /></td></tr>)
            ) : lista.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-fg-3">Nenhum acesso neste filtro{busca ? ' com essa busca' : ''}.</td></tr>
            ) : lista.map((a) => {
              const p = perfilDe(a);
              const meta = PERFIS.find((x) => x.id === p);
              return (
                <tr key={a.id} className="align-middle">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-fg">{a.nome || 'Sem nome'}</p>
                    <p className="text-xs text-fg-3 tabular-nums">{a.matricula ? `${matriculaLabel(a.matricula)} · ` : ''}{formatCnpj(a.cnpj)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {a.tem_login ? (
                      <>
                        <p className="text-fg-2 break-all">{a.login_email}</p>
                        <p className={`text-xs ${a.email_confirmado_em ? 'text-fg-3' : 'text-st-inadimplente'}`}>
                          {a.email_confirmado_em ? `Conta criada ${quando(a.login_criado_em)}` : 'E-mail ainda não confirmado'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-fg-3">Sem login</p>
                        <p className="text-xs text-fg-3">{a.email ? `Cadastra-se com ${a.email}` : 'Sem e-mail na base'}</p>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-fg-2 tabular-nums">{a.tem_login ? quando(a.ultimo_acesso_em) : '—'}</td>
                  <td className="px-4 py-3">
                    {a.user_type === 'integrador' ? (
                      <select className="field !h-9 !py-0 w-[150px]" value={p} disabled={salvando === a.id}
                        onChange={(e) => mudarPerfil(a, e.target.value === 'admin')} aria-label={`Perfil de ${a.nome}`}>
                        <option value="integrador">Integrador</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${meta?.cls || 'text-fg-2'}`}>
                        {meta && <meta.icon size={15} />}{meta?.nome || 'Cliente'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {a.tem_login && (
                        <button className="btn btn-ghost btn-sm" onClick={() => redefinirSenha(a)} disabled={salvando === a.id} title="Envia um link de nova senha para o e-mail do login">
                          <KeyRound size={14} /> Nova senha
                        </button>
                      )}
                      {a.user_type === 'integrador' && (
                        <Link className="btn btn-ghost btn-sm" to={`/crm?a=${a.id}`} title="Abrir no CRM"><ExternalLink size={14} /> CRM</Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-fg-3">Empresas sem login viram admin assim que se cadastrarem com o e-mail que está na base. Só o superadmin vê esta tela.</p>
    </div>
  );
};

export default AdminPage;
