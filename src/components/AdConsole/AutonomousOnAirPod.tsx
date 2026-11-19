import React from 'react';
import { ActiveOneShotBreak } from '../../engine/autopilot/types';
import {
  Radio,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Award,
  Zap,
  Tv,
  Mic,
  FastForward,
  PlayCircle,
  FileText
} from 'lucide-react';

interface AutonomousOnAirPodProps {
  activeBreak: ActiveOneShotBreak;
  onSkipHalfTimeSegment?: () => void;
  onSkipHalfTimeToLive?: () => void;
}

export const AutonomousOnAirPod: React.FC<AutonomousOnAirPodProps> = ({
  activeBreak,
  onSkipHalfTimeSegment,
  onSkipHalfTimeToLive
}) => {
  const { type, pod, remainingSeconds, targetDuration, halfTimeState } = activeBreak;
  const progressPercent = Math.max(0, Math.min(100, ((targetDuration - remainingSeconds) / targetDuration) * 100));

  const formatTime = (secs: number) => {
    const totalSecs = Math.max(0, Math.ceil(secs));
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getBreakTitle = () => {
    switch (type) {
      case 'OVER':
        return 'Over Break (60s Transmission)';
      case 'WICKET':
        return 'Wicket Dismissal Break (90s Transmission)';
      case 'STRATEGIC':
        return 'Strategic Commercial Window (300s Transmission)';
      case 'HALF_TIME':
        return 'Innings Break & Half-Time Show (30 mins: 20m Ads + 10m Studio Talk)';
    }
  };

  const currentSegment = halfTimeState
    ? halfTimeState.segments[halfTimeState.currentSegmentIndex - 1]
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6 text-slate-800">
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
                {type === 'HALF_TIME' ? `Segment ${halfTimeState?.currentSegmentIndex || 1}/6` : `Pod ID: ${pod.id}`}
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
              {type === 'HALF_TIME' ? 'Total Half-Time Remaining' : 'Airtime Remaining'}
            </span>
            <span className="text-xl font-mono font-black text-amber-300">
              {formatTime(remainingSeconds)} / {formatTime(targetDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            {type === 'HALF_TIME' ? '30-Minute Broadcast Progress' : 'Transmission Progress'}
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

      {/* SPECIAL HALF-TIME SHOW SEGMENT TRACKER & CONTROLS */}
      {type === 'HALF_TIME' && halfTimeState && (
        <div className="space-y-4 bg-purple-50/60 p-4 rounded-2xl border border-purple-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-200 pb-2">
            <div>
              <div className="text-xs font-black text-purple-950 uppercase tracking-wide flex items-center gap-2">
                <Tv className="w-4 h-4 text-purple-600" />
                <span>30-Minute Half-Time Program Schedule (20m Ads + 10m Studio Analysis)</span>
              </div>
              <p className="text-[11px] text-purple-700 mt-0.5">
                Segment {halfTimeState.currentSegmentIndex} of 6 • Segment Airtime Remaining:{' '}
                <strong className="font-mono">{formatTime(halfTimeState.currentSegmentRemainingSeconds)}</strong>
              </p>
            </div>

            {/* Fast-Forward Controls */}
            <div className="flex items-center gap-2">
              {onSkipHalfTimeSegment && (
                <button
                  type="button"
                  onClick={onSkipHalfTimeSegment}
                  className="px-3 py-1.5 text-xs font-bold bg-white text-purple-800 border border-purple-300 rounded-xl hover:bg-purple-100 transition shadow-xs flex items-center gap-1.5"
                  title="Skip to next half-time segment"
                >
                  <FastForward className="w-3.5 h-3.5 text-purple-600" />
                  <span>Next Segment &gt;&gt;</span>
                </button>
              )}
              {onSkipHalfTimeToLive && (
                <button
                  type="button"
                  onClick={onSkipHalfTimeToLive}
                  className="px-3 py-1.5 text-xs font-bold bg-purple-700 text-white rounded-xl hover:bg-purple-800 transition shadow-xs flex items-center gap-1.5"
                  title="Conclude entire half-time break and begin second innings"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Start 2nd Innings</span>
                </button>
              )}
            </div>
          </div>

          {/* 6 Segments Pill Tracker */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs">
            {halfTimeState.segments.map((seg, idx) => {
              const isCurrent = idx + 1 === halfTimeState.currentSegmentIndex;
              const isDone = idx + 1 < halfTimeState.currentSegmentIndex;
              return (
                <div
                  key={seg.segmentIndex}
                  className={`p-2 rounded-xl border text-[11px] font-bold flex flex-col justify-between gap-1 transition ${
                    isCurrent
                      ? 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {seg.type === 'STUDIO_TALK' ? <Mic className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
                    <span>Seg {seg.segmentIndex}</span>
                  </div>
                  <div className="text-[10px] truncate">{seg.type === 'STUDIO_TALK' ? 'Studio Talk' : 'Ad Pod'}</div>
                  <span className={`text-[9px] uppercase px-1 rounded ${isCurrent ? 'bg-purple-900/40 text-purple-100' : 'text-slate-400'}`}>
                    {isCurrent ? `${formatTime(halfTimeState.currentSegmentRemainingSeconds)}` : isDone ? 'Done ✓' : '5 mins'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RENDER CURRENT VIEW: EITHER LIVE STUDIO TALK OR COMMERCIAL AD POD */}
      {currentSegment?.type === 'STUDIO_TALK' ? (
        /* LIVE STUDIO TALK VIEW */
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/30 text-red-400 border border-red-500/40 animate-pulse">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    🔴 LIVE STUDIO ANALYSIS
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Half-Time Broadcast Panel (5m window)
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  {currentSegment.title}
                </h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Segment Countdown
              </span>
              <span className="text-xl font-mono font-black text-amber-400">
                {formatTime(halfTimeState?.currentSegmentRemainingSeconds || 300)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <FileText className="w-4 h-4" />
                <span>Panel Discussion Focus & Telemetry</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-200">
                {currentSegment.analysisPoints?.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Match Context & Target Telemetry
                </span>
                <div className="text-sm font-bold text-white mt-1">
                  {pod.matchContext.battingTeam} vs {pod.matchContext.bowlingTeam}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  1st Innings Complete: <strong className="text-emerald-400">{pod.matchContext.runs}/{pod.matchContext.wickets}</strong> ({pod.matchContext.over}.{pod.matchContext.ball} overs)
                </p>
                <p className="text-xs text-amber-300 mt-0.5">
                  Target: <strong>{pod.matchContext.runs + 1} runs</strong> required from 50 overs (Req RR: {((pod.matchContext.runs + 1) / 50).toFixed(2)})
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Broadcaster On-Air Feed: Studio Cam 1 & Holographic Pitch Map</span>
                <span className="text-emerald-400 font-bold font-mono">1080p 50fps</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* COMMERCIAL AD POD VIEW */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {type === 'HALF_TIME' ? `${currentSegment?.title || 'Commercial Pod'} (${pod.slots.length} Spots)` : `Autonomous Defensive Slot Placements (${pod.slots.length} Spots)`}
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
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Safe Placement
                    </span>
                    <span className="text-slate-400">Position #{index + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Autonomous Footer Advisory Notice */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            <strong>Defensive Autonomous Engine Active:</strong> Verified zero rival clashes, spot duration entropy (35/50/15 mix), and exact pod duration. The broadcast will automatically advance.
          </span>
        </div>
      </div>
    </div>
  );
};
