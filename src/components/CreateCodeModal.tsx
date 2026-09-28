import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Radio,
  Barcode,
  Sparkles,
  Wifi,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  CreditCard,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import {
  BarcodeFormat,
  CodeItem,
  CodeType,
  ProjectItem,
  QrCustomization,
  QrSubType
} from '../types.ts';
import {
  generateQrDataUrl,
  renderBarcodeToCanvas
} from '../lib/codeRender.ts';
import { sanitizeUrl, isValidHttpUrl } from '../lib/safeUrl.ts';

interface CreateCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: CodeType;
  defaultBarcodeNumber?: string;
  projects: ProjectItem[];
  onCreateCode: (
    code: Omit<CodeItem, 'id' | 'createdAt' | 'updatedAt' | 'scanCount'>
  ) => CodeItem;
}

export const CreateCodeModal: React.FC<CreateCodeModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'qr',
  defaultBarcodeNumber = '',
  projects,
  onCreateCode
}) => {
  const [codeType, setCodeType] = useState<CodeType>(defaultType);
  const [subType, setSubType] = useState<QrSubType>('dynamic');
  const [name, setName] = useState('');
  const [uniqueId, setUniqueId] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Barcode specific
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('CODE128');
  const [barcodeNumber, setBarcodeNumber] = useState(defaultBarcodeNumber || '');
  const [isDynamicBarcode, setIsDynamicBarcode] = useState(true);

  // Specialized subtype fields
  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');

  // QR Customization
  const [colorDark, setColorDark] = useState('#0f172a');
  const [colorLight, setColorLight] = useState('#ffffff');
  const [dotStyle, setDotStyle] = useState<'square' | 'dots' | 'rounded'>('rounded');

  // Preview data
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-generate Unique ID if empty
  useEffect(() => {
    if (!uniqueId) {
      const prefix = codeType.toUpperCase();
      const rand = Math.floor(100000 + Math.random() * 900000);
      setUniqueId(`${prefix}-${rand}`);
    }
  }, [codeType]);

  // Update preview
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const prefix = codeType === 'qr' ? 'q' : codeType === 'nfc' ? 'n' : 'b';
    const previewIntermediate = `${origin}/${prefix}/${uniqueId || 'preview'}`;

    if (codeType === 'qr' || codeType === 'nfc') {
      generateQrDataUrl(
        previewIntermediate,
        {
          colorDark,
          colorLight,
          dotStyle,
          eyeFrame: 'rounded'
        },
        220
      ).then((url) => setQrPreviewUrl(url || null));
    } else if (codeType === 'barcode' && barcodeCanvasRef.current) {
      setQrPreviewUrl(null);
      const textToEncode = isDynamicBarcode ? previewIntermediate : barcodeNumber || uniqueId || '12345678';
      renderBarcodeToCanvas(
        barcodeCanvasRef.current,
        textToEncode,
        barcodeFormat
      );
    }
  }, [codeType, uniqueId, colorDark, colorLight, dotStyle, barcodeFormat, barcodeNumber, isDynamicBarcode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let computedDestination = destinationUrl.trim();

    // Assemble specialized destinations
    if (codeType === 'qr') {
      if (subType === 'whatsapp') {
        const cleanPhone = waPhone.replace(/[^0-9]/g, '');
        computedDestination = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;
      } else if (subType === 'wifi') {
        computedDestination = `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};;`;
      } else if (subType === 'vcard') {
        computedDestination = `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      }
    }

    if (!computedDestination) {
      alert('Please specify a destination URL or payload.');
      return;
    }

    onCreateCode({
      userId: 'user_enterprise_1',
      projectId: projectId || undefined,
      uniqueId: uniqueId.trim(),
      name: name.trim(),
      codeType,
      subType,
      destinationUrl: computedDestination,
      barcodeFormat: codeType === 'barcode' ? barcodeFormat : undefined,
      barcodeNumber: codeType === 'barcode' ? (barcodeNumber.trim() || uniqueId.trim()) : undefined,
      isDynamic: codeType === 'barcode' ? isDynamicBarcode : true,
      status: 'active',
      customization: {
        colorDark,
        colorLight,
        dotStyle,
        eyeFrame: 'rounded'
      },
      notes
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Create New Code</h3>
            <p className="text-xs text-slate-400">
              Generate dynamic QR, NFC tags, or barcodes with cloud-managed routing.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Code Type Selector (QR vs NFC vs Barcode) */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setCodeType('qr')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              codeType === 'qr'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-semibold">Dynamic QR</span>
          </button>

          <button
            type="button"
            onClick={() => setCodeType('nfc')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              codeType === 'nfc'
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold">NFC Tag</span>
          </button>

          <button
            type="button"
            onClick={() => setCodeType('barcode')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
              codeType === 'barcode'
                ? 'bg-amber-600/20 border-amber-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Barcode className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-semibold">Barcode</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Code Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Promo, Table 04, Arabica 250g"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Unique ID
                </label>
                <input
                  type="text"
                  required
                  value={uniqueId}
                  onChange={(e) => setUniqueId(e.target.value)}
                  placeholder="e.g. 839271 or SUMMER26"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                  Intermediate URL:{' '}
                  <span className="text-indigo-400">
                    /{codeType === 'qr' ? 'q' : codeType === 'nfc' ? 'n' : 'b'}/{uniqueId || '...'}
                  </span>
                </span>
              </div>

              {/* Sub-type selection for QR Code */}
              {codeType === 'qr' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Payload Category
                  </label>
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value as QrSubType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="dynamic">Dynamic Web URL</option>
                    <option value="whatsapp">WhatsApp Direct Chat</option>
                    <option value="wifi">Wi-Fi Network Access</option>
                    <option value="vcard">vCard Business Contact</option>
                  </select>
                </div>
              )}

              {/* Barcode Format and Dynamic switch */}
              {codeType === 'barcode' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Barcode Symbology
                    </label>
                    <select
                      value={barcodeFormat}
                      onChange={(e) => setBarcodeFormat(e.target.value as BarcodeFormat)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      <option value="CODE128">Code 128 (Standard Alpha-Numeric)</option>
                      <option value="CODE39">Code 39</option>
                      <option value="EAN13">EAN-13 (13 Digits)</option>
                      <option value="EAN8">EAN-8 (8 Digits)</option>
                      <option value="UPC">UPC-A (12 Digits)</option>
                      <option value="ITF">ITF (Interleaved 2 of 5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Physical Barcode Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={barcodeNumber}
                      onChange={(e) => setBarcodeNumber(e.target.value)}
                      placeholder="e.g. 8992753123456"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="dyn_barcode"
                      checked={isDynamicBarcode}
                      onChange={(e) => setIsDynamicBarcode(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <label htmlFor="dyn_barcode" className="text-xs text-slate-300 cursor-pointer">
                      Encode intermediate URL (<code className="text-amber-400 font-mono">/b/{uniqueId}</code>)
                    </label>
                  </div>
                </>
              )}

              {/* Destination URL Input */}
              {subType === 'dynamic' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Destination URL
                  </label>
                  <input
                    type="text"
                    required
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://example.com/target-landing-page"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* WhatsApp specific */}
              {codeType === 'qr' && subType === 'whatsapp' && (
                <div className="space-y-2 p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      WhatsApp Phone (with Country Code)
                    </label>
                    <input
                      type="text"
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      placeholder="6281234567890"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Pre-filled Message
                    </label>
                    <input
                      type="text"
                      value={waMessage}
                      onChange={(e) => setWaMessage(e.target.value)}
                      placeholder="Hello! I would like to inquire about..."
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Wi-Fi specific */}
              {codeType === 'qr' && subType === 'wifi' && (
                <div className="space-y-2 p-3 bg-slate-950/80 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Wi-Fi SSID
                    </label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="Cafe_Guest_Wifi"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Wi-Fi Password
                    </label>
                    <input
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Project assignment */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assign to Project (Optional)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No Project (Unassigned)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Side: Live Visual Preview */}
            <div className="flex flex-col items-center justify-center p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                Real-Time Physical Preview
              </span>

              {codeType === 'qr' || codeType === 'nfc' ? (
                <div className="w-44 h-44 bg-white p-3 rounded-xl flex items-center justify-center shadow-lg">
                  {qrPreviewUrl ? (
                    <img
                      src={qrPreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-200 animate-pulse rounded" />
                  )}
                </div>
              ) : (
                <div className="w-full max-w-[220px] bg-white p-3 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                  <canvas ref={barcodeCanvasRef} className="max-w-full h-auto" />
                </div>
              )}

              <div className="text-center text-[11px] text-slate-400 font-mono">
                Payload: /{codeType === 'qr' ? 'q' : codeType === 'nfc' ? 'n' : 'b'}/{uniqueId || '...'}
              </div>

              {/* Color Customization for QR */}
              {(codeType === 'qr' || codeType === 'nfc') && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Color:</span>
                    <input
                      type="color"
                      value={colorDark}
                      onChange={(e) => setColorDark(e.target.value)}
                      className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
            >
              Generate Code & Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
