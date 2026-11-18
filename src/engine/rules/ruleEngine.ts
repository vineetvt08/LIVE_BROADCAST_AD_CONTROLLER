import {
  AdPod,
  BrandAd,
  PodEvaluation,
  PodSlot,
  RuleViolation,
  SlotEvaluation,
  SlotSafetyStatus,
  SpotDuration
} from '../types';

export interface EvaluatePodOptions {
  currentPod: AdPod;
  previousPod?: AdPod;
  allAiredPodsInInnings?: AdPod[];
  allBrands?: BrandAd[];
}

/**
 * Comprehensive defensive rule engine for cricket broadcast MCR.
 * Evaluates rules:
 * 1. Same-category adjacency (BLOCK)
 * 2. Explicit rival neighbour list (BLOCK)
 * 3. Cross-pod positional rule (Rook board forbidden cells) (WARN)
 * 4. Derangement rule (No fixed points vs previous pod) (WARN)
 * 5. Contract rule (Innings/Break type eligibility) (BLOCK)
 * 6. Brand-safety context (Wicket/situation alignment) (WARN)
 * 7. Duration budget (Exact sum to break length) (BLOCK at Go Live)
 * 8. Fair-exposure rule (Gold tier prime slot per innings) (INFO)
 */
export function evaluatePod(options: EvaluatePodOptions): PodEvaluation {
  const { currentPod, previousPod, allAiredPodsInInnings = [] } = options;
  const violations: RuleViolation[] = [];
  const slots = currentPod.slots;

  // 1. Same-Category Adjacency (BLOCK)
  for (let i = 0; i < slots.length - 1; i++) {
    const slotA = slots[i];
    const slotB = slots[i + 1];
    if (slotA.brand && slotB.brand) {
      if (slotA.brand.category === slotB.brand.category) {
        violations.push({
          ruleId: 'RULE_1_SAME_CATEGORY_ADJACENCY',
          ruleName: 'Same-Category Adjacency',
          severity: 'BLOCK',
          slotNumber: slotB.slotNumber,
          message: `Category clash: "${slotA.brand.name}" and "${slotB.brand.name}" both belong to "${slotA.brand.category}".`,
          whyItHarms: `Airing two ads in the same sector consecutively dilutes viewer recall and triggers advertiser breach-of-contract penalties for category separation.`,
          recommendation: `Insert a buffer ad of a distinct category (e.g., Telecom or Insurance) between slots ${slotA.slotNumber} and ${slotB.slotNumber}.`,
          relatedBrandName: slotA.brand.name,
          relatedCategory: slotA.brand.category
        });
      }
    }
  }

  // 2. Explicit Rival Neighbour List (BLOCK)
  for (let i = 0; i < slots.length; i++) {
    const curr = slots[i];
    if (!curr.brand) continue;

    // Check neighbour to the left
    if (i > 0 && slots[i - 1].brand) {
      const prevBrand = slots[i - 1].brand!;
      if (curr.brand.rivalBrandIds.includes(prevBrand.id) || prevBrand.rivalBrandIds.includes(curr.brand.id)) {
        violations.push({
          ruleId: 'RULE_2_EXPLICIT_RIVAL',
          ruleName: 'Rival Neighbour Exclusion',
          severity: 'BLOCK',
          slotNumber: curr.slotNumber,
          message: `Direct competitor conflict: "${curr.brand.name}" is directly preceded by direct rival "${prevBrand.name}".`,
          whyItHarms: `Both brands explicitly contract exclusivity against side-by-side airing with listed rivals. High risk of immediate rebate demand.`,
          recommendation: `Move "${curr.brand.name}" to another slot in the pod or swap with a non-competing brand.`,
          relatedBrandName: prevBrand.name
        });
      }
    }

    // Check neighbour to the right
    if (i < slots.length - 1 && slots[i + 1].brand) {
      const nextBrand = slots[i + 1].brand!;
      if (curr.brand.rivalBrandIds.includes(nextBrand.id) || nextBrand.rivalBrandIds.includes(curr.brand.id)) {
        // Only log if not already logged as pair
        const alreadyLogged = violations.some(
          v => v.ruleId === 'RULE_2_EXPLICIT_RIVAL' && v.slotNumber === curr.slotNumber && v.relatedBrandName === nextBrand.name
        );
        if (!alreadyLogged) {
          violations.push({
            ruleId: 'RULE_2_EXPLICIT_RIVAL',
            ruleName: 'Rival Neighbour Exclusion',
            severity: 'BLOCK',
            slotNumber: curr.slotNumber,
            message: `Direct competitor conflict: "${curr.brand.name}" is followed by direct rival "${nextBrand.name}".`,
            whyItHarms: `Rival brands side-by-side diminish product differentiation and violate explicit exclusion covenants.`,
            recommendation: `Separate "${curr.brand.name}" and "${nextBrand.name}" by at least one non-rival spot.`,
            relatedBrandName: nextBrand.name
          });
        }
      }
    }
  }

  // 3. Cross-Pod Positional Rule (Rook Board) (WARN)
  if (previousPod && previousPod.slots.length > 0) {
    for (let i = 0; i < slots.length; i++) {
      const currSlot = slots[i];
      if (!currSlot.brand) continue;

      const prevSlot = previousPod.slots[i];
      if (prevSlot && prevSlot.brand) {
        if (currSlot.brand.category === prevSlot.brand.category) {
          violations.push({
            ruleId: 'RULE_3_CROSS_POD_ROOK',
            ruleName: 'Cross-Pod Positional Clashing (Rook Board)',
            severity: 'WARN',
            slotNumber: currSlot.slotNumber,
            message: `Rook board violation: Slot ${currSlot.slotNumber} has category "${currSlot.brand.category}" (${currSlot.brand.name}), identical to slot ${prevSlot.slotNumber} in previous pod "${previousPod.id}" (${prevSlot.brand.name}).`,
            whyItHarms: `Viewers experience commercial fatigue when the same category anchors the exact same chronological spot across consecutive breaks.`,
            recommendation: `Permute slot positions to avoid row/column collision on the rook board.`,
            relatedBrandName: prevSlot.brand.name,
            relatedCategory: currSlot.brand.category
          });
        }
      }
    }
  }

  // 4. Derangement Rule (No Fixed Points) (WARN)
  if (previousPod && previousPod.slots.length > 0) {
    for (let i = 0; i < slots.length; i++) {
      const currSlot = slots[i];
      if (!currSlot.brand) continue;

      const prevSlot = previousPod.slots[i];
      if (prevSlot && prevSlot.brand && prevSlot.brand.id === currSlot.brand.id) {
        violations.push({
          ruleId: 'RULE_4_DERANGEMENT_FIXED_POINT',
          ruleName: 'Derangement Rule (Fixed Point Repeat)',
          severity: 'WARN',
          slotNumber: currSlot.slotNumber,
          message: `Fixed point collision: "${currSlot.brand.name}" repeated in exact same slot index ${currSlot.slotNumber} as previous pod.`,
          whyItHarms: `Repeated brand positioning in identical slot numbers causes predictability and reduced visual attention.`,
          recommendation: `Derange the pod permutation so that slot $i$ never equals previous pod slot $i$.`,
          relatedBrandName: currSlot.brand.name
        });
      }
    }
  }

  // 5. Contract Compliance Rule (BLOCK)
  for (const slot of slots) {
    if (!slot.brand) continue;
    const { contract } = slot.brand;

    // Check innings eligibility
    if (!contract.allowedInnings.includes(currentPod.innings)) {
      violations.push({
        ruleId: 'RULE_5_CONTRACT_INNINGS',
        ruleName: 'Contract Eligibility (Innings)',
        severity: 'BLOCK',
        slotNumber: slot.slotNumber,
        message: `Contract restriction: "${slot.brand.name}" only bought airtime in Innings ${contract.allowedInnings.join(', ')}, but current is Innings ${currentPod.innings}.`,
        whyItHarms: `Broadcasting an ad outside its purchased contractual window leads to unbillable airings and contractual disputes.`,
        recommendation: `Select a brand with active contract rights for Innings ${currentPod.innings}.`,
        relatedBrandName: slot.brand.name
      });
    }

    // Check break type eligibility
    if (!contract.allowedBreakTypes.includes(currentPod.breakType)) {
      violations.push({
        ruleId: 'RULE_5_CONTRACT_BREAK_TYPE',
        ruleName: 'Contract Eligibility (Break Type)',
        severity: 'BLOCK',
        slotNumber: slot.slotNumber,
        message: `Contract restriction: "${slot.brand.name}" did not buy airtime for break type "${currentPod.breakType.replace(/_/g, ' ')}".`,
        whyItHarms: `Advertiser contracted for specific audience reach windows (e.g. Over Breaks vs Strategic Timeouts). Airing here breaks commercial policy.`,
        recommendation: `Place this ad during its contracted break types: ${contract.allowedBreakTypes.map(t => t.replace(/_/g, ' ')).join(', ')}.`,
        relatedBrandName: slot.brand.name
      });
    }
  }

  // 6. Brand-Safety Context Rule (WARN)
  const ctx = currentPod.matchContext;
  for (const slot of slots) {
    if (!slot.brand) continue;

    // Post-wicket sensitivity
    if (ctx.wicketJustFell && slot.brand.safetyTags.includes('avoid_after_wicket')) {
      violations.push({
        ruleId: 'RULE_6_BRAND_SAFETY_WICKET',
        ruleName: 'Brand-Safety Context (Post-Wicket Sensitivity)',
        severity: 'WARN',
        slotNumber: slot.slotNumber,
        message: `Context alert: "${slot.brand.name}" is tagged "avoid_after_wicket", but an important wicket just fell (${ctx.lastEvent}).`,
        whyItHarms: `Celebratory, humorous, or leisurely ads immediately following the dismissal of a key home batsman create cognitive dissonance and backlash on social media.`,
        recommendation: `Choose a utility brand, insurance, or neutral public sector spot, or defer "${slot.brand.name}" to the next standard over break.`,
        relatedBrandName: slot.brand.name
      });
    }

    // Key favourite batsman dismissed (extreme sensitivity)
    if (ctx.favouriteWicketFell && slot.brand.safetyTags.includes('needs_positive_context')) {
      violations.push({
        ruleId: 'RULE_6_BRAND_SAFETY_FAVOURITE_DISMISSED',
        ruleName: 'Brand-Safety Mood Mismatch',
        severity: 'WARN',
        slotNumber: slot.slotNumber,
        message: `High viewer sensitivity: Star batsman dismissed; "${slot.brand.name}" requires positive contextual sentiment.`,
        whyItHarms: `Viewers are crestfallen; high-energy celebratory creative will alienate the viewer and damage sentiment perception.`,
        recommendation: `Replace with a somber/neutral or family-safe institutional creative.`,
        relatedBrandName: slot.brand.name
      });
    }
  }

  // 7. Duration Budget Rule (BLOCK at Go Live)
  const durationUsed = slots.reduce((sum, s) => sum + s.duration, 0);
  if (durationUsed !== currentPod.targetDuration) {
    violations.push({
      ruleId: 'RULE_7_DURATION_BUDGET',
      ruleName: 'Duration Budget Exact Match',
      severity: 'BLOCK',
      slotNumber: 0, // Pod-level
      message: `Pod duration mismatch: Current total is ${durationUsed}s, but required break duration is ${currentPod.targetDuration}s (${durationUsed > currentPod.targetDuration ? `Overrun by ${durationUsed - currentPod.targetDuration}s` : `Gap/Black frame of ${currentPod.targetDuration - durationUsed}s`}).`,
      whyItHarms: `A timing overrun truncates the live broadcast or clips bowler run-up; an underrun causes dead air/black frames violating FCC/broadcasting codes.`,
      recommendation: `Adjust slot spot lengths (15s/30s/45s) so the sum matches ${currentPod.targetDuration}s exactly.`
    });
  }

  // 8. Fair-Exposure Rule (Gold Tier Prime Slot) (INFO)
  // Prime slots are slot 1 (first) and slot n (last) of a pod
  const currentPrimeSlotBrands = new Set<string>();
  if (slots.length > 0 && slots[0].brand) currentPrimeSlotBrands.add(slots[0].brand.id);
  if (slots.length > 1 && slots[slots.length - 1].brand) currentPrimeSlotBrands.add(slots[slots.length - 1].brand!.id);

  // Check all Gold-tier brands present in the pod
  for (const slot of slots) {
    if (!slot.brand || slot.brand.tier !== 'Gold') continue;
    
    // Check if this Gold brand has had ANY prime slot in this innings so far
    const hadPrimeSlotBefore = allAiredPodsInInnings.some(pod => {
      if (pod.slots.length === 0) return false;
      const first = pod.slots[0].brand?.id;
      const last = pod.slots[pod.slots.length - 1].brand?.id;
      return first === slot.brand!.id || last === slot.brand!.id;
    });

    const isPrimeInCurrentPod = currentPrimeSlotBrands.has(slot.brand.id);

    if (!hadPrimeSlotBefore && !isPrimeInCurrentPod) {
      violations.push({
        ruleId: 'RULE_8_FAIR_EXPOSURE_GOLD',
        ruleName: 'Fair-Exposure (Gold Tier Prime Slot)',
        severity: 'INFO',
        slotNumber: slot.slotNumber,
        message: `Exposure opportunity: Gold-tier advertiser "${slot.brand.name}" has not yet received a prime slot (first or last) in Innings ${currentPod.innings}.`,
        whyItHarms: `Gold-tier premium contracts entitle brands to high-visibility boundary slots for peak viewer impressions.`,
        recommendation: `Consider shifting "${slot.brand.name}" to Slot 1 or Slot ${slots.length} to fulfill contractual SLA.`,
        relatedBrandName: slot.brand.name
      });
    }
  }

  // Build per-slot evaluations
  const slotEvaluations: SlotEvaluation[] = slots.map(slot => {
    const slotViolations = violations.filter(v => v.slotNumber === slot.slotNumber);
    const hasBlock = slotViolations.some(v => v.severity === 'BLOCK' && !slot.isOverridden);
    const hasWarn = slotViolations.some(v => v.severity === 'WARN');
    
    let status: SlotSafetyStatus = 'GREEN';
    if (hasBlock) status = 'RED';
    else if (hasWarn) status = 'AMBER';

    return {
      slotNumber: slot.slotNumber,
      status,
      violations: slotViolations
    };
  });

  // Calculate if pod is ready to air
  // Blocking violations that have not been overridden
  const podLevelBlock = violations.some(v => v.slotNumber === 0 && v.severity === 'BLOCK');
  const slotBlocksUnoverridden = slots.some((slot, idx) => {
    const sViolations = violations.filter(v => v.slotNumber === slot.slotNumber);
    const hasUnoverriddenBlock = sViolations.some(v => v.severity === 'BLOCK') && !slot.isOverridden;
    return hasUnoverriddenBlock;
  });

  const hasBlockingViolations = podLevelBlock || slotBlocksUnoverridden;
  const isValidForAir = !hasBlockingViolations && durationUsed === currentPod.targetDuration;

  return {
    isValidForAir,
    canGoLiveWithOverrides: !podLevelBlock, // Pod duration itself cannot be overridden; slots can
    hasBlockingViolations,
    durationUsed,
    targetDuration: currentPod.targetDuration,
    slotEvaluations,
    allViolations: violations,
    validCompletionsRemaining: 0 // Will be populated by completion counter
  };
}

