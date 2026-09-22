import { useEffect } from 'react';
import { AlertTriangle, X, Info } from 'lucide-react';

interface ErrorToastProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onDismiss: () => void;
}

export function ErrorToast({ message, type = 'error', onDismiss }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const colorStyles = {
    error: 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-950/50',
    warning: 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-950/50',
    info: 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200 shadow-cyan-950/50',
  }[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 right-6 z-50 flex max-w-md items-start gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${colorStyles}`}
    >
      <div className="mt-0.5 shrink-0">
        {type === 'info' ? (
          <Info className="h-5 w-5 text-cyan-400" aria-hidden="true" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-rose-400" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 text-sm font-medium leading-relaxed">
        {message}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
