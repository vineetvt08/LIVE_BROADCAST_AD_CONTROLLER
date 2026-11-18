import { AdPod, BrandAd, BreakType, SpotDuration } from '../types';
import { evaluatePod } from '../rules/ruleEngine';
import { FrozenMatchState, ResumeMode, StoppageReason, StoppageState, StoppageAuditRecord } from './types';
import { SYNTHETIC_BRANDS } from '../../data/syntheticBrands';
import { getRankedPatterns, MixTally, INITIAL_MIX_TALLY, updateMixTally } from '../patternEngine';

// Broadcaster filler items (House Promos / Public Service Announcements / Cultural Bumpers)
// Each has a distinct sector category to avoid Rule 1 Category Adjacency clashes
export const BROADCASTER_FILLERS: BrandAd[] = [
  {
    id: 'filler_broadcaster_psa',
    name: 'National Public Health PSA',
    category: 'Personal_Care',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Strategic_Timeout', 'Over_Break', 'Wicket_Break'], targetAirings: 9999 },
    tier: 'Bronze',
    rivalBrandIds: [],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Public Health & Safety Announcement'
  },
  {
    id: 'filler_hotstar_stream',
    name: 'Hotstar Ultra HD Sports Promo',
    category: 'Channel_Promo',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Strategic_Timeout', 'Over_Break', 'Wicket_Break'], targetAirings: 9999 },
    tier: 'Bronze',
    rivalBrandIds: [],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Stream in Ultra HD'
  },
  {
    id: 'filler_icc_grassroots',
    name: 'ICC Grassroots Cricket Foundation',
    category: 'EdTech',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Strategic_Timeout', 'Over_Break', 'Wicket_Break'], targetAirings: 9999 },
    tier: 'Bronze',
    rivalBrandIds: [],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Inspiring the Next Generation'
  },
  {
    id: 'filler_broadcaster_bumper',
    name: 'Broadcaster Heritage Archives',
    category: 'Travel',
    availableDurations: [15, 30, 45],
    contract: { allowedInnings: [1, 2], allowedBreakTypes: ['Strategic_Timeout', 'Over_Break', 'Wicket_Break'], targetAirings: 9999 },
    tier: 'Bronze',
    rivalBrandIds: [],
    safetyTags: ['family_safe'],
    isSynthetic: true,
    tagline: 'Greatest World Cup Moments'
  }
];

export class StoppageEngine {
  private state: StoppageState;
  private allBrands: BrandAd[];
  private targetPodDuration: 60 | 90 | 120;
  private resumeMode: ResumeMode;
  private mixTally: MixTally = { ...INITIAL_MIX_TALLY };

  constructor(
    allBrands: BrandAd[] = SYNTHETIC_BRANDS,
    defaultPodDuration: 60 | 90 | 120 = 90,
    resumeMode: ResumeMode = 'AFTER_CURRENT_POD'
  ) {
    this.allBrands = allBrands;
    this.targetPodDuration = defaultPodDuration;
    this.resumeMode = resumeMode;
    this.state = this.getInitialState('Rain');
  }

  public getInitialState(reason: StoppageReason = 'Rain'): StoppageState {
    return {
      isActive: false,
      reason,
      reasonHistory: [],
      startTimestamp: 0,
      elapsedSeconds: 0,
      podCount: 0,
      currentPod: null,
      nextPrecomputedPod: null,
      currentSpotIndex: 0,
      spotElapsedSeconds: 0,
      isResuming: false,
      showBackToLiveSlate: false,
      slateCountdownSeconds: 3,
      inventoryExhausted: false,
      brandAiringsInStoppage: {},
      fillerSpotsAired: 0,
      frozenMatchState: null
    };
  }

  public getState(): StoppageState {
    return { ...this.state };
  }

  public setPodDuration(duration: 60 | 90 | 120): void {
    this.targetPodDuration = duration;
  }

  public setResumeMode(mode: ResumeMode): void {
    this.resumeMode = mode;
  }

  /**
   * Activates Unscheduled Stoppage (Toggle 5: Manual Infinity)
   * Freezes match clock at exact ball and begins continuous ad pod pipeline
   */
  public activateStoppage(
    reason: StoppageReason,
    frozenMatch: FrozenMatchState,
    previousAiredPod?: AdPod,
    savedBreakToggles?: StoppageState['savedBreakToggles']
  ): StoppageState {
    this.state = {
      ...this.getInitialState(reason),
      isActive: true,
      reason,
      reasonHistory: [{ reason, changedAtPod: 1 }],
      startTimestamp: Date.now(),
      frozenMatchState: frozenMatch,
      savedBreakToggles
    };

    // Precompute first pod and next pod
    const firstPod = this.generateStoppagePod(1, reason, previousAiredPod);
    const secondPod = this.generateStoppagePod(2, reason, firstPod);

    this.state.currentPod = firstPod;
    this.state.nextPrecomputedPod = secondPod;
    this.state.podCount = 1;
    this.state.currentSpotIndex = 0;
    this.state.spotElapsedSeconds = 0;

    // Record initial airings
    this.recordPodAirings(firstPod);

    return this.getState();
  }

