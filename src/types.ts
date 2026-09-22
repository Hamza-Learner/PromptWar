export type RiskLevel = 'low' | 'medium' | 'high';

export type FlagCategory =
  | 'payment'
  | 'urgency'
  | 'grammar'
  | 'domain_mismatch'
  | 'greeting'
  | 'contact_details'
  | 'domain_age'
  | 'suspicious_tld'
  | 'brand_impersonation'
  | 'ssl_missing'
  | 'other';

export interface RedFlag {
  id: string;
  name: string;
  points: number;
  category: FlagCategory;
  evidence: string;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface DomainInspection {
  domain: string;
  registrationDate?: string;
  domainAgeDays?: number;
  registrarName?: string;
  isSuspiciousTld: boolean;
  tld?: string;
  isBrandMimic: boolean;
  mimicsBrandName?: string;
  hasSsl: boolean;
  isSslValid: boolean;
  rdapFound: boolean;
  error?: string;
}

export interface TextAnalysis {
  paymentDemandsDetected: boolean;
  urgencyDetected: boolean;
  grammarAnomaliesDetected: boolean;
  domainMismatchDetected: boolean;
  genericGreetingDetected: boolean;
  lackOfOfficialContactDetected: boolean;
  detectedCompanyName?: string;
  detectedContactDomain?: string;
  summary: string;
}

export interface ScanResult {
  inputType: 'url' | 'text';
  rawInput: string;
  threatScore: number;
  riskLevel: RiskLevel;
  riskLabel: string;
  flags: RedFlag[];
  recommendations: string[];
  domainInfo?: DomainInspection;
  textInfo?: TextAnalysis;
  analyzedAt: string;
  fallbackUsed?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  inputType: 'url' | 'text';
  sanitized: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  inputSnippet: string;
  inputType: 'url' | 'text';
  threatScore: number;
  riskLevel: RiskLevel;
  scanResult: ScanResult;
}
