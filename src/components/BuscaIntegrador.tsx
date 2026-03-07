
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface Integrator {
    id: string;
    cnpj: string;
    nome_fantasia: string;
    razao_social: string;
}

interface BuscaIntegradorProps {
    onSelect: (integrator: Integrator | null) => void;
    initialValue?: string;
}

const BuscaIntegrador: React.FC<BuscaIntegradorProps> = ({ onSelect, initialValue = '' }) => {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [results, setResults] = useState<Integrator[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length > 2 && !selectedId) {
                searchIntegrators();
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, selectedId]);

    const searchIntegrators = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('id, cnpj, nome_fantasia, razao_social')
                .eq('user_type', 'integrador')
                .or(`cnpj.ilike.%${searchTerm}%,nome_fantasia.ilike.%${searchTerm}%,razao_social.ilike.%${searchTerm}%`)
                .limit(5);

            if (error) throw error;
            setResults(data || []);
            setShowDropdown(true);
        } catch (err) {
            console.error('Erro na busca de integrador:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (integrator: Integrator) => {
        setSearchTerm(integrator.nome_fantasia || integrator.razao_social);
        setSelectedId(integrator.id);
        setShowDropdown(false);
        onSelect(integrator);
    };

    const handleClear = () => {
        setSearchTerm('');
        setSelectedId(null);
        onSelect(null);
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (selectedId) setSelectedId(null);
                    }}
                    placeholder="Pesquise por CNPJ, Nome ou Razão Social..."
                    className="w-full p-4 pr-12 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-medium"
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        ✕
                    </button>
                )}
                {loading && (
                    <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showDropdown && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    >
                        {results.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className="w-full p-4 text-left hover:bg-green-50 transition-all border-b border-gray-50 last:border-0"
                            >
                                <span className="block font-bold text-gray-800">{item.nome_fantasia || item.razao_social}</span>
                                <span className="block text-xs text-gray-400 font-medium">CNPJ: {item.cnpj}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
                {showDropdown && results.length === 0 && searchTerm.length > 2 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-50 left-0 right-0 mt-2 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 text-center text-gray-400 font-bold text-sm italic"
                    >
                        Nenhum integrador encontrado...
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BuscaIntegrador;
