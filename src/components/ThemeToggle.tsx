import { Sun, Moon, Laptop } from 'lucide-react';
import type { ThemeMode } from '../utils/theme';

interface ThemeToggleProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export function ThemeToggle({ currentTheme, onThemeChange }: ThemeToggleProps) {
  const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Laptop },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className="inline-flex items-center rounded-xl border border-slate-300/80 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-900/90 p-0.5 shadow-sm backdrop-blur-md"
    >
      {options.map(({ mode, label, icon: Icon }) => {
        const isActive = currentTheme === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${label} theme`}
            title={`Switch to ${label} theme`}
            onClick={() => onThemeChange(mode)}
            className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
              isActive
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline capitalize">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
