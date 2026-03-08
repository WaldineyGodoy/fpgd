
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, Zap, Mail, Phone, Hash, X } from 'lucide-react';

interface UsinaData {
    id: string;
    nome: string;
    cpf_cnpj: string;
    ug: string;
    ucs: string[];
    tipo_uc: 'Geradora' | 'Beneficiaria' | null;
    integrador_id: string | null;
    companies: {
        email: string | null;
        telefone: string | null;
    } | null;
    integrador: {
        nome_fantasia: string | null;
        razao_social: string | null;
    } | null;
}

interface BuscaUsinaProps {
    onSelect: (usina: UsinaData | null) => void;
    initialValue?: string;
}

const BuscaUsina: React.FC<BuscaUsinaProps> = ({ onSelect, initialValue = '' }) => {
    const [searchTerm, setSearchTerm] = useState(initialValue);
    const [results, setResults] = useState<UsinaData[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length > 2 && !selectedId) {
                searchUsinas();
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, selectedId]);

    const searchUsinas = async () => {
        setLoading(true);
        try {
            // Buscando usinas
            // Nota: Para buscar em tabelas relacionadas no .or(), o Supabase exige sintaxe específica ou múltiplas queries
            // Faremos uma busca ampla e traremos os dados relacionados
            const { data, error } = await supabase
                .from('usinas')
                .select(`
                    id,
                    nome,
                    cpf_cnpj,
                    ug,
                    ucs,
                    tipo_uc,
                    integrador_id,
                    companies!usinas_company_id_fkey (
                        email,
                        telefone
                    ),
                    integrador:companies!usinas_integrador_id_fkey (
                        nome_fantasia,
                        razao_social
                    )
                `)
                .or(`nome.ilike.%${searchTerm}%,cpf_cnpj.ilike.%${searchTerm}%,ug.ilike.%${searchTerm}%`)
                .limit(10);

            if (error) throw error;
            
            setResults((data as unknown as UsinaData[]) || []);
            setShowDropdown(true);
        } catch (err) {
            console.error('Erro na busca de usina:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (usina: UsinaData) => {
        setSearchTerm(usina.nome);
        setSelectedId(usina.id);
        setShowDropdown(false);
        onSelect(usina);
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
                    placeholder="Nome, CPF, UG, Telefone ou E-mail..."
                    className="w-full p-5 pr-14 rounded-2xl border-2 border-gray-100 focus:border-green-500 outline-none transition-all font-bold text-gray-700 bg-white shadow-sm"
                />
                <div className="absolute left-0 top-0 h-full flex items-center pl-5 pointer-events-none">
                    {/* Placeholder for an icon if needed, but the padding is already handled */}
                </div>
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    {loading ? (
                        <div className="w-5 h-5 border-3 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <Search className="w-5 h-5 text-gray-300" />
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showDropdown && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute z-[100] left-0 right-0 mt-3 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden ring-4 ring-black/5"
                    >
                        <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Resultados Encontrados</span>
                        </div>
                        {results.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(item)}
                                className="w-full p-4 text-left hover:bg-green-50 transition-all border-b border-gray-50 last:border-0 group select-none"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="block font-black text-gray-800 text-sm truncate">{item.nome}</span>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                                                <Hash className="w-3 h-3 text-amber-500" /> UG: {item.ug}
                                            </span>
                                            {item.cpf_cnpj && (
                                                <span className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                                                    <Zap className="w-3 h-3 text-blue-500" /> {item.cpf_cnpj}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
                {showDropdown && results.length === 0 && searchTerm.length > 2 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-[100] left-0 right-0 mt-3 bg-white p-8 rounded-[2rem] shadow-2xl border border-gray-100 text-center"
                    >
                        <Search className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                        <p className="text-gray-400 font-bold text-sm italic">Nenhuma usina ou cliente encontrado...</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BuscaUsina;
