import React, { useState } from 'react';
import {
  ScanLine,
  X,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Radio,
  Barcode,
  ArrowRight,
  Plus
} from 'lucide-react';
import { CodeItem } from '../types.ts';
import { getIntermediateUrl } from '../lib/codeRender.ts';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  codes: CodeItem[];
  onOpenCodeDetail: (code: CodeItem) => void;
  onRecordScan: (uniqueId: string, codeType: any) => void;
  onQuickCreateBarcode?: (scannedNumber: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  codes,
  onOpenCodeDetail,
  onRecordScan,
  onQuickCreateBarcode
}) => {
  const [inputVal, setInputVal] = useState('');
  const [matchedCode, setMatchedCode] = useState<CodeItem | null>(null);
  const [searched, setSearched] = useState(false);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);

  const handleLookup = (searchString?: string) => {
    const query = (searchString !== undefined ? searchString : inputVal).trim().toLowerCase();
    if (!query) return;

    setSearched(true);
    // Find matching by uniqueId or barcodeNumber or name
    const found = codes.find((c) => {
      if (c.uniqueId.toLowerCase() === query) return true;
      if (c.barcodeNumber && c.barcodeNumber.toLowerCase() === query) return true;
      if (c.uniqueId.toLowerCase().replace(/^(qr-|nfc-|bar-)/, '') === query) return true;
      return false;
    });

    setMatchedCode(found || null);
  };

  const handleSimulateLaserScan = () => {
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSimulatingScan(false);
      // Pick a sample code from database or Arabica Beans EAN-13
      const sample = codes.find((c) => c.barcodeNumber) || codes[0];
      if (sample) {
        const val = sample.barcodeNumber || sample.uniqueId;
        setInputVal(val);
        handleLookup(val);
      }
    }, 1200);
  };

  const handleVisit = (code: CodeItem) => {
    onRecordScan(code.uniqueId, code.codeType);
    const intermediate = getIntermediateUrl(code);
    window.open(intermediate, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Hardware Scanner & Barcode Lookup
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                PRD §4.7 Standard & Dynamic Barcode Matcher
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optical Viewport Graphic */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden text-center space-y-3">
          <div className="h-28 border border-slate-800 rounded-lg relative flex items-center justify-center bg-slate-950">
            {/* Viewfinder corner brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />

            {/* Red Laser scan line */}
            <div
              className={`w-3/4 h-0.5 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,1)] ${
                isSimulatingScan ? 'animate-bounce' : 'opacity-60'
              }`}
            />

            <span className="text-[10px] font-mono text-slate-500 absolute bottom-1">
              OPTICAL LASER SCANNER ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleSimulateLaserScan}
              disabled={isSimulatingScan}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ScanLine className="w-3.5 h-3.5 text-indigo-400" />
              Simulate Barcode Scan
            </button>
          </div>
        </div>

        {/* Manual Barcode / Unique ID Input */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-300">
            Enter Barcode Number or Dynamic ID
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="e.g. 8992753123456 or BAR-109283 or SUMMER26"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => handleLookup()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Lookup
            </button>
          </div>
        </div>

        {/* Match Result Display */}
        {searched && (
          <div className="animate-in fade-in">
            {matchedCode ? (
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        matchedCode.codeType === 'qr'
                          ? 'bg-indigo-500/15 text-indigo-400'
                          : matchedCode.codeType === 'nfc'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {matchedCode.codeType === 'qr' ? (
                        <QrCode className="w-4 h-4" />
                      ) : matchedCode.codeType === 'nfc' ? (
                        <Radio className="w-4 h-4" />
                      ) : (
                        <Barcode className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {matchedCode.name}
                      </h4>
                      <span className="text-[11px] font-mono text-emerald-400">
                        Match Found · ID: {matchedCode.uniqueId}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      matchedCode.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {matchedCode.status.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1.5 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">
                      Target Destination
                    </span>
                    <span className="text-slate-200 break-all font-mono text-[11px]">
                      {matchedCode.destinationUrl}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase block">
                      Intermediate Redirect URL
                    </span>
                    <span className="text-indigo-400 break-all font-mono text-[11px]">
                      {getIntermediateUrl(matchedCode)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCodeDetail(matchedCode);
                    }}
                    className="text-xs text-slate-300 hover:text-white"
                  >
                    Open Details
                  </button>

                  <button
                    onClick={() => handleVisit(matchedCode)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>Test Redirect</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950 rounded-xl border border-rose-500/30 text-xs text-center space-y-2">
                <AlertCircle className="w-5 h-5 text-rose-400 mx-auto" />
                <div className="font-semibold text-rose-300">
                  No matching code found for "{inputVal}"
                </div>
                <p className="text-[11px] text-slate-400">
                  This barcode number is not yet registered in LinkTag. Would you like to map this barcode to a destination URL now?
                </p>
                {onQuickCreateBarcode && (
                  <button
                    onClick={() => {
                      onClose();
                      onQuickCreateBarcode(inputVal);
                    }}
                    className="mt-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Map This Barcode Number
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
