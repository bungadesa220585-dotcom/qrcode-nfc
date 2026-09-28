import React from 'react';
import {
  LayoutDashboard,
  QrCode,
  Radio,
  Smartphone,
  Barcode,
  FolderKanban,
  BarChart3,
  FileSpreadsheet,
  ScanLine,
  Settings,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { UserProfile } from '../types.ts';

export type NavTab =
  | 'dashboard'
  | 'qr'
  | 'nfc'
  | 'nfc-writer'
  | 'barcodes'
  | 'projects'
  | 'analytics'
  | 'bulk'
  | 'scanner'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserProfile;
  activeCodeCounts: { qr: number; nfc: number; barcode: number; total: number };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  activeCodeCounts
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'qr' as NavTab,
      label: 'QR Codes',
      icon: QrCode,
      badge: activeCodeCounts.qr
    },
    {
      id: 'nfc' as NavTab,
      label: 'NFC Tags',
      icon: Radio,
      badge: activeCodeCounts.nfc
    },
    {
      id: 'nfc-writer' as NavTab,
      label: 'Android NFC Writer',
      icon: Smartphone,
      highlight: true
    },
    {
      id: 'barcodes' as NavTab,
      label: 'Barcodes',
      icon: Barcode,
      badge: activeCodeCounts.barcode
    },
    {
      id: 'projects' as NavTab,
      label: 'Projects',
      icon: FolderKanban,
      badge: null
    },
    {
      id: 'analytics' as NavTab,
      label: 'Analytics',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'bulk' as NavTab,
      label: 'Bulk Generator',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'scanner' as NavTab,
      label: 'Scanner & Lookup',
      icon: ScanLine,
      badge: null
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 text-base tracking-tighter">
                LT
              </span>
            </div>
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-white leading-tight">
              LinkTag
            </div>
            <div className="text-[11px] text-slate-400 font-mono tracking-wider">
              DYNAMIC CODE MGR
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive
                      ? 'text-indigo-400'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.highlight ? (
                <span className="text-[10px] font-mono tracking-tight px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Android
                </span>
              ) : item.badge !== null && item.badge !== undefined && item.badge > 0 ? (
                <span className="text-[11px] font-mono tabular-nums text-slate-400 group-hover:text-slate-300">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* NFC Status Banner */}
      <div className="mx-3 mb-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            NFC Engine
          </span>
          <span className="text-[10px] font-mono text-emerald-400">READY</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          NDEF URI writes linked to dynamic redirect endpoints.
        </p>
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">
              {user.name}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {user.email}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
