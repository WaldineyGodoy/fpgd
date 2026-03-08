
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../supabaseClient';
import BuscaCNPJ from './BuscaCNPJ';
import BuscaCEP from './BuscaCEP';
import BuscaIntegrador from './BuscaIntegrador';
import { IMaskInput } from 'react-imask';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    email: string;
    telefone: string;
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    password?: string;
    user_type: 'cliente';
    paineis_quantidade: number;
    paineis_potencia: number;
    inversor_quantidade: number;
    inversor_potencia: number;
    integrador_id?: string;
}

const ClientRegistrationForm: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        cnpj: '',
        razao_social: '',
        nome_fantasia: '',
        email: '',
        telefone: '',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        municipio: '',
        uf: '',
        password: '',
        user_type: 'cliente',
        paineis_quantidade: 0,
        paineis_potencia: 0,
        inversor_quantidade: 0,
        inversor_potencia: 0,
        integrador_id: '',
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [cnpjError, setCnpjError] = useState<string | null>(null);

    const handleCompanyFound = (data: any | null) => {
        if (data) {
            setFormData(prev => ({
                ...prev,
                cnpj: data.cnpj,
                razao_social: data.razao_social,
                nome_fantasia: data.nome_fantasia || data.razao_social,
                logradouro: data.logradouro || prev.logradouro,
                bairro: data.bairro || prev.bairro,
                municipio: data.municipio || prev.municipio,
                uf: data.uf || prev.uf,
                cep: data.cep || prev.cep,
            }));
            checkExistingCnpj(data.cnpj);
        }
    };

    const handleAddressFound = (data: any | null) => {
        if (data) {
            setFormData(prev => ({
                ...prev,
                logradouro: data.logradouro,
                bairro: data.bairro || '',
                municipio: data.city || data.municipio,
                uf: data.state || data.uf,
                cep: data.cep
            }));
        }
    };

    const checkExistingCnpj = async (cnpj: string) => {
        const cleanCnpj = cnpj.replace(/\D/g, '');
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
        setFormData(prev => ({ 
            ...prev, 
            [name]: e.target.type === 'number' ? Number(value) : value 
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password!,
                options: {
                    data: {
                        nome: formData.nome_fantasia || formData.razao_social,
                        user_type: formData.user_type
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro ao criar usuário.");

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
            setShowModal(true);
        } catch (error: any) {
            alert('Erro ao realizar cadastro: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoading(false);
        }
    };

    const isStep1Valid = () => {
        return formData.email && formData.telefone && (formData.password?.length || 0) >= 6 && formData.cnpj && formData.razao_social;
    };

    const isStep2Valid = () => {
        return formData.cep && formData.logradouro && formData.municipio && formData.uf;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl p-8 bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl border border-white/20"
        >
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-800">Cadastro <span className="text-green-600">Cliente</span></h1>
                    <p className="text-gray-400 font-bold border-b border-gray-100 pb-2 uppercase tracking-widest text-xs">Passo {step} de 3</p>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-2 w-8 rounded-full transition-all ${step >= i ? 'bg-green-600' : 'bg-gray-100'}`} />
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <section className="space-y-6">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Acesso & Identificação</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">E-mail Principal (Login)</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" placeholder="seu@email.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">Telefone</label>
                                        <IMaskInput
                                            mask="(00) 00000-0000"
                                            value={formData.telefone}
                                            onAccept={(value: string) => setFormData(prev => ({ ...prev, telefone: value }))}
                                            required
                                            className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">Senha (Mín. 6 caracteres)</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">CPF/CNPJ</label>
                                        <IMaskInput
                                            mask={[
                                                { mask: '000.000.000-00' },
                                                { mask: '00.000.000/0000-00' }
                                            ]}
                                            value={formData.cnpj}
                                            onAccept={(value: string) => {
                                                setFormData(prev => ({ ...prev, cnpj: value }));
                                                const clean = value.replace(/\D/g, '');
                                                if (clean.length === 14) {
                                                    // Auto-search CNPJ
                                                    const searchCnpj = async () => {
                                                        try {
                                                            const resp = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
                                                            handleCompanyFound(resp.data);
                                                        } catch (e) {
                                                            console.error('Erro ao buscar CNPJ', e);
                                                        }
                                                    };
                                                    searchCnpj();
                                                }
                                            }}
                                            onBlur={() => checkExistingCnpj(formData.cnpj)}
                                            className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold"
                                        />
                                        {cnpjError && <p className="text-red-500 text-[10px] font-bold uppercase ml-1">{cnpjError}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">Nome/Razão Social</label>
                                        <input type="text" name="razao_social" value={formData.razao_social} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-medium" required />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Integrador Responsável</h2>
                                <BuscaIntegrador initialValue={formData.integrador_id} onSelect={(int) => setFormData(prev => ({ ...prev, integrador_id: int?.id }))} />
                                <div className="flex flex-col md:flex-row gap-4 mt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => {
                                            if (formData.integrador_id) {
                                                alert('Integrador vinculado com sucesso!');
                                            } else {
                                                alert('Por favor, selecione um integrador na busca primeiro.');
                                            }
                                        }}
                                        className={`flex-1 p-4 border-2 rounded-2xl text-xs font-black uppercase transition-all ${
                                            formData.integrador_id 
                                            ? 'bg-green-50 border-green-600 text-green-700' 
                                            : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-green-50 hover:border-green-200'
                                        }`}
                                    >
                                        🔗 Vincular ao Ticket
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, integrador_id: '' }))}
                                        className="flex-1 p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xs font-black text-gray-600 uppercase hover:bg-gray-100 transition-all"
                                    >
                                        ✕ Não tenho empresa
                                    </motion.button>
                                </div>
                            </section>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => setStep(2)}
                                disabled={!isStep1Valid()}
                                className="w-full py-6 bg-green-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-green-100 border-b-8 border-green-800 disabled:opacity-50 transition-all uppercase tracking-widest"
                            >
                                AVANÇAR ✦
                            </motion.button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <section className="space-y-6">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Localização</h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">CEP</label>
                                        <BuscaCEP initialValue={formData.cep} onAddressFound={handleAddressFound} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-black text-gray-700 ml-1">Logradouro</label>
                                            <input type="text" name="logradouro" value={formData.logradouro} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-gray-700 ml-1">Número</label>
                                            <input type="text" name="numero" value={formData.numero} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-gray-700 ml-1">Cidade</label>
                                            <input type="text" name="municipio" value={formData.municipio} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-black text-gray-700 ml-1">UF</label>
                                            <input type="text" name="uf" value={formData.uf} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setStep(1)} className="flex-1 py-6 bg-gray-100 text-gray-400 font-black rounded-2xl transition-all uppercase">Voltar</button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => setStep(3)}
                                    disabled={!isStep2Valid()}
                                    className="flex-[2] py-6 bg-green-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-green-100 border-b-8 border-green-800 disabled:opacity-50 transition-all uppercase"
                                >
                                    AVANÇAR ✦
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <section className="space-y-6">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Dados do Sistema</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">Qtd. Paineis</label>
                                        <input type="number" name="paineis_quantidade" value={formData.paineis_quantidade} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">Potência Paineis (W)</label>
                                        <input type="number" name="paineis_potencia" value={formData.paineis_potencia} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">Qtd. Inversores</label>
                                        <input type="number" name="inversor_quantidade" value={formData.inversor_quantidade} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">Potência Inversor (kW)</label>
                                        <input type="number" name="inversor_potencia" value={formData.inversor_potencia} onChange={handleChange} className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </section>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setStep(2)} className="flex-1 py-6 bg-gray-100 text-gray-400 font-black rounded-2xl transition-all uppercase">Voltar</button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-6 bg-green-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-green-100 border-b-8 border-green-800 disabled:opacity-50 transition-all uppercase"
                                >
                                    {loading ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO ✦'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white p-10 rounded-[3rem] max-w-md w-full text-center shadow-inner"
                        >
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">⚡</div>
                            <h3 className="text-3xl font-black text-gray-800 mb-2">Seja Bem-vindo!</h3>
                            <p className="text-gray-500 font-bold mb-8 italic">Seu perfil de cliente foi criado com sucesso.</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-100 uppercase"
                            >
                                FAZER LOGIN
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ClientRegistrationForm;
