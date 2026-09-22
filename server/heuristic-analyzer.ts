import { SCORING_WEIGHTS, SUSPICIOUS_TLDS } from '../src/utils/constants';
import type { RedFlag, TextAnalysis } from '../src/types';

export interface HeuristicAnalysisResult {
  textInfo: TextAnalysis;
  flags: RedFlag[];
  points: number;
}

/**
 * Heuristic rule-based analyzer for offer letters and job text.
 * Used for offline mode, unit tests, and fallback if Gemini API is unreachable.
 */
export function analyzeTextHeuristically(text: string): HeuristicAnalysisResult {
  const flags: RedFlag[] = [];
  let points = 0;
  const lower = text.toLowerCase();

  // 1. Payment demands (+25 pts)
  const paymentKeywords = [
    'pay for equipment',
    'laptop and equipment',
    'deposit',
    'wire transfer',
    'security deposit',
    'refundable fee',
    'registration fee',
    'training fee',
    'processing fee',
    'pay ₹',
    'pay rs',
    'pay $',
    'pay 15,000',
    'pay 15000',
    'refunded with your first salary',
    'refundable with your first salary',
  ];

  let detectedPayment = false;
  let paymentEvidence = '';
  for (const kw of paymentKeywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      detectedPayment = true;
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + kw.length + 30);
      paymentEvidence = text.slice(start, end).trim();
      break;
    }
  }

  // Regex check for payment patterns like "pay ... fee" or "pay ... ₹/Rs/$"
  if (!detectedPayment) {
    const payPattern = /pay\s+(?:(?:₹|rs\.?|\$)?\s*\d+[\d,]*\b|for\s+(?:laptop|equipment|training|registration))/i;
    const match = text.match(payPattern);
    if (match) {
      detectedPayment = true;
      const idx = text.indexOf(match[0]);
      paymentEvidence = text.slice(Math.max(0, idx - 15), Math.min(text.length, idx + match[0].length + 25)).trim();
    }
  }

  if (detectedPayment) {
    const pts = SCORING_WEIGHTS.PAYMENT_DEMAND;
    points += pts;
    flags.push({
      id: 'payment-demand',
      name: 'Upfront Payment or Deposit Demand',
      points: pts,
      category: 'payment',
      evidence: `"${paymentEvidence}"`,
      explanation: 'Legitimate employers never require candidates to transfer funds, pay for laptops/equipment, or submit advance security deposits.',
      severity: 'high',
    });
  }

  // 2. Urgency language (+10 pts)
  const urgencyKeywords = [
    'immediate joining',
    'limited slots',
    'act now',
    'urgent requirement',
    'today itself',
    'within 24 hours',
    'within 48 hours',
    'urgently required',
    'offer expires today',
    'last date to confirm today',
  ];

  let detectedUrgency = false;
  let urgencyEvidence = '';
  for (const kw of urgencyKeywords) {
    const idx = lower.indexOf(kw);
    if (idx !== -1) {
      detectedUrgency = true;
      const start = Math.max(0, idx - 10);
      const end = Math.min(text.length, idx + kw.length + 20);
      urgencyEvidence = text.slice(start, end).trim();
      break;
    }
  }

  if (detectedUrgency) {
    const pts = SCORING_WEIGHTS.URGENCY_LANGUAGE;
    points += pts;
    flags.push({
      id: 'urgency-pressure',
      name: 'High-Pressure Urgency Tactics',
      points: pts,
      category: 'urgency',
      evidence: `"${urgencyEvidence}"`,
      explanation: 'Scammers manufacture artificial urgency (e.g., immediate joining, limited slots) to force victims to pay before verifying details.',
      severity: 'medium',
    });
  }

  // 3. Generic greetings (+5 pts)
  const genericGreetings = [
    'dear candidate',
    'dear applicant',
    'dear job seeker',
    'dear sir/madam',
    'dear sir or madam',
    'hello applicant',
  ];
  let detectedGenericGreeting = false;
  let greetingEvidence = '';

  for (const gg of genericGreetings) {
    const idx = lower.indexOf(gg);
    if (idx !== -1 && idx < 120) {
      detectedGenericGreeting = true;
      greetingEvidence = text.slice(idx, idx + gg.length + 5).trim();
      break;
    }
  }

  if (detectedGenericGreeting) {
    const pts = SCORING_WEIGHTS.GENERIC_GREETING;
    points += pts;
    flags.push({
      id: 'generic-greeting',
      name: 'Impersonal Generic Greeting',
      points: pts,
      category: 'greeting',
      evidence: `"${greetingEvidence}"`,
      explanation: 'Mass phishing campaigns use generic salutations like "Dear Candidate" rather than addressing you by your legal name.',
      severity: 'low',
    });
  }

  // 4. Grammar and spelling anomalies (+10 pts)
  // Check for weird capitalization (e.g. "Software Engineer position at Amazon India. Salary: ₹12 LPA..."),
  // unusual spacing, multiple exclamation marks, broken punctuation
  const excessivePunctuation = /[!?]{2,}|[A-Z]{5,}|\s{3,}/.test(text);
  const oddCaps = /\b(?:Urgent|Selected|Joining|Laptop|Salary)\b.*\b(?:Pay|Deposit|Amount)\b/.test(text) && /[!]{1}/.test(text);
  let detectedGrammar = false;
  let grammarEvidence = '';

  if (excessivePunctuation) {
    detectedGrammar = true;
    const match = text.match(/[!?]{2,}|[A-Z]{5,}|\s{3,}/);
    grammarEvidence = match ? match[0] : 'Irregular punctuation pattern';
  } else if (oddCaps) {
    detectedGrammar = true;
    grammarEvidence = 'Inconsistent capitalization across nouns and fee terms';
  }

  if (detectedGrammar) {
    const pts = SCORING_WEIGHTS.GRAMMAR_SPELLING_ANOMALIES;
    points += pts;
    flags.push({
      id: 'grammar-anomalies',
      name: 'Typographic or Formatting Irregularities',
      points: pts,
      category: 'grammar',
      evidence: `"${grammarEvidence}"`,
      explanation: 'Official HR letters undergo standard editorial review; erratic casing, punctuation, or odd phrasing often signal spoofing.',
      severity: 'medium',
    });
  }

  // 5. Company name vs domain mismatch (+15 pts)
  // Extract contact emails/domains
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  let detectedMismatch = false;
  let mismatchEvidence = '';
  let contactDomain = '';
  let companyName = '';

  const knownBrandsInText = ['amazon', 'google', 'apple', 'microsoft', 'paypal', 'netflix', 'meta', 'tcs', 'infosys', 'wipro'];
  for (const b of knownBrandsInText) {
    if (lower.includes(b)) {
      companyName = b.charAt(0).toUpperCase() + b.slice(1);
      break;
    }
  }

  if (emailMatch) {
    contactDomain = emailMatch[1].toLowerCase();
    const contactEmail = emailMatch[0];

    // Check if free email provider used for major corporate offer
    const isFreeProvider = /gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|rediffmail\.com/.test(contactDomain);
    if (companyName && isFreeProvider) {
      detectedMismatch = true;
      mismatchEvidence = `Claimed ${companyName} offer sent from free email: ${contactEmail}`;
    } else if (companyName) {
      // Check if domain contains brand name with extra hyphens/suffixes (e.g. amazon-careers-india.xyz)
      const officialDomainRegex = new RegExp(`^(?:[a-zA-Z0-9-]+\\.)?${companyName.toLowerCase()}\\.(?:com|in|co\\.uk|org)$`, 'i');
      if (contactDomain.includes(companyName.toLowerCase()) && !officialDomainRegex.test(contactDomain)) {
        detectedMismatch = true;
        mismatchEvidence = `Company '${companyName}' does not use third-party domain '${contactDomain}' for HR`;
      }
    }
  }

  if (detectedMismatch) {
    const pts = SCORING_WEIGHTS.COMPANY_DOMAIN_MISMATCH;
    points += pts;
    flags.push({
      id: 'domain-mismatch',
      name: 'Company Identity & Domain Mismatch',
      points: pts,
      category: 'domain_mismatch',
      evidence: mismatchEvidence,
      explanation: 'The recruiter claims to represent an established brand but operates from an unofficial domain or public mailbox.',
      severity: 'high',
    });
  }

  // 6. Lack of official contact details (+5 pts)
  // Check for presence of physical address and phone number
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?\d{10}|\+91[-.\s]?[X\d]{10}/i.test(text);
  const hasAddress = /address:|office:|road|street|floor|nagar|bangalore|mumbai|delhi|hyderabad|california|london/i.test(lower);
  const hasOfficialDomain = contactDomain && !contactDomain.endsWith('.xyz') && !contactDomain.endsWith('.top') && !contactDomain.endsWith('.buzz');

  let lackOfContact = false;
  let contactEvidence = '';

  if (!hasPhone && !hasAddress) {
    lackOfContact = true;
    contactEvidence = 'No physical office address and no telephone contact number provided';
  } else if (!hasOfficialDomain && !hasAddress) {
    lackOfContact = true;
    contactEvidence = 'Lacks verifiable physical headquarters and valid corporate domain';
  }

  if (lackOfContact) {
    const pts = SCORING_WEIGHTS.LACK_OF_OFFICIAL_CONTACT;
    points += pts;
    flags.push({
      id: 'lack-contact-details',
      name: 'Absence of Verifiable Contact Details',
      points: pts,
      category: 'contact_details',
      evidence: contactEvidence,
      explanation: 'Authentic employment offers detail verifiable registered company office addresses and reachable recruitment contact lines.',
      severity: 'low',
    });
  }

  // 7. Check if contact domain has a suspicious TLD (+15 pts)
  if (contactDomain) {
    const matchedTld = SUSPICIOUS_TLDS.find((tld) => contactDomain.endsWith(tld));
    if (matchedTld) {
      const pts = SCORING_WEIGHTS.SUSPICIOUS_TLD;
      points += pts;
      flags.push({
        id: 'suspicious-tld',
        name: 'High-Risk TLD in Contact Address',
        points: pts,
        category: 'suspicious_tld',
        evidence: `Email domain ends with suspicious TLD '${matchedTld}'`,
        explanation: 'The recruiter address uses a high-risk or disposable top-level domain frequently associated with automated mass phishing operations.',
        severity: 'medium',
      });
    }
  }

  const textInfo: TextAnalysis = {
    paymentDemandsDetected: detectedPayment,
    urgencyDetected: detectedUrgency,
    grammarAnomaliesDetected: detectedGrammar,
    domainMismatchDetected: detectedMismatch,
    genericGreetingDetected: detectedGenericGreeting,
    lackOfOfficialContactDetected: lackOfContact,
    detectedCompanyName: companyName || undefined,
    detectedContactDomain: contactDomain || undefined,
    summary: flags.length > 0 
      ? `Detected ${flags.length} suspicious pattern(s) across payment demands, sender domains, and recruitment formatting.` 
      : 'No blatant fraud red flags identified in the provided text.',
  };

  return { textInfo, flags, points };
}
