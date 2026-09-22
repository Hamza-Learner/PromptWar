import https from 'node:https';
import { SUSPICIOUS_TLDS, KNOWN_BRANDS, SCORING_WEIGHTS } from '../src/utils/constants';
import type { DomainInspection, RedFlag } from '../src/types';

export interface DomainAnalysisResult {
  inspection: DomainInspection;
  flags: RedFlag[];
  points: number;
}

/**
 * Checks if a domain mimics a known brand without being the official domain.
 */
export function checkBrandMimicry(domain: string): { isMimic: boolean; brand?: string } {
  const clean = domain.toLowerCase();

  for (const brand of KNOWN_BRANDS) {
    // Official domain patterns: brand.com, brand.co.in, brand.org, etc.
    const officialPattern = new RegExp(`^(?:[a-zA-Z0-9-]+\\.)?${brand}\\.(?:com|org|net|co|in|gov|io|edu|co\\.[a-z]{2})$`, 'i');
    const isOfficial = officialPattern.test(clean);

    if (clean.includes(brand) && !isOfficial) {
      return { isMimic: true, brand };
    }
  }

  return { isMimic: false };
}

/**
 * Checks if domain TLD is in the suspicious list.
 */
export function checkSuspiciousTld(domain: string): { isSuspicious: boolean; tld?: string } {
  const clean = domain.toLowerCase();
  for (const tld of SUSPICIOUS_TLDS) {
    if (clean.endsWith(tld)) {
      return { isSuspicious: true, tld };
    }
  }
  return { isSuspicious: false };
}

/**
 * Inspects a domain via public RDAP service and evaluates risk factors.
 */
export async function inspectDomain(rawDomain: string, rawUrl?: string): Promise<DomainAnalysisResult> {
  const domain = rawDomain.toLowerCase().trim();
  const flags: RedFlag[] = [];
  let points = 0;

  // 1. Suspicious TLD check
  const tldCheck = checkSuspiciousTld(domain);
  if (tldCheck.isSuspicious) {
    const pts = SCORING_WEIGHTS.SUSPICIOUS_TLD;
    points += pts;
    flags.push({
      id: 'suspicious-tld',
      name: 'High-Risk TLD (Top-Level Domain)',
      points: pts,
      category: 'suspicious_tld',
      evidence: `Domain uses '${tldCheck.tld}' extension`,
      explanation: `The domain extension '${tldCheck.tld}' is frequently abused by phishing operations and disposable scam infrastructure.`,
      severity: 'medium',
    });
  }

  // 2. Brand mimicry check
  const brandCheck = checkBrandMimicry(domain);
  if (brandCheck.isMimic && brandCheck.brand) {
    const pts = SCORING_WEIGHTS.BRAND_IMPERSONATION;
    points += pts;
    flags.push({
      id: 'brand-mimicry',
      name: 'Brand Impersonation / Typosquatting',
      points: pts,
      category: 'brand_impersonation',
      evidence: `Domain '${domain}' mimics '${brandCheck.brand}'`,
      explanation: `The domain contains the brand name '${brandCheck.brand}' combined with secondary keywords (e.g., -careers, -secure, -login), which is a classic phishing indicator.`,
      severity: 'high',
    });
  }

  // 3. SSL check
  let hasSsl = true;
  let isSslValid = true;
  if (rawUrl) {
    if (rawUrl.toLowerCase().startsWith('http://')) {
      hasSsl = false;
      isSslValid = false;
      const pts = SCORING_WEIGHTS.SSL_MISSING_OR_INVALID;
      points += pts;
      flags.push({
        id: 'no-ssl',
        name: 'Insecure Connection (No SSL / HTTPS)',
        points: pts,
        category: 'ssl_missing',
        evidence: 'URL starts with unencrypted http://',
        explanation: 'The site transmits data over cleartext without valid SSL encryption, indicating rogue or substandard infrastructure.',
        severity: 'medium',
      });
    }
  }

  // 4. RDAP lookup
  let registrationDate: string | undefined;
  let domainAgeDays: number | undefined;
  let registrarName: string | undefined;
  let rdapFound = false;
  let rdapError: string | undefined;

  try {
    const rdapUrl = `https://rdap.org/domain/${encodeURIComponent(domain)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(rdapUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/rdap+json, application/json',
        'User-Agent': 'ScamShield-Security-Auditor/1.0',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      rdapFound = true;

      // Find registration event
      if (Array.isArray(data.events)) {
        const regEvent = data.events.find(
          (e: { eventAction?: string }) =>
            e.eventAction === 'registration' || e.eventAction === 'created'
        );
        if (regEvent && regEvent.eventDate) {
          registrationDate = regEvent.eventDate;
          const regTime = new Date(regEvent.eventDate).getTime();
          if (!isNaN(regTime)) {
            const ageMs = Date.now() - regTime;
            domainAgeDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
          }
        }
      }

      // Find registrar
      if (Array.isArray(data.entities)) {
        const registrarEntity = data.entities.find((ent: { roles?: string[] }) =>
          Array.isArray(ent.roles) && ent.roles.includes('registrar')
        );
        if (registrarEntity) {
          if (registrarEntity.vcardArray && Array.isArray(registrarEntity.vcardArray[1])) {
            const fnItem = registrarEntity.vcardArray[1].find((item: unknown[]) => item[0] === 'fn');
            if (fnItem && typeof fnItem[3] === 'string') {
              registrarName = fnItem[3];
            }
          }
          if (!registrarName && registrarEntity.handle) {
            registrarName = registrarEntity.handle;
          }
        }
      }
    } else {
      rdapError = `RDAP lookup returned HTTP ${res.status}`;
    }
  } catch (err: unknown) {
    rdapError = err instanceof Error ? err.message : 'RDAP network error';
  }

  // Evaluate domain age flag
  if (domainAgeDays !== undefined && domainAgeDays < 30) {
    const pts = SCORING_WEIGHTS.DOMAIN_AGE_UNDER_30_DAYS;
    points += pts;
    flags.push({
      id: 'domain-newly-registered',
      name: 'Recently Registered Domain (<30 Days Old)',
      points: pts,
      category: 'domain_age',
      evidence: `Domain is only ${domainAgeDays} days old (registered: ${registrationDate?.split('T')[0] || 'recently'})`,
      explanation: 'Disposable scam domains and fake recruiter portals are routinely spun up days before launching fraudulent campaigns.',
      severity: 'high',
    });
  }

  const inspection: DomainInspection = {
    domain,
    registrationDate,
    domainAgeDays,
    registrarName,
    isSuspiciousTld: tldCheck.isSuspicious,
    tld: tldCheck.tld,
    isBrandMimic: brandCheck.isMimic,
    mimicsBrandName: brandCheck.brand,
    hasSsl,
    isSslValid,
    rdapFound,
    error: rdapError,
  };

  return { inspection, flags, points };
}
