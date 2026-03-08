
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
    value: string; // "YYYY-MM"
    onChange: (value: string) => void;
}

const MONTHS = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial parsing
    const initialDate = value ? new Date(value + '-01') : new Date();
    const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());

    const selectedYear = initialDate.getFullYear();
    const selectedMonth = initialDate.getMonth();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthClick = (monthIndex: number) => {
        const formattedMonth = (monthIndex + 1).toString().padStart(2, '0');
        onChange(`${viewYear}-${formattedMonth}`);
        setIsOpen(false);
    };

    const getDisplayValue = () => {
        if (!value) return 'Selecione o mês...';
        const [y, m] = value.split('-');
        const monthName = [
            'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ][parseInt(m) - 1];
        return `${monthName} de ${y}`;
    };

    return (
        <div className="relative" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus-within:border-green-500 outline-none transition-all font-bold text-gray-600 bg-white cursor-pointer flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>{getDisplayValue()}</span>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute z-50 mt-2 p-6 bg-white rounded-3xl shadow-2xl border border-gray-100 w-80 left-0"
                    >
                        <div className="flex flex-col gap-6">
                            {/* "Qualquer Data" Button style from image */}
                            <button 
                                type="button"
                                onClick={() => {
                                    const now = new Date();
                                    const y = now.getFullYear();
                                    const m = (now.getMonth() + 1).toString().padStart(2, '0');
                                    onChange(`${y}-${m}`);
                                    setViewYear(y);
                                    setIsOpen(false);
                                }}
                                className="w-full py-3 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-50 transition-colors text-sm"
                            >
                                Qualquer Data
                            </button>

                            <div className="flex items-center justify-between px-2">
                                <button 
                                    type="button" 
                                    onClick={() => setViewYear(viewYear - 1)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-blue-900" />
                                </button>
                                <span className="text-xl font-black text-slate-800">{viewYear}</span>
                                <button 
                                    type="button" 
                                    onClick={() => setViewYear(viewYear + 1)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-blue-900" />
                                </button>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {MONTHS.map((month, index) => {
                                    const isSelected = selectedYear === viewYear && selectedMonth === index;
                                    return (
                                        <button
                                            key={month}
                                            type="button"
                                            onClick={() => handleMonthClick(index)}
                                            className={`
                                                py-3 rounded-xl text-sm font-bold transition-all
                                                ${isSelected 
                                                    ? 'bg-[#003366] text-white shadow-lg' 
                                                    : 'bg-white text-slate-600 hover:bg-gray-50 border border-transparent hover:border-gray-100'}
                                            `}
                                        >
                                            {month}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MonthPicker;
