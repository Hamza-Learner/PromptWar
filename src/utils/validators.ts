import { MAX_INPUT_LENGTH } from './constants';
import type { ValidationResult } from '../types';

/**
 * Strips HTML tags and script elements, normalizes whitespace.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Checks if a string looks like a single URL or URL attempt.
 */
export function isUrl(text: string): boolean {
  const trimmed = text.trim();
  // If text has multiple newlines or is long, treat as text
  if (trimmed.includes('\n') || trimmed.split(/\s+/).length > 2) {
    return false;
  }
  // Matches explicit http:// or https:// protocol
  if (/^https?:\/\//i.test(trimmed)) {
    return true;
  }
  // Match standard domain pattern with common TLD
  const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/[^\s]*)?$/i;
  return domainPattern.test(trimmed);
}

/**
 * Extracts normalized hostname/domain from a URL string or domain-like string.
 */
export function extractDomain(urlStr: string): string | null {
  const trimmed = urlStr.trim();
  try {
    let toParse = trimmed;
    if (!/^https?:\/\//i.test(toParse)) {
      toParse = `https://${toParse}`;
    }
    const parsed = new URL(toParse);
    let hostname = parsed.hostname.toLowerCase();
    // Strip leading 'www.' if present
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }
    return hostname || null;
  } catch {
    // Regex fallback
    const match = trimmed.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i);
    return match ? match[1].toLowerCase() : null;
  }
}

/**
 * Extracts all email addresses from text.
 */
export function extractEmailsFromText(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const matches = text.match(emailRegex);
  if (!matches) return [];
  return Array.from(new Set(matches.map((e) => e.toLowerCase())));
}

/**
 * Extracts URLs / domains found inside a block of text.
 */
export function extractDomainsFromText(text: string): string[] {
  const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi;
  const matches = text.match(urlRegex) || [];
  const domains: string[] = [];

  for (const m of matches) {
    const d = extractDomain(m);
    if (d && !domains.includes(d)) {
      domains.push(d);
    }
  }

  // Also check email domains
  const emails = extractEmailsFromText(text);
  for (const email of emails) {
    const parts = email.split('@');
    if (parts[1] && !domains.includes(parts[1])) {
      domains.push(parts[1]);
    }
  }

  return domains;
}

/**
 * Comprehensive input validator.
 */
export function validateInput(rawInput: string): ValidationResult {
  const sanitized = sanitizeInput(rawInput);

  if (!sanitized) {
    return {
      isValid: false,
      error: 'Please paste a job offer or URL.',
      inputType: 'text',
      sanitized: '',
    };
  }

  if (sanitized.length > MAX_INPUT_LENGTH) {
    return {
      isValid: false,
      error: `Input exceeds ${MAX_INPUT_LENGTH} characters. Please shorten.`,
      inputType: isUrl(sanitized) ? 'url' : 'text',
      sanitized: sanitized.slice(0, MAX_INPUT_LENGTH),
    };
  }

  const detectedIsUrl = isUrl(sanitized);

  if (detectedIsUrl) {
    const domain = extractDomain(sanitized);
    if (!domain || !domain.includes('.')) {
      return {
        isValid: false,
        error: 'Invalid URL format. Please check and try again.',
        inputType: 'url',
        sanitized,
      };
    }
    return {
      isValid: true,
      inputType: 'url',
      sanitized,
    };
  }

  return {
    isValid: true,
    inputType: 'text',
    sanitized,
  };
}
