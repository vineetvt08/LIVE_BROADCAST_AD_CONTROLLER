import { AdPod, BrandAd, PodSuggestion, SpotDuration } from '../types';
import { evaluatePod } from '../rules/ruleEngine';
import { getRankedPatterns, MixTally, INITIAL_MIX_TALLY } from '../patternEngine';

export interface GenerateSuggestionsOptions {
  currentPod: AdPod;
  previousPod?: AdPod;
  allAiredPodsInInnings?: AdPod[];
  allBrands: BrandAd[];
  maxSuggestions?: number;
  runningMixTally?: MixTally;
}

/**
 * Generates top advisory complete pod configurations matching target duration,
 * satisfying all BLOCK and WARN rules, and scored via multi-criteria heuristic.
 */
export function generatePodSuggestions(options: GenerateSuggestionsOptions): PodSuggestion[] {
  const {
    currentPod,
    previousPod,
    allAiredPodsInInnings = [],
    allBrands,
    maxSuggestions = 3,
    runningMixTally = INITIAL_MIX_TALLY
  } = options;

  const targetDuration = currentPod.targetDuration;

  // Filter eligible brands for this innings and break type
  const eligibleBrands = allBrands.filter(b =>
    b.contract.allowedInnings.includes(currentPod.innings) &&
    b.contract.allowedBreakTypes.includes(currentPod.breakType)
  );

  // Extract previous pod's duration pattern if available
  const prevPattern = previousPod ? previousPod.slots.map(s => s.duration) : undefined;

  // Stage A: Obtain candidate duration patterns compliant with hard rules and nudged toward 35/50/15 mix
  const candidatePartitions = getRankedPatterns(targetDuration, prevPattern, runningMixTally, currentPod.overNo);

  const validPodCandidates: {
    slots: { slotNumber: number; duration: SpotDuration; brand: BrandAd }[];
    score: number;
    metrics: {
      tierScore: number;
      fairnessScore: number;
      diversityScore: number;
      contextSafetyScore: number;
    };
    rationale: string[];
  }[] = [];

  // Stage B: Explore partitions to build complete valid combinations
  for (const partition of candidatePartitions) {
    if (validPodCandidates.length >= 25) break;

    searchPodFillings(
      partition,
      0,
      [],
      new Set(),
      eligibleBrands,
      currentPod,
      previousPod,
      allAiredPodsInInnings,
      validPodCandidates,
      25
    );
  }

  // Sort candidates by total score descending
  validPodCandidates.sort((a, b) => b.score - a.score);

  // Return top N distinct candidates
  const topN = validPodCandidates.slice(0, maxSuggestions);

  return topN.map((c, idx) => ({
    id: `SUGGESTION_${idx + 1}`,
    title: idx === 0 ? 'Optimal Commercial & Reputational Fit' : idx === 1 ? 'Balanced Sector Diversity' : 'High-Value Tier Exposure',
    score: Math.round(c.score),
    slots: c.slots,
    rationale: c.rationale,
    metrics: c.metrics
  }));
}

/**
 * Recursive solver for placing brands into partition slots
 */
