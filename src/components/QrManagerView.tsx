import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Plus,
  Search,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Filter,
  Layers,
  Sparkles,
  Wifi,
  Phone,
  Mail,
  MessageCircle,
  CreditCard,
  FileText
} from 'lucide-react';
import { CodeItem, ProjectItem, QrSubType } from '../types.ts';
import {
  getIntermediateUrl,
  generateQrDataUrl,
  generateQrSvgString,
  downloadDataUrl,
  downloadBlob
} from '../lib/codeRender.ts';
import { sanitizeUrl, isValidHttpUrl } from '../lib/safeUrl.ts';

interface QrManagerViewProps {
  codes: CodeItem[];
  projects: ProjectItem[];
  onOpenCreate: (defaultType?: 'qr') => void;
  onOpenCodeDetail: (code: CodeItem) => void;
  onToggleStatus: (codeId: string) => void;
  onDeleteCode: (codeId: string) => void;
  onUpdateDestination: (codeId: string, newUrl: string) => void;
}

export const QrManagerView: React.FC<QrManagerViewProps> = ({
  codes,
  projects,
  onOpenCreate,
  onOpenCodeDetail,
  onToggleStatus,
  onDeleteCode,
  onUpdateDestination
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick edit modal state
  const [quickEditCode, setQuickEditCode] = useState<CodeItem | null>(null);
  const [quickEditUrl, setQuickEditUrl] = useState('');

  // QR preview caches for list items
  const [qrThumbs, setQrThumbs] = useState<Record<string, string>>({});

  const qrCodes = codes.filter((c) => c.codeType === 'qr');

  // Filtered list
  const filtered = qrCodes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.uniqueId.toLowerCase().includes(search.toLowerCase()) ||
      c.destinationUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesProject = projectFilter === 'all' || c.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  // Pre-render QR thumbnails
  useEffect(() => {
    filtered.forEach(async (code) => {
      if (!qrThumbs[code.id]) {
        const intermediate = getIntermediateUrl(code);
        const dataUrl = await generateQrDataUrl(intermediate, code.customization, 140);
        if (dataUrl) {
          setQrThumbs((prev) => ({ ...prev, [code.id]: dataUrl }));
        }
      }
    });
  }, [filtered]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadPng = async (code: CodeItem) => {
    const intermediate = getIntermediateUrl(code);
    const dataUrl = await generateQrDataUrl(intermediate, code.customization, 600);
    if (dataUrl) {
      downloadDataUrl(dataUrl, `linktag_qr_${code.uniqueId}.png`);
    }
  };

  const handleDownloadSvg = async (code: CodeItem) => {
    const intermediate = getIntermediateUrl(code);
    const svgString = await generateQrSvgString(intermediate, code.customization);
    if (svgString) {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      downloadBlob(blob, `linktag_qr_${code.uniqueId}.svg`);
    }
  };

  const handlePrint = (code: CodeItem) => {
    const intermediate = getIntermediateUrl(code);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const imgTag = qrThumbs[code.id] ? `<img src="${qrThumbs[code.id]}" />` : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${code.name}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { border: 2px dashed #ccc; padding: 24px; text-align: center; border-radius: 12px; max-width: 320px; }
            img { width: 220px; height: 220px; }
            h2 { margin: 8px 0 4px; font-size: 18px; }
            p { margin: 4px 0; font-size: 12px; color: #666; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${code.name}</h2>
            <p>ID: ${code.uniqueId}</p>
            ${imgTag}
            <p>${intermediate}</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const openQuickEdit = (code: CodeItem) => {
    setQuickEditCode(code);
    setQuickEditUrl(code.destinationUrl);
  };

  const saveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickEditCode) return;
    const sanitized = sanitizeUrl(quickEditUrl);
    onUpdateDestination(quickEditCode.id, sanitized);
    setQuickEditCode(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            Dynamic QR Codes
          </h2>
          <p className="text-xs text-slate-400">
            QR codes embed intermediate URL <code className="text-indigo-300 font-mono">/q/{'{unique_id}'}</code> so you can modify destination links at any time.
          </p>
        </div>

        <button
          onClick={() => onOpenCreate('qr')}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Dynamic QR
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, unique ID, or destination URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          {(['all', 'active', 'disabled', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Project Filter */}
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* QR Codes Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-xl border border-slate-800">
          <QrCode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No QR codes found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'Try changing your search terms or filter selections.'
              : 'Create your first dynamic QR code to begin generating redirects and tracking live scans.'}
          </p>
          <button
            onClick={() => onOpenCreate('qr')}
            className="mt-4 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create QR Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((code) => {
            const intermediate = getIntermediateUrl(code);
            const isCopied = copiedId === code.id;
            const project = projects.find((p) => p.id === code.projectId);

            return (
              <div
                key={code.id}
                className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  {/* Top Row: Title, Unique ID & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-100 truncate block">
                          {code.name}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>ID: {code.uniqueId}</span>
                        {project && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px]"
                            style={{
                              backgroundColor: `${project.color}20`,
                              color: project.color
                            }}
                          >
                            {project.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleStatus(code.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                        code.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : code.status === 'expired'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-slate-700/40 text-slate-400 border-slate-600/50 hover:bg-slate-700/60'
                      }`}
                    >
                      {code.status.toUpperCase()}
                    </button>
                  </div>

                  {/* QR Preview Card with Intermediate link */}
                  <div className="flex items-center gap-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 mb-4">
                    <div className="w-20 h-20 bg-white p-1.5 rounded-md shrink-0 flex items-center justify-center shadow-inner">
                      {qrThumbs[code.id] && qrThumbs[code.id].length > 0 ? (
                        <img
                          src={qrThumbs[code.id]}
                          alt={code.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono">
                          Intermediate (Embedded)
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-300">
                          <span className="truncate">{intermediate.replace(/^https?:\/\//, '')}</span>
                          <button
                            onClick={() => handleCopy(intermediate, code.id)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Copy intermediate link"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-between">
                          <span>Target Destination</span>
                          <button
                            onClick={() => openQuickEdit(code)}
                            className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center gap-0.5"
                          >
                            <Edit2 className="w-2.5 h-2.5" /> Edit
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-300">
                          <span className="truncate max-w-[160px]">{code.destinationUrl}</span>
                          <a
                            href={code.destinationUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-slate-200"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled override tag */}
                  {code.schedules && code.schedules.length > 0 && (
                    <div className="mb-3 px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between">
                      <span>Scheduled override active</span>
                      <span className="font-mono text-[10px]">
                        {code.schedules.length} rule(s)
                      </span>
                    </div>
                  )}

                  {/* Scan metrics */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/80">
                    <span>
                      Total Scans:{' '}
                      <strong className="text-slate-200 font-mono tabular-nums">
                        {code.scanCount}
                      </strong>
                    </span>
                    <span className="text-[11px] font-mono">
                      {new Date(code.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDownloadPng(code)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 rounded border border-slate-700/50 flex items-center gap-1 transition-colors"
                      title="Download high-resolution PNG"
                    >
                      <Download className="w-3 h-3" /> PNG
                    </button>
                    <button
                      onClick={() => handleDownloadSvg(code)}
                      className="px-2 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 rounded border border-slate-700/50 flex items-center gap-1 transition-colors"
                      title="Download vector SVG"
                    >
                      <Download className="w-3 h-3" /> SVG
                    </button>
                    <button
                      onClick={() => handlePrint(code)}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                      title="Print QR code label"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenCodeDetail(code)}
                      className="px-2.5 py-1 text-[11px] font-medium text-indigo-400 hover:bg-indigo-950/40 rounded transition-colors"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => onDeleteCode(code.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                      title="Delete code"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Edit Destination Link Modal */}
      {quickEditCode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-white">
                Update Destination URL
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Updating this destination does <span className="text-amber-400 font-semibold">NOT</span> change the physical QR code or intermediate URL{' '}
                <code className="text-indigo-300 font-mono">/q/{quickEditCode.uniqueId}</code>.
              </p>
            </div>

            <form onSubmit={saveQuickEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Destination URL
                </label>
                <input
                  type="text"
                  required
                  value={quickEditUrl}
                  onChange={(e) => setQuickEditUrl(e.target.value)}
                  placeholder="https://example.com/new-landing-page"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>
                  Intermediate Link:{' '}
                  <span className="text-indigo-400 font-mono">
                    {getIntermediateUrl(quickEditCode)}
                  </span>
                </div>
                <div>Status: Next scan will immediately redirect to the new URL.</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickEditCode(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
                >
                  Save New Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
