import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string | number | null;
  name?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  size?: 'sm' | 'md' | 'xs';
}

export const Select: React.FC<SelectProps> = ({
  value,
  name,
  onChange,
  options,
  placeholder = 'Selecionar...',
  disabled = false,
  className,
  buttonClassName,
  dropdownClassName,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("relative inline-block w-full", isOpen && "z-[9999]", className)} ref={containerRef}>
      {name && (
        <input 
          type="hidden" 
          name={name} 
          value={value === null || value === undefined ? '' : String(value)} 
        />
      )}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex items-center justify-between w-full bg-white border border-slate-200 rounded-lg text-slate-700 transition-all outline-none",
          "focus:ring-2 focus:ring-blue-100 focus:border-blue-300",
          "hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed",
          size === 'xs' && "h-7 px-2 text-[10px] font-bold",
          size === 'sm' && "h-8 px-2.5 text-xs font-bold",
          size === 'md' && "h-10 px-3 text-sm font-medium",
          buttonClassName
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={size === 'md' ? 16 : 14} 
          className={cn("text-slate-400 transition-transform flex-shrink-0 ml-2", isOpen && "rotate-180")} 
        />
      </button>

      {isOpen && (
        <div 
          className={cn(
            "absolute z-[9999] mt-1 min-w-full bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/60 p-1 max-h-64 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-150 origin-top",
            dropdownClassName
          )}
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic text-center">Nenhuma opção</div>
          ) : (
            options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <div
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors flex items-center justify-between group",
                    isSelected 
                      ? "bg-blue-600 text-white" 
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700",
                    option.disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={12} className="flex-shrink-0 ml-2" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
