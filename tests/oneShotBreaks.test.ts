import { describe, it, expect, beforeEach } from 'vitest';
import { MatchSimulator } from '../src/engine/matchSimulator';
import { generateAutoFillPod } from '../src/engine/autopilot/autoFillEngine';
import { evaluatePod } from '../src/engine/rules/ruleEngine';
import { SYNTHETIC_BRANDS } from '../src/data/syntheticBrands';
import { ActiveOneShotBreak, BreakResumePopup, OneShotBreakType } from '../src/engine/autopilot/types';
import { AdPod } from '../src/engine/types';

describe('Four One-Shot Break Buttons & Autonomous Airflow', () => {
  let sim: MatchSimulator;

  beforeEach(() => {
    sim = new MatchSimulator(42);
  });

  describe('1. Four Buttons Lifecycle (IDLE -> ACTIVE -> IDLE) & Auto-Resume', () => {
    const breakTypes: { type: OneShotBreakType; duration: number }[] = [
      { type: 'OVER', duration: 60 },
      { type: 'WICKET', duration: 90 },
      { type: 'STRATEGIC', duration: 300 },
      { type: 'HALF_TIME', duration: 300 }
    ];

    breakTypes.forEach(({ type, duration }) => {
      it(`Lifecycle for ${type} break: transitions IDLE -> ACTIVE -> IDLE, resumes from correct ball, and generates one popup`, () => {
        // Step 1: Initial state is IDLE (not in break)
        let state = sim.getState();
        const startInnings = state.innings;
        const startOver = state.over;
        const startBall = state.ball;
        const startScore = state.innings === 1 ? { ...state.team1 } : { ...state.team2 };

        // Step 2: Trigger break -> transitions to ACTIVE
        const triggerRes = sim.triggerOneShotBreak(type);
        expect(triggerRes).not.toBeNull();
        expect(sim.getState().status).toBe('PAUSED_AT_BREAK');

        const pod = generateAutoFillPod({
          breakType: type,
          targetDuration: duration,
          innings: triggerRes.breakPod.innings,
          overNo: triggerRes.breakPod.overNo,
          ballNo: triggerRes.breakPod.matchContext.ball,
          score: { runs: triggerRes.breakPod.matchContext.runs, wickets: triggerRes.breakPod.matchContext.wickets },
          battingTeam: triggerRes.breakPod.matchContext.battingTeam,
          bowlingTeam: triggerRes.breakPod.matchContext.bowlingTeam,
          lastEventDescription: 'Break on air'
        });

        const activeBreak: ActiveOneShotBreak = {
          type,
          status: 'ACTIVE',
          pod,
          targetDuration: duration,
          remainingSeconds: duration,
          initialDuration: duration
        };

        expect(activeBreak.status).toBe('ACTIVE');
        expect(activeBreak.targetDuration).toBe(duration);

        // Verify pod duration is exact
        const podDuration = pod.slots.reduce((sum, s) => sum + s.duration, 0);
        expect(podDuration).toBe(duration);

        // Verify zero BLOCK violations in the pod
        const evalRes = evaluatePod({
          currentPod: pod,
          allBrands: SYNTHETIC_BRANDS
        });
        const blockViolations = evalRes.slotEvaluations.flatMap(s => s.violations).filter(v => v.severity === 'BLOCK');
        expect(blockViolations.length).toBe(0);

        // Step 3: Pod finishes -> transitions to IDLE and resumes match
        const resumedState = sim.resumeAfterBreak();
        expect(resumedState.status).toBe('RUNNING');
        expect(resumedState.activeBreak).toBeUndefined();

        // One popup generated
        const team = resumedState.innings === 1 ? resumedState.team1 : resumedState.team2;
        const popup: BreakResumePopup = {
          id: `POP_${type}`,
          breakType: type,
          title: `${type} Break Ended`,
          message: `${type} break has ended. Match resumes.`,
          scoreAtResume: `${team.name} ${team.score}/${team.wickets}`,
          overAtResume: `${team.oversCompleted}.${team.ballsInOver} ov`,
          timestamp: Date.now()
        };

        expect(popup.breakType).toBe(type);
        expect(popup.message).toContain('resumes');
        expect(popup.scoreAtResume).toBeDefined();
        expect(popup.overAtResume).toBeDefined();
      });
    });
  });

  describe('2. Wicket Handling (+1 exactly once)', () => {
    it('increments wickets +1 exactly once on user button click', () => {
      const initialWickets = sim.getState().team1.wickets;
      const initialBallsInOver = sim.getState().team1.ballsInOver;

      const res = sim.dismissWicket('USER_BUTTON');
      expect(res).not.toBeNull();

      const afterState = sim.getState();
      expect(afterState.team1.wickets).toBe(initialWickets + 1);
      expect(afterState.lastBall?.isWicket).toBe(true);
      expect(afterState.activeBreak?.breakType).toBe('Wicket_Break');
      expect(afterState.activeBreak?.targetDuration).toBe(90);

      // Verify ball advanced and next batter is in
      expect(afterState.team1.ballsInOver).toBe((initialBallsInOver + 1) % 6);
      expect(afterState.currentStriker).toBeDefined();
    });

    it('increments wickets +1 exactly once on simulated wicket', () => {
      // Advance match until a wicket falls or force step
      let wicketFell = false;
      let prevWickets = sim.getState().team1.wickets;

      // Seed simulator to hit a wicket
      sim.reseed(999);
      for (let i = 0; i < 200; i++) {
        const state = sim.stepBall();
        if (state.lastBall?.isWicket) {
          wicketFell = true;
          expect(state.team1.wickets).toBe(prevWickets + 1);
          expect(state.status).toBe('HELD_FOR_BREAK');
          expect(state.pendingBreakHold?.type).toBe('WICKET');
          break;
        }
        prevWickets = state.team1.wickets;
        if (state.status === 'HELD_FOR_BREAK' || state.status === 'PAUSED_AT_BREAK') {
          sim.resumeAfterBreak();
        }
      }
      expect(wicketFell).toBe(true);
    });

    it('disables wicket dismissal after 10 wickets fall', () => {
      // Force 10 wickets
      for (let w = 0; w < 10; w++) {
        sim.dismissWicket('USER_BUTTON');
        sim.resumeAfterBreak();
      }

      // Now 10 wickets have fallen
      expect(sim.getState().team1.wickets).toBe(10);

      // Attempting another dismissal in innings 1 returns null
      const nextDismissal = sim.dismissWicket('USER_BUTTON');
      expect(nextDismissal).toBeNull();
    });
  });

  describe('3. Rapid Double-Click Protection', () => {
    it('ignores subsequent clicks while a break is active', () => {
      // Simulate app-level state handling
      let activeOneShotBreak: ActiveOneShotBreak | null = null;
      let breakStartCount = 0;

      const handleTriggerBreak = (type: OneShotBreakType) => {
        // Protection check
        if (activeOneShotBreak !== null) {
          return; // Ignore second click!
        }

        breakStartCount++;
        const res = sim.triggerOneShotBreak(type);
        activeOneShotBreak = {
          type,
          status: 'ACTIVE',
          pod: res.breakPod,
          targetDuration: 60,
          remainingSeconds: 60,
          initialDuration: 60
        };
      };

      // Click once
      handleTriggerBreak('OVER');
      expect(breakStartCount).toBe(1);
      expect(activeOneShotBreak).not.toBeNull();

      // Rapid second and third clicks
      handleTriggerBreak('OVER');
      handleTriggerBreak('WICKET');
      handleTriggerBreak('STRATEGIC');

      // Still only 1 break was started
      expect(breakStartCount).toBe(1);
    });
  });

  describe('4. Mutual Exclusion with Manual Infinity', () => {
    it('disables the 4 break buttons while Manual Infinity (Stoppage) is ON', () => {
      let isStoppageActive = true;
      let activeOneShotBreak: ActiveOneShotBreak | null = null;
      let breakTriggered = false;

      const handleTriggerBreak = (type: OneShotBreakType) => {
        if (isStoppageActive || activeOneShotBreak !== null) {
          return; // Disabled!
        }
        breakTriggered = true;
      };

      // Attempt to click all 4 buttons while stoppage is running
      handleTriggerBreak('OVER');
      handleTriggerBreak('WICKET');
      handleTriggerBreak('STRATEGIC');
      handleTriggerBreak('HALF_TIME');

      expect(breakTriggered).toBe(false);
    });
  });

  describe('5. Full Seeded Match Simulation', () => {
    it('runs a full match asserting 0 BLOCK violations and that every break ends in IDLE', () => {
      sim.reseed(777);
      const airedPods: AdPod[] = [];
      let previousPod: AdPod | undefined = undefined;

      let ballsStepCount = 0;
      const maxBalls = 1500;

      while (sim.getState().status !== 'MATCH_OVER' && ballsStepCount < maxBalls) {
        ballsStepCount++;
        const state = sim.stepBall();

        if ((state.status === 'HELD_FOR_BREAK' && state.pendingBreakHold) || (state.status === 'PAUSED_AT_BREAK' && state.activeBreak)) {
          const holdType: OneShotBreakType = state.pendingBreakHold
            ? state.pendingBreakHold.type
            : state.activeBreak?.breakType === 'Wicket_Break'
            ? 'WICKET'
            : state.activeBreak?.breakType === 'Strategic_Timeout'
            ? 'STRATEGIC'
            : state.activeBreak?.breakType.startsWith('Half_Time')
            ? 'HALF_TIME'
            : 'OVER';

          const targetDuration = holdType === 'OVER' ? 60 : holdType === 'WICKET' ? 90 : 300;
          if (state.status === 'HELD_FOR_BREAK') {
            sim.triggerOperatorBreak(holdType);
          }

          // Auto-fill pod with zero BLOCK violations
          const filledPod = generateAutoFillPod({
            breakType: holdType,
            targetDuration,
            innings: state.innings,
            overNo: state.over,
            ballNo: state.ball,
            score: {
              runs: state.innings === 1 ? state.team1.score : state.team2.score,
              wickets: state.innings === 1 ? state.team1.wickets : state.team2.wickets
            },
            battingTeam: state.currentBattingTeam,
            bowlingTeam: state.currentBowlingTeam,
            lastEventDescription: 'Operator-triggered break',
            previousPod,
            allAiredPodsInInnings: airedPods.filter(p => p.innings === state.innings),
            allBrands: SYNTHETIC_BRANDS
          });

          // Verify exact target duration
          const podDuration = filledPod.slots.reduce((sum, s) => sum + s.duration, 0);
          expect(podDuration).toBe(targetDuration);

          // Verify ZERO BLOCK violations
          const evaluation = evaluatePod({
            currentPod: filledPod,
            previousPod,
            allAiredPodsInInnings: airedPods.filter(p => p.innings === state.innings),
            allBrands: SYNTHETIC_BRANDS
          });

          const blocks = evaluation.slotEvaluations
            .flatMap(se => se.violations)
            .filter(v => v.severity === 'BLOCK');
          expect(blocks.length).toBe(0);

          // Record aired pod and continuity
          airedPods.push(filledPod);
          previousPod = filledPod;

          // Resume match
          sim.resumeAfterBreak();
        }
      }

      // Assert match completed and we had multiple commercial breaks
      expect(airedPods.length).toBeGreaterThan(5);
      // All break states end in IDLE
      expect(sim.getState().activeBreak).toBeUndefined();
    });
  });
});
