import React, { useEffect, useState } from 'react';
import { Toast, subscribeToasts } from '../core/toast';

const TONE: Record<Toast['tone'], string> = {
  good: 'border-emerald-400/60 text-emerald-200',
  info: 'border-white/20 text-zinc-100',
  gold: 'border-amber-400/60 text-amber-200',
};

export const ToastStack: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => subscribeToasts(setToasts), []);
  if (!toasts.length) return null;
  return (
    <div aria-live="polite" className="pointer-events-none absolute left-0 right-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-1.5 px-4">
      {toasts.map((t) => (
        <div key={t.id} data-toast className={`toast-in max-w-full px-3.5 py-1.5 rounded-full bg-black/85 backdrop-blur-md border text-[11px] font-black shadow-xl truncate ${TONE[t.tone]}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
};
