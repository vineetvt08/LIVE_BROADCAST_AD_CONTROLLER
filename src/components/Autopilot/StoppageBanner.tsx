import React, { useState } from 'react';
import { StoppageReason, StoppageState } from '../../engine/autopilot/types';
import { BrandAd } from '../../engine/types';
import {
  AlertOctagon,
  Clock,
  Radio,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface StoppageBannerProps {
  stoppageState: StoppageState;
  availableBrands: BrandAd[];
  onChangeReason: (reason: StoppageReason) => void;
  onDeactivateStoppage: () => void;
}

export const StoppageBanner: React.FC<StoppageBannerProps> = ({
  stoppageState,
  availableBrands,
  onChangeReason,
  onDeactivateStoppage
}) => {
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const formatElapsed = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const allReasons: StoppageReason[] = [
    'Rain',
    'Floodlight failure',
    'Player injury',
    'Crowd/pitch disturbance',
    'Technical fault',
    'Other'
  ];

  return (
    <div className="w-full bg-red-600 text-white shadow-md border-b-2 border-red-700 no-print">
      {/* Main Banner Ribbon */}
      <div className="max-w-[1700px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Prominent Stoppage Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-700/80 border border-red-400 text-white animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wider text-white">
                MATCH PAUSED: {stoppageState.reason.toUpperCase()}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-black/40 text-red-100 border border-red-400">
                MANUAL INFINITY RUNNING
              </span>
              <span className="text-xs font-mono font-bold bg-white text-red-700 px-2 py-0.5 rounded shadow-sm">
                Pod {stoppageState.podCount}
              </span>
            </div>
            <p className="text-xs text-red-100 mt-0.5 flex items-center gap-2">
              <span>Elapsed: <strong className="font-mono text-white text-sm">{formatElapsed(stoppageState.elapsedSeconds)}</strong></span>
              <span>•</span>
              <span>Clock frozen at <strong className="text-white">Over {stoppageState.frozenMatchState?.over}.{stoppageState.frozenMatchState?.ball}</strong></span>
              <span>•</span>
              <span>Next pod is pre-computed in real time</span>
            </p>
          </div>
        </div>

        {/* Center: Change Reason Dropdown & Inventory Drawer */}
        <div className="flex items-center gap-3">
          {/* Reason Selector */}
          <div className="flex items-center gap-1.5 bg-red-700/70 px-2.5 py-1 rounded-lg border border-red-400/80 text-xs">
            <span className="text-red-100 font-semibold text-[11px]">Reason:</span>
            <select
              value={stoppageState.reason}
              onChange={(e) => onChangeReason(e.target.value as StoppageReason)}
              className="bg-white text-slate-900 font-semibold text-xs rounded px-2 py-1 border border-slate-300 focus:outline-none"
              title="Change stoppage reason. Re-filters NEXT pre-computed pod immediately."
            >
              {allReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Remaining Inventory Drawer Toggle */}
          <button
            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
            className="flex items-center gap-1 text-xs font-bold bg-red-700 hover:bg-red-800 text-white px-2.5 py-1.5 rounded-lg border border-red-400/80 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Brand Inventory</span>
            {isInventoryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Right: Deactivate / Resuming Button */}
        <div>
          {stoppageState.isResuming ? (
            <div className="flex items-center gap-2 bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg shadow-md animate-pulse text-xs">
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Resuming after current spot/pod...</span>
            </div>
          ) : (
            <button
              onClick={onDeactivateStoppage}
              className="px-4 py-2 rounded-lg text-xs font-black bg-white text-red-700 hover:bg-slate-100 shadow-md flex items-center gap-2 transition"
              title="Resume broadcast: Current spot/pod completes, 3s slate airs, and match unfreezes"
            >
              <Radio className="w-4 h-4 text-red-600" />
              <span>RESUME MATCH (TURN OFF)</span>
            </button>
          )}
        </div>
      </div>

      {/* Inventory Exhausted Warning Bar if Active */}
      {stoppageState.inventoryExhausted && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 border-t border-amber-600">
          <AlertTriangle className="w-4 h-4 text-slate-950" />
          <span>INVENTORY EXHAUSTED: Commercial quotas reached. Airing Broadcaster House Promos & Public Service Announcements.</span>
        </div>
      )}

      {/* Collapsible Inventory Drawer */}
      {isInventoryOpen && (
        <div className="bg-white text-slate-800 p-4 border-t border-slate-300 max-h-56 overflow-y-auto shadow-inner">
          <div className="max-w-[1700px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>Stoppage Commercial Inventory Allocation</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Caps & quotas apply to avoid flooding)
                </span>
              </h4>
              <span className="text-[11px] font-mono text-slate-600">
                Filler Spots Broadcasted: <strong className="text-red-600 font-bold">{stoppageState.fillerSpotsAired}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
              {availableBrands.map((brand) => {
                const airings = stoppageState.brandAiringsInStoppage[brand.id] || 0;
                const maxCap = Math.max(3, brand.contract.targetAirings);
                const remaining = Math.max(0, maxCap - airings);

                return (
                  <div
                    key={brand.id}
                    className={`p-2 rounded border flex flex-col justify-between text-xs ${
                      remaining === 0
                        ? 'bg-slate-100 border-slate-300 text-slate-400'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate max-w-[100px]">{brand.name}</span>
                      <span className="text-[10px] text-slate-500">{brand.tier[0]}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                      <span>Aired: {airings}</span>
                      <span className={remaining === 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {remaining > 0 ? `${remaining} left` : 'Capped'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
