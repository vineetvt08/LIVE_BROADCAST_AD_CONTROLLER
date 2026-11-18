import { describe, it, expect } from 'vitest';
import { evaluatePod } from '../src/engine/rules/ruleEngine';
import { AdPod } from '../src/engine/types';
import { findBrandByName } from '../src/data/syntheticBrands';

describe('Defensive Rule Engine', () => {
  const maruti = findBrandByName('Maruti_Suzuki')!;
  const hyundai = findBrandByName('Hyundai')!;
  const sprite = findBrandByName('Sprite')!;
  const lic = findBrandByName('LIC')!;

  it('BLOCKS same-category adjacency (Rule 1)', () => {
    const testPod: AdPod = {
      id: 'TEST_01',
      innings: 1,
      overNo: 1,
      breakType: 'Over_Break',
      targetDuration: 60,
      matchContext: {
        innings: 1,
        over: 1,
        ball: 0,
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        runs: 10,
        wickets: 0,
        lastEvent: 'End of Over',
        wicketJustFell: false,
        favouriteWicketFell: false,
        runRate: 6.0
      },
      slots: [
        { slotNumber: 1, duration: 30, brand: maruti }, // Auto
        { slotNumber: 2, duration: 30, brand: hyundai }  // Auto
      ]
    };

    const evaluation = evaluatePod({ currentPod: testPod });
    expect(evaluation.hasBlockingViolations).toBe(true);
    expect(evaluation.isValidForAir).toBe(false);
    expect(evaluation.allViolations.some(v => v.ruleId === 'RULE_1_SAME_CATEGORY_ADJACENCY')).toBe(true);
  });

  it('BLOCKS explicit rival neighbour list (Rule 2)', () => {
    // Maruti and Hyundai are also listed rivals
    const testPod: AdPod = {
      id: 'TEST_02',
      innings: 1,
      overNo: 1,
      breakType: 'Over_Break',
      targetDuration: 60,
      matchContext: {
        innings: 1,
        over: 1,
        ball: 0,
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        runs: 10,
        wickets: 0,
        lastEvent: 'End of Over',
        wicketJustFell: false,
        favouriteWicketFell: false,
        runRate: 6.0
      },
      slots: [
        { slotNumber: 1, duration: 30, brand: maruti },
        { slotNumber: 2, duration: 30, brand: hyundai }
      ]
    };

    const evaluation = evaluatePod({ currentPod: testPod });
    expect(evaluation.allViolations.some(v => v.ruleId === 'RULE_2_EXPLICIT_RIVAL')).toBe(true);
  });

  it('WARNS on cross-pod positional rook collision (Rule 3)', () => {
    const prevPod: AdPod = {
      id: 'PREV_01',
      innings: 1,
      overNo: 1,
      breakType: 'Over_Break',
      targetDuration: 60,
      matchContext: {} as any,
      slots: [
        { slotNumber: 1, duration: 30, brand: maruti }, // Auto in slot 1
        { slotNumber: 2, duration: 30, brand: sprite }  // Beverage in slot 2
      ]
    };

    const currPod: AdPod = {
      id: 'CURR_01',
      innings: 1,
      overNo: 2,
      breakType: 'Over_Break',
      targetDuration: 60,
      matchContext: {
        innings: 1,
        over: 2,
        ball: 0,
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        runs: 20,
        wickets: 0,
        lastEvent: 'End of Over',
        wicketJustFell: false,
        favouriteWicketFell: false,
        runRate: 6.5
      },
      slots: [
        { slotNumber: 1, duration: 30, brand: hyundai }, // Auto again in slot 1!
        { slotNumber: 2, duration: 30, brand: lic }      // Insurance
      ]
    };

    const evaluation = evaluatePod({ currentPod: currPod, previousPod: prevPod });
    expect(evaluation.allViolations.some(v => v.ruleId === 'RULE_3_CROSS_POD_ROOK')).toBe(true);
  });

  it('BLOCKS duration mismatch at Go Live (Rule 7)', () => {
    const testPod: AdPod = {
      id: 'TEST_03',
      innings: 1,
      overNo: 1,
      breakType: 'Over_Break',
      targetDuration: 60,
      matchContext: {
        innings: 1,
        over: 1,
        ball: 0,
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        runs: 10,
        wickets: 0,
        lastEvent: 'End of Over',
        wicketJustFell: false,
        favouriteWicketFell: false,
        runRate: 6.0
      },
      slots: [
        { slotNumber: 1, duration: 30, brand: maruti } // Only 30s instead of 60s
      ]
    };

    const evaluation = evaluatePod({ currentPod: testPod });
    expect(evaluation.allViolations.some(v => v.ruleId === 'RULE_7_DURATION_BUDGET')).toBe(true);
    expect(evaluation.isValidForAir).toBe(false);
  });

  it('Allows valid diverse pod with no violations', () => {
    const testPod: AdPod = {
      id: 'TEST_VALID',
      innings: 1,
      overNo: 1,
      breakType: 'Over_Break',
      targetDuration: 60,
      matchContext: {
        innings: 1,
        over: 1,
        ball: 0,
        battingTeam: 'India',
        bowlingTeam: 'Australia',
        runs: 10,
        wickets: 0,
        lastEvent: 'End of Over',
        wicketJustFell: false,
        favouriteWicketFell: false,
        runRate: 6.0
      },
      slots: [
        { slotNumber: 1, duration: 30, brand: maruti }, // Auto
        { slotNumber: 2, duration: 30, brand: sprite }  // Beverage
      ]
    };

    const evaluation = evaluatePod({ currentPod: testPod });
    expect(evaluation.hasBlockingViolations).toBe(false);
    expect(evaluation.isValidForAir).toBe(true);
  });
});
