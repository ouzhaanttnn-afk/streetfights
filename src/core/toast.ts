// Small, non-blocking notifications ("+40 power", "sold for 120 coins") instead of modal popups.
export type ToastTone = 'good' | 'info' | 'gold';

export interface Toast {
  id: number;
  text: string;
  tone: ToastTone;
}

let seq = 0;
let toasts: Toast[] = [];
const listeners = new Set<(t: Toast[]) => void>();

const emit = () => listeners.forEach((fn) => fn(toasts));

export function pushToast(text: string, tone: ToastTone = 'info', ms = 2400) {
  const toast = { id: ++seq, text, tone };
  toasts = [...toasts.slice(-2), toast]; // at most three on screen
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== toast.id);
    emit();
  }, ms);
}

export function subscribeToasts(fn: (t: Toast[]) => void) {
  listeners.add(fn);
  fn(toasts);
  return () => {
    listeners.delete(fn);
  };
}