/**
 * Evaluates whether placing a specific candidate brand into a target slot index
 * causes any BLOCK or WARN violations. Used by UI for greyed-out slot hints and tooltips.
 */
export function evaluateCandidatePlacement(
  candidate: BrandAd,
  slotDuration: SpotDuration,
  slotIndex: number, // 0-based
  currentPod: AdPod,
  previousPod?: AdPod
): { isAllowed: boolean; violations: RuleViolation[] } {
  // Create hypothetical pod copy with candidate placed in slotIndex
  const hypoSlots: PodSlot[] = [...currentPod.slots];
  while (hypoSlots.length <= slotIndex) {
    hypoSlots.push({ slotNumber: hypoSlots.length + 1, duration: 30 });
  }

  hypoSlots[slotIndex] = {
    slotNumber: slotIndex + 1,
    duration: slotDuration,
    brand: candidate
  };

  const hypoPod: AdPod = {
    ...currentPod,
    slots: hypoSlots
  };

  const evalResult = evaluatePod({
    currentPod: hypoPod,
    previousPod
  });

  const targetSlotViolations = evalResult.allViolations.filter(
    v => v.slotNumber === slotIndex + 1 || (v.ruleId === 'RULE_1_SAME_CATEGORY_ADJACENCY' && (v.slotNumber === slotIndex || v.slotNumber === slotIndex + 2))
  );

  const hasBlock = targetSlotViolations.some(v => v.severity === 'BLOCK');
  return {
    isAllowed: !hasBlock,
    violations: targetSlotViolations
  };
}
