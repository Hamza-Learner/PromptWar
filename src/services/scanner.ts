import { scanOfferLetter } from './gemini';
import { validateInput, extractDomain } from '../utils/validators';
import { quickDomainAudit, directRdapLookup } from './rdap';
import {
  SCORING_WEIGHTS,
  SCORE_THRESHOLDS,
  RISK_CONFIG,
  DEFAULT_RECOMMENDATIONS,
} from '../utils/constants';
import type { ScanResult, RiskLevel, RedFlag } from '../types';

/**
 * High-level scanner client function that delegates to backend API
 * with automatic client-side heuristic fallback when offline.
 */
export async function runScamInspection(input: string, forcedType?: 'url' | 'text'): Promise<ScanResult> {
  const validation = validateInput(input);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid input');
  }

  try {
    // Primary path: secure full-stack server API
    return await scanOfferLetter(validation.sanitized, forcedType);
  } catch (apiError: unknown) {
    // If backend gave a validation error (400) or rate limit (429), rethrow directly
    const msg = apiError instanceof Error ? apiError.message : 'Analysis service temporarily unavailable. Please try again.';
    if (msg.includes('exceeds') || msg.includes('Please paste') || msg.includes('Rate limit')) {
      throw apiError;
    }

    // Otherwise, perform offline client fallback
    return runClientSideFallbackScan(validation.sanitized, forcedType || validation.inputType, msg);
  }
}

/**
 * Client-side heuristic scanner used when backend/offline.
 */
