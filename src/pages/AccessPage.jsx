
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { IMaskInput } from 'react-imask';

const AccessPage = () => {
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleCheck = async (e) => {
        e.preventDefault();
        const cleanCnpj = cnpj.replace(/\D/g, '');

        if (cleanCnpj.length !== 14) {
            setError('Digite um CNPJ válido com 14 dígitos.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { data, error: dbError } = await supabase
                .from('companies')
                .select('id')
                .eq('cnpj', cleanCnpj)
                .single();

            if (dbError && dbError.code !== 'PGRST116') { // PGRST116 is "No rows found"
                console.error(dbError);
                setError('Erro ao verificar CNPJ. Tente novamente.');
                setLoading(false);
                return;
            }

            if (data) {
                // Found -> Go to Scheduling
                navigate('/agendamento');
            } else {
                // Not Found -> Go to Registration with message
                // We can pass state to the route
                navigate('/cadastro', { state: { message: 'EMPRESA NÃO CADASTRADA. Por favor, realize o cadastro.', initialCnpj: cleanCnpj } });
            }

        } catch (err) {
            console.error(err);
            setError('Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-scale-in">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
                Acesso ao Agendamento
            </h1>
            <p className="text-gray-500 text-center mb-6">
                Informe o CNPJ da sua empresa para prosseguir.
            </p>

            <form onSubmit={handleCheck} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        CNPJ
                    </label>
                    <IMaskInput
                        mask="00.000.000/0000-00"
                        value={cnpj}
                        unmask={false}
                        onAccept={(value) => setCnpj(value)}
                        placeholder="00.000.000/0000-00"
                        className="w-full p-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500 focus:outline-none transition-all"
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all disabled:opacity-50"
                >
                    {loading ? 'Verificando...' : 'Acessar'}
                </button>
            </form>
        </div>
    );
};

export default AccessPage;
