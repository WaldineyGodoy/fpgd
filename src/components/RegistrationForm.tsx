
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BuscaCNPJ from './BuscaCNPJ';
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
}

const RegistrationForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialCnpj = location.state?.initialCnpj || '';

    const [formData, setFormData] = useState<FormData>({
        cnpj: initialCnpj.replace(/\D/g, ''),
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
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [cnpjChecked, setCnpjChecked] = useState<boolean>(false);
    const [cnpjError, setCnpjError] = useState<string | null>(null);

    const handleCompanyFound = (data: any | null) => {
        if (data) {
            setFormData(prev => ({
                ...prev,
                cnpj: data.cnpj,
                razao_social: data.razao_social,
                nome_fantasia: data.nome_fantasia || data.razao_social,
                logradouro: data.logradouro,
                numero: data.numero,
                bairro: data.bairro,
                municipio: data.municipio,
                uf: data.uf,
                cep: data.cep,
            }));
            checkExistingCnpj(data.cnpj);
        } else {
            setCnpjChecked(false);
            // Don't clear everything, allow manual entry if requested
        }
    };

    const checkExistingCnpj = async (cnpj: string) => {
        const { data, error } = await supabase
            .from('companies')
            .select('cnpj')
            .eq('cnpj', cnpj)
            .single();

        if (data) {
            setCnpjError('Este CNPJ já está cadastrado em nossa base.');
            setCnpjChecked(false);
        } else {
            setCnpjError(null);
            setCnpjChecked(true);
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
            const { error } = await supabase
                .from('companies')
                .insert([formData]);

            if (error) throw error;
            setShowModal(true);
        } catch (error: any) {
            alert('Erro ao realizar cadastro: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        navigate('/success');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl p-8 bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl border border-white/20"
        >
            <h1 className="text-4xl font-black text-gray-800 mb-2">Cadastro <span className="text-green-600">FPGD</span></h1>
            <p className="text-gray-400 font-bold mb-10 border-b border-gray-100 pb-6 uppercase tracking-widest text-xs">Informações do Integrador Técnico</p>

            <form onSubmit={handleSubmit} className="space-y-8">
                <section className="space-y-6">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        Identificação
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 ml-1">CNPJ da Empresa</label>
                            <BuscaCNPJ onCompanyFound={handleCompanyFound} initialValue={initialCnpj} />
                            <AnimatePresence>
                                {cnpjError && (
                                    <motion.p
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-red-500 text-xs font-bold mt-1"
                                    >
                                        {cnpjError}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-700 ml-1">Razão Social</label>
                            <input
                                type="text"
                                name="razao_social"
                                value={formData.razao_social}
                                onChange={handleChange}
                                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-medium"
                                required
                            />
                        </div>
                    </div>
                </section>

                <AnimatePresence>
                    {cnpjChecked && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-8 overflow-hidden"
                        >
                            <section className="space-y-6">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Contato</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-gray-700 ml-1">E-mail</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all" />
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
                                </div>
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Endereço</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2 md:col-span-1">
                                        <label className="text-sm font-black text-gray-700 ml-1">CEP</label>
                                        <IMaskInput
                                            mask="00000-000"
                                            value={formData.cep}
                                            onAccept={(value: string) => setFormData(prev => ({ ...prev, cep: value }))}
                                            className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all"
                                        />
                                    </div>
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
                            </section>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full py-6 bg-green-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-green-100 border-b-8 border-green-800 disabled:opacity-50 transition-all"
                            >
                                {loading ? 'ENVIANDO...' : 'FINALIZAR CADASTRO ✦'}
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!cnpjChecked && (
                    <div className="p-8 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 text-center">
                        <p className="text-gray-400 font-bold italic">Aguardando identificação do CNPJ para liberar os demais campos...</p>
                    </div>
                )}
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
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm">✓</div>
                            <h3 className="text-3xl font-black text-gray-800 mb-2">Sucesso!</h3>
                            <p className="text-gray-500 font-bold mb-8">Sua empresa foi cadastrada. Agora você já pode criar seu acesso.</p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={closeModal}
                                className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-100"
                            >
                                FECHAR E CONTINUAR
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default RegistrationForm;
