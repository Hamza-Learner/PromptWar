import { useEffect, useRef } from 'react';
import { ScanResult, ThreatFlag } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ResultCardProps {
  result: ScanResult | null;
  flags: ThreatFlag[];
  onExportPDF: () => void;
  onShare: () => void;
  onNewScan: () => void;
}

export function ResultCard({ result, flags, onExportPDF, onShare, onNewScan }: ResultCardProps) {
  const { theme } = useTheme();
  const gaugeRef = useRef<SVGCircleElement>(null);

  if (!result) return null;

  const score = result.threatScore;
  const isHighRisk = score >= 71;
  const isMediumRisk = score >= 31;
  const riskLabel = isHighRisk ? 'CRITICAL' : isMediumRisk ? 'HIGH' : 'LOW';
  const riskColor = isHighRisk ? 'tertiary' : isMediumRisk ? 'tertiary' : 'secondary';

  const getColorClasses = (color: string) => {
    if (theme === 'dark') return `text-${color}`;
    if (color === 'tertiary') return 'text-pink-600';
    if (color === 'secondary') return 'text-green-600';
    if (color === 'primary') return 'text-cyan-600';
    if (color === 'error') return 'text-red-600';
    return `text-${color}-600`;
  };

  const getBgColorClasses = (color: string) => {
    if (theme === 'dark') return `bg-${color}-container`;
    if (color === 'tertiary') return 'bg-pink-100';
    if (color === 'secondary') return 'bg-green-100';
    if (color === 'primary') return 'bg-cyan-100';
    if (color === 'error') return 'bg-red-100';
    return `bg-${color}-100`;
  };

  const getOnColorClasses = (color: string) => {
    if (theme === 'dark') return `text-on-${color}-container`;
    if (color === 'tertiary') return 'text-pink-900';
    if (color === 'secondary') return 'text-green-900';
    if (color === 'primary') return 'text-cyan-900';
    if (color === 'error') return 'text-red-900';
    return `text-${color}-900`;
  };

  const getSurfaceClasses = () => {
    if (theme === 'dark') return 'bg-surface-container';
    return 'bg-white';
  };

  const getSurfaceLowClasses = () => {
    if (theme === 'dark') return 'bg-surface-container-low';
    return 'bg-gray-50';
  };

  const getSurfaceHighClasses = () => {
    if (theme === 'dark') return 'bg-surface-container-high';
    return 'bg-gray-100';
  };

  const getOnSurfaceClasses = () => {
    if (theme === 'dark') return 'text-on-surface';
    return 'text-gray-900';
  };

  const getOnSurfaceVariantClasses = () => {
    if (theme === 'dark') return 'text-on-surface-variant';
    return 'text-gray-600';
  };

  const getPrimaryClasses = () => {
    if (theme === 'dark') return 'text-primary';
    return 'text-cyan-600';
  };

  const getSecondaryClasses = () => {
    if (theme === 'dark') return 'text-secondary';
    return 'text-green-600';
  };

  const getErrorClasses = () => {
    if (theme === 'dark') return 'text-error';
    return 'text-red-600';
  };

  const getTertiaryClasses = () => {
    if (theme === 'dark') return 'text-tertiary';
    return 'text-pink-600';
  };

  const getOutlineClasses = () => {
    if (theme === 'dark') return 'text-outline';
    return 'text-gray-400';
  };

  // Animate gauge on mount
  useEffect(() => {
    if (gaugeRef.current) {
      const circumference = 2 * Math.PI * 50; // 314.15
      const offset = circumference * (1 - score / 100);
      setTimeout(() => {
        gaugeRef.current!.style.strokeDashoffset = String(offset);
      }, 150);
    }
  }, [score]);

  const getFlagIconColor = (severity: string) => {
    if (severity === 'High') return getErrorClasses();
    if (severity === 'Medium') return getTertiaryClasses();
    return getPrimaryClasses();
  };

  const getFlagBgColor = (severity: string) => {
    if (theme === 'dark') {
      if (severity === 'High') return 'bg-error-container';
      if (severity === 'Medium') return 'bg-tertiary-container';
      return 'bg-primary-container';
    }
    if (severity === 'High') return 'bg-red-100';
    if (severity === 'Medium') return 'bg-pink-100';
    return 'bg-cyan-100';
  };

  const getFlagTextColor = (severity: string) => {
    if (theme === 'dark') {
      if (severity === 'High') return 'text-error';
      if (severity === 'Medium') return 'text-tertiary';
      return 'text-primary';
    }
    if (severity === 'High') return 'text-red-900';
    if (severity === 'Medium') return 'text-pink-900';
    return 'text-cyan-900';
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Toast Banner */}
      <div className={`mx-4 mb-3 p-3 rounded-xl ${getSurfaceHighClasses()} shadow-xl flex items-center justify-between transition-all duration-300 transform translate-y-0 opacity-100`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full ${getSecondaryClasses()} animate-ping`}></div>
          <span className="font-telemetry-sm text-telemetry-sm text-on-surface">Forensic Analysis Complete — Case Saved</span>
        </div>
        <button className="text-on-surface-variant hover:text-on-surface" onClick={() => {}} type="button">
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {/* Top Severity Banner */}
      <section className="px-4 mb-4">
        <div className={`rounded-xl p-4 ${getBgColorClasses('error')} ${getOnColorClasses('error')} shadow-md flex flex-col gap-2 relative overflow-hidden`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[20px] ${getErrorClasses()}`} style={{ fontVariationSettings: "'FILL' 1" }}>gpp_maybe</span>
              <span className="font-label-caps text-label-caps tracking-widest uppercase">CRITICAL PHISHING & ADVANCE-FEE SCAM</span>
            </div>
            <span className="font-telemetry-sm text-telemetry-sm px-2 py-0.5 rounded-full bg-surface-container-lowest/60 text-error">#SCAM-{result.caseId}</span>
          </div>
          <p className="font-body-md text-body-md font-medium leading-tight">
            Severe fraud markers identified. Malicious recruitment campaign impersonating legitimate operations.
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="font-telemetry-sm text-telemetry-sm text-on-error-container/80">INSPECTED: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} UTC</span>
            <span className="font-telemetry-sm text-telemetry-sm text-error font-semibold uppercase">STATUS: {riskLabel}_RISK</span>
          </div>
        </div>
      </section>

      {/* Threat Gauge & Composite Score Section */}
      <section className="px-4 mb-4">
        <div className={`rounded-xl ${getSurfaceClasses()} p-5 shadow-lg flex flex-col gap-5`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Circular SVG Threat Meter */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle className="text-surface-container-high fill-none" cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="9" />
                <circle
                  ref={gaugeRef}
                  className={`text-${riskColor} fill-none transition-all duration-1000 ease-out`}
                  cx="60"
                  cy="60"
                  id="gaugeProgress"
                  r="50"
                  stroke="currentColor"
                  strokeDasharray="314.15"
                  strokeDashoffset="314.15"
                  strokeLinecap="round"
                  strokeWidth="9"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`font-telemetry-lg text-telemetry-lg font-bold ${getColorClasses(riskColor)} tracking-tight`}>{score}<span className="font-telemetry-sm text-telemetry-sm text-outline font-normal">/100</span></span>
                <span className={`font-label-caps text-label-caps ${getColorClasses(riskColor)} uppercase tracking-wider mt-0.5`}>{riskLabel}</span>
              </div>
            </div>

            {/* Composite Verdict and ScoreBadge */}
            <div className="flex flex-col gap-2.5 w-full">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full ${getBgColorClasses('error')} ${getErrorClasses()} font-telemetry-sm text-telemetry-sm font-semibold flex items-center gap-1.5 shadow-sm`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                  HIGH RISK VERDICT
                </span>
                <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">CONFIDENCE: {result.confidence}%</span>
              </div>
              <h2 className={`font-headline-sm text-headline-sm ${getOnSurfaceClasses()} font-semibold leading-snug`}>
                DO NOT PAY OR SEND PERSONAL CREDENTIALS
              </h2>
              <p className={`font-body-sm text-body-sm ${getOnSurfaceVariantClasses()}`}>
                Document synthesis reveals spoofed identity headers combined with advance payment solicitations characteristic of syndicated job fraud.
              </p>
            </div>
          </div>

          {/* Key Telemetry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
            <div className={`p-3 rounded-lg ${getSurfaceLowClasses()} flex flex-col gap-1`}>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-caps text-label-caps uppercase">Domain Velocity</span>
                <span className={`material-symbols-outlined text-[15px] ${getTertiaryClasses()}`}>history</span>
              </div>
              <span className={`font-telemetry-md text-telemetry-md ${getOnSurfaceClasses()} font-semibold`}>{result.domainAge ? `${result.domainAge} Days Old` : 'Unknown'}</span>
              <span className={`font-telemetry-sm text-telemetry-sm ${getTertiaryClasses()} truncate`}>{result.registrar || 'Unknown Registrar'}</span>
            </div>
            <div className={`p-3 rounded-lg ${getSurfaceLowClasses()} flex flex-col gap-1`}>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-caps text-label-caps uppercase">SPF • DMARC</span>
                <span className={`material-symbols-outlined text-[15px] ${getTertiaryClasses()}`}>verified_user</span>
              </div>
              <span className={`font-telemetry-md text-telemetry-md ${getErrorClasses()} font-semibold`}>{result.spfDmarc?.pass ? 'Pass' : 'Fail (Spoofed)'}</span>
              <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant truncate">{result.domain || 'N/A'}</span>
            </div>
            <div className={`p-3 rounded-lg ${getSurfaceLowClasses()} flex flex-col gap-1`}>
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-label-caps text-label-caps uppercase">Urgency NLP Index</span>
                <span className={`material-symbols-outlined text-[15px] ${getTertiaryClasses()}`}>speed</span>
              </div>
              <span className={`font-telemetry-md text-telemetry-md ${getTertiaryClasses()} font-semibold`}>{result.urgencyScore}% High Pressure</span>
              <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">Imposed Deadline Detected</span>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion: Red Flag Forensic Breakdown */}
      <section className="px-4 mb-4">
        <div className={`rounded-xl ${getSurfaceClasses()} p-4 shadow-lg flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[20px] ${getPrimaryClasses()}`}>policy</span>
              <h3 className={`font-headline-sm text-headline-sm ${getOnSurfaceClasses()} font-semibold`}>Forensic Threat Anatomy</h3>
            </div>
            <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">{flags.length} FLAGS TRIGGERED</span>
          </div>

          {flags.map((flag, index) => (
            <div key={index} className={`rounded-lg ${getSurfaceLowClasses()} p-3.5 flex flex-col gap-2`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${getFlagIconColor(flag.severity)}`}></span>
                  <span className={`font-body-md text-body-md ${getOnSurfaceClasses()} font-semibold`}>{flag.title}</span>
                </div>
                <span className={`font-telemetry-sm text-telemetry-sm px-2 py-0.5 rounded-full font-medium shrink-0 ${getFlagBgColor(flag.severity)} ${getFlagTextColor(flag.severity)}`}>+{flag.points} PTS</span>
              </div>
              <p className={`font-body-sm text-body-sm ${getOnSurfaceVariantClasses()} pl-4`}>
                {flag.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Immediate Actionable Defenses */}
      <section className="px-4 mb-4">
        <div className={`rounded-xl ${getSurfaceClasses()} p-4 shadow-lg flex flex-col gap-3`}>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[20px] ${getSecondaryClasses()}`}>security</span>
            <h3 className={`font-headline-sm text-headline-sm ${getOnSurfaceClasses()} font-semibold`}>Defensive Countermeasures</h3>
          </div>
          <p className={`font-body-sm text-body-sm ${getOnSurfaceVariantClasses()}`}>
            Execute these threat mitigation protocols immediately to shield your accounts and financial identities.
          </p>
          <div className="flex flex-col gap-2.5 pt-1">
            {result.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-2.5 rounded-lg bg-surface-container-low">
                <div className={`w-6 h-6 rounded-full ${getSecondaryClasses()}-container text-on-secondary-container flex items-center justify-center shrink-0 mt-0.5`}>
                  <span className="material-symbols-outlined text-[15px]">check</span>
                </div>
                <div className="flex flex-col">
                  <span className={`font-body-md text-body-md ${getOnSurfaceClasses()} font-medium`}>{rec}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Official Law Enforcement Reporting */}
      <section className="px-4 mb-4">
        <div className={`rounded-xl ${getSurfaceClasses()} p-4 shadow-lg flex flex-col gap-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-[20px] ${getPrimaryClasses()}`}>local_police</span>
              <h3 className={`font-headline-sm text-headline-sm ${getOnSurfaceClasses()} font-semibold`}>Incident Escalation Portals</h3>
            </div>
            <span className={`font-label-caps text-label-caps ${getPrimaryClasses()} uppercase`}>OFFICIAL CHANNELS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a className={`p-3 rounded-lg ${getSurfaceLowClasses()} hover:${getSurfaceHighClasses()} transition-colors flex items-center justify-between`} href="https://cybercrime.gov.in" rel="noopener noreferrer" target="_blank">
              <div className="flex flex-col">
                <span className={`font-body-md text-body-md ${getOnSurfaceClasses()} font-medium hover:${getPrimaryClasses()}`}>National Cyber Crime Portal</span>
                <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">cybercrime.gov.in • Ministry of Home</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary text-[18px]">open_in_new</span>
            </a>
            <a className={`p-3 rounded-lg ${getSurfaceLowClasses()} hover:${getSurfaceHighClasses()} transition-colors flex items-center justify-between`} href="tel:1930">
              <div className="flex flex-col">
                <span className={`font-body-md text-body-md ${getOnSurfaceClasses()} font-medium hover:${getSecondaryClasses()}`}>Helpline 1930 (Direct Dial)</span>
                <span className={`font-telemetry-sm text-telemetry-sm ${getSecondaryClasses()}`}>Immediate Financial Fraud Halt</span>
              </div>
              <span className={`material-symbols-outlined ${getSecondaryClasses()} text-[18px]`}>call</span>
            </a>
            <a className={`p-3 rounded-lg ${getSurfaceLowClasses()} hover:${getSurfaceHighClasses()} transition-colors flex items-center justify-between`} href="https://ic3.gov" rel="noopener noreferrer" target="_blank">
              <div className="flex flex-col">
                <span className={`font-body-md text-body-md ${getOnSurfaceClasses()} font-medium hover:${getPrimaryClasses()}`}>FBI IC3 Internet Crime Center</span>
                <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">ic3.gov • Wire & Recruitment Fraud</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary text-[18px]">open_in_new</span>
            </a>
            <a className={`p-3 rounded-lg ${getSurfaceLowClasses()} hover:${getSurfaceHighClasses()} transition-colors flex items-center justify-between`} href="https://reportfraud.ftc.gov" rel="noopener noreferrer" target="_blank">
              <div className="flex flex-col">
                <span className={`font-body-md text-body-md ${getOnSurfaceClasses()} font-medium hover:${getPrimaryClasses()}`}>Federal Trade Commission</span>
                <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">reportfraud.ftc.gov</span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant hover:text-primary text-[18px]">open_in_new</span>
            </a>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="px-4 mb-2 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button className="w-full py-3 px-4 rounded-lg bg-primary text-on-primary font-body-md text-body-md font-medium shadow-md hover:bg-primary-container flex items-center justify-center gap-2 transition-transform active:scale-[0.98]" onClick={onNewScan} type="button">
            <span className="material-symbols-outlined text-[18px]">document_scanner</span>
            Scan Another Document
          </button>
          <div className="flex w-full gap-2">
            <button className="w-1/2 py-3 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md font-medium hover:bg-surface-bright flex items-center justify-center gap-1.5 transition-colors" onClick={onExportPDF} type="button">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export PDF
            </button>
            <button className="w-1/2 py-3 px-3 rounded-lg bg-surface-container-high text-on-surface font-body-md text-body-md font-medium hover:bg-surface-bright flex items-center justify-center gap-1.5 transition-colors" onClick={onShare} type="button">
              <span className="material-symbols-outlined text-[18px]">share</span>
              Share Alert
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}