  /**
   * Changes stoppage reason mid-stoppage (e.g. Rain -> Player injury)
   * Re-filters the NEXT pre-computed pod only. Active pod on air is untouched.
   */
  public changeReason(newReason: StoppageReason): StoppageState {
    if (!this.state.isActive || this.state.reason === newReason) {
      return this.getState();
    }

    this.state.reason = newReason;
    this.state.reasonHistory.push({
      reason: newReason,
      changedAtPod: this.state.podCount + 1
    });

    // Re-generate ONLY the next precomputed pod with the new reason brand-safety filter
    if (this.state.currentPod) {
      this.state.nextPrecomputedPod = this.generateStoppagePod(
        this.state.podCount + 1,
        newReason,
        this.state.currentPod
      );
    }

    return this.getState();
  }

  /**
   * Request deactivation / resume of the match.
   * Does NOT cut mid-spot. Sets `isResuming = true`.
   */
  public requestResume(): StoppageState {
    if (!this.state.isActive) return this.getState();
    this.state.isResuming = true;
    return this.getState();
  }

  /**
   * Second-by-second tick driving stoppage playback & precomputing
   */
  public tickSecond(): {
    state: StoppageState;
    didResumeMatch: boolean;
    auditRecord?: StoppageAuditRecord;
  } {
    if (!this.state.isActive) {
      return { state: this.getState(), didResumeMatch: false };
    }

    // Handle 3-second Back to Live Slate countdown
    if (this.state.showBackToLiveSlate) {
      this.state.slateCountdownSeconds--;
      if (this.state.slateCountdownSeconds <= 0) {
        // Slate finished: match unfreezes
        const audit = this.buildAuditRecord();
        this.state.isActive = false;
        this.state.showBackToLiveSlate = false;
        return {
          state: this.getState(),
          didResumeMatch: true,
          auditRecord: audit
        };
      }
      return { state: this.getState(), didResumeMatch: false };
    }

    this.state.elapsedSeconds++;
    this.state.spotElapsedSeconds++;

    const currentPod = this.state.currentPod;
    if (!currentPod) {
      return { state: this.getState(), didResumeMatch: false };
    }

    const currentSpot = currentPod.slots[this.state.currentSpotIndex];
    const spotDuration = currentSpot?.duration || 30;

    // Check if current spot has completed
    if (this.state.spotElapsedSeconds >= spotDuration) {
      this.state.spotElapsedSeconds = 0;
      this.state.currentSpotIndex++;

      // Check if resuming after current spot
      if (this.state.isResuming && this.resumeMode === 'AFTER_CURRENT_SPOT') {
        this.state.showBackToLiveSlate = true;
        this.state.slateCountdownSeconds = 3;
        return { state: this.getState(), didResumeMatch: false };
      }

      // Check if entire current pod has completed
      if (this.state.currentSpotIndex >= currentPod.slots.length) {
        // If operator pressed OFF, clean exit after current pod!
        if (this.state.isResuming) {
          this.state.showBackToLiveSlate = true;
          this.state.slateCountdownSeconds = 3;
          return { state: this.getState(), didResumeMatch: false };
        }

        // Advance to next pre-computed pod (Zero dead air!)
        const nextPod = this.state.nextPrecomputedPod || this.generateStoppagePod(
          this.state.podCount + 1,
          this.state.reason,
          currentPod
        );

        this.state.currentPod = nextPod;
        this.state.podCount++;
        this.state.currentSpotIndex = 0;
        this.recordPodAirings(nextPod);

        // Precompute the pod AFTER next
        this.state.nextPrecomputedPod = this.generateStoppagePod(
          this.state.podCount + 1,
          this.state.reason,
          nextPod
        );
      }
    }

    return { state: this.getState(), didResumeMatch: false };
  }

