import { AdPod, BrandAd, BreakType, SpotDuration } from '../types';
import { generatePodSuggestions } from '../suggestions/suggestionEngine';
import { BROADCASTER_FILLERS } from './stoppageEngine';
import { OneShotBreakType } from './types';
import { SYNTHETIC_BRANDS } from '../../data/syntheticBrands';
import { getRankedPatterns, MixTally, INITIAL_MIX_TALLY } from '../patternEngine';

export interface AutoFillPodOptions {
  breakType: OneShotBreakType;
  targetDuration: number; // 60, 90, 300
  innings: 1 | 2;
  overNo: number;
  ballNo: number;
  score: { runs: number; wickets: number };
  battingTeam: string;
  bowlingTeam: string;
  lastEventDescription: string;
  previousPod?: AdPod;
  allAiredPodsInInnings?: AdPod[];
  allBrands?: BrandAd[];
  runningMixTally?: MixTally;
  onLogFiller?: (reason: string) => void;
}

export function generateAutoFillPod(options: AutoFillPodOptions): AdPod {
  const {
    breakType,
    targetDuration,
    innings,
    overNo,
    ballNo,
    score,
    battingTeam,
    bowlingTeam,
    lastEventDescription,
    previousPod,
    allAiredPodsInInnings = [],
    allBrands = SYNTHETIC_BRANDS,
    runningMixTally = INITIAL_MIX_TALLY,
    onLogFiller
  } = options;

  let mappedBreakType: BreakType = 'Over_Break';
  if (breakType === 'WICKET') mappedBreakType = 'Wicket_Break';
  else if (breakType === 'STRATEGIC') mappedBreakType = 'Strategic_Timeout';
  else if (breakType === 'HALF_TIME') mappedBreakType = 'Half_Time_Break_Part1';

  // Construct draft template pod
  const podId = `POD_AUTO_${Date.now().toString(36).toUpperCase()}`;
  const templatePod: AdPod = {
    id: podId,
    innings,
    overNo,
    breakType: mappedBreakType,
    targetDuration,
    timestamp: new Date().toLocaleTimeString(),
    isAired: false,
    matchContext: {
      innings,
      over: overNo,
      ball: ballNo,
      battingTeam,
      bowlingTeam,
      runs: score.runs,
      wickets: score.wickets,
      lastEvent: lastEventDescription,
      wicketJustFell: breakType === 'WICKET',
      favouriteWicketFell: breakType === 'WICKET' && (overNo === 5 || overNo === 17 || overNo === 35),
      runRate: overNo > 0 ? Number((score.runs / overNo).toFixed(2)) : 0
    },
    slots: []
  };

  // Stage A & B: Solve using suggestion engine with candidate patterns nudged to 35/50/15 mix
  const suggestions = generatePodSuggestions({
    currentPod: templatePod,
    previousPod,
    allAiredPodsInInnings,
    allBrands,
    maxSuggestions: 1,
    runningMixTally
  });

  if (suggestions.length > 0) {
    const best = suggestions[0];
    return {
      ...templatePod,
      isAired: true,
      slots: best.slots.map(s => ({
        slotNumber: s.slotNumber,
        duration: s.duration,
        brand: s.brand
      }))
    };
  }

  // FALLBACK: When commercial inventory is constrained or no zero-BLOCK pod exists,
  // schedule Broadcaster House Promos & PSAs using the SAME diverse duration pattern (Stage A)
  const prevPattern = previousPod ? previousPod.slots.map(s => s.duration) : undefined;
  const candidatePatterns = getRankedPatterns(targetDuration, prevPattern, runningMixTally, overNo);
  const chosenPattern: SpotDuration[] = candidatePatterns.length > 0
    ? candidatePatterns[0]
    : ([30, 30] as SpotDuration[]);

  const reason = `No zero-BLOCK commercial permutation found for ${targetDuration}s ${breakType} break`;
  if (onLogFiller) {
    onLogFiller(`FILLER USED: ${reason}`);
  }

  const slots: { slotNumber: number; duration: SpotDuration; brand: BrandAd }[] = [];
  let prevFillerCat = '';

  for (let i = 0; i < chosenPattern.length; i++) {
    const spotDuration = chosenPattern[i];
    // Pick filler that supports spotDuration and avoids same category as previous slot
    const suitableFillers = BROADCASTER_FILLERS.filter(f =>
      f.availableDurations.includes(spotDuration) && f.category !== prevFillerCat
    );
    const chosenFiller = suitableFillers.length > 0
      ? suitableFillers[i % suitableFillers.length]
      : BROADCASTER_FILLERS[i % BROADCASTER_FILLERS.length];

    prevFillerCat = chosenFiller.category;

    slots.push({
      slotNumber: i + 1,
      duration: spotDuration,
      brand: chosenFiller
    });
  }

  return {
    ...templatePod,
    isAired: true,
    slots
  };
}
