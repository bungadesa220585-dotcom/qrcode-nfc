import React from 'react';
import { Plus, Search, ScanLine, Smartphone } from 'lucide-react';
import { NavTab } from './Sidebar.tsx';

interface HeaderProps {
  currentTab: NavTab;
  onOpenCreate: (defaultType?: 'qr' | 'nfc' | 'barcode') => void;
  onOpenScanner: () => void;
  onOpenNfcWriter: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenCreate,
  onOpenScanner,
  onOpenNfcWriter,
  searchTerm,
  onSearchChange
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Overview Dashboard';
      case 'qr':
        return 'Dynamic QR Generator & Manager';
      case 'nfc':
        return 'NFC Tag Manager';
      case 'nfc-writer':
        return 'Android NFC Writer & Hardware Verifier';
      case 'barcodes':
        return 'Barcode Generator & Mapping';
      case 'projects':
        return 'Projects & Asset Groups';
      case 'analytics':
        return 'Visit & Scan Analytics';
      case 'bulk':
        return 'Bulk Generator (CSV / Excel)';
      case 'scanner':
        return 'Hardware Scanner & Code Lookup';
      case 'settings':
        return 'Settings & Workspace Configuration';
      default:
        return 'LinkTag Management';
    }
  };

  return (
    <header className="h-16 px-6 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
      {/* Zone 1: Title & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold text-slate-100 tracking-tight truncate">
          {getTabTitle(currentTab)}
        </h1>
        <span className="text-slate-600 hidden sm:inline">/</span>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          v1.0-live
        </span>
      </div>

      {/* Zone 2: Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code name, unique ID (e.g. 839271), or destination URL..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
          />
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
          title="Scan barcode or QR code with camera or manual lookup"
        >
          <ScanLine className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden sm:inline">Lookup / Scan</span>
        </button>

        <button
          onClick={onOpenNfcWriter}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/40 rounded-lg transition-colors whitespace-nowrap"
          title="Open Android NFC Writer Companion"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">NFC Writer</span>
        </button>

        <button
          onClick={() => onOpenCreate()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all whitespace-nowrap active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Code</span>
        </button>
      </div>
    </header>
  );
};
