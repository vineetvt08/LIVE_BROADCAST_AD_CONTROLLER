import React, { useState } from 'react';
import { AdPod, BrandAd, PodSuggestion } from '../engine/types';
import { generatePodSuggestions } from '../engine/suggestions/suggestionEngine';
import { Sparkles, Check, ShieldCheck } from 'lucide-react';

interface SuggestionsPanelProps {
  currentPod: AdPod;
  previousPod?: AdPod;
  allAiredPodsInInnings: AdPod[];
  allBrands: BrandAd[];
  onApplySuggestion: (suggestion: PodSuggestion) => void;
}

export const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({
  currentPod,
  previousPod,
  allAiredPodsInInnings,
  allBrands,
  onApplySuggestion
}) => {
  const [suggestions, setSuggestions] = useState<PodSuggestion[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isComputing, setIsComputing] = useState(false);

  const handleGenerate = () => {
    setIsComputing(true);
    setTimeout(() => {
      const results = generatePodSuggestions({
        currentPod,
        previousPod,
        allAiredPodsInInnings,
        allBrands,
        maxSuggestions: 3
      });
      setSuggestions(results);
      setHasGenerated(true);
      setIsComputing(false);
    }, 50);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3.5 shadow-sm text-slate-800">
      {/* Header & Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-wide">
              Advisory Suggestion Engine
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Zero-violation permutations scored by commercial value, prime-slot fairness, and diversity
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isComputing}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm transition disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>{isComputing ? 'Solving Branches...' : 'Generate Top 3 Pod Suggestions'}</span>
        </button>
      </div>

      {/* Suggestion Cards */}
      {hasGenerated && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {suggestions.map((s, idx) => (
            <div
              key={s.id}
              className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition ${
                idx === 0
                  ? 'bg-blue-50/50 border-blue-300 shadow-sm'
                  : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-blue-600 font-mono">
                        #{idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 tracking-wide">{s.title}</h4>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> 0 Violations (Clean SLA)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 block">
                      Score: {s.score}
                    </span>
                  </div>
                </div>

                {/* Slots Breakdown */}
                <div className="flex flex-col gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    Proposed Spot Timeline ({s.slots.reduce((acc: number, x) => acc + x.duration, 0)}s)
                  </span>
                  <div className="flex flex-col gap-1">
                    {s.slots.map((slot) => (
                      <div
                        key={slot.slotNumber}
                        className="flex items-center justify-between text-xs py-0.5 border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono text-[10px]">
                            #{slot.slotNumber}
                          </span>
                          <span className="font-bold text-slate-900 truncate max-w-[140px]">
                            {slot.brand.name}
                          </span>
                          <span className="text-[10px] text-blue-600 truncate max-w-[90px] font-medium">
                            ({slot.brand.category})
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 rounded font-bold">
                          {slot.duration}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plain-Language Rationale */}
                <div className="mt-2.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Why Recommended:
                  </span>
                  <ul className="text-[11px] text-slate-600 flex flex-col gap-1 list-disc list-inside">
                    {s.rationale.map((r, rIdx) => (
                      <li key={rIdx} className="leading-tight">{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Apply Action */}
              <button
                onClick={() => onApplySuggestion(s)}
                className="w-full py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to Pod Draft</span>
              </button>
            </div>
          ))}

          {suggestions.length === 0 && (
            <div className="col-span-3 text-center py-6 text-xs text-slate-400 italic">
              No complete zero-violation permutations found for this specific duration configuration.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
