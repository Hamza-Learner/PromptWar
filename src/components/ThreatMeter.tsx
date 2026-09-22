import { useEffect, useState } from 'react';
import type { RiskLevel } from '../types';

interface ThreatMeterProps {
  score: number;
  riskLevel: RiskLevel;
}

export function ThreatMeter({ score, riskLevel }: ThreatMeterProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (score - start) * eased);
      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, [score]);

  // SVG circle calculations
  const size = 200;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Colors based on risk level
  const theme = {
    low: {
      color: '#10b981', // Emerald
      glow: 'rgba(16, 185, 129, 0.4)',
      bgRing: 'rgba(16, 185, 129, 0.12)',
      textGradient: 'from-emerald-400 to-teal-200',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      label: 'LOW RISK',
    },
    medium: {
      color: '#f59e0b', // Amber
      glow: 'rgba(245, 158, 11, 0.4)',
      bgRing: 'rgba(245, 158, 11, 0.12)',
      textGradient: 'from-amber-400 to-yellow-200',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      label: 'SUSPICIOUS',
    },
    high: {
      color: '#f43f5e', // Rose
      glow: 'rgba(244, 63, 94, 0.45)',
      bgRing: 'rgba(244, 63, 94, 0.12)',
      textGradient: 'from-rose-500 to-pink-300',
      badge: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      label: 'HIGH THREAT',
    },
  }[riskLevel];

  return (
    <div
      className="relative flex flex-col items-center justify-center p-4"
      role="meter"
      aria-label="Scam Threat Index Meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow backdrop */}
        <div
          className="absolute inset-4 rounded-full blur-2xl transition-all duration-700 pointer-events-none"
          style={{ backgroundColor: theme.glow }}
        />

        <svg
          width={size}
          height={size}
          className="relative -rotate-90 transform"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`threat-gradient-${riskLevel}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {riskLevel === 'low' && (
                <>
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#34d399" />
                </>
              )}
              {riskLevel === 'medium' && (
                <>
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </>
              )}
              {riskLevel === 'high' && (
                <>
                  <stop offset="0%" stopColor="#e11d48" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </>
              )}
            </linearGradient>
            <filter id="cyber-glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-200 dark:text-slate-800/80"
          />

          {/* Colored progress circle with neon glow */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#threat-gradient-${riskLevel})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#cyber-glow)"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline">
            <span
              className={`text-5xl font-black tracking-tight bg-gradient-to-br ${theme.textGradient} bg-clip-text text-transparent font-mono`}
            >
              {displayScore}
            </span>
            <span className="text-xl font-bold text-slate-500 dark:text-slate-400 ml-0.5">%</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mt-0.5">
            Threat Index
          </span>
          <span className={`mt-1.5 px-2 py-0.5 text-[11px] font-bold tracking-wider rounded-full border ${theme.badge}`}>
            {theme.label}
          </span>
        </div>
      </div>
    </div>
  );
}
