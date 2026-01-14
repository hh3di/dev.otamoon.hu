import React, { useState, useRef, useEffect } from 'react';
import { LuChevronDown } from 'react-icons/lu';

export interface CustomMultiSelectOption {
  value: string | number;
  label: string;
}

export interface MultiSelectProps {
  options: CustomMultiSelectOption[];
  value?: CustomMultiSelectOption[];
  onChange: (value: CustomMultiSelectOption[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CustomMultiSelect: React.FC<MultiSelectProps> = ({ options, value = [], onChange, placeholder, className = '', disabled }) => {
  const [open, setOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState<'up' | 'down'>('down');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const dropdownHeight = Math.min(options.length * 40 + 16, 248);
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setOpenDirection('up');
      } else if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setOpenDirection('up');
      } else {
        setOpenDirection('down');
      }
    }
  }, [open, options.length]);

  const selectedCount = value.length;

  const handleOptionToggle = (opt: CustomMultiSelectOption) => {
    const exists = value.some((v) => v.value === opt.value);
    let newValue: CustomMultiSelectOption[];
    if (exists) {
      newValue = value.filter((v) => v.value !== opt.value);
    } else {
      newValue = [...value, opt];
    }
    onChange(newValue);
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        className={`w-full flex items-center justify-between p-2 border rounded-lg bg-slate-700 border-gray-600 focus:border-sky-600 duration-200 text-left transition-all cursor-pointer ${open ? 'border-sky-600 shadow-lg' : ''}`}
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selectedCount === 0 ? 'text-gray-400' : ''}`}>
          {selectedCount === 0 ? placeholder : `${selectedCount} selected`}
        </span>
        <LuChevronDown className={`ml-2 h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className={`absolute z-10 w-full bg-slate-800 border p-1 border-gray-700 rounded-lg shadow-lg animate-fade-in`}
          style={openDirection === 'up' ? { bottom: '100%', top: 'auto', marginBottom: 8 } : { top: '100%', bottom: 'auto', marginTop: 8 }}
        >
          <ul className="max-h-60 overflow-auto py-1 gap-2 px-1 flex flex-col">
            {options.map((opt) => {
              const isSelected = value.some((v) => v.value === opt.value);
              return (
                <li
                  key={opt.value}
                  className={`px-2 py-2 flex items-center break-all rounded-md gap-2 cursor-pointer transition-all duration-150 hover:bg-slate-700/60 ${isSelected ? 'bg-slate-700 font-semibold text-sky-400' : 'text-gray-300'}`}
                  onClick={() => handleOptionToggle(opt)}
                  aria-selected={isSelected}
                  tabIndex={0}
                >
                  <input type="checkbox" checked={isSelected} readOnly className="mr-2 accent-sky-400" />
                  {opt.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .animate-fade-in { animation: fade-in 0.18s ease; }
      `}</style>
    </div>
  );
};

export default CustomMultiSelect;
