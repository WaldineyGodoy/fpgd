
import React, { useState } from 'react';
import axios from 'axios';
import { IMaskInput } from 'react-imask';

const BuscaCNPJ = ({ onCompanyFound }) => {
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        const cleanCnpj = cnpj.replace(/\D/g, '');
        if (cleanCnpj.length !== 14) {
            setError('CNPJ deve ter 14 dígitos.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            onCompanyFound(response.data);
        } catch (err) {
            console.error(err);
            setError('CNPJ não encontrado ou erro na busca.');
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
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    {loading ? '...' : 'Buscar'}
                </button>
            </div>
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default BuscaCNPJ;