  /**
   * Immediately triggers next pod in the stoppage pipeline (for test/fast-forwarding)
   */
  public advanceToNextPod(): AdPod {
    const prevPod = this.state.currentPod;
    const nextPod = this.state.nextPrecomputedPod || this.generateStoppagePod(
      this.state.podCount + 1,
      this.state.reason,
      prevPod || undefined
    );

    this.state.currentPod = nextPod;
    this.state.podCount++;
    this.state.currentSpotIndex = 0;
    this.state.spotElapsedSeconds = 0;
    this.recordPodAirings(nextPod);

    this.state.nextPrecomputedPod = this.generateStoppagePod(
      this.state.podCount + 1,
      this.state.reason,
      nextPod
    );

    return nextPod;
  }

  /**
   * Generates an optimal 90s (or 60/120s) stoppage pod with strict brand safety,
   * frequency capping, rotation derangement, and filler fallback.
   */
  public generateStoppagePod(
    podNumber: number,
    reason: StoppageReason,
    previousPod?: AdPod
  ): AdPod {
    const targetDuration = this.targetPodDuration;
    const prevPattern = previousPod ? previousPod.slots.map(s => s.duration) : undefined;
    const rankedPatterns = getRankedPatterns(targetDuration, prevPattern, this.mixTally, podNumber);
    const partition: SpotDuration[] = rankedPatterns.length > 0
      ? rankedPatterns[0]
      : (targetDuration === 60 ? [15, 45] : [15, 30, 45]);

    const innings = this.state.frozenMatchState?.innings || 1;
    const breakType: BreakType = 'Strategic_Timeout';

    // Filter brand pool by Stoppage Brand-Safety Rules & Contract eligibility
    const eligiblePool = this.filterBrandsByStoppageSafety(this.allBrands, reason).filter(b =>
      b.contract.allowedInnings.includes(innings) &&
      b.contract.allowedBreakTypes.includes(breakType)
    );

    // Apply frequency cap: max 3 airings during stoppage (or contract target)
    const availablePool = eligiblePool.filter(brand => {
      const airings = this.state.brandAiringsInStoppage[brand.id] || 0;
      const maxCap = Math.max(3, brand.contract.targetAirings);
      return airings < maxCap;
    });

    const slots: { slotNumber: number; duration: SpotDuration; brand: BrandAd }[] = [];
    const usedInPod = new Set<string>();

    for (let i = 0; i < partition.length; i++) {
      const duration = partition[i];
      const prevBrand = i > 0 ? slots[i - 1].brand : undefined;

      // Find candidates that avoid BLOCK rules:
      // 1. Same category adjacency
      // 2. Explicit rivals
      // 3. Duplicate brand in same pod
      // 4. Derangement / cross-pod rook check against previous pod slot i
      let candidate = this.pickBestCandidate(
        availablePool,
        duration,
        prevBrand,
        usedInPod,
        previousPod?.slots[i]?.brand,
        reason
      );

      // If inventory exhausted for this slot, fallback to Broadcaster House Promo / PSA Filler!
      if (!candidate) {
        this.state.inventoryExhausted = true;
        candidate = this.pickFillerCandidate(duration, prevBrand, usedInPod);
      }

      slots.push({
        slotNumber: i + 1,
        duration,
        brand: candidate
      });
      usedInPod.add(candidate.id);
    }

    const podId = `STOPPAGE_POD_${String(podNumber).padStart(3, '0')}`;
    const pod: AdPod = {
      id: podId,
      innings,
      overNo: this.state.frozenMatchState?.over || 0,
      breakType,
      targetDuration,
      timestamp: new Date().toLocaleTimeString(),
      isAired: false,
      matchContext: {
        innings,
        over: this.state.frozenMatchState?.over || 0,
        ball: this.state.frozenMatchState?.ball || 0,
        battingTeam: 'Match Stoppage',
        bowlingTeam: reason,
        runs: this.state.frozenMatchState?.runs || 0,
        wickets: this.state.frozenMatchState?.wickets || 0,
        lastEvent: `Unscheduled Stoppage (${reason})`,
        wicketJustFell: false,
        favouriteWicketFell: false,
        runRate: this.state.frozenMatchState?.runRate || 0
      },
      slots: slots.map(s => ({
        slotNumber: s.slotNumber,
        duration: s.duration,
        brand: s.brand
      }))
    };

    return pod;
  }

  /**
   * Brand-Safety Filter based on specific Stoppage Reason
   */
  public filterBrandsByStoppageSafety(brands: BrandAd[], reason: StoppageReason): BrandAd[] {
    return brands.filter(b => {
      // 1. Player injury or Crowd/pitch disturbance:
      // Exclude celebratory, humorous, and high-energy ad tags
      if (reason === 'Player injury' || reason === 'Crowd/pitch disturbance') {
        if (b.safetyTags.includes('high_energy')) return false;
        if (b.safetyTags.includes('needs_positive_context')) return false;
        if (b.category === 'Gaming') return false;
      }

      // 2. Technical fault or Other:
      // Neutral-safe ads only
      if (reason === 'Technical fault' || reason === 'Other') {
        if (b.safetyTags.includes('high_energy')) return false;
        if (b.safetyTags.includes('avoid_loss_situation')) return false;
      }

      // 3. Rain: weather-neutral ads allowed
      return true;
    });
  }

