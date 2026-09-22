import { Router, Request, Response } from 'express';
import { validateInput, extractDomain, extractDomainsFromText } from '../src/utils/validators';
import { inspectDomain } from './domain-inspector';
import { analyzeOfferTextWithGemini } from './gemini-handler';
import {
  SCORE_THRESHOLDS,
  RISK_CONFIG,
  DEFAULT_RECOMMENDATIONS,
  MAX_SCANS_PER_MINUTE,
} from '../src/utils/constants';
import type { ScanResult, RiskLevel, RedFlag } from '../src/types';

export const apiRouter = Router();

// In-memory sliding window rate limiter: max 10 requests per minute per IP
const requestLog = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = (requestLog.get(ip) || []).filter((ts) => now - ts < windowMs);

  if (timestamps.length >= MAX_SCANS_PER_MINUTE) {
    return false;
  }

  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return true;
}

apiRouter.get('/health', (_req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({
    status: 'ok',
    appName: 'ScamShield',
    hasGeminiKey: hasKey,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.post('/scan', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'client';

  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      error: 'Rate limit exceeded. Please wait a minute before running additional scans (limit: 10 scans/minute).',
    });
    return;
  }

  const { input, forcedType } = req.body || {};

  if (typeof input !== 'string') {
    res.status(400).json({ error: 'Please paste a job offer or URL.' });
    return;
  }

  const validation = validateInput(input);
  if (!validation.isValid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const inputType = forcedType || validation.inputType;
  const sanitized = validation.sanitized;

  try {
    let flags: RedFlag[] = [];
    let totalPoints = 0;
    let domainInfo = undefined;
    let textInfo = undefined;
    let fallbackUsed = false;

    if (inputType === 'url') {
      const domain = extractDomain(sanitized);
      if (!domain) {
        res.status(400).json({ error: 'Invalid URL format. Please check and try again.' });
        return;
      }

      const domainAnalysis = await inspectDomain(domain, sanitized);
      flags = domainAnalysis.flags;
      totalPoints = domainAnalysis.points;
      domainInfo = domainAnalysis.inspection;
    } else {
      // Input is text
      const geminiResult = await analyzeOfferTextWithGemini(sanitized);
      flags = [...geminiResult.flags];
      totalPoints = geminiResult.points;
      textInfo = geminiResult.textInfo;
      fallbackUsed = geminiResult.fallbackUsed;

      // Also inspect domains found inside the text
      const embeddedDomains = extractDomainsFromText(sanitized);
      if (embeddedDomains.length > 0) {
        // Pick primary contact domain or first suspicious domain
        const targetDomain =
          embeddedDomains.find((d) => d.endsWith('.xyz') || d.endsWith('.top') || d.includes('-careers') || d.includes('-jobs')) ||
          embeddedDomains[0];

        if (targetDomain) {
          const domainAnalysis = await inspectDomain(targetDomain);
          domainInfo = domainAnalysis.inspection;

          // Merge any domain flags that haven't been added yet
          for (const dFlag of domainAnalysis.flags) {
            if (!flags.some((f) => f.id === dFlag.id)) {
              flags.push(dFlag);
              totalPoints += dFlag.points;
            }
          }
        }
      }
    }

    // Cap threat score at 100
    const threatScore = Math.min(100, Math.max(0, totalPoints));

    // Determine risk level based on specifications:
    // 0-30: GREEN ("Low Risk - Likely Safe")
    // 31-70: YELLOW ("Medium Risk - Proceed with Caution")
    // 71-100: RED ("High Risk - Likely Scam")
    let riskLevel: RiskLevel = 'low';
    if (threatScore >= SCORE_THRESHOLDS.HIGH_MIN) {
      riskLevel = 'high';
    } else if (threatScore > SCORE_THRESHOLDS.LOW_MAX) {
      riskLevel = 'medium';
    }

    const riskLabel = RISK_CONFIG[riskLevel].label;
    const recommendations = [...DEFAULT_RECOMMENDATIONS[riskLevel]];

    const result: ScanResult = {
      inputType,
      rawInput: sanitized,
      threatScore,
      riskLevel,
      riskLabel,
      flags,
      recommendations,
      domainInfo,
      textInfo,
      analyzedAt: new Date().toISOString(),
      fallbackUsed,
    };

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown scan error';
    res.status(500).json({
      error: 'Analysis service temporarily unavailable. Please try again.',
      details: message,
    });
  }
});
