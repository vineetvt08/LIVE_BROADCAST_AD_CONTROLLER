import React from 'react';
import { AdPod, PodEvaluation, SpotDuration } from '../../engine/types';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Clock,
  Trash2,
  Lock,
  Unlock,
  Radio,
  Flame
} from 'lucide-react';

interface PodTimelineProps {
  currentPod: AdPod;
  previousPod?: AdPod;
  evaluation: PodEvaluation;
  selectedSlotIndex: number;
  onSelectSlot: (index: number) => void;
  onRemoveSlotBrand: (slotNumber: number) => void;
  onChangeSlotDuration: (slotNumber: number, duration: SpotDuration) => void;
  onAddSlot: (duration?: SpotDuration) => void;
  onDeleteSlot: (slotNumber: number) => void;
  onOpenOverrideModal: (slotNumber: number) => void;
  onGoLive: () => void;
}

export const PodTimeline: React.FC<PodTimelineProps> = ({
  currentPod,
  previousPod,
  evaluation,
  selectedSlotIndex,
  onSelectSlot,
  onRemoveSlotBrand,
  onChangeSlotDuration,
  onAddSlot,
  onDeleteSlot,
  onOpenOverrideModal,
  onGoLive
}) => {
  const durationUsed = currentPod.slots.reduce((sum, s) => sum + s.duration, 0);
  const target = currentPod.targetDuration;
  const durationDiff = target - durationUsed;

  const isExactDuration = durationUsed === target;
  const isOverrun = durationUsed > target;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-4 shadow-sm text-slate-800">
      {/* Pod Header & Match Context Alert */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-wide">{currentPod.id}</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {currentPod.breakType.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Innings {currentPod.innings} • Over {currentPod.overNo}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Duration: <span className="text-slate-900 font-mono font-bold">{target}s</span> • Trigger: {currentPod.matchContext.lastEvent}
            </p>
          </div>
        </div>

        {/* Brand Safety Match Alert (e.g. Wicket Just Fell) */}
        {currentPod.matchContext.wicketJustFell && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold animate-pulse">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>WICKET CONTEXT: Caution against celebratory/high-energy ads</span>
          </div>
        )}

        {/* Go Live Button */}
        <button
          onClick={onGoLive}
          disabled={!evaluation.isValidForAir}
          className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition ${
            evaluation.isValidForAir
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse shadow-red-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          }`}
          title={
            evaluation.isValidForAir
              ? 'Transmit this pod to live television broadcast feed'
              : evaluation.durationUsed !== target
              ? 'Cannot Go Live: Pod duration must sum exactly to break length'
              : 'Cannot Go Live: Resolve or override all BLOCK rule violations first'
          }
        >
          <Radio className="w-4 h-4" />
          <span>GO LIVE ON AIR</span>
        </button>
      </div>

      {/* Duration Bar */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>POD TIMELINE BUDGET:</span>
            <span className={`font-bold ${isExactDuration ? 'text-emerald-700' : isOverrun ? 'text-red-600' : 'text-amber-700'}`}>
              {durationUsed}s / {target}s
            </span>
          </div>
          <div>
            {isExactDuration ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> EXACT BUDGET FIT (0s GAP)
              </span>
            ) : isOverrun ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> OVERRUN BY {durationUsed - target}s (BLOCKED)
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {durationDiff}s REMAINING (BLACK FRAME GAP)
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex border border-slate-300">
          {currentPod.slots.map((slot, idx) => {
            const widthPct = (slot.duration / target) * 100;
            const slotEval = evaluation.slotEvaluations[idx];
            let bgColor = 'bg-blue-600';
            if (!slot.brand) bgColor = 'bg-slate-300 border-r border-slate-400 border-dashed';
            else if (slotEval?.status === 'RED') bgColor = slot.isOverridden ? 'bg-amber-500' : 'bg-red-600';
            else if (slotEval?.status === 'AMBER') bgColor = 'bg-amber-400';
            else bgColor = 'bg-emerald-600';

            return (
              <div
                key={slot.slotNumber}
                style={{ width: `${widthPct}%` }}
                className={`${bgColor} h-full transition-all duration-300 border-r border-white/40 flex items-center justify-center text-[9px] font-mono font-bold text-white overflow-hidden`}
                title={`Slot ${slot.slotNumber}: ${slot.duration}s - ${slot.brand?.name || 'Empty'}`}
              >
                {slot.duration}s
              </div>
            );
          })}
        </div>
      </div>

      {/* Slots in Time Order */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider font-extrabold text-slate-700 flex items-center gap-2">
            <span>Commercial Pod Slots in Broadcast Order</span>
            <span className="text-[10px] text-slate-400 lowercase font-normal">
              (click slot to target for library placement)
            </span>
          </h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddSlot(30)}
              className="text-xs px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold transition"
            >
              + Add Slot (30s)
            </button>
            <button
              onClick={() => onAddSlot(15)}
              className="text-xs px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold transition"
            >
              + 15s
            </button>
          </div>
        </div>

        {/* Slot Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {currentPod.slots.map((slot, index) => {
            const isSelected = selectedSlotIndex === index;
            const slotEval = evaluation.slotEvaluations[index];
            const brand = slot.brand;
            const violations = slotEval?.violations || [];
            const hasBlock = violations.some(v => v.severity === 'BLOCK' && !slot.isOverridden);
            const hasWarn = violations.some(v => v.severity === 'WARN');

            let safetyBg = 'border-slate-200 bg-white hover:border-slate-400';
            let statusPill = (
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                EMPTY SLOT
              </span>
            );

            if (brand) {
              if (hasBlock) {
                safetyBg = 'border-red-300 bg-red-50/50 shadow-sm';
                statusPill = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                    <XCircle className="w-3 h-3 text-red-600" /> BLOCKED
                  </span>
                );
              } else if (hasWarn) {
                safetyBg = 'border-amber-300 bg-amber-50/50 shadow-sm';
                statusPill = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600" /> WARNING
                  </span>
                );
              } else {
                safetyBg = 'border-emerald-300 bg-emerald-50/40 shadow-sm';
                statusPill = (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> SAFE
                  </span>
                );
              }
            }

            return (
              <div
                key={slot.slotNumber}
                onClick={() => onSelectSlot(index)}
                className={`relative rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition cursor-pointer select-none ${safetyBg} ${
                  isSelected ? 'ring-2 ring-blue-600 shadow-md shadow-blue-100' : ''
                }`}
              >
                {/* Slot Top Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-800 text-xs font-black font-mono flex items-center justify-center border border-slate-200">
                      #{slot.slotNumber}
                    </span>
                    {/* Duration badge or selector */}
                    <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
                      {([15, 30, 45] as const).map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeSlotDuration(slot.slotNumber, d);
                          }}
                          className={`px-1.5 py-0.5 text-[10px] font-bold font-mono rounded ${
                            slot.duration === d ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {statusPill}
                </div>

                {/* Brand Details */}
                {brand ? (
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 tracking-tight">{brand.name}</h4>
                          <span
                            className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                              brand.tier === 'Gold'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : brand.tier === 'Silver'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-amber-50 text-amber-900 border-amber-200'
                            }`}
                          >
                            {brand.tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-600 font-bold mt-0.5">{brand.category}</p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSlotBrand(slot.slotNumber);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 transition"
                        title="Remove Brand from Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {brand.tagline && (
                      <p className="text-[10px] text-slate-500 italic mt-1 truncate">
                        "{brand.tagline}"
                      </p>
                    )}

                    {brand.rivalBrandIds.length > 0 && (
                      <div className="text-[9px] text-slate-400 mt-1.5 truncate">
                        Excluded Rivals: {brand.rivalBrandIds.join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200 border-dashed text-center">
                    <p className="text-xs font-bold text-slate-500">Empty Slot #{slot.slotNumber}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click any brand in library to place here</p>
                  </div>
                )}

                {/* Violations List & Harm Explanations */}
                {violations.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1">
                    {violations.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        className={`p-2.5 rounded-xl text-xs border flex flex-col gap-1 ${
                          v.severity === 'BLOCK'
                            ? 'bg-red-50 border-red-200 text-red-900'
                            : v.severity === 'WARN'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-blue-50 border-blue-200 text-blue-900'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span className="flex items-center gap-1">
                            {v.severity === 'BLOCK' ? <XCircle className="w-3.5 h-3.5 text-red-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                            {v.ruleName}
                          </span>
                          <span className="text-[9px] uppercase px-1 py-0.2 rounded font-mono font-bold bg-white/70">
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-[11px] leading-tight text-slate-800">{v.message}</p>
                        <p className="text-[10px] text-slate-600 italic">
                          <strong className="text-slate-800">Commercial Harm:</strong> {v.whyItHarms}
                        </p>
                        <p className="text-[10px] text-slate-600">
                          <strong className="text-blue-700">Fix:</strong> {v.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Override Status or Action */}
                {slot.isOverridden ? (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl px-2.5 py-1 text-[11px] text-amber-800 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-bold">
                      <Unlock className="w-3 h-3 text-amber-700" /> Overridden by Operator
                    </span>
                    <span className="text-[10px] text-slate-500 italic truncate max-w-[120px]">
                      "{slot.overrideReason}"
                    </span>
                  </div>
                ) : (
                  hasBlock && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenOverrideModal(slot.slotNumber);
                      }}
                      className="w-full py-1.5 text-xs font-bold rounded-xl bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 flex items-center justify-center gap-1.5 transition"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Override Rule with Justification</span>
                    </button>
                  )
                )}

                {/* Delete slot button (if more than 1 slot) */}
                {currentPod.slots.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlot(slot.slotNumber);
                    }}
                    className="text-[10px] font-medium text-slate-400 hover:text-red-600 self-end transition"
                  >
                    Remove Slot
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Previous Pod Reference Shelf */}
      {previousPod && (
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="font-bold flex items-center gap-1 text-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Reference: Previous Pod ({previousPod.id} • {previousPod.breakType.replace(/_/g, ' ')})
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Compare current slot positions for Rook & Derangement compliance
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {previousPod.slots.map((s) => (
              <div
                key={s.slotNumber}
                className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1.5 font-mono text-[11px] shadow-xs"
              >
                <span className="text-slate-400 font-bold">Slot #{s.slotNumber}:</span>
                <span className="text-slate-900 font-sans font-bold">{s.brand?.name || 'Empty'}</span>
                <span className="text-blue-600 text-[10px] font-sans">({s.brand?.category})</span>
                <span className="text-slate-400">[{s.duration}s]</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
