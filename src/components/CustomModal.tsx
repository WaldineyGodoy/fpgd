
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Check, Info } from 'lucide-react';

export type ModalType = 'danger' | 'success' | 'info' | 'warning';

interface CustomModalProps {
  show: boolean;
  type: ModalType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({ 
  show, 
  type, 
  title, 
  message, 
  confirmLabel = 'Confirmar', 
  cancelLabel = 'Cancelar', 
  onConfirm, 
  onCancel 
}) => {
  const themes = {
    danger: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
      button: 'bg-red-600 hover:bg-red-700 shadow-red-900/20',
      accent: 'border-red-200'
    },
    success: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      icon: <Check className="w-8 h-8 text-[#198754]" />,
      button: 'bg-[#198754] hover:bg-[#157347] shadow-green-900/20',
      accent: 'border-green-200'
    },
    warning: {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/20',
      accent: 'border-amber-200'
    },
    info: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      icon: <Info className="w-8 h-8 text-blue-600" />,
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20',
      accent: 'border-blue-200'
    }
  };

  const theme = themes[type];

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 flex items-center justify-center z-[2000] p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-[#262727]/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl relative overflow-hidden border border-slate-100"
          >
            {/* Top Close Button */}
            <button 
              onClick={onCancel}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-10 text-center">
              {/* Icon Container */}
              <div className="flex justify-center mb-8">
                <div className={`p-6 rounded-[2rem] ${theme.iconBg} ring-8 ring-white shadow-sm`}>
                  {theme.icon}
                </div>
              </div>

              {/* Text Content */}
              <h3 className="text-2xl font-black text-[#262727] mb-4 tracking-tight uppercase px-4">
                {title}
              </h3>
              <p className="text-slate-500 font-bold text-base leading-relaxed mb-10 px-6">
                {message}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 px-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  className={`w-full py-5 ${theme.button} text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2`}
                >
                  {confirmLabel}
                </motion.button>
                
                <button
                  onClick={onCancel}
                  className="w-full py-5 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>

            {/* Bottom Glow Decoration */}
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#198754]/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CustomModal;
