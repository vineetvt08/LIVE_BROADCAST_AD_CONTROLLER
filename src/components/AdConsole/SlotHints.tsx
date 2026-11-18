import React, { useMemo } from 'react';
import { AdPod, BrandAd, SpotDuration } from '../../engine/types';
import { evaluateCandidatePlacement } from '../../engine/rules/ruleEngine';
import { ShieldCheck, AlertOctagon } from 'lucide-react';

interface SlotHintsProps {
  currentPod: AdPod;
  previousPod?: AdPod;
  selectedSlotIndex: number;
  availableBrands: BrandAd[];
  onSelectBrand: (brand: BrandAd) => void;
}

export const SlotHints: React.FC<SlotHintsProps> = ({
  currentPod,
  previousPod,
  selectedSlotIndex,
  availableBrands,
  onSelectBrand
}) => {
  const currentSlot = currentPod.slots[selectedSlotIndex];
  const slotDuration: SpotDuration = currentSlot?.duration || 30;

  const evaluatedCandidates = useMemo(() => {
    return availableBrands.map(brand => {
      const evaluation = evaluateCandidatePlacement(
        brand,
        slotDuration,
        selectedSlotIndex,
        currentPod,
        previousPod
      );
      return {
        brand,
        isAllowed: evaluation.isAllowed,
        violations: evaluation.violations
      };
    });
  }, [availableBrands, slotDuration, selectedSlotIndex, currentPod, previousPod]);

  const safeOptions = evaluatedCandidates.filter(c => c.isAllowed && c.violations.length === 0);
  const blockedOptions = evaluatedCandidates.filter(c => !c.isAllowed);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2.5 text-slate-800">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black text-slate-900 tracking-wide">
            Live Slot #{selectedSlotIndex + 1} Compatibility Advisory
          </h4>
        </div>
        <span className="text-[11px] text-slate-500 font-mono font-bold">
          Duration: {slotDuration}s
        </span>
      </div>

      {/* Safe recommendations chips */}
      <div>
        <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block mb-1">
          ✓ Clean Safe Options ({safeOptions.length})
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {safeOptions.slice(0, 14).map(({ brand }) => (
            <button
              key={brand.id}
              onClick={() => onSelectBrand(brand)}
              className="text-xs px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-semibold transition"
              title={`Place ${brand.name} (${brand.category}) in Slot #${selectedSlotIndex + 1} without violations`}
            >
              <span>{brand.name}</span>
              <span className="text-[9px] text-emerald-600">({brand.category})</span>
            </button>
          ))}
          {safeOptions.length === 0 && (
            <p className="text-[11px] text-slate-500 italic">No completely clean candidates for this slot.</p>
          )}
        </div>
      </div>

      {/* Blocked or Clashing Options */}
      {blockedOptions.length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" />
              Restricted / Clashing Brands (Hover for Rule Violation)
            </span>
            <span className="text-[10px] text-slate-500">{blockedOptions.length} blocked</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {blockedOptions.slice(0, 10).map(({ brand, violations }) => (
              <div
                key={brand.id}
                className="group relative inline-block"
              >
                <button
                  type="button"
                  onClick={() => onSelectBrand(brand)}
                  className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 border border-slate-200 line-through opacity-70 hover:opacity-100 transition cursor-help font-medium"
                >
                  {brand.name}
                </button>

                {/* Hover Reason Tooltip */}
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-30 w-64 p-2.5 bg-slate-900 border border-red-500 rounded-xl shadow-2xl text-[11px] text-slate-100">
                  <div className="font-bold text-red-400 text-[10px] uppercase mb-0.5">
                    Violation Hazard:
                  </div>
                  {violations.map((v, i) => (
                    <div key={i} className="mb-1 last:mb-0">
                      <p className="font-bold text-white">{v.ruleName}</p>
                      <p className="text-slate-300 text-[10px]">{v.message}</p>
                      <p className="text-slate-400 italic text-[9px] mt-0.5">Harm: {v.whyItHarms}</p>
                    </div>
                  ))}
                  <div className="mt-1 text-[9px] text-amber-300 font-mono">
                    Clicking will place with BLOCK (Requires Override)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
