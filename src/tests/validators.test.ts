import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  isUrl,
  extractDomain,
  extractEmailsFromText,
  extractDomainsFromText,
  validateInput,
} from '../utils/validators';
import { MAX_INPUT_LENGTH } from '../utils/constants';

describe('Input Validators & Sanitization', () => {
  it('should sanitize HTML tags and script injections', () => {
    const malicious = '<script>alert("xss")</script><b>Dear Candidate</b>, please pay $500.';
    const sanitized = sanitizeInput(malicious);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('<b>');
    expect(sanitized).toContain('Dear Candidate, please pay $500.');
  });

  it('should reject empty or whitespace-only input', () => {
    const result = validateInput('    \n   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please paste a job offer or URL.');
  });

  it('should reject input exceeding MAX_INPUT_LENGTH characters', () => {
    const longText = 'A'.repeat(MAX_INPUT_LENGTH + 10);
    const result = validateInput(longText);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain(`Input exceeds ${MAX_INPUT_LENGTH} characters`);
  });

  it('should reject invalid URL format', () => {
    const result = validateInput('https://invalid_domain_without_tld');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid URL format. Please check and try again.');
  });

  it('should correctly identify URLs vs text', () => {
    expect(isUrl('https://amazon-careers-india.xyz')).toBe(true);
    expect(isUrl('http://paypal-secure-login.top/login')).toBe(true);
    expect(isUrl('amazon-careers.xyz')).toBe(true);
    expect(isUrl('Dear Candidate, congratulations on your offer!')).toBe(false);
    expect(isUrl('Multiple lines\nhttps://google.com')).toBe(false);
  });

  it('should extract clean hostname from various URL structures', () => {
    expect(extractDomain('https://www.amazon-careers-india.xyz/verify')).toBe('amazon-careers-india.xyz');
    expect(extractDomain('http://paypal-secure.top:8080/path?query=1')).toBe('paypal-secure.top');
    expect(extractDomain('google.com')).toBe('google.com');
  });

  it('should extract emails and embedded domains from job offer text', () => {
    const text = 'Contact our HR team at hr@amazon-careers-india.xyz or visit https://amazon-careers-india.xyz/join.';
    const emails = extractEmailsFromText(text);
    const domains = extractDomainsFromText(text);

    expect(emails).toContain('hr@amazon-careers-india.xyz');
    expect(domains).toContain('amazon-careers-india.xyz');
  });
});
