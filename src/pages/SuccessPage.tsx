
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SuccessPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg p-10 bg-white/90 backdrop-blur-md rounded-[3rem] shadow-2xl text-center border border-white/20"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner"
            >
                ✓
            </motion.div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-4xl font-black text-gray-800 mb-4"
            >
                Tudo <span className="text-green-600">Certo!</span>
            </motion.h1>

            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-gray-500 font-bold text-lg mb-10 leading-relaxed"
            >
                Sua solicitação foi processada com sucesso. <br />
                Pode começar novamente quando quiser.
            </motion.p>

            <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#15803d' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="w-full py-5 bg-green-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-green-100 border-b-8 border-green-800 transition-colors"
            >
                RECOMEÇAR ✦
            </motion.button>
        </motion.div>
    );
};

export default SuccessPage;
