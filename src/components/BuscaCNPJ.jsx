
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IMaskInput } from 'react-imask';

const BuscaCNPJ = ({ onCompanyFound, initialValue }) => {
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Initial value effect from router
    useEffect(() => {
        if (initialValue) {
            setCnpj(initialValue);
            // Optional: Auto-search if we have a full CNPJ
            if (initialValue.replace(/\D/g, '').length === 14) {
                handleSearch(initialValue);
            }
        }
    }, [initialValue]);

    const handleSearch = async (cnpjToSearch = cnpj) => {
        const cleanCnpj = cnpjToSearch.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) {
            setError('CNPJ deve ter 14 dígitos.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Using a public CORS proxy is sometimes needed, but BrasilAPI usually works.
            // If BrasilAPI fails, we might want a fallback or just clear error message.
            const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            onCompanyFound(response.data);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 404) {
                setError('CNPJ não encontrado na base da Receita Federal.');
            } else if (err.response && err.response.status === 429) {
                setError('Muitas requisições. Tente novamente em alguns instantes.');
            } else {
                setError('Erro ao buscar CNPJ. Verifique sua conexão.');
            }
            onCompanyFound(null);
        } finally {
            setLoading(false);
        }
    };

    const handleBlur = () => {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        if (cleanCnpj.length === 14) {
            handleSearch();
        }
    }

    return (
        <div className="search-container">
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ da Empresa
            </label>
            <div className="flex gap-2">
                <IMaskInput
                    mask="00.000.000/0000-00"
                    value={cnpj}
                    unmask={false}
                    onAccept={(value) => setCnpj(value)}
                    placeholder="00.000.000/0000-00"
                    className={`w-full p-3 rounded-lg bg-white border ${error ? 'border-red-500' : 'border-gray-300'} text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all shadow-sm`}
                    onBlur={handleBlur}
                />
                <button
                    type="button"
                    onClick={() => handleSearch(cnpj)}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {loading ? '...' : 'Buscar'}
                </button>
            </div>
            {error && <p className="mt-1 text-sm text-red-600 font-medium">{error}</p>}
        </div>
    );
};

export default BuscaCNPJ;
