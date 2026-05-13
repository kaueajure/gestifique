import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Save, 
  ChevronDown,
  Layout,
  LayoutList,
  LayoutGrid
} from 'lucide-react';
import { Button } from '../ui/Button';
import { TicketView } from '../../types';

interface Props {
  views: TicketView[];
  currentViewId: number | null;
  onSelectView: (view: TicketView | null) => void;
  onSaveCurrent: (name: string) => void;
  onDeleteView: (id: number) => void;
}

export const TicketSavedViews: React.FC<Props> = ({ 
  views, 
  currentViewId, 
  onSelectView, 
  onSaveCurrent,
  onDeleteView
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const handleSave = () => {
    if (newViewName.trim()) {
      onSaveCurrent(newViewName.trim());
      setNewViewName('');
      setShowSaveModal(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <select
          value={currentViewId || ''}
          onChange={(e) => {
            if (e.target.value === 'none') {
              onSelectView(null);
            } else {
              const view = views.find(v => v.id === parseInt(e.target.value));
              if (view) onSelectView(view);
            }
          }}
          className="bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 appearance-none min-w-[180px]"
        >
          <option value="none">Filtros Personalizados</option>
          <optgroup label="Minhas Views">
            {views.map(view => (
              <option key={view.id} value={view.id}>{view.nome}</option>
            ))}
          </optgroup>
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSaveModal(true)}
        className="text-slate-400 hover:text-slate-200 gap-2 border-slate-800 h-[38px]"
        title="Salvar filtros atuais como view"
      >
        <Plus size={16} />
        Salvar View
      </Button>

      {currentViewId && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDeleteView(currentViewId)}
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border-slate-800 h-[38px] w-[38px]"
          title="Excluir view selecionada"
        >
          <Trash2 size={16} />
        </Button>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Bookmark className="text-blue-500" size={20} />
                Salvar Nova View
              </h3>
              <p className="text-sm text-slate-400 mt-1">Os filtros e o modo de visualização atuais serão salvos.</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nome da View</label>
                <input
                  type="text"
                  autoFocus
                  value={newViewName}
                  onChange={(e) => setNewViewName(e.target.value)}
                  placeholder="Ex: Meus Urgentes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>
            </div>

            <div className="p-6 bg-slate-950/50 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowSaveModal(false)} className="text-slate-400">
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!newViewName.trim()}
                className="bg-blue-600 hover:bg-blue-500 gap-2"
              >
                <Save size={16} />
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
