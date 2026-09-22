import { useState } from 'react';
import { ChevronDown, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { RedFlag } from '../types';

interface WhyThisScoreProps {
  flags: RedFlag[];
  totalScore: number;
}

export function WhyThisScore({ flags }: WhyThisScoreProps) {
  // Track open/closed state of accordion items. Default first item or all open if few.
  const [openItems, setOpenItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    flags.forEach((f, idx) => {
      initial[f.id] = idx === 0 || flags.length <= 3;
    });
    return initial;
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getSeverityBadge = (severity: RedFlag['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30';
      case 'medium':
        return 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30';
      default:
        return 'bg-cyan-100 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30';
    }
  };

  if (flags.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/20 p-5 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <h4 className="mt-2 text-base font-semibold text-emerald-900 dark:text-emerald-200">
          Zero Fraud Flags Detected
        </h4>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          No suspicious payment demands, urgency tricks, domain mismatches, or predatory recruitment phrases were identified in this communication.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Why this score? ({flags.length} Red Flag{flags.length > 1 ? 's' : ''} Identified)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Total Flag Weight: +{flags.reduce((acc, f) => acc + f.points, 0)} pts
        </span>
      </div>

      <div className="space-y-2.5" role="region" aria-label="Detailed red flag breakdown">
        {flags.map((flag, index) => {
          const isOpen = !!openItems[flag.id];
          return (
            <div
              key={flag.id || index}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <button
                type="button"
                onClick={() => toggleItem(flag.id)}
                aria-expanded={isOpen}
                aria-controls={`flag-content-${flag.id}`}
                className="flex w-full items-center justify-between p-4 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <AlertCircle
                      className={`h-4 w-4 ${
                        flag.severity === 'high'
                          ? 'text-rose-600 dark:text-rose-400'
                          : flag.severity === 'medium'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-cyan-600 dark:text-cyan-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                        {flag.name}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${getSeverityBadge(
                          flag.severity
                        )}`}
                      >
                        {flag.severity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 text-xs font-bold font-mono text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                    +{flag.points} pts
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>

              {isOpen && (
                <div
                  id={`flag-content-${flag.id}`}
                  className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/40 px-4 py-3 text-sm space-y-2.5"
                >
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Detected Evidence:
                    </span>
                    <blockquote className="mt-1 rounded-md border-l-2 border-rose-500 bg-rose-50 dark:bg-rose-950/20 px-3 py-2 font-mono text-xs text-rose-900 dark:text-rose-200 break-words">
                      {flag.evidence}
                    </blockquote>
                  </div>

                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Threat Analysis:
                    </span>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                      {flag.explanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
