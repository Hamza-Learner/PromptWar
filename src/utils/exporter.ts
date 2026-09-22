import { jsPDF } from 'jspdf';
import type { ScanResult } from '../types';

/**
 * Downloads the full scan assessment as a formatted JSON file.
 */
export function downloadJsonReport(result: ScanResult): void {
  const timestamp = new Date(result.analyzedAt || Date.now()).toISOString();
  const targetName =
    result.inputType === 'url' && result.domainInfo?.domain
      ? result.domainInfo.domain.replace(/[^a-zA-Z0-9.-]/g, '_')
      : 'offer-letter';

  const filename = `scamshield-analysis-${targetName}-${Date.now()}.json`;

  const reportPayload = {
    generator: 'ScamShield Security Inspector',
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    scanTimestamp: timestamp,
    overallAssessment: {
      threatScore: result.threatScore,
      riskLevel: result.riskLevel,
      riskLabel: result.riskLabel,
      analysisMode: result.fallbackUsed ? 'Heuristic Rule Engine' : 'Hybrid AI + RDAP Engine',
    },
    target: {
      inputType: result.inputType,
      rawInput: result.rawInput,
      domainInfo: result.domainInfo || null,
      textSignals: result.textInfo || null,
    },
    redFlagsIdentified: result.flags.map((flag) => ({
      id: flag.id,
      name: flag.name,
      points: flag.points,
      severity: flag.severity,
      category: flag.category,
      evidence: flag.evidence,
      explanation: flag.explanation,
    })),
    recommendations: result.recommendations,
    officialReportingHelplines: {
      indiaCyberCrime: '1930 / https://cybercrime.gov.in',
      unitedStatesIC3: 'https://www.ic3.gov',
      unitedKingdomActionFraud: '0300 123 2040 / https://www.actionfraud.police.uk',
    },
  };

  const jsonString = JSON.stringify(reportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  triggerDownload(blob, filename);
}

/**
 * Generates and triggers download of a clean, structured PDF threat summary report.
 */
export async function downloadPdfReport(result: ScanResult): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 16;

  // Colors
  const primaryNavy = [15, 23, 42]; // slate-900
  const cyanAccent = [6, 182, 212]; // cyan-500
  const redAlert = [225, 29, 72]; // rose-600
  const amberAlert = [217, 119, 6]; // amber-600
  const greenSafe = [16, 185, 129]; // emerald-500

  // 1. Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, cursorY, contentWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SCAMSHIELD THREAT ASSESSMENT REPORT', margin + 6, cursorY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    `Generated: ${new Date().toLocaleString()} | Target: ${result.inputType.toUpperCase()}`,
    margin + 6,
    cursorY + 16
  );

  cursorY += 28;

  // 2. Score & Risk Level Highlight Card
  let riskColor = greenSafe;
  if (result.riskLevel === 'high') riskColor = redAlert;
  else if (result.riskLevel === 'medium') riskColor = amberAlert;

  doc.setDrawColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setLineWidth(1);
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, cursorY, contentWidth, 26, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('SCAM THREAT INDEX:', margin + 6, cursorY + 9);

  // Score badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text(`${result.threatScore}%`, margin + 65, cursorY + 11);

  doc.setFontSize(12);
  doc.text(`[ ${result.riskLabel.toUpperCase()} ]`, margin + 95, cursorY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const statusMsg =
    result.threatScore >= 70
      ? 'CRITICAL WARNING: High probability of fraudulent appointment or phishing.'
      : result.threatScore >= 30
      ? 'MODERATE WARNING: Suspicious elements detected. Proceed with extreme caution.'
      : 'LOW RISK: No critical advance-fee or fraud signals identified.';
  doc.text(statusMsg, margin + 6, cursorY + 20);

  cursorY += 32;

  // 3. Target Input Preview
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('INSPECTED TARGET / EVIDENCE:', margin, cursorY);
  cursorY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  const previewSnippet =
    result.inputType === 'url'
      ? `URL Domain: ${result.domainInfo?.domain || result.rawInput}`
      : `Excerpt: "${result.rawInput.trim().replace(/\s+/g, ' ').slice(0, 220)}..."`;

  const splitSnippet = doc.splitTextToSize(previewSnippet, contentWidth - 8);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, cursorY, contentWidth, splitSnippet.length * 4.5 + 6, 'F');
  doc.text(splitSnippet, margin + 4, cursorY + 5);
  cursorY += splitSnippet.length * 4.5 + 10;

  // 4. Domain & Technical Parameters (if URL or detected domain)
  if (result.domainInfo && result.domainInfo.domain) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text('DOMAIN INTELLIGENCE (RDAP AUDIT):', margin, cursorY);
    cursorY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const dInfo = [
      `Domain: ${result.domainInfo.domain}`,
      `Age: ${
        result.domainInfo.domainAgeDays !== undefined
          ? `${result.domainInfo.domainAgeDays} days old`
          : 'Unknown'
      }`,
      `Registrar: ${result.domainInfo.registrarName || 'Not publicly disclosed'}`,
      `SSL Active: ${result.domainInfo.hasSsl ? 'Yes' : 'No'} | Valid: ${
        result.domainInfo.isSslValid ? 'Yes' : 'No'
      }`,
      `Suspicious TLD: ${result.domainInfo.isSuspiciousTld ? 'YES (High Risk TLD)' : 'No'}`,
    ];

    dInfo.forEach((item) => {
      doc.text(`• ${item}`, margin + 4, cursorY);
      cursorY += 4.5;
    });
    cursorY += 4;
  }

  // 5. Red Flags Breakdown
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(
    `DETECTED RED FLAGS (${result.flags.length} Identified):`,
    margin,
    cursorY
  );
  cursorY += 6;

  if (result.flags.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(greenSafe[0], greenSafe[1], greenSafe[2]);
    doc.text('No malicious indicators or extortion flags were identified.', margin + 4, cursorY);
    cursorY += 8;
  } else {
    result.flags.forEach((flag, idx) => {
      // Check for page overflow
      if (cursorY > 260) {
        doc.addPage();
        cursorY = 16;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(190, 18, 60); // rose-700
      doc.text(`${idx + 1}. [ +${flag.points} pts ] ${flag.name}`, margin + 4, cursorY);
      cursorY += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      if (flag.evidence) {
        doc.text(`   Evidence: "${flag.evidence.slice(0, 140)}"`, margin + 4, cursorY);
        cursorY += 4;
      }

      const explanationLines = doc.splitTextToSize(
        `   Why: ${flag.explanation}`,
        contentWidth - 10
      );
      doc.text(explanationLines, margin + 4, cursorY);
      cursorY += explanationLines.length * 4 + 3;
    });
  }

  cursorY += 3;

  // 6. Actionable Recommendations
  if (cursorY > 250) {
    doc.addPage();
    cursorY = 16;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('MANDATORY DEFENSE RECOMMENDATIONS:', margin, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  result.recommendations.forEach((rec) => {
    if (cursorY > 270) {
      doc.addPage();
      cursorY = 16;
    }
    const lines = doc.splitTextToSize(`• ${rec}`, contentWidth - 8);
    doc.text(lines, margin + 4, cursorY);
    cursorY += lines.length * 4 + 1.5;
  });

  // Footer Emergency Helpline Notice on Bottom
  if (cursorY > 265) {
    doc.addPage();
    cursorY = 270;
  } else {
    cursorY = 272;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 5;

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'ScamShield is an assistive security tool. Cyber helpline: India 1930 | USA ic3.gov | UK Action Fraud 0300 123 2040.',
    margin,
    cursorY
  );

  const targetClean =
    result.inputType === 'url' && result.domainInfo?.domain
      ? result.domainInfo.domain.replace(/[^a-zA-Z0-9.-]/g, '_')
      : 'offer-letter';

  doc.save(`scamshield-report-${targetClean}-${Date.now()}.pdf`);
}

/**
 * Helper to trigger client-side download of a Blob.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
