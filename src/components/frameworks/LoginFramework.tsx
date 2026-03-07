
import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
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

interface LoginFrameworkProps {
    onSuccess: (user: any) => void;
    onRegisterRedirect: () => void;
}

const LoginFramework: React.FC<LoginFrameworkProps> = ({ onSuccess, onRegisterRedirect }) => {
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
                onRegisterRedirect();
                return;
            }

            setCompany(data);
            if (data.auth_user_id) {
                setStep('login');
            } else {
                setStep('signup');
            }
        } catch (err) {
            setError('Erro ao verificar CNPJ.');
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
                setError('Nenhum email associado. Contate o suporte.');
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email: company.email,
                password: password,
            });

            if (error) throw error;
            onSuccess(data.user);
        } catch (err) {
            setError('Senha incorreta.');
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

            onSuccess(authData.user);
        } catch (err) {
            setError('Erro ao criar conta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100"
        >
            <AnimatePresence mode="wait">
                {step === 'cnpj' && (
                    <motion.div key="cnpj" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="text-xl font-black mb-4 text-gray-800">Identificação <span className="text-green-600">FPGD</span></h2>
                        <div className="space-y-4">
                            <IMaskInput
                                mask="00.000.000/0000-00"
                                value={cnpj}
                                onAccept={(val: string) => setCnpj(val)}
                                className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-green-500 outline-none"
                                placeholder="CNPJ da Empresa"
                            />
                            <button
                                onClick={handleCnpjCheck}
                                disabled={loading || cnpj.length < 18}
                                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all"
                            >
                                {loading ? 'Verificando...' : 'Acessar Paineis'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'login' && (
                    <motion.form key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleLogin} className="space-y-4">
                        <div className="text-sm font-bold text-green-700 bg-green-50 p-3 rounded-lg truncate">
                            {company?.nome_fantasia || company?.razao_social}
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-green-500 outline-none"
                            placeholder="Sua Senha"
                            required
                        />
                        {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                        <button type="button" onClick={() => setStep('cnpj')} className="w-full text-xs text-gray-400 font-bold hover:text-green-600">Voltar</button>
                    </motion.form>
                )}

                {step === 'signup' && (
                    <motion.form key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSignup} className="space-y-4">
                        <div className="text-sm font-bold text-blue-700 bg-blue-50 p-3 rounded-lg">Configurar primeiro acesso</div>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-green-500 outline-none" placeholder="Email principal" required />
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 rounded-xl border-2 border-gray-100 focus:border-green-500 outline-none" placeholder="Criar senha" required />
                        {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all">
                            {loading ? 'Configurando...' : 'Finalizar e Entrar'}
                        </button>
                        <button type="button" onClick={() => setStep('cnpj')} className="w-full text-xs text-gray-400 font-bold hover:text-green-600">Mudar CNPJ</button>
                    </motion.form>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default LoginFramework;
