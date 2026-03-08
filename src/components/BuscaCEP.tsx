
import React, { useState } from 'react';
import axios from 'axios';
import { IMaskInput } from 'react-imask';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressData {
    cep: string;
    logradouro: string;
    bairro: string;
    city: string;
    state: string;
    service?: string;
}

interface BuscaCEPProps {
    onAddressFound: (data: AddressData | null) => void;
    initialValue?: string;
}

const BuscaCEP: React.FC<BuscaCEPProps> = ({ onAddressFound, initialValue = '' }) => {
    const [cep, setCep] = useState<string>(initialValue);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            setError('CEP inválido.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`);
            onAddressFound(response.data);
        } catch (err: any) {
            setError('CEP não encontrado ou erro na busca.');
            onAddressFound(null);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-3">
            <div className="flex-1 relative">
                <IMaskInput
                    mask="00000-000"
                    value={cep}
                    onAccept={(value: string) => setCep(value)}
                    className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-700"
                    placeholder="DIGITE O CEP"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                />
                <AnimatePresence>
                    {error && (
                        <motion.p
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -bottom-5 left-1 text-red-500 text-[10px] font-bold uppercase"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="px-8 bg-green-600 text-white font-black rounded-2xl hover:bg-green-700 shadow-lg shadow-green-100 border-b-4 border-green-800 disabled:opacity-50 transition-all uppercase text-xs"
            >
                {loading ? '...' : 'Buscar CEP'}
            </motion.button>
        </div>
    );
};

export default BuscaCEP;
