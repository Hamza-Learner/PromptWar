import { useState } from 'react';
import { Search, Loader2, Sparkles, Link as LinkIcon, FileText, Trash2, ArrowRight } from 'lucide-react';
import { MAX_INPUT_LENGTH } from '../utils/constants';
import { isUrl } from '../utils/validators';

interface InputSectionProps {
  onScan: (input: string) => void;
  isLoading: boolean;
}

const PRESET_SCENARIOS = [
  {
    id: 'scenario-1',
    label: 'Scenario 1 (High Risk)',
    badge: 'Scam Letter',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    text: 'Dear Candidate, Congratulations! You have been selected for Software Engineer position at Amazon India. Salary: ₹12 LPA. To confirm your joining, please pay ₹15,000 for laptop and equipment. This amount will be refunded with your first salary. Immediate joining required. Contact: hr@amazon-careers-india.xyz',
  },
  {
    id: 'scenario-2',
    label: 'Scenario 2 (Medium Risk)',
    badge: 'Unverified Offer',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    text: 'Hello, We are pleased to offer you a position at TechCorp Solutions. Salary: ₹8 LPA. Please visit our office for document verification. Address: 123, MG Road, Bangalore. Contact: hr@techcorp.com',
  },
  {
    id: 'scenario-3',
    label: 'Scenario 3 (Low Risk)',
    badge: 'Legit Offer',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    text: 'Dear Rahul, We are pleased to offer you a position at Google India. Salary: ₹25 LPA. Please find the offer letter attached. For any queries, contact your recruiter at +91-XXXXXXXXXX or reply to this email from your official domain.',
  },
  {
    id: 'scenario-url',
    label: 'Phishing URL',
    badge: 'Suspicious Domain',
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    text: 'http://amazon-careers-india.xyz/verify-appointment',
  },
];

export function InputSection({ onScan, isLoading }: InputSectionProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const charCount = input.length;
  const isOverLimit = charCount > MAX_INPUT_LENGTH;
  const detectedUrl = input.trim().length > 0 && isUrl(input);

  const handleScan = () => {
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) {
      setError('Please paste a job offer or URL.');
      return;
    }
    if (isOverLimit) {
      setError(`Input exceeds ${MAX_INPUT_LENGTH} characters. Please shorten.`);
      return;
    }
    onScan(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd+Enter or Ctrl+Enter submits
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleScan();
    }
  };

  const loadScenario = (text: string) => {
    setError(null);
    setInput(text);
  };

  const handleClear = () => {
    setInput('');
    setError(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Preset Test Scenarios */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3.5 backdrop-blur-sm shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
            Quick Test Scenarios
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
            Click any preset to test the Scam Threat Index instantly
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESET_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => loadScenario(sc.text)}
              className="group flex flex-col items-start p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/90 bg-slate-50/90 dark:bg-slate-950/60 text-left transition-all hover:border-cyan-500/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                  {sc.label}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {sc.text}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea Container */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xl backdrop-blur-md transition-all focus-within:border-cyan-500/70 focus-within:shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/70 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              {detectedUrl ? (
                <>
                  <LinkIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono">Domain / URL Mode</span>
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">Offer Letter Text Mode</span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {input.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 transition-colors"
                title="Clear input"
                aria-label="Clear input"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="text-[11px]">Clear</span>
              </button>
            )}
            <span
              className={`font-mono text-xs ${
                isOverLimit ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-400'
              }`}
            >
              {charCount} / {MAX_INPUT_LENGTH}
            </span>
          </div>
        </div>

        <label htmlFor="scam-input" className="sr-only">
          Paste the job offer text or URL here
        </label>
        <textarea
          id="scam-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste the job offer text or URL here..."
          rows={7}
          disabled={isLoading}
          className="w-full resize-y bg-transparent text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none disabled:opacity-50 font-sans"
        />

        {error && (
          <div
            role="alert"
            className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
          >
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Action bar below textarea */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/70">
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Press <kbd className="rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">Ctrl</kbd> + <kbd className="rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:text-slate-300">Enter</kbd> to inspect
          </p>

          <button
            type="button"
            onClick={handleScan}
            disabled={isLoading || !input.trim() || isOverLimit}
            aria-label="Scan job offer or URL for scams"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-7 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/35 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>Analyzing Threat Vectors...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 stroke-[2.5]" />
                <span>Scan for Fraud</span>
                <ArrowRight className="h-4 w-4 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