  private pickBestCandidate(
    pool: BrandAd[],
    duration: SpotDuration,
    prevBrand: BrandAd | undefined,
    usedInPod: Set<string>,
    prevPodSlotBrand: BrandAd | undefined,
    reason: StoppageReason
  ): BrandAd | null {
    const valid = pool.filter(b => {
      if (!b.availableDurations.includes(duration)) return false;
      if (usedInPod.has(b.id)) return false;

      // Rule 1: No category adjacency
      if (prevBrand && prevBrand.category === b.category) return false;

      // Rule 2: No explicit rivals
      if (prevBrand && (prevBrand.rivalBrandIds.includes(b.id) || b.rivalBrandIds.includes(prevBrand.id))) return false;

      // Rule 4: Derangement (prefer no identical brand in same slot as previous pod)
      if (prevPodSlotBrand && prevPodSlotBrand.id === b.id) return false;

      return true;
    });

    if (valid.length === 0) return null;

    // Score candidates: prioritize fairness and rain category boosts
    valid.sort((a, b) => {
      let scoreA = (a.tier === 'Gold' ? 30 : a.tier === 'Silver' ? 20 : 10);
      let scoreB = (b.tier === 'Gold' ? 30 : b.tier === 'Silver' ? 20 : 10);

      // Rain Category Boost (Suggestion score only, never a hard rule)
      if (reason === 'Rain') {
        if (a.category === 'Beverage' || a.category === 'Home_Decor') scoreA += 15;
        if (b.category === 'Beverage' || b.category === 'Home_Decor') scoreB += 15;
      }

      // Fair airings: prioritize brands with fewer airings in this stoppage
      const airingsA = this.state.brandAiringsInStoppage[a.id] || 0;
      const airingsB = this.state.brandAiringsInStoppage[b.id] || 0;
      return (scoreB - airingsB * 5) - (scoreA - airingsA * 5);
    });

    return valid[0];
  }

  private pickFillerCandidate(
    duration: SpotDuration,
    prevBrand: BrandAd | undefined,
    usedInPod: Set<string>
  ): BrandAd {
    // Select a filler that supports duration and does not repeat category or identical ID
    for (const f of BROADCASTER_FILLERS) {
      if (f.availableDurations.includes(duration) && !usedInPod.has(f.id)) {
        if (!prevBrand || (prevBrand.category !== f.category && prevBrand.id !== f.id)) {
          return f;
        }
      }
    }

    // Secondary pass: any filler with duration match and different category from previous
    for (const f of BROADCASTER_FILLERS) {
      if (f.availableDurations.includes(duration)) {
        if (!prevBrand || prevBrand.category !== f.category) {
          return f;
        }
      }
    }

    return BROADCASTER_FILLERS.find(f => f.availableDurations.includes(duration)) || BROADCASTER_FILLERS[0];
  }

  private recordPodAirings(pod: AdPod): void {
    this.mixTally = updateMixTally(this.mixTally, pod.slots.map(s => s.duration));
    for (const s of pod.slots) {
      if (!s.brand) continue;
      if (s.brand.id.startsWith('filler_')) {
        this.state.fillerSpotsAired++;
      } else {
        this.state.brandAiringsInStoppage[s.brand.id] = (this.state.brandAiringsInStoppage[s.brand.id] || 0) + 1;
      }
    }
  }

  private buildAuditRecord(): StoppageAuditRecord {
    const totalDuration = this.state.elapsedSeconds;
    const ratePerSecond = 500; // Simulated commercial value
    return {
      id: `STOPPAGE_AUDIT_${this.state.startTimestamp}`,
      reason: this.state.reason,
      reasonHistory: [...this.state.reasonHistory],
      startTime: new Date(this.state.startTimestamp).toLocaleTimeString(),
      endTime: new Date().toLocaleTimeString(),
      totalDurationSeconds: totalDuration,
      podsAiredCount: this.state.podCount,
      spotsAiredCount: this.state.podCount * (this.targetPodDuration / 30),
      brandsAired: { ...this.state.brandAiringsInStoppage },
      fillersUsedCount: this.state.fillerSpotsAired,
      equivalentAirtimeCommercialValue: totalDuration * ratePerSecond
    };
  }
}
