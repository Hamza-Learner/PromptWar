export const SCORING_WEIGHTS = {
  // Text analysis weights (from specifications)
  PAYMENT_DEMAND: 25,
  COMPANY_DOMAIN_MISMATCH: 15,
  URGENCY_LANGUAGE: 10,
  GRAMMAR_SPELLING_ANOMALIES: 10,
  GENERIC_GREETING: 5,
  LACK_OF_OFFICIAL_CONTACT: 5,

  // URL / Domain analysis weights (from specifications)
  DOMAIN_AGE_UNDER_30_DAYS: 30,
  BRAND_IMPERSONATION: 20,
  SUSPICIOUS_TLD: 15,
  SSL_MISSING_OR_INVALID: 10,
} as const;

export const SUSPICIOUS_TLDS = [
  '.tk',
  '.ml',
  '.xyz',
  '.top',
  '.buzz',
  '.click',
  '.work',
  '.live',
  '.cf',
  '.ga',
  '.gq',
  '.cam',
  '.rest',
  '.fit',
  '.country',
] as const;

export const KNOWN_BRANDS = [
  'amazon',
  'paypal',
  'google',
  'apple',
  'microsoft',
  'netflix',
  'meta',
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'telegram',
  'whatsapp',
  'tcs',
  'infosys',
  'wipro',
  'accenture',
  'deloitte',
  'cognizant',
  'hcl',
  'flipkart',
  'uber',
  'swiggy',
  'zomato',
  'bankofamerica',
  'chase',
  'wellsfargo',
  'hsbc',
  'sbi',
  'icici',
  'hdfc',
  'fedex',
  'dhl',
  'usps',
] as const;

export const SCORE_THRESHOLDS = {
  LOW_MAX: 30, // 0-30: Green
  MEDIUM_MAX: 70, // 31-70: Yellow
  HIGH_MIN: 71, // 71-100: Red
} as const;

export const MAX_INPUT_LENGTH = 5000;
export const MAX_SCANS_PER_MINUTE = 10;

export const RISK_CONFIG = {
  low: {
    label: 'Low Risk - Likely Safe',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bannerClass: 'from-emerald-950/80 via-emerald-900/40 to-slate-900 border-emerald-500/40 text-emerald-200',
    strokeColor: '#10b981',
  },
  medium: {
    label: 'Medium Risk - Proceed with Caution',
    color: 'amber',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    bannerClass: 'from-amber-950/80 via-amber-900/40 to-slate-900 border-amber-500/40 text-amber-200',
    strokeColor: '#f59e0b',
  },
  high: {
    label: 'High Risk - Likely Scam',
    color: 'rose',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    bannerClass: 'from-rose-950/80 via-rose-900/40 to-slate-900 border-rose-500/40 text-rose-200',
    strokeColor: '#f43f5e',
  },
} as const;

export const DEFAULT_RECOMMENDATIONS = {
  high: [
    'DO NOT pay any money. Legitimate employers never ask candidates to pay for laptops, equipment, registration, or onboarding fees.',
    'Do not share sensitive banking details, UPI IDs, social security, or Aadhaar numbers.',
    'Verify the communication by visiting the company’s official corporate career portal directly (do not use links provided in the message).',
    'Report the incident and contact details to national cybercrime authorities (e.g. cybercrime.gov.in in India or IC3.gov in the US).',
    'Block the sender and warn peers who might also be targeted in the same campaign.',
  ],
  medium: [
    'Cross-check the sender’s email domain with the company’s verified website. Look for subtle spelling anomalies.',
    'Contact the hiring department through an independently verified phone number or LinkedIn official company page.',
    'Ask for a formal interview through corporate video conferencing (Google Meet, Teams, Zoom) before signing anything.',
    'Never make upfront deposits or advance fee payments under any pretext.',
  ],
  low: [
    'The communication exhibits standard indicators of legitimate recruitment, but standard diligence remains wise.',
    'Always verify job offers match an active job ID in the company’s official job portal.',
    'Keep all official communications within corporate email domains rather than personal messaging platforms (Telegram/WhatsApp).',
  ],
};
