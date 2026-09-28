import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  AlertTriangle,
  Clock,
  Radio,
  QrCode,
  Barcode,
  CheckCircle2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { store } from '../lib/store.ts';
import { CodeItem } from '../types.ts';
import { isValidHttpUrl } from '../lib/safeUrl.ts';

interface PublicRedirectLandingProps {
  type: 'qr' | 'nfc' | 'barcode';
  uniqueId: string;
}

export const PublicRedirectLanding: React.FC<PublicRedirectLandingProps> = ({
  type,
  uniqueId
}) => {
  const [code, setCode] = useState<CodeItem | null>(null);
  const [status, setStatus] = useState<
    'evaluating' | 'redirecting' | 'disabled' | 'expired' | 'unsafe' | 'not_found'
  >('evaluating');
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduleName, setScheduleName] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(1);

  useEffect(() => {
    const found = store.findCodeByUniqueId(uniqueId, type);

    if (!found) {
      setStatus('not_found');
      return;
    }

    setCode(found);

    // Check expiration
    if (found.expiresAt) {
      const exp = new Date(found.expiresAt).getTime();
      if (Date.now() > exp) {
        setStatus('expired');
        return;
      }
    }

    // Check status
    if (found.status === 'disabled') {
      setStatus('disabled');
      return;
    }
    if (found.status === 'expired') {
      setStatus('expired');
      return;
    }

    // Determine active destination considering scheduled links
    const { url, isScheduled: sched, scheduleName: sName } = store.getActiveDestination(found);
    setIsScheduled(sched);
    if (sName) setScheduleName(sName);

    // Validate safe URL
    if (!isValidHttpUrl(url)) {
      setStatus('unsafe');
      setTargetUrl(url);
      return;
    }

    setTargetUrl(url);
    setStatus('redirecting');

    // Record scan telemetry
    store.recordScan(found.uniqueId, found.codeType, {
      userAgent: navigator.userAgent,
      deviceType: window.innerWidth < 768 ? 'Mobile' : 'Desktop',
      browser: navigator.userAgent.includes('Chrome')
        ? 'Chrome'
        : navigator.userAgent.includes('Safari')
        ? 'Safari'
        : 'Browser',
      os: navigator.userAgent.includes('Android')
        ? 'Android'
        : navigator.userAgent.includes('iPhone')
        ? 'iOS'
        : 'Desktop OS'
    });

    // Execute redirect after quick countdown
    const timer = setTimeout(() => {
      window.location.href = url;
    }, 1200);

    return () => clearTimeout(timer);
  }, [type, uniqueId]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-xs">
            LT
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            LinkTag Redirect Engine
          </span>
        </div>

        {/* State Viewport */}
        {status === 'evaluating' && (
          <div className="space-y-3 py-6">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
            <div className="text-sm font-medium text-slate-300">
              Resolving dynamic intermediate link...
            </div>
            <div className="text-xs font-mono text-slate-400">
              /{type}/{uniqueId}
            </div>
          </div>
        )}

        {status === 'redirecting' && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Redirecting you...
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Routing from intermediate ID <span className="font-mono text-indigo-400">{uniqueId}</span> to active destination.
              </p>
            </div>

            {isScheduled && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-medium">
                Scheduled campaign active: {scheduleName}
              </div>
            )}

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 break-all text-left">
              <div className="text-[10px] text-slate-500 uppercase">Target URL</div>
              <div className="text-emerald-400 mt-0.5">{targetUrl}</div>
            </div>

            <div className="pt-2">
              <a
                href={targetUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all"
              >
                <span>Click if not redirected</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {status === 'disabled' && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Link Inactive
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The owner has temporarily disabled this link (<span className="font-mono text-slate-300">{uniqueId}</span>). It will not redirect until re-activated in the LinkTag dashboard.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
              Status: <span className="text-slate-300 font-mono">DISABLED</span>
            </div>
          </div>
        )}

        {status === 'expired' && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Campaign Expired
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                This promotional link has reached its scheduled expiration date.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
              Status: <span className="text-rose-400 font-mono">EXPIRED</span>
            </div>
          </div>
        )}

        {status === 'unsafe' && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Unsafe Destination Blocked
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                The configured destination URL does not use a verified http or https scheme.
              </p>
            </div>
          </div>
        )}

        {status === 'not_found' && (
          <div className="space-y-4 py-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Code ID Not Found
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                No active record was found matching unique ID <span className="font-mono text-slate-300">"{uniqueId}"</span>.
              </p>
            </div>

            <a
              href="/"
              className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg"
            >
              Go to LinkTag Dashboard
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 font-mono">
          PROTECTED BY LINKTAG DYNAMIC ROUTING ENGINE
        </div>
      </div>
    </div>
  );
};
