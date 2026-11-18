import React from 'react';
import { EndOfMatchReportData } from '../engine/types';
import {
  Download,
  Printer,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  AlertOctagon,
  BarChart3
} from 'lucide-react';

interface EndOfMatchReportProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: EndOfMatchReportData;
}

export const EndOfMatchReport: React.FC<EndOfMatchReportProps> = ({
  isOpen,
  onClose,
  reportData
}) => {
  if (!isOpen) return null;

  const handleExportJson = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(reportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `MCR_Guard_Broadcast_Audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  const stoppages = reportData.stoppageAudits || [];
  const totalStoppageSeconds = reportData.totalStoppageTimeSeconds || 
    stoppages.reduce((sum, s) => sum + s.totalDurationSeconds, 0);

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto text-slate-800">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-5xl w-full p-6 shadow-2xl flex flex-col gap-6 my-auto max-h-[90vh] overflow-y-auto printable-card">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-wide">
                  MCR GUARD — BROADCAST TRANSMISSION & AD AUDIT REPORT
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Certified Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ODI Broadcaster Master-Control Audit • Brand Reputation Safeguard Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition"
              title="Download Raw JSON Log"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition"
              title="Open Browser Print Dialog"
            >
              <Printer className="w-4 h-4" />
              <span>Print Page</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* High-Level Executive Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Total Pods Aired
            </span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">
              {reportData.totalPods}
            </span>
            <span className="text-[10px] text-blue-600 font-semibold">Scheduled & Stoppage Pods</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Total Ads Transmitted
            </span>
            <span className="text-2xl font-black text-emerald-700 font-mono mt-0.5 block">
              {reportData.totalAdsAired}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold">100% Duration Matched</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Violations Prevented
            </span>
            <span className="text-2xl font-black text-blue-700 font-mono mt-0.5 block">
              {reportData.ruleViolationsAvoided}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Adjacency & Rivals Blocked</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Operator Overrides Logged
            </span>
            <span className={`text-2xl font-black font-mono mt-0.5 block ${reportData.overridesMade.length > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
              {reportData.overridesMade.length}
            </span>
            <span className="text-[10px] text-amber-700 font-semibold">Full Written Justifications</span>
          </div>
        </div>

        {/* Match Summary */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
              Match Broadcast Outcome:
            </span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {reportData.matchSummary.team1} vs {reportData.matchSummary.team2}
            </div>
            <p className="text-slate-600 text-xs mt-0.5">
              1st Inn: {reportData.matchSummary.innings1Score} • 2nd Inn: {reportData.matchSummary.innings2Score}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-blue-100 border border-blue-300 font-bold text-blue-900 text-xs">
            {reportData.matchSummary.result}
          </div>
        </div>

        {/* Section 5: Unscheduled Stoppages Section */}
        {stoppages.length > 0 && (
          <div className="bg-red-50/60 rounded-2xl border border-red-200 p-4">
            <div className="flex items-center justify-between border-b border-red-200 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-600" />
                <h3 className="text-sm font-black text-red-950 uppercase tracking-wide">
                  Unscheduled Stoppages (Manual Infinity Audit)
                </h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span>Total Stoppage Time: <strong className="text-slate-900 font-bold">{formatSecs(totalStoppageSeconds)}</strong></span>
                <span>Revenue Equivalent: <strong className="text-emerald-700 font-bold">₹{((totalStoppageSeconds * 500) / 1000).toFixed(1)}k</strong></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-white/80 text-[10px] uppercase font-bold text-slate-600 border-b border-red-200">
                  <tr>
                    <th className="p-2">Reason</th>
                    <th className="p-2">Time Window</th>
                    <th className="p-2">Duration</th>
                    <th className="p-2 text-center">Pods Aired</th>
                    <th className="p-2 text-center">Fillers Airing</th>
                    <th className="p-2">Equivalent Commercial Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100 font-mono text-[11px]">
                  {stoppages.map((s) => (
                    <tr key={s.id} className="hover:bg-red-100/40">
                      <td className="p-2 font-bold font-sans text-red-950">{s.reason}</td>
                      <td className="p-2 text-slate-600">{s.startTime} — {s.endTime}</td>
                      <td className="p-2 text-slate-900 font-bold">{formatSecs(s.totalDurationSeconds)}</td>
                      <td className="p-2 text-center font-bold">{s.podsAiredCount}</td>
                      <td className="p-2 text-center font-bold text-amber-800">{s.fillersUsedCount} spots</td>
                      <td className="p-2 font-sans font-bold text-emerald-700">₹{(s.equivalentAirtimeCommercialValue / 1000).toFixed(1)}k value</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Spot Duration Mix & Ordered Composition Audit */}
        {reportData.durationMixStats && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Spot Duration Mix & Dynamic Pattern Audit
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[10px] uppercase font-bold text-slate-500">Target Mix:</span>
                <span className="font-bold text-blue-700">35% (15s)</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-emerald-700">50% (30s)</span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-purple-700">15% (45s)</span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-blue-800">15s Short Spots</span>
                  <span className="font-mono font-bold text-slate-900">
                    {reportData.durationMixStats.count15} spots ({reportData.durationMixStats.percent15}%)
                  </span>
                </div>
                <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, reportData.durationMixStats.percent15)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Target: 35%</span>
                  <span className={Math.abs(reportData.durationMixStats.percent15 - 35) <= 10 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {Math.abs(reportData.durationMixStats.percent15 - 35) <= 10 ? '✓ Balanced (±10%)' : 'Variance Noted'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-800">30s Standard Spots</span>
                  <span className="font-mono font-bold text-slate-900">
                    {reportData.durationMixStats.count30} spots ({reportData.durationMixStats.percent30}%)
                  </span>
                </div>
                <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, reportData.durationMixStats.percent30)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Target: 50%</span>
                  <span className={Math.abs(reportData.durationMixStats.percent30 - 50) <= 10 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {Math.abs(reportData.durationMixStats.percent30 - 50) <= 10 ? '✓ Balanced (±10%)' : 'Variance Noted'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-800">45s Premium Spots</span>
                  <span className="font-mono font-bold text-slate-900">
                    {reportData.durationMixStats.count45} spots ({reportData.durationMixStats.percent45}%)
                  </span>
                </div>
                <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, reportData.durationMixStats.percent45)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Target: 15%</span>
                  <span className={Math.abs(reportData.durationMixStats.percent45 - 15) <= 10 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {Math.abs(reportData.durationMixStats.percent45 - 15) <= 10 ? '✓ Balanced (±10%)' : 'Variance Noted'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pod Patterns Table */}
            {reportData.durationMixStats.podPatterns && reportData.durationMixStats.podPatterns.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-3 py-2 bg-slate-100 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200 flex justify-between">
                  <span>Aired Pod Patterns (Ordered Compositions)</span>
                  <span>{reportData.durationMixStats.podPatterns.length} Pods Recorded</span>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {reportData.durationMixStats.podPatterns.map((p, idx) => (
                    <div key={idx} className="px-3 py-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-500">{p.podId}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">{p.breakType}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold">
                        {p.pattern.map((dur, didx) => (
                          <span
                            key={didx}
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              dur === 15
                                ? 'bg-blue-100 text-blue-800'
                                : dur === 30
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {dur}s
                          </span>
                        ))}
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-700">{p.duration}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Operator Overrides Audit Trail */}
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-wide uppercase flex items-center gap-2 mb-2">
            <span>Operator Override Audit Trail ({reportData.overridesMade.length})</span>
          </h3>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Pod ID</th>
                    <th className="p-2.5">Slot #</th>
                    <th className="p-2.5">Brand</th>
                    <th className="p-2.5">Bypassed Rule</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Operator's Written Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {reportData.overridesMade.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-100/60">
                      <td className="p-2.5 text-slate-500">{log.timestamp}</td>
                      <td className="p-2.5 font-bold text-slate-900">{log.podId}</td>
                      <td className="p-2.5">#{log.slotNumber}</td>
                      <td className="p-2.5 font-sans font-bold text-blue-700">{log.brandName}</td>
                      <td className="p-2.5 font-sans">{log.ruleName}</td>
                      <td className="p-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold">
                          {log.severity}
                        </span>
                      </td>
                      <td className="p-2.5 font-sans italic text-slate-800">"{log.reason}"</td>
                    </tr>
                  ))}
                  {reportData.overridesMade.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center font-sans text-xs text-emerald-700 font-bold italic">
                        No operator overrides were made. Zero manual rule bypasses throughout broadcast transmission.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Advertiser-Wise Exposure & Reputation Risk Index */}
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-wide uppercase flex items-center gap-2 mb-2">
            <span>Advertiser Exposure & Reputation Risk Index</span>
          </h3>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2.5">Advertiser Brand</th>
                    <th className="p-2.5">Sector</th>
                    <th className="p-2.5">Contract Tier</th>
                    <th className="p-2.5 text-center">Total Spots Aired</th>
                    <th className="p-2.5 text-center">Prime Slots (1 or N)</th>
                    <th className="p-2.5 text-center">Overrides Involved</th>
                    <th className="p-2.5 text-center">Reputation Risk Score</th>
                    <th className="p-2.5">Brand Safety Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {reportData.advertiserScores.map((adv) => {
                    let scoreBadgeColor = 'text-emerald-800 bg-emerald-100 border-emerald-300';
                    if (adv.status === 'Moderate Risk') scoreBadgeColor = 'text-amber-800 bg-amber-100 border-amber-300';
                    else if (adv.status === 'High Risk') scoreBadgeColor = 'text-red-800 bg-red-100 border-red-300';

                    return (
                      <tr key={adv.brandId} className="hover:bg-slate-100/60">
                        <td className="p-2.5 font-sans font-bold text-slate-900">{adv.brandName}</td>
                        <td className="p-2.5 font-sans text-blue-700 font-semibold">{adv.category}</td>
                        <td className="p-2.5 font-sans">
                          <span
                            className={`text-[9px] uppercase font-black px-1.5 py-0.2 rounded border ${
                              adv.tier === 'Gold'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : adv.tier === 'Silver'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}
                          >
                            {adv.tier}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-900">{adv.totalAirings}</td>
                        <td className="p-2.5 text-center text-amber-800 font-bold">{adv.primeSlotCount}</td>
                        <td className="p-2.5 text-center text-slate-600">{adv.overriddenIncidents}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${scoreBadgeColor}`}>
                            {adv.reputationRiskScore} / 100
                          </span>
                        </td>
                        <td className="p-2.5 font-sans">
                          {adv.status === 'Safe' ? (
                            <span className="text-emerald-700 flex items-center gap-1 font-bold text-[10px]">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Pristine Brand Reputation
                            </span>
                          ) : adv.status === 'Moderate Risk' ? (
                            <span className="text-amber-800 flex items-center gap-1 font-bold text-[10px]">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Minor Override Notice
                            </span>
                          ) : (
                            <span className="text-red-700 flex items-center gap-1 font-bold text-[10px]">
                              <XCircle className="w-3.5 h-3.5 text-red-600" /> High Risk Advisory Alert
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
          <div>
            Master Control Room Transmission System • MCR Guard v2.4 • Verification Timestamp: {new Date().toLocaleString()}
          </div>
          <div className="font-bold text-slate-700">
            Broadcaster Signature: <span className="underline decoration-slate-400">MASTER CONTROL OPERATOR (ON-DUTY)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
