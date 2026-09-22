import { useEffect } from 'react';
import {
  History,
  X,
  Trash2,
  ExternalLink,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';
import type { HistoryItem, ScanResult } from '../types';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectResult: (result: ScanResult) => void;
  onRemoveItem: (id: string) => void;
  onClearHistory: () => void;
}

export function HistorySidebar({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onRemoveItem,
  onClearHistory,
}: HistorySidebarProps) {
  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 45) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getRiskStyles = (risk: HistoryItem['riskLevel']) => {
    switch (risk) {
      case 'high':
        return {
          badge: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30',
          dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
          label: 'HIGH THREAT',
          icon: ShieldAlert,
        };
      case 'medium':
        return {
          badge: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
          dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
          label: 'SUSPICIOUS',
          icon: AlertTriangle,
        };
      default:
        return {
          badge: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
          label: 'LOW RISK',
          icon: ShieldCheck,
        };
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-sidebar-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 shadow-2xl backdrop-blur-xl flex flex-col transition-transform duration-300 animate-in slide-in-from-right">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                <History className="h-4 w-4" />
              </div>
              <div>
                <h2
                  id="history-sidebar-title"
                  className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"
                >
                  <span>Scan History</span>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700">
                    {history.length}/5
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Last 5 scans stored in browser localStorage
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  title="Clear all saved scans"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close history sidebar"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* History List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-400 mb-3">
                  <Clock className="h-7 w-7" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No scan history yet
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  Every offer letter or URL you inspect will automatically be saved here (up to 5 scans) for quick reference.
                </p>
              </div>
            ) : (
              history.map((item) => {
                const riskStyles = getRiskStyles(item.riskLevel);
                const RiskIcon = riskStyles.icon;

                return (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/70 p-4 transition-all hover:border-cyan-500/50 hover:bg-white dark:hover:bg-slate-800/50 shadow-sm focus-within:ring-2 focus-within:ring-cyan-500/40"
                  >
                    {/* Top row: Type, Threat Badge, Delete Button */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        {item.inputType === 'url' ? (
                          <span className="flex items-center gap-1 rounded bg-cyan-100 dark:bg-cyan-950/80 px-2 py-0.5 text-[10px] font-mono text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/60">
                            <LinkIcon className="h-3 w-3" />
                            URL
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            <FileText className="h-3 w-3" />
                            Offer Text
                          </span>
                        )}

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold font-mono border ${riskStyles.badge}`}
                        >
                          <RiskIcon className="h-3 w-3" />
                          <span>{item.threatScore}%</span>
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(item.id);
                          }}
                          title="Remove from history"
                          aria-label={`Remove scan from ${formatTimestamp(item.timestamp)}`}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Input Snippet */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 font-mono bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800/80 leading-relaxed mb-3">
                      {item.inputSnippet}
                    </p>

                    {/* Footer / Revisit Button */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800/60">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.scanResult.flags.length} red flag
                        {item.scanResult.flags.length === 1 ? '' : 's'}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectResult(item.scanResult);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors focus:outline-none"
                      >
                        <span>Revisit Analysis</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950/60 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Data is saved strictly to your local browser storage. No logs or private offer texts are transmitted or shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
