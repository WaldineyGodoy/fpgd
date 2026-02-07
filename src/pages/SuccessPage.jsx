
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center animate-fade-in">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Tudo certo!
            </h1>

            <p className="text-gray-600 text-lg mb-8 max-w-md">
                Pode começar novamente quando quiser.
            </p>

            <button
                onClick={() => navigate('/consulta_cadastro')}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transform hover:-translate-y-1 transition-all duration-200"
            >
                Começar Novamente
            </button>
        </div>
    );
};

export default SuccessPage;
