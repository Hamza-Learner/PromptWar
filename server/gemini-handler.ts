import { GoogleGenAI } from '@google/genai';
import { SCORING_WEIGHTS } from '../src/utils/constants';
import type { RedFlag, TextAnalysis } from '../src/types';
import { analyzeTextHeuristically } from './heuristic-analyzer';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface GeminiAnalysisResult {
  textInfo: TextAnalysis;
  flags: RedFlag[];
  points: number;
  fallbackUsed: boolean;
}

interface RawGeminiFraudResponse {
  paymentDemands?: { detected: boolean; evidence?: string };
  urgencyLanguage?: { detected: boolean; evidence?: string };
  grammarAnomalies?: { detected: boolean; evidence?: string };
  companyDomainMismatch?: { detected: boolean; company?: string; domain?: string; evidence?: string };
  genericGreeting?: { detected: boolean; greeting?: string; evidence?: string };
  lackOfContactDetails?: { detected: boolean; evidence?: string };
  companyIdentified?: string;
  contactDomainIdentified?: string;
  summary?: string;
  extraFlags?: Array<{ name: string; evidence: string; explanation: string; severity?: 'high' | 'medium' | 'low'; points?: number }>;
}

export async function analyzeOfferTextWithGemini(text: string): Promise<GeminiAnalysisResult> {
  const client = getGeminiClient();

  if (!client) {
    // Graceful fallback to heuristic engine if API key is not yet set
    const fallback = analyzeTextHeuristically(text);
    return {
      textInfo: fallback.textInfo,
      flags: fallback.flags,
      points: fallback.points,
      fallbackUsed: true,
    };
  }

  const systemInstruction = `You are a high-level cyber security fraud analyst and threat intelligence engine specializing in employment scams, phishing offer letters, and pay-for-equipment advance-fee fraud.
Analyze the provided offer letter or recruitment message and evaluate the exact fraud indicators:

1. Payment demands: e.g. "pay for equipment", "laptop fee", "deposit", "wire transfer", "security deposit", "refundable fee", "registration fee", "training fee".
2. Urgency language: e.g. "immediate joining", "limited slots", "act now", "urgent requirement", "today itself", "within 24 hours".
3. Grammar/spelling anomalies: unusual capitalization, irregular spacing, erratic punctuation, unprofessional styling.
4. Company name vs domain mismatch: e.g. claimed company is "Amazon" but domain is "amazon-careers-india.xyz" or sent via free mail (gmail.com, etc.).
5. Generic greetings: e.g. "Dear Candidate", "Dear Applicant", "Dear Job Seeker" instead of recipient's actual personal name.
6. Lack of official contact details: absence of physical corporate address, missing legitimate telephone contact, or unverified contact channels.

Return STRICT JSON matching this schema:
{
  "paymentDemands": { "detected": boolean, "evidence": "quote from text" },
  "urgencyLanguage": { "detected": boolean, "evidence": "quote from text" },
  "grammarAnomalies": { "detected": boolean, "evidence": "quote or description" },
  "companyDomainMismatch": { "detected": boolean, "company": "name", "domain": "domain", "evidence": "quote or description" },
  "genericGreeting": { "detected": boolean, "greeting": "greeting found", "evidence": "quote" },
  "lackOfContactDetails": { "detected": boolean, "evidence": "reasoning" },
  "companyIdentified": "name of company mentioned or empty",
  "contactDomainIdentified": "email domain or empty",
  "summary": "2-sentence executive summary of findings",
  "extraFlags": [
    { "name": "Flag Title", "evidence": "quote", "explanation": "why this is dangerous", "severity": "high|medium|low" }
  ]
}`;

  try {
    // Model specified: gemini-2.5-flash with fallback to gemini-3.8-flash
    let rawOutput = '';
    try {
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: text,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      rawOutput = response.text || '';
    } catch {
      // Fallback model
      const fallbackResponse = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: text,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
      rawOutput = fallbackResponse.text || '';
    }

    if (!rawOutput) {
      throw new Error('Empty response received from Gemini API');
    }

    // Clean potential code block wrapping
    let cleaned = rawOutput.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed: RawGeminiFraudResponse = JSON.parse(cleaned);
    const flags: RedFlag[] = [];
    let points = 0;

    // 1. Payment demands (+25 pts)
    if (parsed.paymentDemands?.detected) {
      const pts = SCORING_WEIGHTS.PAYMENT_DEMAND;
      points += pts;
      flags.push({
        id: 'payment-demand',
        name: 'Upfront Payment or Deposit Demand',
        points: pts,
        category: 'payment',
        evidence: parsed.paymentDemands.evidence || 'Upfront payment demanded for equipment/training',
        explanation: 'Legitimate employers never demand upfront wire transfers, refundable security deposits, or advance laptop fees.',
        severity: 'high',
      });
    }

    // 2. Company vs domain mismatch (+15 pts)
    if (parsed.companyDomainMismatch?.detected) {
      const pts = SCORING_WEIGHTS.COMPANY_DOMAIN_MISMATCH;
      points += pts;
      flags.push({
        id: 'domain-mismatch',
        name: 'Company Identity & Domain Mismatch',
        points: pts,
        category: 'domain_mismatch',
        evidence: parsed.companyDomainMismatch.evidence || `${parsed.companyDomainMismatch.company || 'Company'} domain mismatch with ${parsed.companyDomainMismatch.domain || 'recruiter address'}`,
        explanation: 'The sender claims to represent a recognized company but operates from an unauthorized, spoofed, or disposable domain.',
        severity: 'high',
      });
    }

    // 3. Urgency language (+10 pts)
    if (parsed.urgencyLanguage?.detected) {
      const pts = SCORING_WEIGHTS.URGENCY_LANGUAGE;
      points += pts;
      flags.push({
        id: 'urgency-pressure',
        name: 'High-Pressure Urgency Tactics',
        points: pts,
        category: 'urgency',
        evidence: parsed.urgencyLanguage.evidence || 'Strict ultimatum requiring immediate joining/payment',
        explanation: 'Scammers apply artificial deadlines to force compliance before candidates can consult peers or verify authenticity.',
        severity: 'medium',
      });
    }

    // 4. Grammar anomalies (+10 pts)
    if (parsed.grammarAnomalies?.detected) {
      const pts = SCORING_WEIGHTS.GRAMMAR_SPELLING_ANOMALIES;
      points += pts;
      flags.push({
        id: 'grammar-anomalies',
        name: 'Typographic or Formatting Irregularities',
        points: pts,
        category: 'grammar',
        evidence: parsed.grammarAnomalies.evidence || 'Unusual capitalization, spacing, or punctuation',
        explanation: 'Professional HR corporate letters conform to standard templates; formatting anomalies often indicate overseas mass scam scripts.',
        severity: 'medium',
      });
    }

    // 5. Generic greeting (+5 pts)
    if (parsed.genericGreeting?.detected) {
      const pts = SCORING_WEIGHTS.GENERIC_GREETING;
      points += pts;
      flags.push({
        id: 'generic-greeting',
        name: 'Impersonal Generic Greeting',
        points: pts,
        category: 'greeting',
        evidence: parsed.genericGreeting.evidence || parsed.genericGreeting.greeting || 'Generic greeting addressed to "Candidate"',
        explanation: 'Targeted legitimate recruitment letters address candidates by their validated legal full names.',
        severity: 'low',
      });
    }

    // 6. Lack of official contact details (+5 pts)
    if (parsed.lackOfContactDetails?.detected) {
      const pts = SCORING_WEIGHTS.LACK_OF_OFFICIAL_CONTACT;
      points += pts;
      flags.push({
        id: 'lack-contact-details',
        name: 'Absence of Verifiable Contact Details',
        points: pts,
        category: 'contact_details',
        evidence: parsed.lackOfContactDetails.evidence || 'Lacks physical headquarters address and official telephone switchboard',
        explanation: 'Authentic employment contracts provide registered headquarters addresses and official contact numbers.',
        severity: 'low',
      });
    }

    const textInfo: TextAnalysis = {
      paymentDemandsDetected: !!parsed.paymentDemands?.detected,
      urgencyDetected: !!parsed.urgencyLanguage?.detected,
      grammarAnomaliesDetected: !!parsed.grammarAnomalies?.detected,
      domainMismatchDetected: !!parsed.companyDomainMismatch?.detected,
      genericGreetingDetected: !!parsed.genericGreeting?.detected,
      lackOfOfficialContactDetected: !!parsed.lackOfContactDetails?.detected,
      detectedCompanyName: parsed.companyIdentified,
      detectedContactDomain: parsed.contactDomainIdentified,
      summary: parsed.summary || 'Gemini 2.5 Flash security inspection completed.',
    };

    return {
      textInfo,
      flags,
      points,
      fallbackUsed: false,
    };
  } catch {
    // Malformed JSON fallback or API failure -> heuristic fallback
    const fallback = analyzeTextHeuristically(text);
    return {
      textInfo: fallback.textInfo,
      flags: fallback.flags,
      points: fallback.points,
      fallbackUsed: true,
    };
  }
}
