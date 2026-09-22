import { ShieldCheck, ExternalLink, AlertOctagon } from 'lucide-react';
import type { RiskLevel } from '../types';

interface RecommendationsProps {
  recommendations: string[];
  riskLevel: RiskLevel;
}

export function Recommendations({ recommendations, riskLevel }: RecommendationsProps) {
  const isHighRisk = riskLevel === 'high';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {isHighRisk ? (
          <AlertOctagon className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />
        ) : (
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        )}
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Recommended Security Actions
        </h3>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4">
        <ul className="space-y-2.5">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
              <span className="mt-1.5 flex h-2 w-2 shrink-0 rounded-full bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              <span className="leading-relaxed">{rec}</span>
            </li>
          ))}
        </ul>

        {/* Reporting Resources for High/Medium risk */}
        {riskLevel !== 'low' && (
          <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
              Official Cybercrime Reporting Portals:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-1.5 font-medium text-cyan-700 dark:text-cyan-300 transition-colors hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
              >
                <span>India: cybercrime.gov.in (Helpline: 1930)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://www.ic3.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-1.5 font-medium text-cyan-700 dark:text-cyan-300 transition-colors hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
              >
                <span>US: FBI Internet Crime Complaint (IC3)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://reportfraud.ftc.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-1.5 font-medium text-cyan-700 dark:text-cyan-300 transition-colors hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
              >
                <span>US: Federal Trade Commission (FTC)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
