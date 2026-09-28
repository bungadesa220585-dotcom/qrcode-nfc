import React, { useState } from 'react';
import {
  BarChart3,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Compass,
  Calendar,
  Eye,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { CodeItem, ScanEvent } from '../types.ts';

interface AnalyticsViewProps {
  scans: ScanEvent[];
  codes: CodeItem[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ scans, codes }) => {
  const [selectedCodeFilter, setSelectedCodeFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  // Filter scans by code
  const filteredScans = scans.filter((s) => {
    if (selectedCodeFilter !== 'all' && s.codeId !== selectedCodeFilter) {
      return false;
    }
    // Filter by time range
    if (timeRange === '7d') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      return new Date(s.eventTime) >= sevenDaysAgo;
    }
    if (timeRange === '30d') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      return new Date(s.eventTime) >= thirtyDaysAgo;
    }
    return true;
  });

  const totalVisits = filteredScans.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const scansToday = filteredScans.filter((s) => s.eventTime.startsWith(todayStr)).length;

  // Device Breakdown
  const deviceCounts = filteredScans.reduce<Record<string, number>>((acc, s) => {
    acc[s.deviceType] = (acc[s.deviceType] || 0) + 1;
    return acc;
  }, {});

  const mobilePct = totalVisits > 0 ? Math.round(((deviceCounts['Mobile'] || 0) / totalVisits) * 100) : 0;
  const desktopPct = totalVisits > 0 ? Math.round(((deviceCounts['Desktop'] || 0) / totalVisits) * 100) : 0;
  const tabletPct = totalVisits > 0 ? Math.round(((deviceCounts['Tablet'] || 0) / totalVisits) * 100) : 0;

  // Browser Breakdown
  const browserCounts = filteredScans.reduce<Record<string, number>>((acc, s) => {
    acc[s.browser] = (acc[s.browser] || 0) + 1;
    return acc;
  }, {});
  const topBrowsers = Object.entries(browserCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // OS Breakdown
  const osCounts = filteredScans.reduce<Record<string, number>>((acc, s) => {
    acc[s.os] = (acc[s.os] || 0) + 1;
    return acc;
  }, {});
  const topOS = Object.entries(osCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Geo / City breakdown
  const cityCounts = filteredScans.reduce<Record<string, number>>((acc, s) => {
    const loc = s.city ? `${s.city}, ${s.country}` : s.country || 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});
  const topLocations = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Daily distribution for the chart
  const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 14 : 7;
  const dailySeries = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - i));
    const dayStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const count = filteredScans.filter((s) => s.eventTime.startsWith(dayStr)).length;
    return { dayStr, label, count };
  });

  const maxDaily = Math.max(...dailySeries.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Intermediate Scan Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Real-time telemetry captured by the intermediate redirect engine before handoff to destination links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            {(['7d', '30d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  timeRange === r
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Filter by code */}
          <select
            value={selectedCodeFilter}
            onChange={(e) => setSelectedCodeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 max-w-[200px]"
          >
            <option value="all">All Codes Combined</option>
            {codes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.uniqueId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Filtered Visits</span>
            <Eye className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {totalVisits}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Redirect hits recorded
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Visits Today</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {scansToday}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Past 24-hour traffic
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Mobile Share</span>
            <Smartphone className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {mobilePct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Smartphone camera / NFC taps
          </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Desktop & Tablets</span>
            <Monitor className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {desktopPct + tabletPct}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Secondary scan & kiosk access
          </div>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="p-5 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Visit Volume Over Time</h3>
            <p className="text-xs text-slate-400">
              Aggregated daily scan events across active intermediate endpoints
            </p>
          </div>
        </div>

        <div className="h-56 flex items-end gap-2 pt-6 pb-2">
          {dailySeries.map((item) => {
            const heightPct = Math.round((item.count / maxDaily) * 100);
            return (
              <div
                key={item.dayStr}
                className="flex-1 flex flex-col items-center gap-2 group min-w-0"
              >
                <span className="text-[10px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </span>
                <div className="w-full bg-slate-800 rounded-t h-40 relative flex items-end">
                  <div
                    style={{ height: `${Math.max(6, heightPct)}%` }}
                    className="w-full bg-gradient-to-t from-indigo-600 via-indigo-500 to-cyan-400 rounded-t transition-all group-hover:brightness-125"
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-400 truncate max-w-full">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device, Browser, and Geo Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Device Form Factor
          </h3>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1 text-slate-300">
                <span>Mobile (Phone)</span>
                <span className="font-mono">{deviceCounts['Mobile'] || 0} ({mobilePct}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: `${mobilePct}%` }} className="h-full bg-emerald-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1 text-slate-300">
                <span>Desktop (PC / Mac)</span>
                <span className="font-mono">{deviceCounts['Desktop'] || 0} ({desktopPct}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: `${desktopPct}%` }} className="h-full bg-indigo-500" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1 text-slate-300">
                <span>Tablet (iPad / Android)</span>
                <span className="font-mono">{deviceCounts['Tablet'] || 0} ({tabletPct}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div style={{ width: `${tabletPct}%` }} className="h-full bg-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Browser & OS */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            Browsers & Platforms
          </h3>

          <div className="space-y-2 text-xs">
            {topBrowsers.map(([browser, count]) => {
              const pct = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
              return (
                <div key={browser} className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-300">{browser}</span>
                  <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1.5">
              Operating Systems
            </span>
            <div className="flex flex-wrap gap-1.5">
              {topOS.map(([os, count]) => (
                <span
                  key={os}
                  className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700"
                >
                  {os}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Estimated Regional Traffic
          </h3>

          <div className="space-y-2 text-xs">
            {topLocations.map(([location, count]) => {
              const pct = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
              return (
                <div key={location} className="flex items-center justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-300 truncate max-w-[170px]">{location}</span>
                  <span className="font-mono text-slate-400">{count} scans ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Privacy Rigor Banner (PRD Section 4.9 & 10) */}
      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Zero-PII Privacy Protection:</strong>{' '}
          In compliance with PRD §4.9, LinkTag does not claim false unique scan counts or store invasive personal tracking identifiers. IP addresses are hashed using non-reversible salts for visit rate telemetry only.
        </div>
      </div>
    </div>
  );
};
