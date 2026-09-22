import { describe, it, expect, beforeEach } from 'vitest';
import {
  getScanHistory,
  saveScanToHistory,
  removeHistoryItem,
  clearScanHistory,
  MAX_HISTORY_ITEMS,
} from '../utils/history';
import type { ScanResult } from '../types';

describe('Scan History localStorage Utility', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };

    // Polyfill window and localStorage in test environment
    if (typeof globalThis.window === 'undefined') {
      (globalThis as any).window = globalThis;
    }
    (globalThis as any).localStorage = mockLocalStorage;
    (globalThis.window as any).localStorage = mockLocalStorage;
  });

  const createMockResult = (id: string, score: number, type: 'url' | 'text' = 'text'): ScanResult => ({
    inputType: type,
    rawInput: `Sample Job Offer #${id} with salary INR ${score * 1000}`,
    threatScore: score,
    riskLevel: score > 70 ? 'high' : score > 30 ? 'medium' : 'low',
    riskLabel: score > 70 ? 'High Risk' : 'Safe',
    flags: [],
    recommendations: ['Check company website'],
    analyzedAt: new Date().toISOString(),
  });

  it('should start with empty history', () => {
    expect(getScanHistory()).toEqual([]);
  });

  it('should save a scan to history and retrieve it', () => {
    const mock = createMockResult('1', 85);
    const updated = saveScanToHistory(mock);

    expect(updated.length).toBe(1);
    expect(updated[0].threatScore).toBe(85);
    expect(updated[0].riskLevel).toBe('high');
    expect(updated[0].scanResult.rawInput).toBe(mock.rawInput);

    const retrieved = getScanHistory();
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].threatScore).toBe(85);
  });

  it('should cap scan history at exactly 5 items (MAX_HISTORY_ITEMS)', () => {
    for (let i = 1; i <= 7; i++) {
      saveScanToHistory(createMockResult(`${i}`, i * 10));
    }

    const history = getScanHistory();
    expect(history.length).toBe(MAX_HISTORY_ITEMS);
    expect(history.length).toBe(5);

    // Most recent (7) should be at the top
    expect(history[0].scanResult.rawInput).toContain('Sample Job Offer #7');
    // 6, 5, 4, 3 should be subsequent; 1 and 2 should have been purged
    expect(history[4].scanResult.rawInput).toContain('Sample Job Offer #3');
  });

  it('should deduplicate when re-scanning same input and move to top', () => {
    const inputA: ScanResult = {
      ...createMockResult('A', 20),
      rawInput: 'https://careers-google-verify.xyz',
    };
    const inputB: ScanResult = {
      ...createMockResult('B', 40),
      rawInput: 'https://amazon-offer-jobs.top',
    };
    const inputARescan: ScanResult = {
      ...createMockResult('A', 85),
      rawInput: 'https://careers-google-verify.xyz', // Exact same input string
    };

    saveScanToHistory(inputA);
    saveScanToHistory(inputB);
    saveScanToHistory(inputARescan); // Rescanning A

    const history = getScanHistory();
    expect(history.length).toBe(2);
    expect(history[0].scanResult.rawInput).toBe('https://careers-google-verify.xyz');
    expect(history[0].threatScore).toBe(85);
  });

  it('should remove a single item by id', () => {
    const list1 = saveScanToHistory(createMockResult('1', 50));
    const list2 = saveScanToHistory(createMockResult('2', 90));

    const idToRemove = list2[0].id;
    const remaining = removeHistoryItem(idToRemove);

    expect(remaining.length).toBe(1);
    expect(remaining[0].threatScore).toBe(50);
    expect(getScanHistory().length).toBe(1);
  });

  it('should clear all scan history', () => {
    saveScanToHistory(createMockResult('1', 50));
    saveScanToHistory(createMockResult('2', 90));

    clearScanHistory();
    expect(getScanHistory()).toEqual([]);
  });

  it('should gracefully handle malformed JSON in localStorage', () => {
    localStorage.setItem('scamshield_scan_history_v1', 'not-a-valid-json');
    expect(getScanHistory()).toEqual([]);
  });
});
