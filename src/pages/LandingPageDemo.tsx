
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginFramework from '../components/frameworks/LoginFramework';
import TicketFramework from '../components/frameworks/TicketFramework';
import { motion, AnimatePresence } from 'framer-motion';

const LandingPageDemo: React.FC = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'selection' | 'login' | 'ticket'>('selection');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-green-50 to-white">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <h1 className="text-5xl font-black text-gray-800 mb-2">Protocolos e Tickets de <span className="text-green-600">atendimento</span></h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sistema de Gestão de Pleitos FPGD</p>
            </motion.div>

            <AnimatePresence mode="wait">
                {view === 'selection' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl"
                    >
                        <button
                            onClick={() => setView('login')}
                            className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-green-500 transition-all text-center group"
                        >
                            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🔑</div>
                            <h2 className="text-2xl font-black text-gray-800">Framework de Login</h2>
                            <p className="text-gray-400 font-medium mt-2">Acesso rápido para integradores</p>
                        </button>

                        <button
                            onClick={() => setView('ticket')}
                            className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-transparent hover:border-green-500 transition-all text-center group"
                        >
                            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🎫</div>
                            <h2 className="text-2xl font-black text-gray-800">Framework Ticket</h2>
                            <p className="text-gray-400 font-medium mt-2">Formulário dinâmico multistep</p>
                        </button>
                    </motion.div>
                )}

                {view === 'login' && (
                    <motion.div
                        key="login"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full max-w-md"
                    >
                        <LoginFramework
                            onSuccess={() => navigate('/tickets')}
                            onRegisterRedirect={() => navigate('/cadastro')}
                        />
                        <button onClick={() => setView('selection')} className="mt-8 text-gray-400 font-bold w-full">← Voltar para Demonstração</button>
                    </motion.div>
                )}

                {view === 'ticket' && (
                    <motion.div
                        key="ticket"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full"
                    >
                        <TicketFramework
                            onComplete={() => navigate('/tickets')}
                        />
                        <button onClick={() => setView('selection')} className="mt-8 text-gray-400 font-bold w-full">← Voltar para Demonstração</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer className="mt-20 text-gray-300 font-bold text-xs uppercase tracking-widest">
                Developed by Antigravity AI • 2024
            </footer>
        </div>
    );
};

export default LandingPageDemo;
