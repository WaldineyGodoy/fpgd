
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { IMaskInput } from 'react-imask';

interface NPSData {
    agencias?: number;
    whatsapp?: number;
    telefone?: number;
    portal_gd?: number;
    homologacao?: number;
    lista_rateio?: number;
    aumento_carga?: number;
    equipe_campo_extensao?: number;
    equipe_campo_vistoria?: number;
    atendimento_agencia_fisica?: number;
}

interface FormData {
    cnpj: string;
    integrador_nome: string;
    cliente: string;
    mes_referencia: string;
    tipo_uc: 'Geradora' | 'Beneficiaria';
    codigo_cliente_ug: string;
    codigo_cliente_uc: string[];
    tem_beneficiarias?: boolean;
    tem_mais_beneficiarias?: boolean;
    tipo_chamado: string;
    numero_protocolo: string;
    data_abertura: string;
    status_protocolo: string;
    descricao_reclamacao: string;
    esta_de_acordo: boolean;
    recurso: string;
    nps: NPSData;
}

const steps = [
    'Identificação',
    'Cliente',
    'Unidades',
    'Atendimento',
    'Resultado',
    'Avaliação (NPS)'
];

const TicketFramework: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [company, setCompany] = useState<any>(null);
    const [newUc, setNewUc] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        cnpj: '',
        integrador_nome: '',
        cliente: '',
        mes_referencia: '',
        tipo_uc: 'Geradora',
        codigo_cliente_ug: '',
        codigo_cliente_uc: [],
        tipo_chamado: 'Compensação',
        numero_protocolo: '',
        data_abertura: '',
        status_protocolo: 'Não aberto',
        descricao_reclamacao: '',
        esta_de_acordo: false,
        recurso: 'Abrir novo protocolo',
        nps: {}
    });

    // Pre-fill if logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('companies').select('*').eq('auth_user_id', user.id).single();
                if (data) {
                    setCompany(data);
                    setFormData(prev => ({ ...prev, cnpj: data.cnpj, integrador_nome: data.nome_fantasia || data.razao_social }));
                    setCurrentStep(1); // Skip Step 0
                }
            }
        };
        checkSession();
    }, []);

    const handleCnpjCheck = async () => {
        setLoading(true);
        const cleanCnpj = formData.cnpj.replace(/\D/g, '');
        const { data, error } = await supabase.from('companies').select('*').eq('cnpj', cleanCnpj).single();
        if (data) {
            setCompany(data);
            setFormData(prev => ({ ...prev, integrador_nome: data.nome_fantasia || data.razao_social }));
            nextStep();
        } else {
            alert('CNPJ não encontrado na base FPGD.');
        }
        setLoading(false);
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const updateNPS = (key: keyof NPSData, value: number) => {
        setFormData(prev => ({
            ...prev,
            nps: { ...prev.nps, [key]: value }
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.from('tickets').insert([{
                company_id: company.id,
                cliente: formData.cliente,
                mes_referencia: formData.mes_referencia + '-01',
                tipo_uc: formData.tipo_uc,
                codigo_cliente_ug: formData.codigo_cliente_ug,
                codigo_cliente_uc: formData.codigo_cliente_uc,
                tipo_chamado: formData.tipo_chamado,
                numero_protocolo: formData.numero_protocolo,
                data_abertura: formData.data_abertura,
                status_protocolo: formData.status_protocolo,
                descricao_reclamacao: formData.descricao_reclamacao,
                esta_de_acordo: formData.esta_de_acordo,
                recurso: formData.esta_de_acordo ? formData.recurso : null,
                nps_data: formData.nps
            }]);

            if (error) throw error;
            setShowSuccessModal(true);
        } catch (err) {
            alert('Erro ao enviar ticket.');
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ value, onChange, label }: { value?: number, onChange: (v: number) => void, label: string }) => (
        <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700">{label}</p>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className={`w-10 h-10 rounded-lg font-black transition-all ${value === star ? 'bg-green-600 text-white scale-110 shadow-lg shadow-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    >
                        {star}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                    className="h-full bg-green-600 shadow-[0_0_10px_rgba(22,163,74,0.5)]"
                />
            </div>

            <div className="flex justify-between items-center mb-8 mt-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full">
                    Passo {currentStep + 1} de {steps.length}: {steps[currentStep]}
                </span>
                <span className="text-[10px] font-bold text-gray-400">Tempo est.: 6-8 min</span>
            </div>

            <AnimatePresence mode="wait">
                {currentStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Validar Integrador</h2>
                        <div className="space-y-4">
                            <IMaskInput
                                mask="00.000.000/0000-00"
                                value={formData.cnpj}
                                onAccept={(val: string) => setFormData(prev => ({ ...prev, cnpj: val }))}
                                className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-green-500 outline-none"
                                placeholder="CNPJ do Integrador"
                            />
                            <button
                                onClick={handleCnpjCheck}
                                disabled={loading || formData.cnpj.length < 18}
                                className="w-full py-5 bg-green-600 text-white font-black rounded-2xl shadow-xl shadow-green-100"
                            >
                                {loading ? 'Buscando...' : 'Iniciar Preenchimento'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {currentStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Dados do Cliente</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-gray-400 uppercase ml-1">Integrador Responsável</label>
                                <p className="p-4 bg-gray-50 rounded-2xl font-bold text-gray-600 border border-gray-100">{formData.integrador_nome}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase ml-1">Nome do Cliente</label>
                                <input
                                    type="text"
                                    placeholder="Nome Completo do Cliente"
                                    value={formData.cliente}
                                    onChange={e => setFormData({ ...formData, cliente: e.target.value })}
                                    className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-green-500 outline-none font-bold text-gray-700"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-400 uppercase ml-1">Mês de Ref. da conta</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={formData.mes_referencia.split('-')[1] || ''}
                                        onChange={e => {
                                            const year = formData.mes_referencia.split('-')[0] || new Date().getFullYear().toString();
                                            setFormData({ ...formData, mes_referencia: `${year}-${e.target.value}` });
                                        }}
                                        className="p-4 rounded-2xl border-2 border-gray-50 focus:border-green-500 outline-none font-bold text-gray-700 bg-white"
                                    >
                                        <option value="" disabled>Mês</option>
                                        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                                            <option key={m} value={m}>{new Date(2024, parseInt(m) - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={formData.mes_referencia.split('-')[0] || ''}
                                        onChange={e => {
                                            const month = formData.mes_referencia.split('-')[1] || '01';
                                            setFormData({ ...formData, mes_referencia: `${e.target.value}-${month}` });
                                        }}
                                        className="p-4 rounded-2xl border-2 border-gray-50 focus:border-green-500 outline-none font-bold text-gray-700 bg-white"
                                    >
                                        <option value="" disabled>Ano</option>
                                        {[2023, 2024, 2025, 2026].map(y => (
                                            <option key={y} value={y.toString()}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={nextStep}
                                    disabled={!formData.cliente || !formData.mes_referencia}
                                    className="w-full py-5 bg-green-600 text-white font-black rounded-2xl shadow-xl hover:bg-green-700 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                    {!formData.cliente || !formData.mes_referencia ? 'Preencha os campos acima' : 'Avançar ➜'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Unidades de Energia</h2>
                        <div className="space-y-4">
                            <select
                                value={formData.tipo_uc}
                                onChange={e => setFormData({ ...formData, tipo_uc: e.target.value as any })}
                                className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-green-500 outline-none font-bold bg-white"
                            >
                                <option value="Geradora">Tipo: Unidade Geradora (UG)</option>
                                <option value="Beneficiaria">Tipo: Unidade Beneficiária (UC)</option>
                            </select>

                            {formData.tipo_uc === 'Geradora' ? (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Código do Cliente Unidade Geradora</label>
                                        <input
                                            type="text"
                                            placeholder="Código da Unidade Geradora"
                                            value={formData.codigo_cliente_ug}
                                            onChange={e => setFormData({ ...formData, codigo_cliente_ug: e.target.value })}
                                            className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-green-500 outline-none font-bold text-gray-700"
                                        />
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-sm font-bold text-gray-700 mb-2">Há beneficiárias que recebem créditos?</p>
                                        <div className="flex gap-4">
                                            <button onClick={() => setFormData({ ...formData, tem_beneficiarias: true })} className={`px-6 py-2 rounded-xl font-bold ${formData.tem_beneficiarias === true ? 'bg-green-600 text-white' : 'bg-white text-gray-400 border'}`}>Sim</button>
                                            <button
                                                onClick={() => {
                                                    if (!formData.codigo_cliente_ug) {
                                                        alert('Preencha o Código da Unidade Geradora primeiro.');
                                                        return;
                                                    }
                                                    setFormData({ ...formData, tem_beneficiarias: false, codigo_cliente_uc: [] });
                                                    nextStep();
                                                }}
                                                className={`px-6 py-2 rounded-xl font-bold ${formData.tem_beneficiarias === false ? 'bg-red-600 text-white' : 'bg-white text-gray-400 border'}`}
                                            >
                                                Não
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Código Cliente Beneficiária</label>
                                        <input
                                            type="text"
                                            placeholder="Código da Unidade Beneficiária"
                                            value={newUc}
                                            onChange={e => setNewUc(e.target.value)}
                                            onBlur={() => { if (newUc) setFormData({ ...formData, codigo_cliente_uc: [newUc] }) }}
                                            className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-green-500 outline-none font-bold text-gray-700"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-black text-gray-400 uppercase ml-1">Código do Cliente Unidade Geradora</label>
                                        <input
                                            type="text"
                                            placeholder="Código da Unidade Geradora Associada"
                                            value={formData.codigo_cliente_ug}
                                            onChange={e => setFormData({ ...formData, codigo_cliente_ug: e.target.value })}
                                            className="w-full p-4 rounded-2xl border-2 border-gray-50 focus:border-green-500 outline-none font-bold text-gray-700"
                                        />
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl">
                                        <p className="text-sm font-bold text-gray-700 mb-2">Há mais beneficiárias?</p>
                                        <div className="flex gap-4">
                                            <button onClick={() => setFormData({ ...formData, tem_mais_beneficiarias: true })} className={`px-6 py-3 rounded-xl font-bold ${formData.tem_mais_beneficiarias === true ? 'bg-green-600 text-white' : 'bg-white text-gray-400 border'}`}>Sim</button>
                                            <button onClick={() => setFormData({ ...formData, tem_mais_beneficiarias: false })} className={`px-6 py-3 rounded-xl font-bold ${formData.tem_mais_beneficiarias === false ? 'bg-red-600 text-white' : 'bg-white text-gray-400 border'}`}>Não</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(formData.tem_beneficiarias || formData.tem_mais_beneficiarias) && (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input type="text" value={newUc} onChange={e => setNewUc(e.target.value)} placeholder="Novo código de Beneficiária..." className="flex-1 p-4 rounded-xl border border-gray-200" />
                                        <button onClick={() => { if (newUc && !formData.codigo_cliente_uc.includes(newUc)) setFormData({ ...formData, codigo_cliente_uc: [...formData.codigo_cliente_uc, newUc], tem_beneficiarias: true }); setNewUc('') }} className="bg-gray-800 text-white px-6 rounded-xl font-bold">+</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.codigo_cliente_uc.map(uc => (
                                            <span key={uc} className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-xs font-black border border-green-100">{uc}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button onClick={prevStep} className="flex-1 py-4 text-gray-400 font-bold">Voltar</button>
                                <button
                                    onClick={nextStep}
                                    disabled={!formData.codigo_cliente_ug}
                                    className="flex-[2] py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg disabled:opacity-30"
                                >
                                    Continuar ➜
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {currentStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                        <h2 className="text-2xl font-black text-gray-800 mb-4">Dados do Atendimento</h2>
                        <select value={formData.tipo_chamado} onChange={e => setFormData({ ...formData, tipo_chamado: e.target.value })} className="w-full p-4 rounded-xl border-2 border-gray-50 bg-white font-bold">
                            <option>Compensação</option>
                            <option>Desligamento Involuntário</option>
                            <option>Vistoria</option>
                            <option>Homologação</option>
                            <option>Nova Instalação com GD</option>
                            <option>Nova Instalação</option>
                        </select>
                        <input type="text" placeholder="Número do Protocolo" value={formData.numero_protocolo} onChange={e => setFormData({ ...formData, numero_protocolo: e.target.value })} className="w-full p-4 rounded-xl border-2 border-gray-50" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Data Abertura</label>
                                <input type="date" value={formData.data_abertura} onChange={e => setFormData({ ...formData, data_abertura: e.target.value })} className="w-full p-4 rounded-xl border-2 border-gray-50" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Status Protocolo</label>
                                <select value={formData.status_protocolo} onChange={e => setFormData({ ...formData, status_protocolo: e.target.value })} className="w-full p-4 rounded-xl border-2 border-gray-50 bg-white font-bold">
                                    <option>Não aberto</option>
                                    <option>Em analise</option>
                                    <option>Fechado Procedente</option>
                                    <option>Fechado Improcente</option>
                                </select>
                            </div>
                        </div>
                        <textarea placeholder="Relate o ocorrido..." rows={3} value={formData.descricao_reclamacao} onChange={e => setFormData({ ...formData, descricao_reclamacao: e.target.value })} className="w-full p-4 rounded-2xl border-2 border-gray-50 resize-none font-medium" />
                        <div className="flex gap-3 pt-4">
                            <button onClick={prevStep} className="flex-1 py-4 text-gray-400 font-bold">Voltar</button>
                            <button
                                onClick={nextStep}
                                disabled={!formData.numero_protocolo || !formData.data_abertura}
                                className="flex-[2] py-4 bg-green-600 text-white font-black rounded-2xl shadow-lg disabled:opacity-30"
                            >
                                Continuar ➜
                            </button>
                        </div>
                    </motion.div>
                )}

                {currentStep === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                        <h2 className="text-2xl font-black text-gray-800">Resultado do Pleito</h2>
                        <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-gray-100">
                            <p className="text-gray-700 font-bold mb-6">Você está de acordo com o resultado apresentado pela concessionária?</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => { setFormData({ ...formData, esta_de_acordo: true }); nextStep(); }} className={`py-5 rounded-2xl font-black text-lg transition-all ${formData.esta_de_acordo === true ? 'bg-green-600 text-white' : 'bg-white text-gray-400 border'}`}>SIM ✅</button>
                                <button onClick={() => setFormData({ ...formData, esta_de_acordo: false })} className={`py-5 rounded-2xl font-black text-lg transition-all ${formData.esta_de_acordo === false ? 'bg-red-600 text-white' : 'bg-white text-gray-400 border'}`}>NÃO ❌</button>
                            </div>
                        </div>

                        {formData.esta_de_acordo === false && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-4">
                                <p className="text-sm font-bold text-gray-500">Pretende entrar com recurso?</p>
                                <select value={formData.recurso} onChange={e => setFormData({ ...formData, recurso: e.target.value })} className="w-full p-4 rounded-xl border-2 border-gray-100 bg-white font-black text-green-700">
                                    <option>Abrir novo protocolo</option>
                                    <option>Ouvidoria</option>
                                    <option>Aneel</option>
                                    <option>Judicializar</option>
                                    <option>Todas as opções</option>
                                </select>
                                <button onClick={nextStep} className="w-full py-5 bg-gray-800 text-white font-black rounded-2xl shadow-xl">Avançar ➜</button>
                            </motion.div>
                        )}
                        <button onClick={prevStep} className="w-full py-2 text-gray-400 font-bold mt-4">Voltar</button>
                    </motion.div>
                )}

                {currentStep === 5 && (
                    <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 leading-tight">Avalie sua <span className="text-green-600">Experiência</span></h2>
                            <p className="text-xs font-bold text-gray-400 uppercase mt-1">Sua avaliação é fundamental para a FPGD</p>
                        </div>

                        <div className="space-y-8">
                            <StarRating label="Atendimento Presencial (Agências)" value={formData.nps.agencias} onChange={v => updateNPS('agencias', v)} />
                            <StarRating label="Atendimento via WhatsApp" value={formData.nps.whatsapp} onChange={v => updateNPS('whatsapp', v)} />
                            <StarRating label="Atendimento via Telefone" value={formData.nps.telefone} onChange={v => updateNPS('telefone', v)} />
                            <StarRating label="Portal GD (Usabilidade)" value={formData.nps.portal_gd} onChange={v => updateNPS('portal_gd', v)} />

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">Funções do Portal GD</h3>
                                <StarRating label="Nova Instalação com GD" value={formData.nps.homologacao} onChange={v => updateNPS('homologacao', v)} />
                                <StarRating label="Lista de Rateio" value={formData.nps.lista_rateio} onChange={v => updateNPS('lista_rateio', v)} />
                                <StarRating label="Aumento de Carga" value={formData.nps.aumento_carga} onChange={v => updateNPS('aumento_carga', v)} />
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase mb-6 tracking-widest">Equipes de Campo / Atendimento</h3>
                                <StarRating label="Equipe de Extensão de Rede" value={formData.nps.equipe_campo_extensao} onChange={v => updateNPS('equipe_campo_extensao', v)} />
                                <StarRating label="Equipe de Vistoria Final GD" value={formData.nps.equipe_campo_vistoria} onChange={v => updateNPS('equipe_campo_vistoria', v)} />
                                <StarRating label="Equipe das Agências Físicas" value={formData.nps.atendimento_agencia_fisica} onChange={v => updateNPS('atendimento_agencia_fisica', v)} />
                            </div>
                        </div>

                        <div className="flex gap-4 sticky bottom-0 bg-white py-4 border-t border-white shadow-[0_-20px_20px_rgba(255,255,255,0.9)]">
                            <button onClick={prevStep} className="flex-1 py-5 text-gray-400 font-bold">Voltar</button>
                            <button onClick={handleSubmit} disabled={loading} className="flex-[3] py-5 bg-green-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-green-200">
                                {loading ? 'PROCESSANDO...' : 'FINALIZAR ✦'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[100]">
                        <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-10 rounded-[3rem] max-w-lg w-full text-center relative">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">✦</div>
                            <h3 className="text-3xl font-black text-gray-800 mb-4 leading-tight">Ticket Registrado com <span className="text-green-600">Sucesso!</span></h3>
                            <p className="text-gray-500 font-bold mb-8 leading-relaxed">
                                Suas informações e avaliações foram enviadas para audiência e serão debatidas pela <span className="text-green-800">comissão da FPGD</span> juntamente com a concessionária.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: '#15803d' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setShowSuccessModal(false); if (onComplete) onComplete(); }}
                                className="w-full py-6 bg-green-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-green-200 border-b-8 border-green-800"
                            >
                                IR PARA O DASHBOARD ➜
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
};

export default TicketFramework;
