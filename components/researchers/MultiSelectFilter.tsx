import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectFilterProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  };

  const buttonLabel =
    selected.length === 0
      ? 'TOUS'
      : selected.length === 1
        ? (options.find(o => o.value === selected[0])?.label ?? selected[0])
        : `${selected.length} sélectionnés`;

  return (
    <div className="space-y-1 relative" ref={ref}>
      <label className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-tighter">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full border-2 p-1 text-[10px] font-bold flex items-center justify-between gap-1 min-w-[120px] bg-white dark:bg-slate-800 dark:text-white transition-colors ${selected.length > 0 ? 'border-pixel-blue text-pixel-blue' : 'border-black dark:border-white'}`}
      >
        <span className="truncate max-w-[130px]">{buttonLabel}</span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel z-30 min-w-[200px] max-h-[280px] overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-b-2 border-black/20 dark:border-white/20 transition-colors">
            <input type="checkbox" checked={selected.length === 0} onChange={() => onChange([])} className="accent-current" />
            <span className="text-[10px] font-bold uppercase font-mono">TOUS</span>
          </label>
          {options.map(opt => (
            <label key={opt.value} className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
              <input type="checkbox" checked={selected.includes(opt.value)} onChange={() => toggle(opt.value)} className="accent-current" />
              <span className="text-[10px] font-bold uppercase font-mono truncate">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};