export async function runClientSideFallbackScan(
  sanitized: string,
  inputType: 'url' | 'text',
  fallbackReason: string
): Promise<ScanResult> {
  const flags: RedFlag[] = [];
  let points = 0;
  let domainInfo = undefined;

  if (inputType === 'url') {
    const domain = extractDomain(sanitized) || sanitized;
    const audit = quickDomainAudit(domain);

    if (audit.isSuspiciousTld) {
      points += SCORING_WEIGHTS.SUSPICIOUS_TLD;
      flags.push({
        id: 'suspicious-tld',
        name: 'High-Risk TLD (Top-Level Domain)',
        points: SCORING_WEIGHTS.SUSPICIOUS_TLD,
        category: 'suspicious_tld',
        evidence: `Domain ends with '${audit.tld}'`,
        explanation: 'Free and low-cost TLDs are predominantly utilized in throwaway phishing attacks.',
        severity: 'medium',
      });
    }

    if (audit.isBrandMimic) {
      points += SCORING_WEIGHTS.BRAND_IMPERSONATION;
      flags.push({
        id: 'brand-mimicry',
        name: 'Brand Impersonation / Typosquatting',
        points: SCORING_WEIGHTS.BRAND_IMPERSONATION,
        category: 'brand_impersonation',
        evidence: `Domain mimics '${audit.mimicsBrandName}'`,
        explanation: 'Domain uses a famous corporate brand name with deceptive prefixes or suffixes.',
        severity: 'high',
      });
    }

    const hasSsl = !sanitized.toLowerCase().startsWith('http://');
    if (!hasSsl) {
      points += SCORING_WEIGHTS.SSL_MISSING_OR_INVALID;
      flags.push({
        id: 'no-ssl',
        name: 'Insecure Connection (No SSL / HTTPS)',
        points: SCORING_WEIGHTS.SSL_MISSING_OR_INVALID,
        category: 'ssl_missing',
        evidence: 'Insecure http:// protocol',
        explanation: 'Authentic career sites enforce HTTPS encryption.',
        severity: 'medium',
      });
    }

    // Try RDAP direct
    const rdap = await directRdapLookup(domain);
    if (rdap.domainAgeDays !== undefined && rdap.domainAgeDays < 30) {
      points += SCORING_WEIGHTS.DOMAIN_AGE_UNDER_30_DAYS;
      flags.push({
        id: 'domain-age-under-30',
        name: 'Recently Registered Domain (<30 Days Old)',
        points: SCORING_WEIGHTS.DOMAIN_AGE_UNDER_30_DAYS,
        category: 'domain_age',
        evidence: `Domain registered ${rdap.domainAgeDays} days ago`,
        explanation: 'Domain was created very recently, characteristic of disposable scam infrastructure.',
        severity: 'high',
      });
    }

    domainInfo = {
      domain,
      registrationDate: rdap.registrationDate,
      domainAgeDays: rdap.domainAgeDays,
      isSuspiciousTld: audit.isSuspiciousTld,
      tld: audit.tld,
      isBrandMimic: audit.isBrandMimic,
      mimicsBrandName: audit.mimicsBrandName,
      hasSsl,
      isSslValid: hasSsl,
      rdapFound: !!rdap.rdapFound,
      error: rdap.error,
    };
  } else {
    // Text fallback checks
    const lower = sanitized.toLowerCase();

    // 1. Payment demand
    const paymentRegex = /pay (?:for equipment|deposit|wire transfer|security deposit|refundable fee|registration fee|₹|rs|\$)|15,?000.*(?:laptop|equipment)|refunded with your first salary/i;
    if (paymentRegex.test(lower)) {
      points += SCORING_WEIGHTS.PAYMENT_DEMAND;
      flags.push({
        id: 'payment-demand',
        name: 'Upfront Payment or Deposit Demand',
        points: SCORING_WEIGHTS.PAYMENT_DEMAND,
        category: 'payment',
        evidence: 'Demands upfront payment for equipment/laptop or registration fee',
        explanation: 'Legitimate employers never demand advance funds or fees for laptops or joining kits.',
        severity: 'high',
      });
    }

    // 2. Urgency
    const urgencyRegex = /immediate joining|limited slots|act now|urgent requirement|today itself|within 24 hours/i;
    if (urgencyRegex.test(lower)) {
      points += SCORING_WEIGHTS.URGENCY_LANGUAGE;
      flags.push({
        id: 'urgency-pressure',
        name: 'High-Pressure Urgency Tactics',
        points: SCORING_WEIGHTS.URGENCY_LANGUAGE,
        category: 'urgency',
        evidence: 'Pressuring urgency phrase detected (e.g., immediate joining)',
        explanation: 'Scammers manufacture artificial urgency to prevent candidates from verifying details.',
        severity: 'medium',
      });
    }

    // 3. Grammar
    if (/[!?]{2,}|[A-Z]{6,}|Salary:\s*₹.*\.\s*To confirm/.test(sanitized)) {
      points += SCORING_WEIGHTS.GRAMMAR_SPELLING_ANOMALIES;
      flags.push({
        id: 'grammar-anomalies',
        name: 'Typographic or Formatting Irregularities',
        points: SCORING_WEIGHTS.GRAMMAR_SPELLING_ANOMALIES,
        category: 'grammar',
        evidence: 'Irregular punctuation, capitalization, or formatting pattern',
        explanation: 'Formatting anomalies frequently occur in automated spam or phishing templates.',
        severity: 'medium',
      });
    }

    // 4. Mismatch
    if (lower.includes('amazon') && (lower.includes('amazon-careers') || lower.includes('.xyz') || lower.includes('gmail.com'))) {
      points += SCORING_WEIGHTS.COMPANY_DOMAIN_MISMATCH;
      flags.push({
        id: 'domain-mismatch',
        name: 'Company Identity & Domain Mismatch',
        points: SCORING_WEIGHTS.COMPANY_DOMAIN_MISMATCH,
        category: 'domain_mismatch',
        evidence: 'Recruiter uses third-party / spoofed domain or free email for corporate brand',
        explanation: 'Official recruiters only reach out from corporate domains, not unofficial lookalikes.',
        severity: 'high',
      });
    }

    // 5. Generic greeting
    if (/dear candidate|dear applicant|dear job seeker|dear sir\/madam/i.test(lower)) {
      points += SCORING_WEIGHTS.GENERIC_GREETING;
      flags.push({
        id: 'generic-greeting',
        name: 'Impersonal Generic Greeting',
        points: SCORING_WEIGHTS.GENERIC_GREETING,
        category: 'greeting',
        evidence: 'Addressed as "Dear Candidate" or "Dear Applicant"',
        explanation: 'Generic greetings indicate mass spam distribution rather than genuine personalized recruitment.',
        severity: 'low',
      });
    }

    // 6. Lack of contact
    if (!lower.includes('address:') && !lower.includes('office') && !/\+\d{2,}/.test(sanitized)) {
      points += SCORING_WEIGHTS.LACK_OF_OFFICIAL_CONTACT;
      flags.push({
        id: 'lack-contact-details',
        name: 'Absence of Verifiable Contact Details',
        points: SCORING_WEIGHTS.LACK_OF_OFFICIAL_CONTACT,
        category: 'contact_details',
        evidence: 'No physical office address or phone number found',
        explanation: 'Legitimate offers contain registered headquarters office addresses.',
        severity: 'low',
      });
    }
  }

  const threatScore = Math.min(100, Math.max(0, points));
  let riskLevel: RiskLevel = 'low';
  if (threatScore >= SCORE_THRESHOLDS.HIGH_MIN) {
    riskLevel = 'high';
  } else if (threatScore > SCORE_THRESHOLDS.LOW_MAX) {
    riskLevel = 'medium';
  }

  return {
    inputType,
    rawInput: sanitized,
    threatScore,
    riskLevel,
    riskLabel: RISK_CONFIG[riskLevel].label,
    flags,
    recommendations: [...DEFAULT_RECOMMENDATIONS[riskLevel]],
    domainInfo,
    analyzedAt: new Date().toISOString(),
    fallbackUsed: true,
  };
}
