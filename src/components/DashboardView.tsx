import React from 'react';
import {
  QrCode,
  Radio,
  Barcode,
  Eye,
  Activity,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { CodeItem, ScanEvent } from '../types.ts';
import { getIntermediateUrl } from '../lib/codeRender.ts';

interface DashboardViewProps {
  codes: CodeItem[];
  scans: ScanEvent[];
  onOpenCreate: (defaultType?: 'qr' | 'nfc' | 'barcode') => void;
  onOpenNfcWriter: (codeId?: string) => void;
  onOpenCodeDetail: (code: CodeItem) => void;
  onToggleStatus: (codeId: string) => void;
  onNavigateTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  codes,
  scans,
  onOpenCreate,
  onOpenNfcWriter,
  onOpenCodeDetail,
  onToggleStatus,
  onNavigateTab
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const qrCount = codes.filter((c) => c.codeType === 'qr').length;
  const nfcCount = codes.filter((c) => c.codeType === 'nfc').length;
  const barcodeCount = codes.filter((c) => c.codeType === 'barcode').length;
  const activeCount = codes.filter((c) => c.status === 'active').length;
  const disabledCount = codes.filter((c) => c.status !== 'active').length;
  const totalScans = codes.reduce((sum, c) => sum + (c.scanCount || 0), 0);

  // Scans today
  const todayStr = new Date().toISOString().split('T')[0];
  const scansToday = scans.filter((s) => s.eventTime.startsWith(todayStr)).length;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Recent 5 scans
  const recentScans = scans.slice(0, 5);

  // Recent 6 codes
  const recentCodes = [...codes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Compute daily trend for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = scans.filter((s) => s.eventTime.startsWith(dayStr)).length;
    return { dayStr, label, count };
  });

  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Enterprise Redirect & Tag Control
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Update destination links dynamically for existing physical QR codes, NFC tags, and barcodes without re-printing or re-writing hardware tags.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenCreate('qr')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            + New Dynamic QR
          </button>
          <button
            onClick={() => onOpenCreate('nfc')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            + New NFC Tag
          </button>
          <button
            onClick={() => onOpenCreate('barcode')}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <Barcode className="w-3.5 h-3.5 text-amber-400" />
            + New Barcode
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total QR</span>
            <QrCode className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {qrCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Dynamic & Static
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>NFC Tags</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {nfcCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            NDEF Programmed
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Barcodes</span>
            <Barcode className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {barcodeCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            1D / 2D Mapped
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Scans</span>
            <Eye className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {totalScans}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            All-time hits
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Scans Today</span>
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {scansToday}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            Live tracked
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {activeCount}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {disabledCount} off
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active / Inactive
          </div>
        </div>
      </div>

      {/* Analytics Chart + Live Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scans Past 7 Days */}
        <div className="lg:col-span-2 p-5 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Scan Velocity (Past 7 Days)
              </h3>
              <p className="text-xs text-slate-400">
                Hourly and daily intermediate redirect telemetry
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              Full Analytics <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-44 flex items-end gap-3 pt-6 pb-2">
            {last7Days.map((item) => {
              const heightPct = Math.round((item.count / maxDayCount) * 100);
              return (
                <div
                  key={item.dayStr}
                  className="flex-1 flex flex-col items-center gap-2 group"
                >
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                  <div className="w-full bg-slate-800 rounded-t h-28 relative flex items-end">
                    <div
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t transition-all group-hover:from-indigo-500 group-hover:to-cyan-300"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Scan Stream */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live Scan Activity
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {scans.length} events
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-1">
            {recentScans.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-8">
                No scans recorded yet. Test an intermediate link to generate live telemetry.
              </div>
            ) : (
              recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-200 truncate">
                      {scan.codeName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                      <span>{scan.deviceType}</span>
                      <span>·</span>
                      <span>{scan.city || scan.country}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {new Date(scan.eventTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Codes Section */}
      <div className="p-5 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Recent Codes</h3>
            <p className="text-xs text-slate-400">
              Click any code to inspect redirect rules, customize, or download high-res assets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('qr')}
              className="text-xs text-slate-400 hover:text-white font-medium px-2 py-1 rounded bg-slate-800/50"
            >
              View All Codes →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                <th className="pb-3 font-medium">Code Name / Type</th>
                <th className="pb-3 font-medium">Intermediate URL</th>
                <th className="pb-3 font-medium">Current Destination</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-right">Scans</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentCodes.map((code) => {
                const intermediate = getIntermediateUrl(code);
                const isCopied = copiedId === code.id;

                return (
                  <tr
                    key={code.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            code.codeType === 'qr'
                              ? 'bg-indigo-500/15 text-indigo-400'
                              : code.codeType === 'nfc'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {code.codeType === 'qr' ? (
                            <QrCode className="w-4 h-4" />
                          ) : code.codeType === 'nfc' ? (
                            <Radio className="w-4 h-4" />
                          ) : (
                            <Barcode className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => onOpenCodeDetail(code)}
                            className="font-medium text-slate-200 hover:text-indigo-400 text-left truncate max-w-xs block"
                          >
                            {code.name}
                          </button>
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                            <span>ID: {code.uniqueId}</span>
                            {code.schedules && code.schedules.length > 0 && (
                              <span className="text-amber-400">· Scheduled</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                        <span className="truncate max-w-[190px]">
                          {intermediate.replace(/^https?:\/\//, '')}
                        </span>
                        <button
                          onClick={() => handleCopy(intermediate, code.id)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          title="Copy intermediate link"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-400 max-w-[220px]">
                        <span className="truncate">{code.destinationUrl}</span>
                        <a
                          href={code.destinationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-300"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onToggleStatus(code.id)}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border transition-all ${
                          code.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : code.status === 'expired'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-slate-700/40 text-slate-400 border-slate-600/50 hover:bg-slate-700/60'
                        }`}
                        title="Click to toggle status"
                      >
                        {code.status.toUpperCase()}
                      </button>
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
                      {code.scanCount}
                    </td>

                    <td className="py-3 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {code.codeType === 'nfc' && (
                          <button
                            onClick={() => onOpenNfcWriter(code.id)}
                            className="px-2 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/40 rounded transition-colors"
                            title="Write to physical NFC tag"
                          >
                            Write NFC
                          </button>
                        )}
                        <button
                          onClick={() => onOpenCodeDetail(code)}
                          className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 rounded transition-colors"
                        >
                          Edit Link
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
