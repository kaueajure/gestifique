import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

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
  size?: "sm" | "md" | "lg" | "xs";
}

export const Select: React.FC<SelectProps> = ({
  value,
  name,
  onChange,
  options,
  placeholder = "Selecionar...",
  disabled = false,
  className,
  buttonClassName,
  dropdownClassName,
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(
    (opt) => String(opt.value) === String(value),
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
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
    <div
      className={cn(
        "relative inline-block w-full text-left",
        isOpen && "z-[9999]",
        className,
      )}
      ref={containerRef}
    >
      {name && (
        <input
          type="hidden"
          name={name}
          value={value === null || value === undefined ? "" : String(value)}
        />
      )}
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          "flex items-center justify-between w-full bg-white border border-slate-300 rounded-md text-slate-700 transition-all outline-none",
          "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          "hover:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
          size === "xs" && "h-6 px-2 text-[11px]",
          size === "sm" && "h-7 px-2 py-1 text-xs",
          size === "md" && "h-8 px-2.5 py-1.5 text-[13px]",
          size === "lg" && "h-10 px-3 py-2 text-sm",
          buttonClassName,
        )}
      >
        <span className="truncate">
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          size={size === "md" || size === "sm" || size === "xs" ? 14 : 16}
          className={cn(
            "text-slate-400 transition-transform flex-shrink-0 ml-2",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-[9999] mt-1 min-w-full w-max bg-white border border-slate-200 rounded-md shadow-lg p-1 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in duration-150 origin-top",
            dropdownClassName,
          )}
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic text-center">
              Nenhuma opção
            </div>
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
                    "px-2.5 py-1.5 rounded-sm text-[13px] cursor-pointer transition-colors flex items-center justify-between group",
                    isSelected
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                    option.disabled &&
                      "opacity-50 cursor-not-allowed pointer-events-none",
                  )}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {isSelected && (
                    <Check size={14} className="flex-shrink-0 text-slate-600" />
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
