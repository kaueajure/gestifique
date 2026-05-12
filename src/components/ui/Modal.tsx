import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn("relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]", sizes[size])}
          >
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto">
              {children}
            </div>

            {footer && (
              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