function searchPodFillings(
  partition: SpotDuration[],
  slotIdx: number,
  currentAssignment: { slotNumber: number; duration: SpotDuration; brand: BrandAd }[],
  usedBrandIds: Set<string>,
  eligibleBrands: BrandAd[],
  currentPod: AdPod,
  previousPod: AdPod | undefined,
  allAiredPodsInInnings: AdPod[],
  results: {
    slots: { slotNumber: number; duration: SpotDuration; brand: BrandAd }[];
    score: number;
    metrics: { tierScore: number; fairnessScore: number; diversityScore: number; contextSafetyScore: number };
    rationale: string[];
  }[],
  maxResults: number
): void {
  if (results.length >= maxResults) return;

  if (slotIdx === partition.length) {
    // Complete candidate constructed. Evaluate against all rules!
    const hypoPod: AdPod = {
      ...currentPod,
      slots: currentAssignment.map(a => ({
        slotNumber: a.slotNumber,
        duration: a.duration,
        brand: a.brand
      }))
    };

    const evaluation = evaluatePod({
      currentPod: hypoPod,
      previousPod,
      allAiredPodsInInnings
    });

    // We only suggest pods that have ZERO BLOCK and ZERO WARN violations
    const hasAnyBlockOrWarn = evaluation.allViolations.some(
      v => v.severity === 'BLOCK' || v.severity === 'WARN'
    );

    if (!hasAnyBlockOrWarn) {
      const { score, metrics, rationale } = scorePodCandidate(
        currentAssignment,
        currentPod,
        previousPod,
        allAiredPodsInInnings
      );

      results.push({
        slots: [...currentAssignment],
        score,
        metrics,
        rationale
      });
    }
    return;
  }

  const duration = partition[slotIdx];
  const prevItem = slotIdx > 0 ? currentAssignment[slotIdx - 1] : undefined;

  // Filter brands that offer this duration and haven't been used in this pod
  const candidateBrands = eligibleBrands.filter(b =>
    b.availableDurations.includes(duration) && !usedBrandIds.has(b.id)
  );

  // Sort candidate brands: prefer Gold & Silver for prime slots (first and last)
  const isPrimeSlot = slotIdx === 0 || slotIdx === partition.length - 1;
  if (isPrimeSlot) {
    candidateBrands.sort((a, b) => {
      const tierRank = { Gold: 3, Silver: 2, Bronze: 1 };
      return tierRank[b.tier] - tierRank[a.tier];
    });
  }

  for (const brand of candidateBrands) {
    // Fast pruning: Rule 1 (same category adjacency)
    if (prevItem && prevItem.brand.category === brand.category) continue;

    // Fast pruning: Rule 2 (explicit rival)
    if (prevItem && (prevItem.brand.rivalBrandIds.includes(brand.id) || brand.rivalBrandIds.includes(prevItem.brand.id))) continue;

    // Fast pruning: Rule 3 & 4 (Cross-pod rook & derangement)
    if (previousPod && previousPod.slots[slotIdx]?.brand) {
      const prevPodSlotBrand = previousPod.slots[slotIdx].brand!;
      if (prevPodSlotBrand.id === brand.id) continue; // Derangement
      if (prevPodSlotBrand.category === brand.category) continue; // Rook
    }

    // Fast pruning: Rule 6 (Post-wicket safety tag mismatch)
    if (currentPod.matchContext.wicketJustFell && brand.safetyTags.includes('avoid_after_wicket')) continue;

    usedBrandIds.add(brand.id);
    currentAssignment.push({
      slotNumber: slotIdx + 1,
      duration,
      brand
    });

    searchPodFillings(
      partition,
      slotIdx + 1,
      currentAssignment,
      usedBrandIds,
      eligibleBrands,
      currentPod,
      previousPod,
      allAiredPodsInInnings,
      results,
      maxResults
    );

    currentAssignment.pop();
    usedBrandIds.delete(brand.id);

    if (results.length >= maxResults) return;
  }
}

/**
 * Scores a valid pod configuration across 4 key broadcast objectives:
 * 1. Tier Weight (Gold = 30 pts, Silver = 20 pts, Bronze = 10 pts)
 * 2. Prime Slot Fairness (Gold/Silver in slot 1 and slot N)
 * 3. Category Diversity & Separation
 * 4. Match Context Alignment
 */
function scorePodCandidate(
  slots: { slotNumber: number; duration: SpotDuration; brand: BrandAd }[],
  currentPod: AdPod,
  previousPod: AdPod | undefined,
  allAiredPodsInInnings: AdPod[]
): {
  score: number;
  metrics: { tierScore: number; fairnessScore: number; diversityScore: number; contextSafetyScore: number };
  rationale: string[];
} {
  const rationale: string[] = [];
  let tierScore = 0;
  let fairnessScore = 0;
  let diversityScore = 0;
  let contextSafetyScore = 0;

  // 1. Tier Score (Normalized per slot to avoid penalizing higher slot counts)
  for (const s of slots) {
    if (s.brand.tier === 'Gold') tierScore += 25;
    else if (s.brand.tier === 'Silver') tierScore += 15;
    else tierScore += 8;
  }
  const normalizedTierScore = slots.length > 0 ? (tierScore / slots.length) * 3 : 0;

  // 2. Prime Slot Fairness
  const firstSlot = slots[0];
  const lastSlot = slots[slots.length - 1];

  if (firstSlot.brand.tier === 'Gold') {
    fairnessScore += 20;
    rationale.push(`Anchors opening prime position with Gold advertiser ${firstSlot.brand.name}.`);
  }
  if (lastSlot.brand.tier === 'Gold' && slots.length > 1) {
    fairnessScore += 15;
    rationale.push(`Concludes break with high-impact Gold partner ${lastSlot.brand.name}.`);
  }

  // 3. Category Diversity
  const categories = new Set(slots.map(s => s.brand.category));
  if (categories.size === slots.length) {
    diversityScore += 25;
    rationale.push(`100% sector diversity: ${categories.size} completely distinct market categories.`);
  } else {
    diversityScore += 10;
  }

  // 4. Context Safety
  const ctx = currentPod.matchContext;
  if (ctx.wicketJustFell) {
    const neutralBrands = slots.filter(s => !s.brand.safetyTags.includes('avoid_after_wicket'));
    if (neutralBrands.length === slots.length) {
      contextSafetyScore += 20;
      rationale.push(`Carefully avoids celebratory or euphoric creative after the dismissal.`);
    }
  } else {
    contextSafetyScore += 15;
    rationale.push(`Harmonious commercial tone with current run chase tempo.`);
  }

  const totalScore = normalizedTierScore + fairnessScore + diversityScore + contextSafetyScore;

  return {
    score: totalScore,
    metrics: {
      tierScore: normalizedTierScore,
      fairnessScore,
      diversityScore,
      contextSafetyScore
    },
    rationale
  };
}
