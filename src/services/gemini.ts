import type { ScanResult } from '../types';

/**
 * Service to request scam/fraud inspection from the secure server-side endpoint.
 */
export async function scanOfferLetter(input: string, forcedType?: 'url' | 'text'): Promise<ScanResult> {
  const response = await fetch('/api/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input, forcedType }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Analysis service temporarily unavailable. Please try again.');
  }

  return data as ScanResult;
}

/**
 * Checks server health and Gemini API key status.
 */
export async function checkServerHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch {
    return { status: 'offline', hasGeminiKey: false };
  }
}
