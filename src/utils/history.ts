import type { ScanResult, RiskLevel } from '../types';

export interface HistoryItem {
  id: string;
  timestamp: number;
  inputSnippet: string;
  inputType: 'url' | 'text';
  threatScore: number;
  riskLevel: RiskLevel;
  scanResult: ScanResult;
}

const STORAGE_KEY = 'scamshield_scan_history_v1';
export const MAX_HISTORY_ITEMS = 5;

/**
 * Retrieves the scan history from localStorage, handling SSR or parsing errors safely.
 */
export function getScanHistory(): HistoryItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_HISTORY_ITEMS);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Saves a new scan result to the top of history, capping at MAX_HISTORY_ITEMS (5).
 */
export function saveScanToHistory(scanResult: ScanResult): HistoryItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const current = getScanHistory();

    // Create snippet: for URL, use domain or truncated URL; for text, clean first 80 chars
    const raw = scanResult.rawInput.trim();
    let snippet = raw;
    if (scanResult.inputType === 'url') {
      snippet = scanResult.domainInfo?.domain || raw;
    } else {
      snippet = raw.replace(/\s+/g, ' ').slice(0, 80);
      if (raw.length > 80) snippet += '...';
    }

    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      inputSnippet: snippet,
      inputType: scanResult.inputType,
      threatScore: scanResult.threatScore,
      riskLevel: scanResult.riskLevel,
      scanResult,
    };

    // Filter out identical rawInput if already present to avoid duplicate clutter, then prepend new item
    const filtered = current.filter(
      (item) => item.scanResult.rawInput.trim() !== raw
    );

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed to save scan history to localStorage:', e);
    return [];
  }
}

/**
 * Deletes a single history item by ID.
 */
export function removeHistoryItem(id: string): HistoryItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const current = getScanHistory();
    const updated = current.filter((item) => item.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * Clears all scan history from localStorage.
 */
export function clearScanHistory(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear scan history:', e);
  }
}
