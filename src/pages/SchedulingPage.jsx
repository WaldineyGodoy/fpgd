
import React from 'react';

const SchedulingPage = () => {
    const locations = [
        { name: 'Natal - RN', url: 'https://cal.com/fpgdrn/natal' },
        { name: 'Mossoró - RN', url: 'https://cal.com/fpgdrn/mossoro' },
        { name: 'Caicó - RN', url: 'https://cal.com/fpgdrn/caico' },
    ];

    return (
        <div className="w-full max-w-lg bg-white p-10 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center animate-fade-in text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">
                Você busca atendimentos em qual agência?
            </h1>

            <div className="w-full space-y-4 mb-8">
                {locations.map((loc) => (
                    <a
                        key={loc.name}
                        href={loc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-4 px-6 bg-white border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-bold rounded-xl transition-all text-lg shadow-sm hover:shadow-lg hover:-translate-y-1"
                    >
                        {loc.name}
                    </a>
                ))}
            </div>

            <div className="mt-4 pt-6 border-t border-gray-100 w-full">
                <p className="text-sm text-gray-500">
                    Selecione uma agência mais próxima para atendimento presencial ou vídeo chamada
                </p>
            </div>
        </div>
    );
};

export default SchedulingPage;
