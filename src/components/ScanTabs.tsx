import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ScanResult, ThreatFlag } from '../types';

interface ScanTabsProps {
  onScan: (input: string, type: 'text' | 'url' | 'file') => Promise<void>;
  isScanning: boolean;
  result: ScanResult | null;
  setResult: (result: ScanResult | null) => void;
  flags: ThreatFlag[];
  setFlags: (flags: ThreatFlag[]) => void;
  error: string | null;
}

export function ScanTabs({
  onScan,
  isScanning,
  result,
  setResult,
  flags,
  setFlags,
  error,
}: ScanTabsProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'text' | 'url' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [autoTag, setAutoTag] = useState({ label: 'Auto-detect standby', color: 'bg-surface-container-highest text-on-surface-variant' });
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [telemetryStep, setTelemetryStep] = useState(0);
  const [telemetryLog, setTelemetryLog] = useState('');
  const [progressWidth, setProgressWidth] = useState('0%');
  const [btnText, setBtnText] = useState('Inspect for Scam Indicators');
  const [btnIcon, setBtnIcon] = useState('radar');
  const [btnDisabled, setBtnDisabled] = useState(false);

  const presets = {
    telegram: {
      tag: 'High Alert: Telegram Interview Redirect',
      color: 'bg-error/15 text-error',
      text: `Dear Candidate,

Congratulations on qualifying for the Remote Data Clerk role at Apex Health. Your hourly compensation is $52/hr. Please connect directly with our Talent Operations Lead via Telegram handle: @ApexHealth_HR_Robert for your mandatory screening chat and equipment provisioning stipend.`,
      count: '318 / 10,000 chars'
    },
    amazon: {
      tag: 'Phishing: Lookalike Domain Detected',
      color: 'bg-tertiary/15 text-tertiary',
      text: `Official Notice from Amazon Global Logistics.
Your profile has been accepted for Regional Dispatch Support. Please finalize your digital signature within 12 hours via our private partner gateway: https://amazon-careers-onboarding-us.top/form?id=99281.`,
      count: '272 / 10,000 chars'
    },
    deposit: {
      tag: 'Severe: Equipment Advance Fee Scam',
      color: 'bg-error/15 text-error',
      text: `OFFER LETTER AGREEMENT
Position: Senior UX Strategist
Prior to sending Apple MacBook Pro & Workspace Monitor, candidate must purchase a security verification bond of $350 via Zelle / CashApp to our certified equipment logistics agent. This fee is 100% refundable on your first weekly pay cycle.`,
      count: '331 / 10,000 chars'
    },
    legit: {
      tag: 'Verified Safe: Institutional Match',
      color: 'bg-secondary/15 text-secondary',
      text: `Subject: Formal Offer of Employment - Senior Software Engineer at Stripe

Dear Alex,
We are delighted to extend this offer of employment for the position of Senior Software Engineer. Review details via Stripe Workday Portal (stripe.com/jobs) using your SSO. No fees or equipment payments will ever be requested.`,
      count: '344 / 10,000 chars'
    }
  };

  const loadPreset = (key: keyof typeof presets) => {
    const item = presets[key];
    setTextInput(item.text);
    setCharCount(item.text.length);
    setAutoTag({ label: item.tag, color: item.color });
    setActiveTab('text');
  };

  const clearInput = () => {
    setTextInput('');
    setCharCount(0);
    setAutoTag({ label: 'Auto-detect standby', color: 'bg-surface-container-highest text-on-surface-variant' });
  };

  const updateCharCount = () => {
    setCharCount(textInput.length);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setShowTelemetry(true);
    setProgressWidth('0%');
    setTelemetryStep(1);
    setTelemetryLog('Parsing wire & deposit stipulations...');
    setBtnText('Analyzing Heuristics...');
    setBtnIcon('hourglass_top');
    setBtnDisabled(true);

    try {
      await onScan(textInput, 'text');
    } catch (err) {
      console.error(err);
    } finally {
      setShowTelemetry(false);
      setBtnText('Inspect for Scam Indicators');
      setBtnIcon('radar');
      setBtnDisabled(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setShowTelemetry(true);
    setProgressWidth('0%');
    setBtnText('Analyzing Heuristics...');
    setBtnIcon('hourglass_top');
    setBtnDisabled(true);

    try {
      await onScan(urlInput, 'url');
    } catch (err) {
      console.error(err);
    } finally {
      setShowTelemetry(false);
      setBtnText('Inspect for Scam Indicators');
      setBtnIcon('radar');
      setBtnDisabled(false);
    }
  };

  const handleFileSubmit = async () => {
    if (!fileInput) return;
    setShowTelemetry(true);
    setProgressWidth('0%');
    setBtnText('Analyzing Heuristics...');
    setBtnIcon('hourglass_top');
    setBtnDisabled(true);

    try {
      const text = await fileInput.text();
      await onScan(text, 'file');
    } catch (err) {
      console.error(err);
    } finally {
      setShowTelemetry(false);
      setBtnText('Inspect for Scam Indicators');
      setBtnIcon('radar');
      setBtnDisabled(false);
    }
  };

  const dismissFile = () => {
    setFileInput(null);
  };

  const getTabClasses = (tab: 'text' | 'url' | 'file') => {
    const base = 'flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg font-body-md text-body-md transition-all';
    return activeTab === tab
      ? `${base} text-on-primary bg-primary shadow-sm`
      : `${base} text-on-surface-variant hover:text-on-surface`;
  };

  const getSurfaceClasses = () => {
    if (theme === 'dark') return 'bg-surface-container-low';
    if (theme === 'light') return 'bg-white';
    return 'bg-surface-container-low';
  };

  const getSurfaceContainerClasses = () => {
    if (theme === 'dark') return 'bg-surface-container';
    if (theme === 'light') return 'bg-gray-100';
    return 'bg-surface-container';
  };

  const getSurfaceContainerHighClasses = () => {
    if (theme === 'dark') return 'bg-surface-container-high';
    if (theme === 'light') return 'bg-gray-200';
    return 'bg-surface-container-high';
  };

  const getSurfaceContainerHighestClasses = () => {
    if (theme === 'dark') return 'bg-surface-container-highest';
    if (theme === 'light') return 'bg-gray-300';
    return 'bg-surface-container-highest';
  };

  const getSurfaceContainerLowClasses = () => {
    if (theme === 'dark') return 'bg-surface-container-low';
    if (theme === 'light') return 'bg-gray-50';
    return 'bg-surface-container-low';
  };

  const getSurfaceContainerLowestClasses = () => {
    if (theme === 'dark') return 'bg-surface-container-lowest';
    if (theme === 'light') return 'bg-white';
    return 'bg-surface-container-lowest';
  };

  const getOnSurfaceClasses = () => {
    if (theme === 'dark') return 'text-on-surface';
    return 'text-gray-900';
  };

  const getOnSurfaceVariantClasses = () => {
    if (theme === 'dark') return 'text-on-surface-variant';
    return 'text-gray-600';
  };

  const getPrimaryClasses = () => {
    if (theme === 'dark') return 'text-primary';
    return 'text-cyan-600';
  };

  const getSecondaryClasses = () => {
    if (theme === 'dark') return 'text-secondary';
    return 'text-green-600';
  };

  const getErrorClasses = () => {
    if (theme === 'dark') return 'text-error';
    return 'text-red-600';
  };

  const getTertiaryClasses = () => {
    if (theme === 'dark') return 'text-tertiary';
    return 'text-pink-600';
  };

  const getOutlineClasses = () => {
    if (theme === 'dark') return 'text-outline';
    return 'text-gray-400';
  };

  // Load default preset on mount
  // useEffect(() => {
  //   loadPreset('deposit');
  // }, []);

  return (
    <section className={`flex flex-col rounded-xl ${getSurfaceContainerLowClasses()} p-6 shadow-md gap-6 relative`}>
      {/* Tab Bar */}
      <div className="flex items-center p-1 rounded-lg bg-surface-container-highest gap-1" id="scan-tab-group">
        <button className={getTabClasses('text')} onClick={() => setActiveTab('text')} type="button">
          <span className="material-symbols-outlined text-[18px]">match_word</span>
          <span>Text / Email</span>
        </button>
        <button className={getTabClasses('url')} onClick={() => setActiveTab('url')} type="button">
          <span className="material-symbols-outlined text-[18px]">link</span>
          <span>Domain / URL</span>
        </button>
        <button className={getTabClasses('file')} onClick={() => setActiveTab('file')} type="button">
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          <span>PDF / Image</span>
        </button>
      </div>

      {/* Quick Scenario Presets */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Simulate Pre-loaded Incident</span>
          <span className="font-telemetry-sm text-telemetry-sm text-primary flex items-center gap-0.5 cursor-pointer hover:underline" onClick={clearInput}>
            <span className="material-symbols-outlined text-[13px]">refresh</span> Reset
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-none">
          <button className="shrink-0 px-3 min-h-[38px] rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-body-sm transition-colors flex items-center gap-1.5 shadow-sm active:scale-95" onClick={() => loadPreset('telegram')} type="button">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            <span>1. Telegram WFH Scam</span>
          </button>
          <button className="shrink-0 px-3 min-h-[38px] rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-body-sm transition-colors flex items-center gap-1.5 shadow-sm active:scale-95" onClick={() => loadPreset('amazon')} type="button">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            <span>2. Fake Amazon Recruiter</span>
          </button>
          <button className="shrink-0 px-3 min-h-[38px] rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-body-sm transition-colors flex items-center gap-1.5 shadow-sm active:scale-95" onClick={() => loadPreset('deposit')} type="button">
            <span className="w-2 h-2 rounded-full bg-error"></span>
            <span>3. Security Deposit Wire</span>
          </button>
          <button className="shrink-0 px-3 min-h-[38px] rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-body-sm font-body-sm transition-colors flex items-center gap-1.5 shadow-sm active:scale-95" onClick={() => loadPreset('legit')} type="button">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>4. Verified Tech Offer</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Text Ingestion View */}
      <div className={`flex flex-col gap-2 ${activeTab === 'text' ? '' : 'hidden'}`} id="view-text">
        <div className={`relative rounded-xl ${getSurfaceContainerClasses()} p-2 flex flex-col shadow-inner`}>
          <div className="flex items-center justify-between pb-2 px-1">
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-telemetry-sm text-telemetry-sm ${autoTag.color}`} id="auto-tag">
              <span className="material-symbols-outlined text-[13px]">policy</span>
              <span>{autoTag.label}</span>
            </div>
            <button className={`min-h-[32px] px-2 rounded-md ${getSurfaceContainerHighClasses()} hover:${getSurfaceContainerHighestClasses()} ${getPrimaryClasses()} font-telemetry-sm text-telemetry-sm flex items-center gap-1 transition-colors`} onClick={() => loadPreset('deposit')} type="button">
              <span className="material-symbols-outlined text-[14px]">content_paste</span>
              <span>Paste Sample</span>
            </button>
          </div>
          <textarea
            className={`w-full bg-transparent ${getOnSurfaceClasses()} placeholder:${getOutlineClasses()} font-telemetry-md text-telemetry-md resize-none p-1 focus:outline-none`}
            id="scan-textarea"
            onChange={(e) => {
              setTextInput(e.target.value);
              updateCharCount();
            }}
            placeholder="Paste offer letter body, recruiter email raw text, wire routing demands, or Telegram interview scripts..."
            rows={6}
            value={textInput}
          />
          <div className="flex items-center justify-between pt-2 px-1 text-on-surface-variant font-telemetry-sm text-telemetry-sm">
            <span className="flex items-center gap-1 text-secondary font-telemetry-sm text-telemetry-sm">
              <span className="material-symbols-outlined text-[13px]">neurology</span> Heuristics Armed
            </span>
            <span id="char-counter">{charCount} / 10,000 chars</span>
          </div>
        </div>
      </div>

      {/* Mode 2: URL Ingestion View */}
      <div className={`hidden flex-col gap-2 ${activeTab === 'url' ? 'flex' : ''}`} id="view-url">
        <div className={`rounded-xl ${getSurfaceContainerClasses()} p-6 flex flex-col gap-4 shadow-inner`}>
          <label className="font-label-caps text-label-caps text-on-surface-variant">Recruiter Portal / Workday Domain</label>
          <div className={`flex items-center gap-2 ${getSurfaceContainerHighClasses()} rounded-lg px-3 py-2 min-h-[44px]`}>
            <span className={`material-symbols-outlined text-outline text-[18px] ${getOutlineClasses()}`}>dns</span>
            <input
              className={`bg-transparent flex-1 ${getOnSurfaceClasses()} font-telemetry-md text-telemetry-md focus:outline-none placeholder:${getOutlineClasses()}`}
              id="url-input"
              placeholder="https://careers-google-verify-portal.net/login"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button className="text-primary font-telemetry-sm text-telemetry-sm underline" onClick={() => setUrlInput('https://telegram-freelance-payout.live/offer')} type="button">Demo</button>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant font-telemetry-sm text-telemetry-sm px-1">
            <span className={`material-symbols-outlined text-[14px] ${getPrimaryClasses()}`}>public</span> Queries global ICANN RDAP + WHOIS creation timeline.
          </div>
        </div>
      </div>

      {/* Mode 3: PDF / Screenshot Dropzone View */}
      <div className={`flex flex-col gap-2 ${activeTab === 'file' ? '' : 'hidden'}`} id="view-file">
        <div className="flex items-center justify-between px-1">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Optical Character Recognition</span>
          <span className={`font-telemetry-sm text-telemetry-sm ${getSecondaryClasses()}`}>OCR v3.1 Ready</span>
        </div>
        <div
          className={`relative rounded-xl p-6 flex flex-col items-center justify-center text-center gap-2 ${getSurfaceContainerClasses()} hover:${getSurfaceContainerHighClasses()} transition-all cursor-pointer shadow-sm min-h-[140px]`}
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) setFileInput(e.dataTransfer.files[0]);
          }}
        >
          <div className={`w-12 h-12 rounded-full ${getPrimaryClasses()}/10 flex items-center justify-center ${getPrimaryClasses()}`}>
            <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
          </div>
          <div className="flex flex-col">
            <span className={`font-body-md text-body-md ${getOnSurfaceClasses()} font-medium`}>Drag & drop offer letter or screenshot</span>
            <span className={`font-body-sm text-body-sm ${getOnSurfaceVariantClasses()}`}>Supports PDF, PNG, JPEG up to 10MB</span>
          </div>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => e.target.files?.[0] && setFileInput(e.target.files[0])}
            className="hidden"
            id="file-upload"
          />
        </div>
        {fileInput && (
          <div className={`flex items-center justify-between p-2 rounded-lg ${getSurfaceContainerHighClasses()} shadow-sm`} id="file-preview-card">
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded ${getErrorClasses()}-container text-on-error-container flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-telemetry-md text-telemetry-md ${getOnSurfaceClasses()} truncate`}>{fileInput.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-telemetry-sm text-telemetry-sm ${getOnSurfaceVariantClasses()}`}>{(fileInput.size / 1024 / 1024).toFixed(1)} MB</span>
                  <span className={`w-1 h-1 rounded-full ${getOutlineClasses()}`}></span>
                  <span className={`font-telemetry-sm text-telemetry-sm ${getErrorClasses()} flex items-center gap-0.5`}>
                    <span className="material-symbols-outlined text-[12px]">warning</span> Unofficial Stamp Found
                  </span>
                </div>
              </div>
            </div>
            <button aria-label="Remove File" className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface-variant hover:text-on-surface" onClick={dismissFile} type="button">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
      </div>

      {/* Active Scanning Progress / Diagnostics Banner */}
      <div className={`hidden flex-col gap-2 p-3 rounded-lg ${getSurfaceContainerHighestClasses()} shadow-sm ${showTelemetry ? 'flex' : ''}`} id="telemetry-banner">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${getPrimaryClasses()} animate-ping`}></span>
            <span className={`font-telemetry-sm text-telemetry-sm ${getPrimaryClasses()} font-semibold tracking-wide uppercase`}>Pipeline: Forensic Diagnostics</span>
          </div>
          <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant" id="telemetry-step">Step {telemetryStep} of 4</span>
        </div>
        <div className={`w-full ${getSurfaceContainerClasses()} h-1.5 rounded-full overflow-hidden`}>
          <div className={`${getPrimaryClasses()} h-full transition-all duration-300`} id="progress-bar-fill" style={{ width: progressWidth }}></div>
        </div>
        <div className="font-telemetry-sm text-telemetry-sm text-on-surface-variant flex items-center gap-1" id="telemetry-log">
          <span className={`material-symbols-outlined text-[14px] ${getSecondaryClasses()}`}>check_circle</span>
          <span>{telemetryLog}</span>
        </div>
      </div>

      {/* Primary CTA Button */}
      <div className="flex flex-col gap-1.5 pt-4">
        <button
          className={`w-full min-h-[48px] rounded-lg ${getPrimaryClasses()} hover:${getPrimaryClasses()}-container text-on-primary font-headline-sm text-headline-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all ${btnDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          id="scan-submit-btn"
          onClick={() => {
            if (activeTab === 'text') handleTextSubmit();
            else if (activeTab === 'url') handleUrlSubmit();
            else handleFileSubmit();
          }}
          type="button"
          disabled={btnDisabled || isScanning}
        >
          <span className="material-symbols-outlined text-[20px]" id="btn-icon">{btnIcon}</span>
          <span id="btn-text">{isScanning ? 'Analyzing...' : btnText}</span>
        </button>
        <div className="flex items-center justify-center gap-3 pt-1 text-on-surface-variant font-telemetry-sm text-telemetry-sm">
          <span className="flex items-center gap-1"><span className={`material-symbols-outlined text-[13px] ${getSecondaryClasses()}`}>encrypted</span> 256-bit Encrypted</span>
          <span>•</span>
          <span>Avg. response ~1.2s</span>
          <span>•</span>
          <span className="text-primary cursor-pointer hover:underline">Threat DB 4.1</span>
        </div>
      </div>
    </section>
  );
}