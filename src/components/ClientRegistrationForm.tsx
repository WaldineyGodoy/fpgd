
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import DimensionamentoSolar from './DimensionamentoSolar';
import { IMaskInput } from 'react-imask';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
    cnpj: string;
    razao_social: string;
    email: string;
    telefone: string;
    password?: string;
    user_type: 'cliente';
}

const ClientRegistrationForm: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Registration, 2: Solar Dimensioning
    const [formData, setFormData] = useState<FormData>({
        cnpj: '',
        razao_social: '',
        email: '',
        telefone: '',
        password: '',
        user_type: 'cliente',
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
    const [cnpjError, setCnpjError] = useState<string | null>(null);

    const checkExistingCnpj = async (cnpj: string) => {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        if (cleanCnpj.length < 11) return;
        
        const { data } = await supabase
            .from('companies')
            .select('cnpj')
            .eq('cnpj', cleanCnpj)
            .single();

        if (data) {
            setCnpjError('Este documento já está cadastrado.');
        } else {
            setCnpjError(null);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Auth SignUp
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password!,
                options: {
                    data: {
                        nome: formData.razao_social,
                        user_type: formData.user_type
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro ao criar usuário.");

            // 2. Insert into companies
            const { password, ...companyData } = formData;
            const cleanCnpj = formData.cnpj.replace(/\D/g, '');
            
            const { error: dbError } = await supabase
                .from('companies')
                .insert([{
                    ...companyData,
                    cnpj: cleanCnpj,
                    auth_user_id: authData.user.id
                }]);

            if (dbError) throw dbError;

            // 3. Show confirmation modal for 3 seconds
            setShowConfirmModal(true);
            setTimeout(() => {
                setShowConfirmModal(false);
                setStep(2); // Go to Solar Dimensioning
            }, 3000);

        } catch (error: any) {
            alert('Erro ao realizar cadastro: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = () => {
        return formData.email && formData.telefone && (formData.password?.length || 0) >= 6 && formData.cnpj && formData.razao_social;
    };

    if (step === 2) {
        return (
            <div className="w-full max-w-5xl px-4 py-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black text-gray-800 mb-2">Simulação <span className="text-orange-500">Solar</span></h2>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs italic">Personalize seu sistema agora</p>
                </div>
                <DimensionamentoSolar />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl p-10 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 relative overflow-hidden"
        >
            <div className="flex justify-between items-start mb-10">
                <div>
                    <h1 className="text-5xl font-black text-gray-800 tracking-tight">Cadastro <span className="text-green-600">Cliente</span></h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-1 w-12 bg-green-500 rounded-full" />
                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Dados Essenciais</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                        <input 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-700 bg-gray-50/30" 
                            placeholder="exemplo@email.com" 
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                        <IMaskInput
                            mask="(00) 00000-0000"
                            value={formData.telefone}
                            onAccept={(value: string) => setFormData(prev => ({ ...prev, telefone: value }))}
                            required
                            className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-700 bg-gray-50/30"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                    <div className="space-y-3 md:col-span-2">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Crie sua Senha</label>
                        <input 
                            type="password" 
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            required 
                            className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-700 bg-gray-50/30" 
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">CPF ou CNPJ</label>
                        <IMaskInput
                            mask={[
                                { mask: '000.000.000-00' },
                                { mask: '00.000.000/0000-00' }
                            ]}
                            value={formData.cnpj}
                            onAccept={(value: string) => setFormData(prev => ({ ...prev, cnpj: value }))}
                            onBlur={() => checkExistingCnpj(formData.cnpj)}
                            className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-black text-gray-800 bg-gray-50/30"
                            placeholder="000.000.000-00"
                        />
                        {cnpjError && <p className="text-red-500 text-[10px] font-black uppercase ml-1 animate-bounce">{cnpjError}</p>}
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo / Razão Social</label>
                        <input 
                            type="text" 
                            name="razao_social" 
                            value={formData.razao_social} 
                            onChange={handleChange} 
                            className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-700 bg-gray-50/30" 
                            required 
                            placeholder="Digite como preferir ser chamado"
                        />
                    </div>
                </section>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !isFormValid()}
                    className="w-full py-6 bg-green-600 text-white font-black text-2xl rounded-2xl shadow-2xl shadow-green-100 border-b-8 border-green-800 disabled:opacity-50 transition-all uppercase tracking-widest flex items-center justify-center gap-4"
                >
                    {loading ? 'Processando...' : 'Registrar e Avançar ⚡'}
                </motion.button>
            </form>

            <AnimatePresence>
                {showConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 z-[100]"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white p-12 rounded-[3.5rem] max-w-md w-full text-center shadow-inner relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 to-blue-500" />
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8 shadow-lg shadow-green-50 ring-8 ring-green-50/50">✉️</div>
                            <h3 className="text-4xl font-black text-gray-800 mb-4 tracking-tight">Verifique seu E-mail</h3>
                            <p className="text-gray-500 font-bold mb-0 leading-relaxed">
                                Enviamos um link de confirmação para <br/>
                                <span className="text-green-600 italic underline uppercase text-sm">{formData.email}</span>
                            </p>
                            <div className="mt-10 flex flex-col items-center gap-2">
                                <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Redirecionando em instantes</div>
                                <div className="flex gap-1.5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ClientRegistrationForm;
