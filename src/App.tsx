import { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Terminal, Lock, HelpCircle, History } from 'lucide-react';
import { InputSection } from './components/InputSection';
import { ResultCard } from './components/ResultCard';
import { ErrorToast } from './components/ErrorToast';
import { HistorySidebar } from './components/HistorySidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { runScamInspection } from './services/scanner';
import {
  getSavedTheme,
  applyTheme,
  setupSystemThemeListener,
  type ThemeMode,
} from './utils/theme';
import {
  getScanHistory,
  saveScanToHistory,
  removeHistoryItem,
  clearScanHistory,
  type HistoryItem,
} from './utils/history';
import type { ScanResult } from './types';

export default function App() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'error' | 'warning' | 'info'>('error');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => getScanHistory());
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getSavedTheme());

  // Initialize and synchronize theme
  useEffect(() => {
    applyTheme(themeMode);
    const cleanup = setupSystemThemeListener(() => {
      setThemeMode(getSavedTheme());
    });
    return cleanup;
  }, [themeMode]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
    applyTheme(newTheme);
  };

  const handleScan = async (input: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const scanResult = await runScamInspection(input);
      setResult(scanResult);

      // Persist to localStorage history (up to last 5 scans)
      const updatedHistory = saveScanToHistory(scanResult);
      setHistory(updatedHistory);

      if (scanResult.fallbackUsed) {
        setToastType('info');
        setErrorMessage('Inspection processed using high-precision local heuristic rules.');
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Analysis service temporarily unavailable. Please try again.';
      setToastType('error');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage(null);
  };

  const handleSelectHistoryResult = (selected: ScanResult) => {
    setResult(selected);
    setErrorMessage(null);
  };

  const handleClearHistory = () => {
    clearScanHistory();
    setHistory([]);
  };

  const handleRemoveHistoryItem = (id: string) => {
    const updated = removeHistoryItem(id);
    setHistory(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-900 dark:selection:text-cyan-200">
      {/* Background Cyber Glow Grids */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-[450px] h-[450px] bg-rose-500/5 dark:bg-rose-500/5 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 right-10 w-[500px] h-[400px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f00f_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f00f_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 rounded-lg bg-cyan-500 px-4 py-2 text-slate-950 font-bold"
      >
        Skip to main inspection tool
      </a>

      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-slate-950 shadow-[0_0_18px_rgba(6,182,212,0.4)]">
              <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-mono">
                  ScamShield
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/50">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Fake Offer Letter &amp; Phishing Inspector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle (Dark / Light / System) */}
            <ThemeToggle currentTheme={themeMode} onThemeChange={handleThemeChange} />

            {/* History Toggle Button */}
            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              aria-label={`View Scan History (${history.length} saved)`}
              className="group relative inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <History className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 group-hover:rotate-[-20deg] transition-transform duration-200" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-500/20 px-1.5 font-mono text-[10px] font-bold text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30">
                  {history.length}
                </span>
              )}
            </button>

            {/* Live Status indicator */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-400 font-mono shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-medium hidden md:inline">AI &amp; RDAP Online</span>
              <span className="text-[11px] font-medium md:hidden">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero Title Section */}
        {!result && (
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/30 px-3.5 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              <Terminal className="h-3.5 w-3.5" />
              <span>Real-Time Employment Fraud &amp; URL Threat Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Inspect Fake Offer Letters &amp; Phishing Traps
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Job seekers lose millions to advance-fee equipment schemes and spoofed company domains that bypass email spam filters. Paste any appointment letter or URL to compute its <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Scam Threat Index (0–100%)</span>.
            </p>
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-4xl mx-auto rounded-2xl border border-cyan-500/30 bg-white dark:bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md space-y-6 animate-pulse"
          >
            <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-500 dark:text-cyan-400">
                <ShieldAlert className="h-10 w-10 animate-pulse text-cyan-600 dark:text-cyan-400" />
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-20" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Scanning Threat Vectors...
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  Querying Gemini 2.5 Flash fraud models, checking RDAP domain registration age, auditing SSL certificates, and inspecting advance-fee signals.
                </p>
              </div>

              {/* Progress bars skeleton */}
              <div className="w-full max-w-md space-y-2 pt-2">
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full animate-[shimmer_2s_infinite]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Extracting Domain &amp; Keywords</span>
                  <span>Calculating Threat Score</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Screen vs Result Screen */}
        {!isLoading && !result && (
          <div className="max-w-4xl mx-auto">
            {history.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/40 px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>
                    You have <strong className="text-cyan-700 dark:text-cyan-300 font-mono">{history.length}</strong> recent scan{history.length > 1 ? 's' : ''} stored locally.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="inline-flex items-center gap-1 font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors focus:outline-none self-start sm:self-auto"
                >
                  <span>Open History</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            )}

            <InputSection onScan={handleScan} isLoading={isLoading} />

            {/* Educational Feature Pillars */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
                  <Lock className="h-4 w-4" />
                  <span>RDAP Domain Verification</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Automatically extracts domains, flags recently spun-up sites (&lt;30 days old), identifies suspicious TLDs (.xyz, .top, .live), and flags brand impersonation.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold mb-1">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Advance-Fee &amp; Urgency Detection</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Pinpoints fake laptop fees (+25 pts), forced security deposits, artificial joining deadlines (+10 pts), and unofficial mailboxes.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  <HelpCircle className="h-4 w-4" />
                  <span>Actionable Defenses</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Delivers clear steps to protect yourself, verified channels for corporate confirmation, and direct reporting links to national cybercrime agencies.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && result && (
          <div className="max-w-4xl mx-auto">
            <ResultCard
              result={result}
              onReset={handleReset}
              onOpenHistory={() => setIsHistoryOpen(true)}
              historyCount={history.length}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 mt-16 py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p>
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">Security Notice:</strong> ScamShield is an assistive risk evaluation engine. Never wire money or share banking passwords or OTPs for any employment appointment.
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            Emergency Cyber Helpline (India): <span className="text-cyan-600 dark:text-cyan-400 font-mono">1930</span> • US Internet Crime: <span className="text-cyan-600 dark:text-cyan-400 font-mono">ic3.gov</span>
          </p>
        </div>
      </footer>

      {/* Error Toast */}
      {errorMessage && (
        <ErrorToast
          message={errorMessage}
          type={toastType}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* History Sidebar Modal Drawer */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectResult={handleSelectHistoryResult}
        onClearHistory={handleClearHistory}
        onRemoveItem={handleRemoveHistoryItem}
      />
    </div>
  );
}
