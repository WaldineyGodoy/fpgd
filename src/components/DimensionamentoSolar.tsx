
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DimensionamentoSolar Component (All-in-One)
 * 
 * Um componente premium que integra 3 funcionalidades em uma única interface:
 * 1. Calculadora de Potência (kWp)
 * 2. Busca de CEP/Localização (IBGE)
 * 3. Gráfico de Irradiância e Geração Mensal (SVG)
 */
const DimensionamentoSolar: React.FC = () => {
    const navigate = useNavigate();
    // --- Estados do Simulador (Cálculo) ---
    const [qtdPaineis, setQtdPaineis] = useState(10);
    const [potenciaPainel, setPotenciaPainel] = useState(550);
    const [kwp, setKwp] = useState(0);
    // --- Estados da Localização (CEP) ---
    const [cep, setCep] = useState('');
    const [address, setAddress] = useState<any>(null);
    const [loadingCep, setLoadingCep] = useState(false);
    const [ibgeCode, setIbgeCode] = useState<string | null>(null);
    // --- Estados do Gráfico (Irradiância) ---
    const [chartData, setChartData] = useState<any[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);

    // --- Lógica: Calculadora de Power Scales ---
    const listaPaineis = useMemo(() => {
        const list = [];
        for (let i = 400; i <= 800; i += 5) list.push(i);
        return list;
    }, []);

    useEffect(() => {
        const calculated = (qtdPaineis * potenciaPainel) / 1000;
        setKwp(Number(calculated.toFixed(2)));
    }, [qtdPaineis, potenciaPainel]);

    // --- Lógica: Busca CEP ---
    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
        setCep(val.length > 5 ? val.replace(/^(\d{5})(\d)/, '$1-$2') : val);
        if (val.length === 8) fetchAddress(val);
    };

    const fetchAddress = async (cleanCep: string) => {
        setLoadingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();
            if (data.erro) throw new Error();
            setAddress(data);
            setIbgeCode(data.ibge);
        } catch {
            setAddress(null);
            setIbgeCode(null);
        } finally {
            setLoadingCep(false);
        }
    };

    // --- Lógica: Busca Irradiância (Supabase) ---
    useEffect(() => {
        if (ibgeCode && kwp > 0) {
            fetchIrradiance();
        }
    }, [ibgeCode, kwp]);

    const fetchIrradiance = async () => {
        setLoadingChart(true);
        try {
            const { data: result, error } = await supabase
                .from('irradiancia')
                .select('*')
                .eq('"cod.ibge"', ibgeCode) // Quoted for safety due to dot in column name
                .single();
            
            if (error || !result) throw new Error();
            
            // Map consistent with database column names found in list_tables
            const months = [
                { name: 'Jan', k: 'jan.khw' }, 
                { name: 'Fev', k: 'fev.khw' }, 
                { name: 'Mar', k: 'mar.kwh' },
                { name: 'Abr', k: 'abr.kwh' }, 
                { name: 'Mai', k: 'mai.kwh' }, 
                { name: 'Jun', k: 'jun.kwh' },
                { name: 'Jul', k: 'jul.kwh' }, 
                { name: 'Ago', k: 'ago.kwh' }, 
                { name: 'Set', k: 'set.kwh' },
                { name: 'Out', k: 'out.kwh' }, 
                { name: 'Nov', k: 'nov.kwh' }, 
                { name: 'Dez', k: 'dez.khw' }
            ];

            setChartData(months.map(m => ({
                name: m.name,
                value: Math.round(kwp * (parseFloat(result[m.k]) || 0))
            })));
        } catch (err) {
            console.error('Erro ao buscar dados de irradiância:', err);
            setChartData([]);
        } finally {
            setLoadingChart(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                input[type=number] {
                    -moz-appearance: textfield;
                }
            `}</style>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-50">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-[#FF6600] w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-orange-100">1</div>
                    <div>
                        <h3 className="text-xl font-black text-[#002D5E]">Configuração do Sistema</h3>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Ajuste os parâmetros dos seus painéis</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Qtd. de Painéis</label>
                        <input 
                            type="number" 
                            className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] outline-none transition-all font-bold text-gray-700 bg-gray-50/50" 
                            value={qtdPaineis} 
                            onChange={e => setQtdPaineis(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Potência Unitária (W)</label>
                        <div className="relative">
                            <select 
                                className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] outline-none transition-all font-bold text-gray-700 bg-gray-50/50 appearance-none cursor-pointer" 
                                value={potenciaPainel} 
                                onChange={e => setPotenciaPainel(parseInt(e.target.value))}
                            >
                                {listaPaineis.map(p => <option key={p} value={p}>{p}W</option>)}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500">▼</div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 my-8 pt-8 border-t border-gray-50">
                    <div className="bg-[#002D5E] w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-100">2</div>
                    <div>
                        <h3 className="text-xl font-black text-[#002D5E]">Localização do Projeto</h3>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Informe seu CEP para dados climáticos reais</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">CEP para Cálculo</label>
                        <div className="relative">
                            <input 
                                className="w-full p-5 rounded-2xl border-2 border-gray-100 focus:border-[#FF6600] outline-none transition-all font-bold text-gray-700 bg-gray-50/50" 
                                placeholder="00000-000" 
                                value={cep} 
                                onChange={handleCepChange}
                            />
                            {loadingCep && (
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                    </div>
                    <AnimatePresence>
                        {address && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-3"
                            >
                                <label className="text-xs font-black text-gray-500 uppercase tracking-wider ml-1">Cidade / UF Encontrada</label>
                                <div className="p-5 rounded-2xl border-2 border-green-100 bg-green-50/50 text-green-700 font-black flex items-center gap-3">
                                    <span className="text-xl">📍</span>
                                    {address.localidade} - {address.uf}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-50 overflow-hidden">
                <div className="bg-gradient-to-br from-[#FF6600] to-[#FF8C40] rounded-3xl p-8 text-white shadow-xl shadow-orange-100 flex flex-col md:flex-row items-center justify-between gap-6 mb-8 transform hover:scale-[1.01] transition-transform">
                    <div className="text-center md:text-left">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1">Potência Estimada do Sistema</div>
                        <div className="text-6xl font-black">{kwp.toLocaleString('pt-BR')} <span className="text-2xl opacity-70">kWp</span></div>
                    </div>
                    <div className="h-16 w-px bg-white/20 hidden md:block" />
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full md:w-auto px-10 py-5 bg-white text-[#FF6600] font-black rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all uppercase tracking-widest text-sm"
                    >
                        Concluir Cadastro ✦
                    </button>
                </div>

                {!ibgeCode ? (
                    <div className="text-center py-20 px-8 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="text-5xl mb-4">☀️</div>
                        <p className="text-gray-400 font-black text-sm uppercase tracking-widest leading-relaxed">
                            Por favor, informe seu <span className="text-[#FF6600]">CEP</span> acima<br/>para visualizar o gráfico de geração mensal.
                        </p>
                    </div>
                ) : loadingChart ? (
                    <div className="text-center py-20 bg-gray-50/50 rounded-3xl">
                        <div className="w-12 h-12 border-4 border-[#FF6600] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Consultando histórico solar da região...</p>
                    </div>
                ) : chartData.length > 0 ? (
                    <div className="pt-8 animate-in fade-in duration-1000">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 px-2">
                             <div className="flex items-center gap-3">
                                <div className="w-2 h-8 bg-[#002D5E] rounded-full" />
                                <span className="text-xl font-black text-[#002D5E]">Geração Estimada (kWh)</span>
                             </div>
                             <div className="bg-orange-50 px-6 py-3 rounded-2xl border-2 border-orange-100 flex items-center gap-3">
                                <span className="text-orange-500 font-black text-xs uppercase">Média Mensal:</span>
                                <span className="text-[#FF6600] text-xl font-black italic">{Math.round(chartData.reduce((a:any, b:any) => a + b.value, 0) / 12)} kWh</span>
                             </div>
                        </div>
                        
                        <div className="h-[250px] w-full mt-4">
                            <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none" className="overflow-visible">
                                {chartData.map((d: any, i: number) => {
                                    const max = Math.max(...chartData.map((cd: any) => cd.value));
                                    const h = (d.value / max) * 160;
                                    const x = 50 * i + (i * 1.5);
                                    return (
                                        <g 
                                            key={i} 
                                            onMouseEnter={() => setHoveredBar(i)} 
                                            onMouseLeave={() => setHoveredBar(null)}
                                            className="cursor-pointer group"
                                        >
                                            <motion.rect 
                                                initial={{ height: 0, y: 180 }}
                                                animate={{ height: h, y: 180 - h }}
                                                transition={{ delay: i * 0.05, duration: 0.5 }}
                                                x={x} 
                                                width="40" 
                                                fill={hoveredBar === i ? '#FF8C40' : '#FF6600'} 
                                                rx="6"
                                                className="transition-colors duration-300"
                                            />
                                            <text x={x + 20} y="198" textAnchor="middle" fontSize="10" fontWeight="900" className="fill-gray-400 group-hover:fill-[#002D5E] transition-colors">{d.name}</text>
                                            <AnimatePresence>
                                                {hoveredBar === i && (
                                                    <motion.g
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 10 }}
                                                    >
                                                        <rect x={x - 10} y={145 - h} width="60" height="25" rx="8" fill="#002D5E" />
                                                        <text x={x + 20} y={162 - h} textAnchor="middle" fontSize="12" fontWeight="black" fill="white">{d.value}</text>
                                                        <path d={`M ${x+15} ${170-h} L ${x+25} ${170-h} L ${x+20} ${175-h} Z`} fill="#002D5E" />
                                                    </motion.g>
                                                )}
                                            </AnimatePresence>
                                        </g>
                                    );
                                })}
                                <line x1="0" y1="180" x2="600" y2="180" stroke="#f1f5f9" strokeWidth="2" />
                            </svg>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-red-50 rounded-3xl border-2 border-red-100 italic font-bold text-red-400 px-8">
                        ⚠️ Ocorreu um erro ao carregar os dados de irradiância para este município.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DimensionamentoSolar;
