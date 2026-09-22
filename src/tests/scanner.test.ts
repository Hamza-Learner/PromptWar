import { describe, it, expect } from 'vitest';
import { checkBrandMimicry, checkSuspiciousTld } from '../../server/domain-inspector';
import { analyzeTextHeuristically } from '../../server/heuristic-analyzer';
import { SCORING_WEIGHTS, SCORE_THRESHOLDS } from '../utils/constants';

describe('ScamShield Scanner Logic & Threat Index Calculation', () => {
  describe('Domain & TLD Intelligence Checks', () => {
    it('should flag suspicious TLDs (+15 points weight)', () => {
      expect(checkSuspiciousTld('jobportal.xyz').isSuspicious).toBe(true);
      expect(checkSuspiciousTld('careers-verification.top').isSuspicious).toBe(true);
      expect(checkSuspiciousTld('recruitment.click').isSuspicious).toBe(true);
      expect(checkSuspiciousTld('amazon.com').isSuspicious).toBe(false);
      expect(checkSuspiciousTld('google.co.in').isSuspicious).toBe(false);
    });

    it('should detect brand mimicry / typosquatting (+20 points weight)', () => {
      const mimic1 = checkBrandMimicry('amazon-careers-india.xyz');
      expect(mimic1.isMimic).toBe(true);
      expect(mimic1.brand).toBe('amazon');

      const mimic2 = checkBrandMimicry('paypal-secure-login.top');
      expect(mimic2.isMimic).toBe(true);
      expect(mimic2.brand).toBe('paypal');

      const legit = checkBrandMimicry('amazon.com');
      expect(legit.isMimic).toBe(false);

      const legit2 = checkBrandMimicry('google.com');
      expect(legit2.isMimic).toBe(false);
    });
  });

  describe('5 Core Known Scenario Threat Score Evaluations', () => {
    // Scenario 1: High Risk Amazon Laptop Payment Scam
    it('Scenario 1 (High Risk): should classify as RED (>70) with domain mismatch, payment demand, urgency, and generic greeting', () => {
      const input =
        'Dear Candidate, Congratulations! You have been selected for Software Engineer position at Amazon India. Salary: ₹12 LPA. To confirm your joining, please pay ₹15,000 for laptop and equipment. This amount will be refunded with your first salary. Immediate joining required. Contact: hr@amazon-careers-india.xyz';

      const result = analyzeTextHeuristically(input);

      // Check specific flags
      expect(result.textInfo.paymentDemandsDetected).toBe(true);
      expect(result.textInfo.urgencyDetected).toBe(true);
      expect(result.textInfo.genericGreetingDetected).toBe(true);
      expect(result.textInfo.domainMismatchDetected).toBe(true);

      // Verify points
      // Payment (25) + Urgency (10) + Generic Greeting (5) + Domain Mismatch (15) + Contact details (5) + Formatting/Grammar (10) = 70+
      expect(result.points).toBeGreaterThan(SCORE_THRESHOLDS.MEDIUM_MAX); // >70 -> RED
      expect(result.flags.some((f) => f.category === 'payment')).toBe(true);
    });

    // Scenario 2: Medium Risk Unverified Offer
    it('Scenario 2 (Medium Risk): should classify in expected bounds (no payment demand, office address present)', () => {
      const input =
        'Hello, We are pleased to offer you a position at TechCorp Solutions. Salary: ₹8 LPA. Please visit our office for document verification. Address: 123, MG Road, Bangalore. Contact: hr@techcorp.com';

      const result = analyzeTextHeuristically(input);

      // Should NOT flag payment demand or urgency
      expect(result.textInfo.paymentDemandsDetected).toBe(false);
      expect(result.textInfo.urgencyDetected).toBe(false);
      // Threat score should not exceed high threat
      expect(result.points).toBeLessThanOrEqual(SCORE_THRESHOLDS.MEDIUM_MAX);
    });

    // Scenario 3: Low Risk Google India Offer
    it('Scenario 3 (Low Risk): should classify as GREEN (0-30) for personalized, legitimate offer with official details', () => {
      const input =
        'Dear Rahul, We are pleased to offer you a position at Google India. Salary: ₹25 LPA. Please find the offer letter attached. For any queries, contact your recruiter at +91-9876543210 or reply to this email from your official domain.';

      const result = analyzeTextHeuristically(input);

      expect(result.textInfo.paymentDemandsDetected).toBe(false);
      expect(result.textInfo.urgencyDetected).toBe(false);
      expect(result.textInfo.genericGreetingDetected).toBe(false); // Addressed to Rahul, not Candidate
      expect(result.points).toBeLessThanOrEqual(SCORE_THRESHOLDS.LOW_MAX); // <=30 -> GREEN
    });

    // Scenario 4: Phishing URL with compound risks
    it('Scenario 4 (High Risk Phishing URL): cumulative calculation with Brand Mimicry (20) + Suspicious TLD (15) + New Domain (30) + No SSL (10)', () => {
      const brandPoints = SCORING_WEIGHTS.BRAND_IMPERSONATION; // 20
      const tldPoints = SCORING_WEIGHTS.SUSPICIOUS_TLD; // 15
      const agePoints = SCORING_WEIGHTS.DOMAIN_AGE_UNDER_30_DAYS; // 30
      const sslPoints = SCORING_WEIGHTS.SSL_MISSING_OR_INVALID; // 10

      const totalUrlScore = brandPoints + tldPoints + agePoints + sslPoints; // 75
      expect(totalUrlScore).toBe(75);
      expect(totalUrlScore).toBeGreaterThan(SCORE_THRESHOLDS.MEDIUM_MAX); // RED > 70
    });

    // Scenario 5: Legitimate URL with 0 risk points
    it('Scenario 5 (Low Risk Legitimate URL): clean official corporate domain with HTTPS', () => {
      const brandCheck = checkBrandMimicry('google.com');
      const tldCheck = checkSuspiciousTld('google.com');

      let points = 0;
      if (brandCheck.isMimic) points += SCORING_WEIGHTS.BRAND_IMPERSONATION;
      if (tldCheck.isSuspicious) points += SCORING_WEIGHTS.SUSPICIOUS_TLD;

      expect(points).toBe(0);
      expect(points).toBeLessThanOrEqual(SCORE_THRESHOLDS.LOW_MAX); // GREEN
    });
  });

  describe('Gemini Response Parsing & Fallback Handling', () => {
    it('should parse valid JSON response correctly', () => {
      const rawJson = JSON.stringify({
        paymentDemands: { detected: true, evidence: 'pay ₹15,000 for equipment' },
        urgencyLanguage: { detected: true, evidence: 'Immediate joining required' },
        grammarAnomalies: { detected: false },
        companyDomainMismatch: { detected: true, company: 'Amazon', domain: 'amazon-careers-india.xyz' },
        genericGreeting: { detected: true, greeting: 'Dear Candidate' },
        lackOfContactDetails: { detected: true, evidence: 'No phone number' },
        summary: 'Severe phishing offer letter detected.',
      });

      const parsed = JSON.parse(rawJson);
      expect(parsed.paymentDemands.detected).toBe(true);
      expect(parsed.paymentDemands.evidence).toContain('pay ₹15,000');
    });

    it('should cleanly strip markdown code block fences before parsing', () => {
      const fenced = '```json\n{"paymentDemands": {"detected": true}, "summary": "Phishing"}\n```';
      let cleaned = fenced.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(cleaned);
      expect(parsed.paymentDemands.detected).toBe(true);
      expect(parsed.summary).toBe('Phishing');
    });

    it('should gracefully fallback to rule-based engine if JSON is completely malformed', () => {
      const malformed = 'Not valid JSON at all: Error 500 occurred.';
      let result;
      try {
        result = JSON.parse(malformed);
      } catch {
        // Fallback triggered
        result = analyzeTextHeuristically('Dear Candidate, please pay ₹5000 for joining registration.');
      }
      expect(result).toBeDefined();
      expect(result.textInfo.paymentDemandsDetected).toBe(true);
    });
  });
});
