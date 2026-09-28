import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Download,
  Calendar,
  Clock,
  Plus,
  Trash2,
  ShieldCheck,
  QrCode,
  Radio,
  Barcode,
  Save,
  AlertTriangle
} from 'lucide-react';
import { CodeItem, ScheduledLink } from '../types.ts';
import {
  getIntermediateUrl,
  generateQrDataUrl,
  generateQrSvgString,
  renderBarcodeToCanvas,
  downloadDataUrl,
  downloadBlob
} from '../lib/codeRender.ts';
import { sanitizeUrl } from '../lib/safeUrl.ts';

interface CodeDetailModalProps {
  code: CodeItem | null;
  onClose: () => void;
  onUpdateCode: (id: string, updates: Partial<CodeItem>) => void;
  onToggleStatus: (id: string) => void;
  onOpenNfcWriter?: (id: string) => void;
}

export const CodeDetailModal: React.FC<CodeDetailModalProps> = ({
  code,
  onClose,
  onUpdateCode,
  onToggleStatus,
  onOpenNfcWriter
}) => {
  const [name, setName] = useState(code?.name || '');
  const [destinationUrl, setDestinationUrl] = useState(code?.destinationUrl || '');
  const [expiresAt, setExpiresAt] = useState(code?.expiresAt || '');
  const [schedules, setSchedules] = useState<ScheduledLink[]>(code?.schedules || []);
  const [copied, setCopied] = useState(false);

  // New schedule form state
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [schName, setSchName] = useState('');
  const [schUrl, setSchUrl] = useState('');
  const [schStart, setSchStart] = useState('');
  const [schEnd, setSchEnd] = useState('');
  const [schPriority, setSchPriority] = useState(1);

  // Preview data
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const intermediate = code ? getIntermediateUrl(code) : '';

  useEffect(() => {
    if (code) {
      setName(code.name);
      setDestinationUrl(code.destinationUrl);
      setExpiresAt(code.expiresAt || '');
      setSchedules(code.schedules || []);
    }
  }, [code]);

  useEffect(() => {
    if (!code) return;
    if (code.codeType === 'qr' || code.codeType === 'nfc') {
      generateQrDataUrl(intermediate, code.customization, 400).then((url) => {
        setQrDataUrl(url || null);
      });
    } else if (code.codeType === 'barcode' && barcodeCanvasRef.current) {
      setQrDataUrl(null);
      const textToEncode = code.isDynamic ? intermediate : code.barcodeNumber || code.uniqueId;
      renderBarcodeToCanvas(barcodeCanvasRef.current, textToEncode, code.barcodeFormat || 'CODE128');
    }
  }, [code, intermediate]);

  // Hook rules guarantee: all hooks have executed before any return
  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(intermediate);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSaveBasic = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCode(code.id, {
      name: name.trim(),
      destinationUrl: sanitizeUrl(destinationUrl),
      expiresAt: expiresAt || undefined
    });
    alert('Code configuration successfully updated.');
  };

  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schName.trim() || !schUrl.trim() || !schStart || !schEnd) return;

    const newSch: ScheduledLink = {
      id: `sch_${Date.now()}`,
      name: schName.trim(),
      destinationUrl: sanitizeUrl(schUrl),
      startDate: new Date(schStart).toISOString(),
      endDate: new Date(schEnd).toISOString(),
      priority: Number(schPriority)
    };

    const updated = [...schedules, newSch];
    setSchedules(updated);
    onUpdateCode(code.id, { schedules: updated });

    setIsAddingSchedule(false);
    setSchName('');
    setSchUrl('');
    setSchStart('');
    setSchEnd('');
  };

  const handleDeleteSchedule = (schId: string) => {
    const updated = schedules.filter((s) => s.id !== schId);
    setSchedules(updated);
    onUpdateCode(code.id, { schedules: updated });
  };

  const handleDownloadPng = async () => {
    if (code.codeType === 'qr' || code.codeType === 'nfc') {
      const url = await generateQrDataUrl(intermediate, code.customization, 800);
      if (url) downloadDataUrl(url, `${code.uniqueId}_qr.png`);
    } else {
      const canvas = document.createElement('canvas');
      const text = code.isDynamic ? intermediate : code.barcodeNumber || code.uniqueId;
      renderBarcodeToCanvas(canvas, text, code.barcodeFormat || 'CODE128');
      downloadDataUrl(canvas.toDataURL('image/png'), `${code.uniqueId}_barcode.png`);
    }
  };

  const handleDownloadSvg = async () => {
    if (code.codeType === 'qr' || code.codeType === 'nfc') {
      const svg = await generateQrSvgString(intermediate, code.customization);
      if (svg) downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${code.uniqueId}_qr.svg`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                code.codeType === 'qr'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : code.codeType === 'nfc'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {code.codeType === 'qr' ? (
                <QrCode className="w-5 h-5" />
              ) : code.codeType === 'nfc' ? (
                <Radio className="w-5 h-5" />
              ) : (
                <Barcode className="w-5 h-5" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{code.name}</h3>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                <span>ID: {code.uniqueId}</span>
                <span>·</span>
                <span className="uppercase">{code.codeType}</span>
                <span>·</span>
                <span className="tabular-nums">{code.scanCount} scans</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleStatus(code.id)}
              className={`text-xs font-mono px-3 py-1 rounded-full border transition-all ${
                code.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-700/40 text-slate-400 border-slate-600/50 hover:bg-slate-700/60'
              }`}
            >
              {code.status.toUpperCase()}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Grid: Live Asset Preview + Intermediate Link */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 rounded-xl bg-slate-950 border border-slate-800">
          {/* Asset Graphic (4 cols) */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner min-h-[160px]">
            {code.codeType === 'qr' || code.codeType === 'nfc' ? (
              qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Code Preview"
                  className="w-36 h-36 object-contain"
                />
              ) : (
                <div className="w-36 h-36 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs font-mono animate-pulse">
                  Rendering QR...
                </div>
              )
            ) : (
              <canvas ref={barcodeCanvasRef} className="max-w-full h-auto" />
            )}
          </div>

          {/* Links & Fast Actions (8 cols) */}
          <div className="md:col-span-8 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Intermediate URL (Fixed Physical Anchor)
                </span>
                <div className="flex items-center gap-2 font-mono text-xs text-indigo-300 bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="truncate flex-1">{intermediate}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Copy intermediate link"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={intermediate}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Open test redirect"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Current Target Destination
                </span>
                <span className="text-xs text-slate-200 font-mono break-all">
                  {code.destinationUrl}
                </span>
              </div>
            </div>

            {/* Asset Download Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-900">
              <button
                onClick={handleDownloadPng}
                className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> High-Res PNG
              </button>
              {(code.codeType === 'qr' || code.codeType === 'nfc') && (
                <button
                  onClick={handleDownloadSvg}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Vector SVG
                </button>
              )}
              {code.codeType === 'nfc' && onOpenNfcWriter && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenNfcWriter(code.id);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 rounded-lg border border-emerald-700/50 flex items-center gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-400" /> Write to NFC
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Edit Destination Form */}
        <form onSubmit={handleSaveBasic} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              General Routing Settings
            </h4>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Code Label / Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Target Destination URL
              </label>
              <input
                type="text"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Optional Expiration Date
              </label>
              <input
                type="date"
                value={expiresAt ? expiresAt.split('T')[0] : ''}
                onChange={(e) =>
                  setExpiresAt(e.target.value ? new Date(e.target.value).toISOString() : '')
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </form>

        {/* Scheduled Links Section (PRD Section 4.12) */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Scheduled Promotional Overrides (PRD §4.12)
              </h4>
              <p className="text-[11px] text-slate-400">
                Override the destination URL during specific date ranges (e.g. flash sales, event stages).
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingSchedule(!isAddingSchedule)}
              className="px-2.5 py-1 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/40 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add Schedule Window
            </button>
          </div>

          {/* Add Schedule Form */}
          {isAddingSchedule && (
            <form onSubmit={handleAddSchedule} className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Black Friday Special"
                    value={schName}
                    onChange={(e) => setSchName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Override Destination URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://example.com/promo/black-friday"
                    value={schUrl}
                    onChange={(e) => setSchUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={schStart}
                    onChange={(e) => setSchStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={schEnd}
                    onChange={(e) => setSchEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingSchedule(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded"
                >
                  Save Schedule Rule
                </button>
              </div>
            </form>
          )}

          {/* Schedules List */}
          {schedules.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-3">
              No active schedules. Destination permanently points to general target URL.
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-200">{s.name}</div>
                    <div className="font-mono text-[11px] text-amber-300 truncate">
                      {s.destinationUrl}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {new Date(s.startDate).toLocaleString()} → {new Date(s.endDate).toLocaleString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                    title="Remove rule"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
