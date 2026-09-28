import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Download,
  Database,
  Globe,
  Radio,
  Save,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { UserProfile, CodeItem } from '../types.ts';
import { downloadBlob } from '../lib/codeRender.ts';

interface SettingsViewProps {
  user: UserProfile;
  codes: CodeItem[];
  onUpdateUser: (user: UserProfile) => void;
  onResetFactoryData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  codes,
  onUpdateUser,
  onResetFactoryData
}) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [company, setCompany] = useState(user.company || '');
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name: name.trim(),
      email: email.trim(),
      company: company.trim()
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportJson = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      user,
      totalCodes: codes.length,
      codes
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json'
    });
    downloadBlob(blob, `linktag_database_backup_${Date.now()}.json`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          Workspace & Account Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage user profile, intermediate URL routing rules, and database export archives.
        </p>
      </div>

      {/* Account Profile Section */}
      <form
        onSubmit={handleSaveProfile}
        className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-400" />
            Administrator Profile
          </h3>
          {saved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Organization / Company
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp, Retail Brand Ltd"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Save Profile
          </button>
        </div>
      </form>

      {/* Intermediate Domain Configuration */}
      <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Intermediate Domain Architecture (PRD §4.2)
          </h3>
          <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
            HTTPS ENFORCED
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Physical codes embed immutable intermediate paths that never change even when destinations are updated:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-indigo-400 uppercase">QR Intermediate</div>
            <div className="text-slate-200 mt-1">/q/{'{unique_id}'}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-emerald-400 uppercase">NFC Intermediate</div>
            <div className="text-slate-200 mt-1">/n/{'{unique_id}'}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-amber-400 uppercase">Barcode Intermediate</div>
            <div className="text-slate-200 mt-1">/b/{'{unique_id}'}</div>
          </div>
        </div>
      </div>

      {/* Database Backup & Disaster Recovery */}
      <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            Database Persistence & Backup (PRD §10)
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {codes.length} Registered Codes
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          LinkTag synchronizes all state with cloud Firestore with real-time failover caching. You can generate an immediate full JSON snapshot of your code mappings and scan histories.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJson}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-indigo-400" /> Export Full JSON Database
          </button>

          <button
            onClick={() => {
              if (confirm('Reset to initial factory sample codes? Your custom edits will be refreshed.')) {
                onResetFactoryData();
              }
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Factory Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
