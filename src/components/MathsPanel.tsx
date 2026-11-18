import React, { useState, useMemo } from 'react';
import { AdPod, BrandAd, SpotDuration } from '../engine/types';
import {
  disjointPairsPIE,
  computeRookPolynomial,
  derangementCount
} from '../engine/math/combinatorics';
import { countValidCompletions } from '../engine/math/completionCounter';
import { MixTally, INITIAL_MIX_TALLY, isValidPattern } from '../engine/patternEngine';
import { Calculator, ChevronDown, ChevronUp, Grid, Shuffle, Compass, Shield, BarChart3, CheckCircle, AlertTriangle } from 'lucide-react';

interface MathsPanelProps {
  currentPod: AdPod;
  previousPod?: AdPod;
  availableBrands: BrandAd[];
  mixTally?: MixTally;
}

export const MathsPanel: React.FC<MathsPanelProps> = ({
  currentPod,
  previousPod,
  availableBrands,
  mixTally = INITIAL_MIX_TALLY
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 1. Live counter: N valid completions remain for this pod
  const remainingCompletions = useMemo(() => {
    return countValidCompletions(currentPod, availableBrands);
  }, [currentPod, availableBrands]);

  // 2. Principle of Inclusion-Exclusion (PIE) for current slot count
  const nSlots = currentPod.slots.length;
  const mPairs = Math.min(2, Math.floor(nSlots / 2));
  const pieResult = useMemo(() => {
    return disjointPairsPIE(nSlots, mPairs);
  }, [nSlots, mPairs]);

  // 3. Rook Polynomial for Cross-Pod Forbidden Board
  const rookResult = useMemo(() => {
    if (!previousPod || previousPod.slots.length === 0) {
      const b = Array.from({ length: nSlots }, (_, r) =>
        Array.from({ length: nSlots }, (_, c) => (r === c ? 1 : 0))
      );
      return computeRookPolynomial(b);
    }

    const prevCats = previousPod.slots.map((s: any) => s.brand?.category);
    const currCats = currentPod.slots.map((s: any) => s.brand?.category);

    const b = Array.from({ length: nSlots }, (_, r) => {
      return Array.from({ length: nSlots }, (_, c) => {
        const prevCat = prevCats[r];
        const currCat = currCats[c];
        return prevCat && currCat && prevCat === currCat ? 1 : 0;
      });
    });

    return computeRookPolynomial(b);
  }, [currentPod, previousPod, nSlots]);

  // 4. Derangements !n
  const derangements = useMemo(() => {
    return derangementCount(nSlots);
  }, [nSlots]);

  // Current pod spot durations pattern
  const currentPattern: SpotDuration[] = useMemo(() => {
    return currentPod.slots.map(s => s.duration);
  }, [currentPod]);

  const prevPattern: SpotDuration[] | undefined = useMemo(() => {
    return previousPod?.slots.map(s => s.duration);
  }, [previousPod]);

  // Pattern validity checks
  const distinctLengthsCount = new Set(currentPattern).size;
  const hasMinDistinct = currentPattern.length <= 1 || distinctLengthsCount >= 2;
  
  let maxRun = 0;
  let curRun = 0;
  let lastDur: number | null = null;
  for (const d of currentPattern) {
    if (d === lastDur) {
      curRun++;
    } else {
      curRun = 1;
      lastDur = d;
    }
    if (curRun > maxRun) maxRun = curRun;
  }
  const hasValidRunLength = maxRun <= 2;
  const patternValid = isValidPattern(currentPattern, prevPattern);

  // Mix percentages
  const pct15 = mixTally.totalSpots > 0 ? Math.round((mixTally.count15 / mixTally.totalSpots) * 100) : 0;
  const pct30 = mixTally.totalSpots > 0 ? Math.round((mixTally.count30 / mixTally.totalSpots) * 100) : 0;
  const pct45 = mixTally.totalSpots > 0 ? Math.round((mixTally.count45 / mixTally.totalSpots) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 text-slate-800">
      {/* Top Banner & Live Completion Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-wide group-hover:text-blue-700 transition">
                Defensive Combinatorics & Graph Theory Engine
              </h3>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                PIE • Rook Board • !n • 35/50/15 Mix
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Rigorous verification of non-clashing broadcast permutations & dynamic spot-duration entropy
            </p>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 ml-2" /> : <ChevronDown className="w-4 h-4 text-slate-400 ml-2" />}
        </button>

        {/* Live Completion Counter Pill */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-inner">
          <Compass className="w-4 h-4 text-indigo-600 animate-pulse" />
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
              Live Pod Completion Space
            </div>
            <div className="text-sm font-mono font-black text-emerald-700">
              {remainingCompletions.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-slate-600">valid completions remain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Math Details */}
      {isOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          {/* Card 1: Inclusion-Exclusion for Disjoint Rival Pairs */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <Shuffle className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  1. Inclusion-Exclusion (PIE)
                </h4>
              </div>
              <p className="text-[11px] text-slate-600">
                Permutations of {nSlots} slots avoiding {mPairs} disjoint rival pair adjacencies:
              </p>

              {/* Formula Display */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-indigo-900 my-2 overflow-x-auto text-center font-bold">
                N = ∑ (-1)^k C({mPairs},k) 2^k ({nSlots}-k)!
              </div>

              {/* Step-by-step Term Breakdown */}
              <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-700">
                {pieResult.terms.map((t) => (
                  <div key={t.k} className="flex justify-between items-center py-0.5 border-b border-slate-200 last:border-b-0">
                    <span>
                      k={t.k}: {t.sign > 0 ? '+' : '-'} C({mPairs},{t.k}) × 2^{t.k} × {t.fact}
                    </span>
                    <span className="font-bold text-slate-900">{t.termValue}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg text-xs font-mono text-emerald-700 font-bold flex justify-between border border-slate-200">
              <span>Valid Orderings:</span>
              <span>{pieResult.count}</span>
            </div>
          </div>

          {/* Card 2: Rook Polynomial of Cross-Pod Forbidden Board */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Grid className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  2. Cross-Pod Rook Polynomial
                </h4>
              </div>
              <p className="text-[11px] text-slate-600">
                Non-attacking rooks on forbidden cells (Row = Prev Pod, Col = Curr Pod):
              </p>

              {/* Formula Display */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-blue-900 my-2 overflow-x-auto text-center font-bold">
                N(B) = ∑ (-1)^k r_k ({nSlots}-k)!
              </div>

              {/* Rook Coefficients */}
              <div className="text-[11px] font-mono text-slate-700 flex flex-col gap-1">
                <div className="text-[10px] text-slate-500 font-sans">
                  Rook coefficients r_k:
                </div>
                <div className="flex flex-wrap gap-1.5 my-1">
                  {rookResult.coefficients.map((rk, k) => (
                    <span key={k} className="px-1.5 py-0.5 rounded bg-white text-[10px] border border-slate-300 font-bold">
                      r_{k} = {rk}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic">
                  Poly: <code className="text-blue-700 font-bold">{rookResult.polynomialLatex}</code>
                </p>
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg text-xs font-mono text-emerald-700 font-bold flex justify-between border border-slate-200">
              <span>Rook Permutations:</span>
              <span>{rookResult.validPermutations}</span>
            </div>
          </div>

          {/* Card 3: Derangements !n for Slot Rotations */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <Shield className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  3. Derangements !n (Zero Fixed Points)
                </h4>
              </div>
              <p className="text-[11px] text-slate-600">
                Permutations where no brand repeats in the exact same slot index:
              </p>

              {/* Formula Display */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-purple-900 my-2 overflow-x-auto text-center font-bold">
                !{nSlots} = [ {nSlots}! / e ] = {derangements}
              </div>

              {/* Table of Derangements */}
              <div className="text-[11px] font-mono text-slate-700">
                <span className="text-[10px] text-slate-500 font-sans block mb-1">
                  Subfactorial sequence:
                </span>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <div className="bg-white p-1 rounded border border-slate-200 font-bold">!1 = 0</div>
                  <div className="bg-white p-1 rounded border border-slate-200 font-bold">!2 = 1</div>
                  <div className="bg-white p-1 rounded border border-slate-200 font-bold">!3 = 2</div>
                  <div className="bg-white p-1 rounded border border-slate-200 font-bold">!4 = 9</div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center text-[10px] mt-1">
                  <div className="bg-white p-1 rounded border border-slate-200 font-bold">!5 = 44</div>
                  <div className="bg-white p-1 rounded border border-slate-200 font-bold">!6 = 265</div>
                  <div className="bg-white p-1 rounded border border-slate-200 font-bold">!7 = 1854</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg text-xs font-mono text-emerald-700 font-bold flex justify-between border border-slate-200">
              <span>Derangements !{nSlots}:</span>
              <span>{derangements}</span>
            </div>
          </div>

          {/* Card 4: Spot Duration Mix (35% x 15s, 50% x 30s, 15% x 45s) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2 text-amber-700 mb-1">
                <BarChart3 className="w-4 h-4" />
                <h4 className="text-xs font-black uppercase tracking-wider">
                  4. Spot Duration Mix & Entropy
                </h4>
              </div>
              <p className="text-[11px] text-slate-600">
                Ordered composition solver targeting 35% 15s • 50% 30s • 15% 45s:
              </p>

              {/* Current Pod Pattern Display */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs my-2 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                  <span>Current Pattern</span>
                  <span className="font-mono text-amber-800">{currentPod.targetDuration}s</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-slate-900">
                  {currentPattern.length > 0 ? (
                    currentPattern.map((dur, idx) => (
                      <span
                        key={idx}
                        className={`px-1.5 py-0.5 rounded text-[11px] ${
                          dur === 15
                            ? 'bg-blue-100 text-blue-800'
                            : dur === 30
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {dur}s
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">Empty Pod</span>
                  )}
                </div>
                <div className="flex flex-col gap-1 pt-1 text-[10px] text-slate-600 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span>≥2 distinct spot lengths:</span>
                    <span className="flex items-center gap-1 font-bold">
                      {hasMinDistinct ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Pass ({distinctLengthsCount})
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Fail (1)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Run length ≤ 2:</span>
                    <span className="flex items-center gap-1 font-bold">
                      {hasValidRunLength ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> Pass (max {maxRun})
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Fail ({maxRun})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Running Mix Histogram vs Target */}
              <div className="flex flex-col gap-1.5 text-[10px] font-mono text-slate-700">
                <div className="flex justify-between items-center text-slate-500 font-sans font-bold">
                  <span>Match Spots ({mixTally.totalSpots} total)</span>
                  <span>Target</span>
                </div>
                {/* 15s bar */}
                <div className="flex items-center gap-2">
                  <span className="w-6 font-bold text-blue-700">15s</span>
                  <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${pct15}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-slate-800">{mixTally.count15} ({pct15}%)</span>
                  <span className="w-7 text-right text-slate-400">35%</span>
                </div>
                {/* 30s bar */}
                <div className="flex items-center gap-2">
                  <span className="w-6 font-bold text-emerald-700">30s</span>
                  <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${pct30}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-slate-800">{mixTally.count30} ({pct30}%)</span>
                  <span className="w-7 text-right text-slate-400">50%</span>
                </div>
                {/* 45s bar */}
                <div className="flex items-center gap-2">
                  <span className="w-6 font-bold text-purple-700">45s</span>
                  <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                    <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${pct45}%` }} />
                  </div>
                  <span className="w-12 text-right font-bold text-slate-800">{mixTally.count45} ({pct45}%)</span>
                  <span className="w-7 text-right text-slate-400">15%</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-2 rounded-lg text-xs font-mono text-emerald-700 font-bold flex justify-between border border-slate-200">
              <span>Pattern Status:</span>
              <span>{patternValid ? 'Optimal Derangement' : 'Standard'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
