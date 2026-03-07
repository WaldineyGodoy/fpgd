
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const AccessPage: React.FC = () => {
    const navigate = useNavigate();
    const [cnpj, setCnpj] = useState<string>('');

    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-xl p-10 bg-white/80 backdrop-blur-lg rounded-[2.5rem] shadow-2xl border border-white/20"
        >
            <header className="mb-10 text-center">
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="text-5xl mb-4"
                >
                    🔍
                </motion.div>
                <h1 className="text-4xl font-black text-gray-800">
                    Consulta <span className="text-green-600">FPGD</span>
                </h1>
                <p className="text-gray-400 font-bold mt-2 tracking-widest uppercase text-xs">Consulta de Habilitação</p>
            </header>

            <div className="space-y-8">
                <div className="p-6 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 text-center">
                    <p className="text-gray-500 font-medium mb-6">
                        Para consultar sua situação ou realizar um novo agendamento, identifique-se abaixo.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/login')}
                        className="w-full py-5 bg-gray-800 text-white font-black text-lg rounded-2xl shadow-xl hover:bg-black transition-all"
                    >
                        IR PARA ÁREA DE ACESSO ➜
                    </motion.button>
                </div>

                <div className="relative flex items-center justify-center py-4">
                    <div className="absolute w-full border-t border-gray-100"></div>
                    <span className="relative px-4 bg-white text-gray-300 font-bold text-xs uppercase tracking-widest">OU</span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/cadastro')}
                    className="w-full py-5 bg-green-100 text-green-700 font-black text-lg rounded-2xl border-2 border-green-200 hover:bg-green-200 transition-all flex items-center justify-center gap-2"
                >
                    QUERO ME CADASTRAR ✦
                </motion.button>
            </div>
        </motion.div>
    );
};

export default AccessPage;
