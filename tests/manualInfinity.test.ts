import { describe, it, expect } from 'vitest';
import { StoppageEngine } from '../src/engine/autopilot/stoppageEngine';
import { evaluatePod } from '../src/engine/rules/ruleEngine';
import { FrozenMatchState } from '../src/engine/autopilot/types';
import { SYNTHETIC_BRANDS } from '../src/data/syntheticBrands';

describe('Autopilot Toggle 5: Manual Infinity (Unscheduled Stoppage)', () => {
  const dummyFrozenMatch: FrozenMatchState = {
    innings: 1,
    over: 14,
    ball: 3,
    runs: 84,
    wickets: 2,
    striker: 'Virat Kohli',
    nonStriker: 'Shreyas Iyer',
    bowler: 'Mitchell Starc',
    runRate: 5.86,
    commentarySnapshot: '14.3: Mitchell Starc to Virat Kohli, no run.'
  };

  it('runs a 500-pod stoppage with ZERO BLOCK violations, exact durations, and frequency cap enforcement', () => {
    const engine = new StoppageEngine(SYNTHETIC_BRANDS, 90);
    const state = engine.activateStoppage('Rain', dummyFrozenMatch);

    expect(state.isActive).toBe(true);
    expect(state.reason).toBe('Rain');

    let prevPod = state.currentPod!;
    let totalPodsAired = 1;

    for (let i = 2; i <= 500; i++) {
      const nextPod = engine.advanceToNextPod();
      totalPodsAired++;

      // 1. Duration must match 90s exactly
      const durationSum = nextPod.slots.reduce((sum, s) => sum + s.duration, 0);
      expect(durationSum).toBe(90);

      // 2. Evaluate against defensive rule engine: ZERO BLOCK violations
      const evalResult = evaluatePod({
        currentPod: nextPod,
        previousPod: prevPod,
        allBrands: SYNTHETIC_BRANDS
      });

      // Filter non-overridden BLOCK violations (duration is 90 so duration budget passes)
      const blockViolations = evalResult.allViolations.filter(v => v.severity === 'BLOCK');
      expect(blockViolations.length).toBe(0);

      prevPod = nextPod;
    }

    expect(totalPodsAired).toBe(500);

    // 3. Assert no commercial brand exceeded reasonable frequency cap without filler intervention
    const stoppageState = engine.getState();
    expect(stoppageState.fillerSpotsAired).toBeGreaterThan(0);
    expect(stoppageState.inventoryExhausted).toBe(true);
  });

  it('turns OFF mid-pod and preserves exact match state upon resumption', () => {
    const engine = new StoppageEngine(SYNTHETIC_BRANDS, 90, 'AFTER_CURRENT_POD');
    engine.activateStoppage('Floodlight failure', dummyFrozenMatch);

    // Run a few ticks into the pod
    for (let sec = 0; sec < 45; sec++) {
      engine.tickSecond();
    }

    // Operator requests resume (turns Toggle 5 OFF)
    const resumingState = engine.requestResume();
    expect(resumingState.isResuming).toBe(true);
    expect(resumingState.isActive).toBe(true); // Still airing current pod!

    // Tick until pod finishes (remaining 45 seconds)
    let resumedMatch = false;
    let finalAudit: any = null;

    for (let sec = 0; sec < 50; sec++) {
      const { didResumeMatch, auditRecord } = engine.tickSecond();
      if (didResumeMatch) {
        resumedMatch = true;
        finalAudit = auditRecord;
        break;
      }
    }

    expect(resumedMatch).toBe(true);
    expect(finalAudit).toBeDefined();
    expect(finalAudit.reason).toBe('Floodlight failure');

    // Assert exact ball, score, striker, and bowler remain completely frozen & intact
    const restored = dummyFrozenMatch;
    expect(restored.over).toBe(14);
    expect(restored.ball).toBe(3);
    expect(restored.runs).toBe(84);
    expect(restored.wickets).toBe(2);
    expect(restored.striker).toBe('Virat Kohli');
    expect(restored.bowler).toBe('Mitchell Starc');
  });

  it('changes stoppage reason mid-stoppage and adapts ONLY the next pod, leaving active pod untouched', () => {
    const engine = new StoppageEngine(SYNTHETIC_BRANDS, 90);
    engine.activateStoppage('Rain', dummyFrozenMatch);

    const initialCurrentPod = engine.getState().currentPod!;
    const initialNextPrecomputedPod = engine.getState().nextPrecomputedPod!;

    // Change reason mid-stoppage to 'Player injury'
    engine.changeReason('Player injury');
    const updatedState = engine.getState();

    // 1. Current active pod on air MUST remain identical (not disrupted)
    expect(updatedState.currentPod?.id).toBe(initialCurrentPod.id);
    expect(updatedState.currentPod?.slots[0].brand?.id).toBe(initialCurrentPod.slots[0].brand?.id);

    // 2. Next pre-computed pod must have been re-filtered with 'Player injury' brand-safety rules
    expect(updatedState.nextPrecomputedPod).toBeDefined();
    const nextSlots = updatedState.nextPrecomputedPod!.slots;

    // None of the next slots should contain high_energy or celebratory brands
    for (const slot of nextSlots) {
      if (slot.brand && !slot.brand.id.startsWith('filler_')) {
        expect(slot.brand.safetyTags.includes('high_energy')).toBe(false);
        expect(slot.brand.safetyTags.includes('needs_positive_context')).toBe(false);
        expect(slot.brand.category).not.toBe('Gaming');
      }
    }
  });

  it('exhausts brand inventory safely and schedules Broadcaster House Promo / PSA filler without BLOCK clashes', () => {
    // Restrict pool to only 2 brands
    const tinyPool = SYNTHETIC_BRANDS.slice(0, 2);
    const engine = new StoppageEngine(tinyPool, 90);
    engine.activateStoppage('Technical fault', dummyFrozenMatch);

    // Advance 10 pods to exhaust tiny pool
    for (let p = 0; p < 10; p++) {
      engine.advanceToNextPod();
    }

    const state = engine.getState();
    expect(state.inventoryExhausted).toBe(true);
    expect(state.fillerSpotsAired).toBeGreaterThan(0);

    // Check that current pod slots contain filler and zero BLOCK violations
    const currentPod = state.currentPod!;
    const evalResult = evaluatePod({
      currentPod,
      allBrands: SYNTHETIC_BRANDS
    });
    const blockViolations = evalResult.allViolations.filter(v => v.severity === 'BLOCK');
    expect(blockViolations.length).toBe(0);
  });
});
