import React, { useState, useEffect, useRef } from 'react';
import {
  Barcode,
  Plus,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Search,
  Trash2,
  Info,
  ScanLine,
  Layers,
  ArrowRight
} from 'lucide-react';
import { BarcodeFormat, CodeItem, ProjectItem } from '../types.ts';
import {
  getIntermediateUrl,
  renderBarcodeToCanvas,
  downloadDataUrl
} from '../lib/codeRender.ts';
import { sanitizeUrl } from '../lib/safeUrl.ts';

interface BarcodeManagerViewProps {
  codes: CodeItem[];
  projects: ProjectItem[];
  onOpenCreate: (defaultType?: 'barcode') => void;
  onOpenCodeDetail: (code: CodeItem) => void;
  onOpenScanner: () => void;
  onToggleStatus: (codeId: string) => void;
  onDeleteCode: (codeId: string) => void;
  onUpdateDestination: (codeId: string, newUrl: string) => void;
}

export const BarcodeManagerView: React.FC<BarcodeManagerViewProps> = ({
  codes,
  projects,
  onOpenCreate,
  onOpenCodeDetail,
  onOpenScanner,
  onToggleStatus,
  onDeleteCode,
  onUpdateDestination
}) => {
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dynamic' | 'standard'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const barcodeCodes = codes.filter((c) => c.codeType === 'barcode');

  const filtered = barcodeCodes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.uniqueId.toLowerCase().includes(search.toLowerCase()) ||
      (c.barcodeNumber && c.barcodeNumber.includes(search)) ||
      c.destinationUrl.toLowerCase().includes(search.toLowerCase());
    const matchesFormat = formatFilter === 'all' || c.barcodeFormat === formatFilter;
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'dynamic' && c.isDynamic) ||
      (typeFilter === 'standard' && !c.isDynamic);
    return matchesSearch && matchesFormat && matchesType;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const downloadBarcodePng = (code: CodeItem) => {
    const canvas = document.createElement('canvas');
    const textToEncode = code.isDynamic
      ? getIntermediateUrl(code)
      : code.barcodeNumber || code.uniqueId;
    const ok = renderBarcodeToCanvas(canvas, textToEncode, code.barcodeFormat || 'CODE128');
    if (ok) {
      const dataUrl = canvas.toDataURL('image/png');
      downloadDataUrl(dataUrl, `linktag_barcode_${code.uniqueId}.png`);
    }
  };

  const handlePrint = (code: CodeItem) => {
    const canvas = document.createElement('canvas');
    const textToEncode = code.isDynamic
      ? getIntermediateUrl(code)
      : code.barcodeNumber || code.uniqueId;
    renderBarcodeToCanvas(canvas, textToEncode, code.barcodeFormat || 'CODE128');
    const dataUrl = canvas.toDataURL('image/png');
    const imgTag = dataUrl ? `<img src="${dataUrl}" />` : '';

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode - ${code.name}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { border: 2px dashed #999; padding: 20px; text-align: center; border-radius: 8px; width: 340px; }
            img { max-width: 300px; height: auto; }
            h3 { margin: 6px 0 2px; font-size: 16px; }
            p { margin: 2px 0; font-size: 11px; color: #555; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>${code.name}</h3>
            <p>Type: ${code.isDynamic ? 'Dynamic Barcode' : 'Standard Barcode'} (${code.barcodeFormat})</p>
            ${imgTag}
            <p>${textToEncode}</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Barcode className="w-5 h-5 text-amber-400" />
            Barcode Generator & Mapping
          </h2>
          <p className="text-xs text-slate-400">
            Create standard 1D product barcodes or dynamic barcodes embedded with <code className="text-amber-300 font-mono">/b/{'{unique_id}'}</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <ScanLine className="w-4 h-4 text-slate-300" />
            Scan / Lookup
          </button>

          <button
            onClick={() => onOpenCreate('barcode')}
            className="flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-amber-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Generate Barcode
          </button>
        </div>
      </div>

      {/* PRD Information Note regarding Standard vs Dynamic Barcodes */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-300">
            Barcode Mapping Architecture (PRD §4.7)
          </div>
          <div className="text-[11px] leading-relaxed text-amber-200/80">
            • <strong>Dynamic Barcode:</strong> Encodes the intermediate URL (<code className="font-mono">/b/ID</code>). When scanned by any camera that supports URL barcodes, users are redirected automatically.<br />
            • <strong>Standard Barcode:</strong> Contains a standard numeric sequence (e.g. EAN-13, UPC). Note that regular smartphone cameras do not automatically open links from pure numbers; they are matched via the LinkTag database and in-app Scanner.
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, barcode number, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800 text-xs">
          {(['all', 'dynamic', 'standard'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                typeFilter === t
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Format Filter */}
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Formats</option>
          <option value="CODE128">Code 128</option>
          <option value="CODE39">Code 39</option>
          <option value="EAN13">EAN-13</option>
          <option value="EAN8">EAN-8</option>
          <option value="UPC">UPC-A</option>
          <option value="ITF">ITF</option>
        </select>
      </div>

      {/* Barcode Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-xl border border-slate-800">
          <Barcode className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No barcodes found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Generate a new barcode or map physical product barcodes to dynamic destinations.
          </p>
          <button
            onClick={() => onOpenCreate('barcode')}
            className="mt-4 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Generate Barcode
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((code) => (
            <BarcodeCard
              key={code.id}
              code={code}
              projects={projects}
              copiedId={copiedId}
              onCopy={handleCopy}
              onDownload={downloadBarcodePng}
              onPrint={handlePrint}
              onToggleStatus={onToggleStatus}
              onOpenDetail={onOpenCodeDetail}
              onDelete={onDeleteCode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Sub-component for individual Barcode Card with Live Canvas rendering
const BarcodeCard: React.FC<{
  code: CodeItem;
  projects: ProjectItem[];
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onDownload: (code: CodeItem) => void;
  onPrint: (code: CodeItem) => void;
  onToggleStatus: (id: string) => void;
  onOpenDetail: (code: CodeItem) => void;
  onDelete: (id: string) => void;
}> = ({
  code,
  projects,
  copiedId,
  onCopy,
  onDownload,
  onPrint,
  onToggleStatus,
  onOpenDetail,
  onDelete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intermediate = getIntermediateUrl(code);
  const isCopied = copiedId === code.id;
  const project = projects.find((p) => p.id === code.projectId);

  useEffect(() => {
    if (canvasRef.current) {
      const textToEncode = code.isDynamic
        ? intermediate
        : code.barcodeNumber || code.uniqueId;
      renderBarcodeToCanvas(
        canvasRef.current,
        textToEncode,
        code.barcodeFormat || 'CODE128',
        { displayValue: true }
      );
    }
  }, [code, intermediate]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all group">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="font-semibold text-sm text-slate-100 truncate block">
              {code.name}
            </span>
            <div className="text-[11px] font-mono text-amber-400 mt-0.5 flex items-center gap-2">
              <span>{code.barcodeFormat || 'CODE128'}</span>
              <span>·</span>
              <span>{code.isDynamic ? 'Dynamic Link' : 'Mapped Standard'}</span>
            </div>
          </div>

          <button
            onClick={() => onToggleStatus(code.id)}
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
              code.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-700/40 text-slate-400 border-slate-600/50 hover:bg-slate-700/60'
            }`}
          >
            {code.status.toUpperCase()}
          </button>
        </div>

        {/* Live Canvas Barcode Display */}
        <div className="p-3 bg-white rounded-lg flex items-center justify-center mb-3 shadow-inner overflow-hidden">
          <canvas ref={canvasRef} className="max-w-full h-auto" />
        </div>

        {/* URL and Target info */}
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 mb-3 text-xs">
          {code.isDynamic ? (
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">
                Intermediate Barcode URL
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300">
                <span className="truncate">{intermediate}</span>
                <button
                  onClick={() => onCopy(intermediate, code.id)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase">
                Physical Barcode Number
              </div>
              <div className="font-mono text-slate-200 text-xs">
                {code.barcodeNumber || code.uniqueId}
              </div>
            </div>
          )}

          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">
              Target Destination
            </div>
            <div className="flex items-center gap-1 text-slate-300 text-xs">
              <span className="truncate max-w-[200px]">{code.destinationUrl}</span>
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

        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/80">
          <span>
            Scans:{' '}
            <strong className="text-slate-200 font-mono tabular-nums">
              {code.scanCount}
            </strong>
          </span>
          <span className="text-[11px] font-mono">ID: {code.uniqueId}</span>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDownload(code)}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700/80 rounded border border-slate-700/50 flex items-center gap-1"
          >
            <Download className="w-3 h-3" /> PNG
          </button>
          <button
            onClick={() => onPrint(code)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            title="Print Barcode Label"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenDetail(code)}
            className="px-2.5 py-1 text-xs font-medium text-amber-400 hover:bg-amber-950/40 rounded transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(code.id)}
            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
