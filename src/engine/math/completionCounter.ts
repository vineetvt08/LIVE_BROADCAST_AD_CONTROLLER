import { AdPod, BrandAd, SpotDuration } from '../types';

/**
 * Counts how many valid ways remain to complete the current pod's empty slots
 * so that:
 * 1. The total pod duration reaches targetDuration exactly.
 * 2. No BLOCK rules (Rule 1 category adjacency, Rule 2 explicit rivals, Rule 5 contract) are violated.
 */
export function countValidCompletions(
  currentPod: AdPod,
  availableBrands: BrandAd[]
): number {
  const targetDuration = currentPod.targetDuration;
  const currentSlots = currentPod.slots;
  
  // Calculate duration used so far
  const durationUsed = currentSlots.reduce((sum, s) => sum + s.duration, 0);
  const remainingDuration = targetDuration - durationUsed;

  // Filter pool of brands contractually eligible for this innings and break type
  const eligibleBrands = availableBrands.filter(b => 
    b.contract.allowedInnings.includes(currentPod.innings) &&
    b.contract.allowedBreakTypes.includes(currentPod.breakType)
  );

  // If already at target duration
  if (remainingDuration === 0) {
    // Check if the current full configuration has any internal BLOCK violations
    for (let i = 0; i < currentSlots.length; i++) {
      const b1 = currentSlots[i].brand;
      if (!b1) return 0;
      if (i > 0) {
        const b0 = currentSlots[i - 1].brand;
        if (b0) {
          if (b0.category === b1.category) return 0;
          if (b0.rivalBrandIds.includes(b1.id) || b1.rivalBrandIds.includes(b0.id)) return 0;
        }
      }
    }
    return 1;
  }

  if (remainingDuration < 0) return 0;

  // The last assigned brand in the current pod (if any)
  const lastAssignedBrand = currentSlots.length > 0 ? currentSlots[currentSlots.length - 1].brand : undefined;

  let completionCount = 0;
  // Maximum search depth guard to ensure instantaneous UI response (at most 5000 valid paths)
  const MAX_COUNT = 5000;

  function search(
    remDuration: number,
    prevBrand?: BrandAd,
    usedBrandIds: Set<string> = new Set()
  ): void {
    if (remDuration === 0) {
      completionCount++;
      return;
    }
    if (completionCount >= MAX_COUNT) return;

    const possibleDurations: SpotDuration[] = [15, 30, 45];
    for (const d of possibleDurations) {
      if (d <= remDuration) {
        for (const brand of eligibleBrands) {
          // Check if brand provides this duration
          if (!brand.availableDurations.includes(d)) continue;
          // Avoid duplicate brand within the same pod
          if (usedBrandIds.has(brand.id)) continue;

          // Rule 1: No category adjacency
          if (prevBrand && prevBrand.category === brand.category) continue;

          // Rule 2: No explicit rival neighbour
          if (prevBrand && (prevBrand.rivalBrandIds.includes(brand.id) || brand.rivalBrandIds.includes(prevBrand.id))) continue;

          usedBrandIds.add(brand.id);
          search(remDuration - d, brand, usedBrandIds);
          usedBrandIds.delete(brand.id);

          if (completionCount >= MAX_COUNT) return;
        }
      }
    }
  }

  // Pre-populate used brand IDs from already assigned slots
  const initialUsed = new Set<string>();
  for (const s of currentSlots) {
    if (s.brand) initialUsed.add(s.brand.id);
  }

  search(remainingDuration, lastAssignedBrand, initialUsed);
  return completionCount;
}
