import { describe, it, expect, beforeEach } from 'vitest';
import { MatchSimulator } from '../src/engine/matchSimulator';
import { generateAutoFillPod } from '../src/engine/autopilot/autoFillEngine';
import { evaluatePod } from '../src/engine/rules/ruleEngine';
import { SYNTHETIC_BRANDS } from '../src/data/syntheticBrands';
import {
  enumerateCompositions,
  isValidPattern,
  getRankedPatterns,
  INITIAL_MIX_TALLY,
  updateMixTally,
  MixTally
} from '../src/engine/patternEngine';
import { AdPod, SpotDuration } from '../src/engine/types';
import { OneShotBreakType } from '../src/engine/autopilot/types';

describe('Operator-Triggered Breaks & Spot Duration Mix (35/50/15)', () => {
  let sim: MatchSimulator;

  beforeEach(() => {
    sim = new MatchSimulator(42);
  });

  describe('1. Breaks are Triggered ONLY by Operator', () => {
    it('holds at over boundaries and does not advance without operator action', () => {
      // Step through first over (6 legal balls)
      let state = sim.getState();
      while (state.team1.oversCompleted === 0 && state.status !== 'HELD_FOR_BREAK') {
        state = sim.stepBall();
      }

      // Assert it holds at over boundary
      expect(state.status).toBe('HELD_FOR_BREAK');
      expect(state.pendingBreakHold).not.toBeNull();
      expect(state.pendingBreakHold?.type).toBe('OVER');
      expect(state.pendingBreakHold?.reasonText).toContain('Over complete');

      // Next stepBall does NOT advance play because it's held
      const nextAttempt = sim.stepBall();
      expect(nextAttempt.status).toBe('HELD_FOR_BREAK');
      expect(nextAttempt.team1.oversCompleted).toBe(1);
      expect(nextAttempt.team1.ballsInOver).toBe(0);

      // No active break was created automatically
      expect(nextAttempt.activeBreak).toBeUndefined();
    });

    it('holds at simulated wicket without auto-airing ads', () => {
      // Run until wicket
      let state = sim.getState();
      let steps = 0;
      while (steps < 200) {
        state = sim.stepBall();
        steps++;
        if (state.lastBall?.isWicket) break;
        if (state.status === 'HELD_FOR_BREAK') {
          // Resume past over boundaries
          sim.skipPendingBreak();
        }
      }

      expect(state.lastBall?.isWicket).toBe(true);
      expect(state.status).toBe('HELD_FOR_BREAK');
      expect(state.pendingBreakHold?.type).toBe('WICKET');
      expect(state.pendingBreakHold?.reasonText).toContain('awaiting Wicket Break');
      expect(state.activeBreak).toBeUndefined();
    });

    it('"Continue without ads" skip button resumes match and logs skip', () => {
      // Advance to over boundary hold
      let state = sim.getState();
      while (state.status !== 'HELD_FOR_BREAK') {
        state = sim.stepBall();
      }

      expect(state.status).toBe('HELD_FOR_BREAK');

      // Operator clicks "Continue without ads"
      const res = sim.skipPendingBreak();
      expect(res).not.toBeNull();
      expect(res?.reason).toContain('Break skipped by operator');
      expect(res?.state.status).toBe('RUNNING');
      expect(res?.state.pendingBreakHold).toBeNull();
      expect(res?.state.commentaryLog[0]).toContain('[OPERATOR ACTION]: Break skipped by operator');

      // Play can now continue
      const nextBall = sim.stepBall();
      expect(nextBall.status).toBe('RUNNING');
    });
  });

  describe('2. Wicket Idempotency & Single-Count Accounting', () => {
    it('increments wickets +1 exactly once when simulated wicket falls and operator clicks Wicket Break', () => {
      sim.reseed(999);
      let state = sim.getState();
      while (state.status !== 'HELD_FOR_BREAK' || state.pendingBreakHold?.type !== 'WICKET') {
        state = sim.stepBall();
        if (state.status === 'HELD_FOR_BREAK' && state.pendingBreakHold?.type !== 'WICKET') {
          sim.skipPendingBreak();
        }
      }

      const wicketsBeforeClick = state.team1.wickets;
      expect(state.pendingBreakHold?.type).toBe('WICKET');

      // Operator clicks Wicket Break button
      const breakRes = sim.triggerOperatorBreak('WICKET');
      expect(breakRes.state.team1.wickets).toBe(wicketsBeforeClick); // MUST NOT increment again!
      expect(breakRes.state.status).toBe('PAUSED_AT_BREAK');
      expect(breakRes.breakPod.breakType).toBe('Wicket_Break');
      expect(breakRes.breakPod.targetDuration).toBe(90);

      // Resume after break
      const resumed = sim.resumeAfterBreak();
      expect(resumed.status).toBe('RUNNING');
      expect(resumed.team1.wickets).toBe(wicketsBeforeClick);
    });

    it('increments wickets +1 once when operator clicks Wicket Break with NO pending wicket (manual wicket)', () => {
      const initialWickets = sim.getState().team1.wickets;
      expect(sim.getState().pendingBreakHold).toBeNull();

      // Operator clicks manual Wicket Break
      const breakRes = sim.triggerOperatorBreak('WICKET');
      expect(breakRes.state.team1.wickets).toBe(initialWickets + 1);
      expect(breakRes.state.status).toBe('PAUSED_AT_BREAK');
      expect(breakRes.breakPod.breakType).toBe('Wicket_Break');
      expect(breakRes.breakPod.targetDuration).toBe(90);
    });

    it('disables Wicket button at 10 wickets', () => {
      for (let i = 0; i < 10; i++) {
        sim.triggerOperatorBreak('WICKET');
        sim.resumeAfterBreak();
      }

      expect(sim.getState().team1.wickets).toBe(10);

      // Attempting 11th wicket should not increment
      const overTenRes = sim.triggerOperatorBreak('WICKET');
      expect(overTenRes.state.team1.wickets).toBe(10);
    });
  });

  describe('3. Spot-Duration Mix (35% x 15s, 50% x 30s, 15% x 45s) & Ordered Compositions', () => {
    it('ordered composition generator satisfies hard constraints: >=2 distinct lengths and run-length <= 2', () => {
      for (const targetDur of [60, 90, 300]) {
        const patterns = getRankedPatterns(targetDur);
        expect(patterns.length).toBeGreaterThan(0);

        for (const pattern of patterns) {
          // Exact sum
          const sum = pattern.reduce((acc, d) => acc + d, 0);
          expect(sum).toBe(targetDur);

          // Hard Rule 1: At least 2 distinct spot lengths
          const distinct = new Set(pattern);
          expect(distinct.size).toBeGreaterThanOrEqual(2);

          // Hard Rule 2: No more than 2 identical lengths in a row
          let maxRun = 0;
          let curRun = 0;
          let lastDur: number | null = null;
          for (const d of pattern) {
            if (d === lastDur) curRun++;
            else {
              curRun = 1;
              lastDur = d;
            }
            if (curRun > maxRun) maxRun = curRun;
          }
          expect(maxRun).toBeLessThanOrEqual(2);
        }
      }
    });

    it('enforces derangement: next pod pattern differs from previous pod pattern', () => {
      const p1 = [15, 45] as SpotDuration[];
      const patterns = getRankedPatterns(60, p1);
      expect(patterns.length).toBeGreaterThan(0);

      // First ranked candidate should not be identical to p1
      expect(patterns[0]).not.toEqual(p1);
    });

    it('1,000-pod benchmark: 100% exact sum, 100% valid patterns, and mix within ±10% of target', () => {
      let mixTally: MixTally = { ...INITIAL_MIX_TALLY };
      let previousPattern: SpotDuration[] | undefined = undefined;

      const durationsList = [60, 90, 60, 60, 90, 60, 300]; // Realistic ODI break mix

      for (let i = 0; i < 1000; i++) {
        const targetDuration = durationsList[i % durationsList.length];
        const ranked = getRankedPatterns(targetDuration, previousPattern, mixTally, i);
        expect(ranked.length).toBeGreaterThan(0);

        const chosen = ranked[0];

        // 1. Exact sum
        const sum = chosen.reduce((acc, d) => acc + d, 0);
        expect(sum).toBe(targetDuration);

        // 2. >= 2 distinct lengths
        const distinct = new Set(chosen);
        expect(distinct.size).toBeGreaterThanOrEqual(2);

        // 3. run-length <= 2
        let curRun = 0;
        let lastDur: number | null = null;
        for (const d of chosen) {
          if (d === lastDur) curRun++;
          else {
            curRun = 1;
            lastDur = d;
          }
          expect(curRun).toBeLessThanOrEqual(2);
        }

        // 4. Derangement from previous
        if (previousPattern && chosen.length === previousPattern.length) {
          const isIdentical = chosen.every((d, idx) => d === previousPattern![idx]);
          expect(isIdentical).toBe(false);
        }

        // Update mix tally
        mixTally = updateMixTally(mixTally, chosen);
        previousPattern = chosen;
      }

      // Assert total spots
      expect(mixTally.totalSpots).toBeGreaterThan(2000);

      const pct15 = (mixTally.count15 / mixTally.totalSpots) * 100;
      const pct30 = (mixTally.count30 / mixTally.totalSpots) * 100;
      const pct45 = (mixTally.count45 / mixTally.totalSpots) * 100;

      // Target: 35% x 15s (tolerance: ±10% -> 25% to 45%)
      expect(pct15).toBeGreaterThanOrEqual(25);
      expect(pct15).toBeLessThanOrEqual(45);

      // Target: 50% x 30s (tolerance: ±10% -> 40% to 60%)
      expect(pct30).toBeGreaterThanOrEqual(40);
      expect(pct30).toBeLessThanOrEqual(60);

      // Target: 15% x 45s (tolerance: ±10% -> 5% to 25%)
      expect(pct45).toBeGreaterThanOrEqual(5);
      expect(pct45).toBeLessThanOrEqual(25);
    });
  });

  describe('4. Full Seeded Match Simulation with Operator Breaks', () => {
    it('simulates a match where operator triggers breaks, producing 0 BLOCK violations and correct duration mix', () => {
      sim.reseed(1234);
      let mixTally: MixTally = { ...INITIAL_MIX_TALLY };
      const airedPods: AdPod[] = [];
      let previousPod: AdPod | undefined = undefined;

      let steps = 0;
      while (sim.getState().status !== 'MATCH_OVER' && steps < 1200) {
        steps++;
        const state = sim.stepBall();

        if (state.status === 'HELD_FOR_BREAK' && state.pendingBreakHold) {
          const holdType = state.pendingBreakHold.type;
          const { breakPod } = sim.triggerOperatorBreak(holdType);

          const filledPod = generateAutoFillPod({
            breakType: holdType,
            targetDuration: breakPod.targetDuration,
            innings: breakPod.innings,
            overNo: breakPod.overNo,
            ballNo: state.ball,
            score: {
              runs: state.innings === 1 ? state.team1.score : state.team2.score,
              wickets: state.innings === 1 ? state.team1.wickets : state.team2.wickets
            },
            battingTeam: state.currentBattingTeam,
            bowlingTeam: state.currentBowlingTeam,
            lastEventDescription: 'Operator break',
            previousPod,
            allAiredPodsInInnings: airedPods.filter(p => p.innings === state.innings),
            allBrands: SYNTHETIC_BRANDS,
            runningMixTally: mixTally
          });

          // Assert zero BLOCK violations
          const evalRes = evaluatePod({
            currentPod: filledPod,
            previousPod,
            allAiredPodsInInnings: airedPods.filter(p => p.innings === state.innings),
            allBrands: SYNTHETIC_BRANDS
          });

          const blocks = evalRes.slotEvaluations
            .flatMap(se => se.violations)
            .filter(v => v.severity === 'BLOCK');
          expect(blocks.length).toBe(0);

          // Assert exact duration
          const sum = filledPod.slots.reduce((acc, s) => acc + s.duration, 0);
          expect(sum).toBe(breakPod.targetDuration);

          // Update tracking
          airedPods.push(filledPod);
          previousPod = filledPod;
          mixTally = updateMixTally(mixTally, filledPod.slots.map(s => s.duration));

          // Resume match
          sim.resumeAfterBreak();
        }
      }

      expect(airedPods.length).toBeGreaterThan(5);
      expect(mixTally.totalSpots).toBeGreaterThan(15);
      expect(mixTally.count15).toBeGreaterThan(0);
      expect(mixTally.count30).toBeGreaterThan(0);
      expect(mixTally.count45).toBeGreaterThan(0);
    });
  });
});
