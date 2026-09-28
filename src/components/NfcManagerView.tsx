import React, { useState } from 'react';
import {
  Radio,
  Plus,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { CodeItem, NfcWriteRecord, ProjectItem } from '../types.ts';
import { getIntermediateUrl } from '../lib/codeRender.ts';
import { sanitizeUrl } from '../lib/safeUrl.ts';

interface NfcManagerViewProps {
  codes: CodeItem[];
  projects: ProjectItem[];
  nfcWrites: NfcWriteRecord[];
  onOpenCreate: (defaultType?: 'nfc') => void;
  onOpenCodeDetail: (code: CodeItem) => void;
  onOpenNfcWriter: (codeId?: string) => void;
  onToggleStatus: (codeId: string) => void;
  onDeleteCode: (codeId: string) => void;
  onUpdateDestination: (codeId: string, newUrl: string) => void;
}

export const NfcManagerView: React.FC<NfcManagerViewProps> = ({
  codes,
  projects,
  nfcWrites,
  onOpenCreate,
  onOpenCodeDetail,
  onOpenNfcWriter,
  onToggleStatus,
  onDeleteCode,
  onUpdateDestination
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tags' | 'history'>('tags');

  // Quick edit state
  const [quickEditCode, setQuickEditCode] = useState<CodeItem | null>(null);
  const [quickEditUrl, setQuickEditUrl] = useState('');

  const nfcCodes = codes.filter((c) => c.codeType === 'nfc');

  const filtered = nfcCodes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.uniqueId.toLowerCase().includes(search.toLowerCase()) ||
      c.destinationUrl.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400" />
            NFC Tag Manager
          </h2>
          <p className="text-xs text-slate-400">
            Store unique NFC IDs and program hardware NDEF tags with intermediate links{' '}
            <code className="text-emerald-300 font-mono">/n/{'{unique_id}'}</code>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onOpenNfcWriter()}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold rounded-lg border border-emerald-700/50 shadow-sm transition-all"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Launch NFC Writer
          </button>

          <button
            onClick={() => onOpenCreate('nfc')}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            New NFC Tag
          </button>
        </div>
      </div>

      {/* Tabs: Tags List vs Write Audit Trail */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tags')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'tags'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            NFC Tags ({nfcCodes.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Write Audit Logs ({nfcWrites.length})
          </button>
        </div>

        {activeTab === 'tags' && (
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search NFC tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'tags' ? (
        filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 rounded-xl border border-slate-800">
            <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-200">No NFC tags found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Register an NFC tag with a unique ID and write the intermediate NDEF payload using the Android NFC Writer.
            </p>
            <button
              onClick={() => onOpenCreate('nfc')}
              className="mt-4 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Register NFC Tag
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((code) => {
              const intermediate = getIntermediateUrl(code);
              const isCopied = copiedId === code.id;
              const project = projects.find((p) => p.id === code.projectId);
              const lastWrite = nfcWrites.find((w) => w.codeId === code.id);

              return (
                <div
                  key={code.id}
                  className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all group"
                >
                  <div>
                    {/* Header: Tag title, ID and status */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-100 truncate block">
                            {code.name}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 mt-0.5 flex items-center gap-2">
                          <span>NFC ID: {code.uniqueId}</span>
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
                            : 'bg-slate-700/40 text-slate-400 border-slate-600/50 hover:bg-slate-700/60'
                        }`}
                      >
                        {code.status.toUpperCase()}
                      </button>
                    </div>

                    {/* Hardware Card Simulation Preview */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800/80 mb-4 relative overflow-hidden">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-2">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <Cpu className="w-3.5 h-3.5" />
                          NTAG213 / NTAG215
                        </span>
                        <span>NDEF URI RECORD</span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-mono">
                            Written NDEF Payload (Intermediate)
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-xs text-emerald-300">
                            <span className="truncate">{intermediate}</span>
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
                            <span>Dynamic Target (Cloud Redirect)</span>
                            <button
                              onClick={() => openQuickEdit(code)}
                              className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-0.5"
                            >
                              <Edit2 className="w-2.5 h-2.5" /> Change
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-300">
                            <span className="truncate max-w-[210px]">
                              {code.destinationUrl}
                            </span>
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

                    {/* Hardware write verification status */}
                    <div className="text-xs text-slate-400 pb-3 border-b border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck
                          className={`w-3.5 h-3.5 ${
                            lastWrite && lastWrite.verificationStatus === 'verified'
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        />
                        <span className="text-[11px]">
                          {lastWrite
                            ? `Verified ${new Date(lastWrite.writtenAt).toLocaleDateString()}`
                            : 'Pending Physical Write'}
                        </span>
                      </div>
                      <span className="font-mono tabular-nums text-slate-200">
                        {code.scanCount} taps
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 flex items-center justify-between">
                    <button
                      onClick={() => onOpenNfcWriter(code.id)}
                      className="px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      Write NFC Tag
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenCodeDetail(code)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onDeleteCode(code.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                        title="Delete tag record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Audit Trail Table */
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                NFC Write & Verification History
              </h3>
              <p className="text-xs text-slate-400">
                Audit trail of physical NDEF write operations executed via Android NFC Writer
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="pb-3 font-medium">Tag Name / ID</th>
                  <th className="pb-3 font-medium">Device Info</th>
                  <th className="pb-3 font-medium">Written NDEF Payload</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-center">Verification</th>
                  <th className="pb-3 font-medium text-right">Written At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {nfcWrites.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No NFC write logs recorded yet. Use the Android NFC Writer to program a tag.
                    </td>
                  </tr>
                ) : (
                  nfcWrites.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/40">
                      <td className="py-3 pr-3 font-medium text-slate-200">
                        <div>{w.codeName}</div>
                        <div className="text-[10px] font-mono text-emerald-400">{w.uniqueId}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                        {w.deviceInfo}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                        {w.writtenPayload}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            w.writeStatus === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {w.writeStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            w.verificationStatus === 'verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {w.verificationStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right font-mono text-slate-400 text-[11px]">
                        {new Date(w.writtenAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Edit Target Destination Modal */}
      {quickEditCode && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-white">
                Change NFC Destination Link
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You do <span className="text-emerald-400 font-semibold">NOT</span> need to touch or re-program the physical NFC tag! Subsequent taps automatically redirect to the new URL.
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
                  placeholder="https://example.com/new-target"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>
                  Physical Tag NDEF:{' '}
                  <span className="text-emerald-400 font-mono">
                    {getIntermediateUrl(quickEditCode)}
                  </span>
                </div>
                <div>Status: Tag stays intact; cloud routing redirects immediately.</div>
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
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
                >
                  Update Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
