
import React from 'react';
import { motion } from 'framer-motion';

const SchedulingPage: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl p-10 bg-white/90 backdrop-blur-md rounded-[3rem] shadow-2xl border border-white/20 text-center"
        >
            <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5 }}
                className="text-6xl mb-6"
            >
                📅
            </motion.div>
            <h1 className="text-4xl font-black text-gray-800 mb-4">
                Agendamento <span className="text-green-600">Presencial</span>
            </h1>
            <p className="text-gray-500 font-bold text-lg mb-8 leading-relaxed">
                Estamos preparando o sistema de agendamento online. <br />
                Em breve você poderá escolher data e horário aqui.
            </p>

            <div className="p-8 bg-green-50 rounded-3xl border border-green-100 text-left">
                <h3 className="text-green-800 font-black mb-4 uppercase tracking-widest text-xs">Como proceder agora:</h3>
                <ul className="space-y-4 text-green-700 font-bold">
                    <li className="flex gap-4">
                        <span className="flex-none w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">1</span>
                        Compareça à nossa unidade com seus documentos.
                    </li>
                    <li className="flex gap-4">
                        <span className="flex-none w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">2</span>
                        Solicite a habilitação técnica FPGD.
                    </li>
                </ul>
            </div>
        </motion.div>
    );
};

export default SchedulingPage;
