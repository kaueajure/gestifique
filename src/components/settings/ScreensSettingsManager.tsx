
import React, { useState } from 'react';
import { User } from '../../types';
import { Globe, Layout, Smartphone, CreditCard, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { PricingSettingsManager } from './PricingSettingsManager';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ScreensSettingsManagerProps {
  currentUser: User;
}

export const ScreensSettingsManager: React.FC<ScreensSettingsManagerProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'home' | 'features'>('pricing');

  if (!currentUser.desenvolvedor) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
           <Globe size={20} className="text-blue-600" />
           <h3 className="text-xl font-bold text-slate-900 tracking-tight">Telas</h3>
        </div>
        <p className="text-sm font-medium text-slate-500">Configure conteúdos exibidos nas páginas públicas do Gestifique.</p>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('pricing')}
          className={cn(
            "h-9 px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
            activeTab === 'pricing' ? "bg-slate-100 text-slate-900 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/80"
          )}
        >
          <CreditCard size={14} /> Planos & Preços
        </button>
        <button 
          className="h-9 px-4 rounded-lg text-xs font-bold text-slate-400 cursor-not-allowed flex items-center gap-2"
          disabled
        >
          <Layout size={14} /> Home <Badge variant="slate" className="text-[8px] h-4 px-1">EM BREVE</Badge>
        </button>
        <button 
          className="h-9 px-4 rounded-lg text-xs font-bold text-slate-400 cursor-not-allowed flex items-center gap-2"
          disabled
        >
          <Smartphone size={14} /> Funcionalidades <Badge variant="slate" className="text-[8px] h-4 px-1">EM BREVE</Badge>
        </button>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PricingSettingsManager />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
