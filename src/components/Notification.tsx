
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  show: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ show, type, title, message, onClose }) => {
  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
      accent: 'bg-green-600'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="w-6 h-6 text-red-600" />,
      accent: 'bg-red-600'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="w-6 h-6 text-blue-600" />,
      accent: 'bg-blue-600'
    }
  };

  const style = colors[type];

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`w-full max-w-sm ${style.bg} border-2 ${style.border} rounded-[2rem] shadow-2xl relative overflow-hidden`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${style.accent}`} />
            
            <div className="p-8">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-1 rounded-full hover:bg-black/5 transition-colors text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className={`mb-4 p-3 rounded-2xl ${style.bg} ring-8 ring-white shadow-sm`}>
                  {style.icon}
                </div>
                
                <h3 className={`text-xl font-black ${style.text} mb-2 tracking-tight`}>
                  {title}
                </h3>
                
                <p className="text-gray-500 font-bold text-sm leading-relaxed">
                  {message}
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={`mt-8 w-full py-4 ${style.accent} text-white font-black rounded-xl shadow-lg transition-all uppercase tracking-widest text-xs`}
                >
                  Continuar
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
