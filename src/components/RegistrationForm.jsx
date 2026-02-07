
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BuscaCNPJ from './BuscaCNPJ';
import { supabase } from '../supabaseClient';
import { IMaskInput } from 'react-imask';

const RegistrationForm = () => {
    const location = useLocation();
    const [formData, setFormData] = useState({
        cnpj: '',
        razao_social: '',
        nome_fantasia: '',
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        municipio: '',
        uf: '',
        email: '',
        telefone: '',
        contato_nome: '',
        participa_manifestacao: '',
        afiliacao_associacao: ''
    });

    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [warningMsg, setWarningMsg] = useState('');

    // Handle incoming state from Router (e.g. from AccessPage)
    useEffect(() => {
        if (location.state?.message) {
            setWarningMsg(location.state.message);
            // Clear warning after 10 seconds? Or keep it? keeping it is better visibility.
        }
        if (location.state?.initialCnpj) {
            // We technically need to search for it to fill data, 
            // but for now just setting it might be enough if we modify BuscaCNPJ or just let user search.
            // Actually, let's just pre-fill the state so BuscaCNPJ sees it? 
            // BuscaCNPJ manages its own state. passing `initialValue` prop would be best.
            // For simplicity, we just show the message.
        }
    }, [location.state]);


    const checkCnpjExists = async (cnpj) => {
        const { data } = await supabase
            .from('companies')
            .select('id')
            .eq('cnpj', cnpj)
            .single();
        return !!data;
    };

    const handleCompanyFound = async (data) => {
        setErrorMsg('');
        if (data) {
            const exists = await checkCnpjExists(data.cnpj);
            if (exists) {
                setErrorMsg('Empresa já inscrita, entre com outro CNPJ');
            }

            setFormData(prev => ({
                ...prev,
                cnpj: data.cnpj || prev.cnpj,
                razao_social: data.razao_social || '',
                nome_fantasia: data.nome_fantasia || data.razao_social || '',
                cep: data.cep || '',
                logradouro: data.logradouro || '',
                numero: data.numero || '',
                bairro: data.bairro || '',
                municipio: data.municipio || '',
                uf: data.uf || '',
                email: data.email || '',
                telefone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone_1 || ''}` : ''
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhoneChange = (value) => {
        setFormData(prev => ({
            ...prev,
            telefone: value
        }));
    };

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setWarningMsg(''); // Clear warning on submit attempt

        if (!formData.razao_social) {
            setErrorMsg('Por favor, busque o CNPJ para preencher os dados da empresa.');
            return;
        }

        if (!validateEmail(formData.email)) {
            setErrorMsg('Por favor, insira um e-mail válido.');
            return;
        }

        const phoneClean = formData.telefone.replace(/\D/g, '');
        if (phoneClean.length !== 11) {
            setErrorMsg('Por favor, insira um número de celular válido com DDD.');
            return;
        }
        if (phoneClean[2] !== '9') {
            setErrorMsg('O número deve ser um celular (iniciando com 9).');
            return;
        }

        const exists = await checkCnpjExists(formData.cnpj);
        if (exists) {
            setErrorMsg('Empresa já inscrita, entre com outro CNPJ');
            return;
        }

        try {
            const { error } = await supabase
                .from('companies')
                .insert([formData]);

            if (error) {
                if (error.code === '23505') throw new Error('Empresa já inscrita.');
                throw error;
            }

            setShowModal(true);
        } catch (error) {
            console.error(error);
            setErrorMsg(error.message || 'Erro ao salvar o cadastro.');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        window.location.href = '/'; // Go back to home/access page?
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-3xl bg-white p-6 md:p-10 rounded-2xl border border-gray-100 shadow-xl">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 border-b border-gray-100 pb-4">
                    Cadastro <span className="text-green-600">FPGD</span>
                </h1>

                {/* Custom Warning from Redirect */}
                {warningMsg && (
                    <div className="p-4 mb-6 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-center font-bold animate-pulse">
                        ⚠️ {warningMsg}
                    </div>
                )}

                <BuscaCNPJ onCompanyFound={handleCompanyFound} />

                {errorMsg && errorMsg.includes('Empresa já inscrita') && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-center font-bold">
                        ⚠️ {errorMsg}
                    </div>
                )}

                {/* ... Rest of form remains same ... */}
                {/* Shortening file updates for brevity where possible, but here we need the full file for write_to_file */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Razão Social</label>
                        <input
                            type="text"
                            name="razao_social"
                            value={formData.razao_social}
                            readOnly
                            className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed focus:outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome Fantasia</label>
                        <input
                            type="text"
                            name="nome_fantasia"
                            value={formData.nome_fantasia}
                            onChange={handleChange}
                            className="w-full p-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="exemplo@email.com"
                            className="w-full p-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Celular</label>
                        <IMaskInput
                            mask="(00) 90000-0000"
                            value={formData.telefone}
                            unmask={false}
                            onAccept={handlePhoneChange}
                            placeholder="(00) 90000-0000"
                            className="w-full p-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="h-px bg-gray-100 my-8" />

                <div className="space-y-6">
                    <div>
                        <label htmlFor="contato_nome" className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Contato Principal
                        </label>
                        <input
                            type="text"
                            id="contato_nome"
                            name="contato_nome"
                            value={formData.contato_nome}
                            onChange={handleChange}
                            required
                            className="w-full p-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none transition-all placeholder-gray-400"
                            placeholder="Digite seu nome completo"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Você irá participar da manifestação dia 06/02?
                        </label>
                        <div className="flex gap-6">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="participa_manifestacao"
                                    value="Sim"
                                    checked={formData.participa_manifestacao === 'Sim'}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                                />
                                <span className="text-gray-700 group-hover:text-green-600 transition-colors">Sim</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="participa_manifestacao"
                                    value="Não"
                                    checked={formData.participa_manifestacao === 'Não'}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                                />
                                <span className="text-gray-700 group-hover:text-green-600 transition-colors">Não</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Você quer se afiliar a uma associação para defender os seus interesses na concessionaria e outras instituições?
                        </label>
                        <div className="flex gap-6">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="afiliacao_associacao"
                                    value="Sim"
                                    checked={formData.afiliacao_associacao === 'Sim'}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                                />
                                <span className="text-gray-700 group-hover:text-green-600 transition-colors">Sim</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="afiliacao_associacao"
                                    value="Não"
                                    checked={formData.afiliacao_associacao === 'Não'}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 focus:ring-green-500"
                                />
                                <span className="text-gray-700 group-hover:text-green-600 transition-colors">Não</span>
                            </label>
                        </div>
                    </div>
                </div>

                {errorMsg && !errorMsg.includes('Empresa já inscrita') && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {errorMsg}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transform hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {loading ? 'Salvando...' : 'Confirmar Cadastro'}
                </button>
            </form>

            {/* Success Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center transform animate-scale-in">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-800 mb-4">
                            Cadastro concluído!
                        </h3>

                        <p className="text-gray-600 leading-relaxed mb-8">
                            Cadastro concluido com sucesso, A união faz a força contamos com a sua participação !
                        </p>

                        <button
                            onClick={closeModal}
                            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-green-600/30"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default RegistrationForm;
