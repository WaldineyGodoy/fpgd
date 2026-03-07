
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IMaskInput } from 'react-imask';
import { motion, AnimatePresence } from 'framer-motion';

interface CompanyData {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
}

interface BuscaCNPJProps {
    onCompanyFound: (data: CompanyData | null) => void;
    initialValue?: string;
}

const BuscaCNPJ: React.FC<BuscaCNPJProps> = ({ onCompanyFound, initialValue = '' }) => {
    const [cnpj, setCnpj] = useState<string>(initialValue);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initialValue && initialValue.length === 18) {
            handleSearch(initialValue);
        }
    }, [initialValue]);

    const handleSearch = async (value: string) => {
        const cleanCnpj = value.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            onCompanyFound(response.data);
        } catch (err: any) {
            if (err.response && err.response.status === 404) {
                setError('CNPJ não encontrado na base da Receita Federal.');
            } else if (err.response && err.response.status === 429) {
                setError('Muitas requisições. Tente novamente em alguns instantes.');
            } else {
                setError('Erro ao buscar CNPJ. Você pode preencher os dados manualmente.');
            }
            onCompanyFound(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <IMaskInput
                    mask="00.000.000/0000-00"
                    value={cnpj}
                    onAccept={(value: string) => {
                        setCnpj(value);
                        if (value.replace(/\D/g, '').length === 14) {
                            handleSearch(value);
                        }
                    }}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-700 shadow-sm"
                    placeholder="DIGITE O CNPJ PARA BUSCAR"
                />

                <AnimatePresence>
                    {loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                            <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-500 text-xs font-bold px-1"
                    >
                        {error}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BuscaCNPJ;
