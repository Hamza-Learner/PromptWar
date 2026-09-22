import type { DomainInspection } from '../types';
import { SUSPICIOUS_TLDS, KNOWN_BRANDS } from '../utils/constants';

/**
 * Client-side domain extraction and quick threat checks.
 */
export function quickDomainAudit(domain: string): {
  isSuspiciousTld: boolean;
  tld?: string;
  isBrandMimic: boolean;
  mimicsBrandName?: string;
} {
  const clean = domain.toLowerCase();

  let isSuspiciousTld = false;
  let detectedTld: string | undefined;
  for (const tld of SUSPICIOUS_TLDS) {
    if (clean.endsWith(tld)) {
      isSuspiciousTld = true;
      detectedTld = tld;
      break;
    }
  }

  let isBrandMimic = false;
  let mimicsBrandName: string | undefined;
  for (const brand of KNOWN_BRANDS) {
    const officialPattern = new RegExp(`^(?:[a-zA-Z0-9-]+\\.)?${brand}\\.(?:com|org|net|co|in|gov|io|edu|co\\.[a-z]{2})$`, 'i');
    if (clean.includes(brand) && !officialPattern.test(clean)) {
      isBrandMimic = true;
      mimicsBrandName = brand;
      break;
    }
  }

  return {
    isSuspiciousTld,
    tld: detectedTld,
    isBrandMimic,
    mimicsBrandName,
  };
}

/**
 * Parses RDAP creation timestamp into domain age in days.
 */
export function calculateDomainAge(registrationDateStr?: string): number | undefined {
  if (!registrationDateStr) return undefined;
  const regTime = new Date(registrationDateStr).getTime();
  if (isNaN(regTime)) return undefined;
  const ageMs = Date.now() - regTime;
  return Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
}

/**
 * Client-side direct RDAP query fallback if backend is unreachable.
 */
export async function directRdapLookup(domain: string): Promise<Partial<DomainInspection>> {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json, application/json' },
    });
    if (!res.ok) return { domain, rdapFound: false, error: `RDAP status ${res.status}` };
    const data = await res.json();
    let regDate: string | undefined;

    if (Array.isArray(data.events)) {
      const reg = data.events.find((e: { eventAction?: string }) => e.eventAction === 'registration' || e.eventAction === 'created');
      if (reg && reg.eventDate) regDate = reg.eventDate;
    }

    return {
      domain,
      registrationDate: regDate,
      domainAgeDays: calculateDomainAge(regDate),
      rdapFound: true,
    };
  } catch (e: unknown) {
    return { domain, rdapFound: false, error: e instanceof Error ? e.message : 'RDAP fetch error' };
  }
}
