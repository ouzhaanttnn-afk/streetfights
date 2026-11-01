import React from 'react';

interface SegmentedProps<T extends string> {
  value: T;
  options: { id: T; label: string; badge?: boolean }[];
  onChange: (id: T) => void;
}

// Two-way switch used inside merged tabs (Gear | Skills, Stages | Quests)
export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="tablist" className="grid grid-flow-col auto-cols-fr gap-1 p-1 rounded-2xl bg-black/60 border border-white/10">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            data-view={o.id}
            onClick={() => onChange(o.id)}
            className={`relative min-h-10 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all active:scale-[0.97] ${
              active ? 'game-btn-gold text-black shadow-md' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {o.label}
            {o.badge && <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
        );
      })}
    </div>
  );
}
