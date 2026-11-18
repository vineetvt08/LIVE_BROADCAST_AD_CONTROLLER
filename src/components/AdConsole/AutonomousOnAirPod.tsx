import React from 'react';
import { ActiveOneShotBreak } from '../../engine/autopilot/types';
import { Radio, ShieldCheck, Clock, CheckCircle2, Award, Zap, AlertTriangle } from 'lucide-react';

interface AutonomousOnAirPodProps {
  activeBreak: ActiveOneShotBreak;
}

export const AutonomousOnAirPod: React.FC<AutonomousOnAirPodProps> = ({ activeBreak }) => {
  const { type, pod, remainingSeconds, targetDuration } = activeBreak;
  const progressPercent = Math.max(0, Math.min(100, ((targetDuration - remainingSeconds) / targetDuration) * 100));

  const getBreakTitle = () => {
    switch (type) {
      case 'OVER':
        return 'Over Break (60s Transmission)';
      case 'WICKET':
        return 'Wicket Dismissal Break (90s Transmission)';
      case 'STRATEGIC':
        return 'Strategic Commercial Window (300s Transmission)';
      case 'HALF_TIME':
        return 'Half-Time / Innings Break (300s Transmission)';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 text-red-600 border border-red-200 animate-pulse">
            <Radio className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full animate-pulse">
                ON AIR TRANSMISSION
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Pod ID: {pod.id}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              {getBreakTitle()}
            </h2>
          </div>
        </div>

        {/* Real-time Countdown Timer */}
        <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-inner">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Airtime Remaining
            </span>
            <span className="text-xl font-mono font-black text-amber-300">
              {Math.ceil(remainingSeconds)}s / {targetDuration}s
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" /> Transmission Progress
          </span>
          <span className="font-mono font-bold text-slate-800">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Auto-filled Spots Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Autonomous Defensive Slot Placements ({pod.slots.length} Spots)
          </h3>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Zero BLOCK Violations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {pod.slots.map((slot, index) => {
            const brand = slot.brand;
            return (
              <div
                key={slot.slotNumber}
                className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between hover:shadow-sm transition"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                      Slot {slot.slotNumber}
                    </span>
                    <span className="font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {slot.duration}s
                    </span>
                  </div>

                  {brand ? (
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {brand.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold bg-white text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded">
                          {brand.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            brand.tier === 'Gold'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : brand.tier === 'Silver'
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          <Award className="w-2.5 h-2.5" />
                          {brand.tier}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic py-2">Empty Slot</div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Safe Placement
                  </span>
                  <span className="text-slate-400">Position #{index + 1}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Autonomous Footer Advisory Notice */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong>Defensive Autonomous Engine Active:</strong> The algorithm has verified rival exclusivity, derangement rules, and exact pod duration. The match will automatically resume upon timer expiration.
          </span>
        </div>
      </div>
    </div>
  );
};
