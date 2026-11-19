import { describe, it, expect, beforeEach } from 'vitest';
import { MatchSimulator } from '../src/engine/matchSimulator';
import { generateAutoFillPod } from '../src/engine/autopilot/autoFillEngine';
import { SYNTHETIC_BRANDS } from '../src/data/syntheticBrands';
import { OneShotBreakType, ActiveOneShotBreak, BreakResumePopup } from '../src/engine/autopilot/types';

describe('Hold-Point Matrix & Break Button Enablement', () => {
  let sim: MatchSimulator;

  beforeEach(() => {
    sim = new MatchSimulator(42);
  });

  // Helper simulating the Header enablement and tooltip rules
  function getButtonStates(simState: ReturnType<typeof sim.getState>, activeBreak: ActiveOneShotBreak | null = null) {
    const isMatchOver = simState.status === 'MATCH_OVER';
    const isBreakActive = activeBreak !== null;
    const pendingHold = simState.pendingBreakHold;
    const holdState = pendingHold?.holdState;
    const currentWickets = simState.innings === 1 ? simState.team1.wickets : simState.team2.wickets;

    // Over Break (60s)
    let isOverDisabled = false;
    let overTitle = '';
    if (isBreakActive) {
      isOverDisabled = true;
      overTitle = 'A break is already on air.';
    } else if (isMatchOver) {
      isOverDisabled = true;
      overTitle = 'Match is concluded.';
    } else if (holdState === 'STATE_A') {
      isOverDisabled = false;
      overTitle = 'Over complete: click to broadcast 60s Over Break';
    } else if (holdState === 'STATE_C') {
      isOverDisabled = false;
      overTitle = 'Wicket on the last ball: click to broadcast 60s Over Break';
    } else if (holdState === 'STATE_B') {
      isOverDisabled = true;
      overTitle = 'Over has not ended. Over Break and Strategic Timeout are available at the over boundary.';
    } else {
      isOverDisabled = true;
      overTitle = 'Match is mid-over. Breaks can start when the over ends.';
    }

    // Strategic Timeout (300s)
    let isStrategicDisabled = false;
    let strategicTitle = '';
    if (isBreakActive) {
      isStrategicDisabled = true;
      strategicTitle = 'A break is already on air.';
    } else if (isMatchOver) {
      isStrategicDisabled = true;
      strategicTitle = 'Match is concluded.';
    } else if (holdState === 'STATE_A') {
      isStrategicDisabled = false;
      strategicTitle = 'Click to broadcast 300s Strategic Timeout';
    } else if (holdState === 'STATE_C') {
      isStrategicDisabled = false;
      strategicTitle = 'Wicket on the last ball: click to broadcast 300s Strategic Timeout';
    } else if (holdState === 'STATE_B') {
      isStrategicDisabled = true;
      strategicTitle = 'Over has not ended. Over Break and Strategic Timeout are available at the over boundary.';
    } else {
      isStrategicDisabled = true;
      strategicTitle = 'Match is mid-over. Breaks can start when the over ends.';
    }

    // Wicket Break (90s)
    let isWicketDisabled = false;
    let wicketTitle = '';
    if (currentWickets >= 10) {
      isWicketDisabled = true;
      wicketTitle = 'All 10 wickets fallen.';
    } else if (isBreakActive) {
      isWicketDisabled = true;
      wicketTitle = 'A break is already on air.';
    } else if (isMatchOver) {
      isWicketDisabled = true;
      wicketTitle = 'Match is concluded.';
    } else if (holdState === 'STATE_A') {
      isWicketDisabled = true;
      wicketTitle = 'No wicket is pending.';
    } else if (holdState === 'HALF_TIME') {
      isWicketDisabled = true;
      wicketTitle = 'Innings completed. Half-time break is pending.';
    } else if (holdState === 'STATE_B') {
      isWicketDisabled = false;
      wicketTitle = 'Wicket fell mid-over: click to broadcast 90s Wicket Break';
    } else if (holdState === 'STATE_C') {
      isWicketDisabled = false;
      wicketTitle = 'Wicket on the last ball: click to broadcast 90s Wicket Break';
    } else {
      isWicketDisabled = false;
      wicketTitle = 'Click to record a wicket (+1 Wkt) and broadcast 90s Wicket Break';
    }

    // Half-time Break (300s)
    let isHalfTimeDisabled = false;
    let halfTimeTitle = '';
    if (isBreakActive) {
      isHalfTimeDisabled = true;
      halfTimeTitle = 'A break is already on air.';
    } else if (isMatchOver) {
      isHalfTimeDisabled = true;
      halfTimeTitle = 'Match is concluded.';
    } else if (pendingHold?.type === 'HALF_TIME') {
      isHalfTimeDisabled = false;
      halfTimeTitle = 'Innings complete: click to broadcast 300s Half-time break';
    } else {
      isHalfTimeDisabled = true;
      halfTimeTitle = 'Half-time is available after the first innings.';
    }

    return {
      over: { disabled: isOverDisabled, title: overTitle },
      strategic: { disabled: isStrategicDisabled, title: strategicTitle },
      wicket: { disabled: isWicketDisabled, title: wicketTitle },
      halfTime: { disabled: isHalfTimeDisabled, title: halfTimeTitle }
    };
  }

  describe('State A: Over complete, no wicket on last ball', () => {
    it('enables Over Break and Strategic Timeout, disables Wicket Break', () => {
      // Step to end of first over with no wicket
      let state = sim.getState();
      while (state.status !== 'HELD_FOR_BREAK') {
        state = sim.stepBall();
        if (state.lastBall?.isWicket) {
          sim.reseed(123); // find clean over
          state = sim.getState();
        }
      }

      expect(state.pendingBreakHold?.holdState).toBe('STATE_A');
      const buttons = getButtonStates(state);

      expect(buttons.over.disabled).toBe(false);
      expect(buttons.strategic.disabled).toBe(false);
      expect(buttons.wicket.disabled).toBe(true);
      expect(buttons.wicket.title).toBe('No wicket is pending.');
      expect(buttons.halfTime.disabled).toBe(true);
    });
  });

  describe('State B: Wicket fell mid-over (not the last ball)', () => {
    it('enables Wicket Break only; Over and Strategic are disabled with explanatory tooltip', () => {
      // Run until a wicket falls mid-over (ballsInOver > 0)
      let state = sim.getState();
      let steps = 0;
      while (steps < 300) {
        state = sim.stepBall();
        steps++;
        if (state.status === 'HELD_FOR_BREAK') {
          if (state.pendingBreakHold?.holdState === 'STATE_B') break;
          sim.skipPendingBreak();
        }
      }

      expect(state.pendingBreakHold?.holdState).toBe('STATE_B');
      expect(state.team1.ballsInOver).toBeGreaterThan(0);

      const buttons = getButtonStates(state);
      expect(buttons.wicket.disabled).toBe(false);
      expect(buttons.over.disabled).toBe(true);
      expect(buttons.over.title).toBe('Over has not ended. Over Break and Strategic Timeout are available at the over boundary.');
      expect(buttons.strategic.disabled).toBe(true);
      expect(buttons.strategic.title).toBe('Over has not ended. Over Break and Strategic Timeout are available at the over boundary.');
    });
  });

  describe('State C: Wicket fell on the LAST ball of an over', () => {
    function advanceToStateC(): MatchSimulator {
      // Find seed that produces a last-ball wicket
      for (let s = 1; s < 500; s++) {
        const testSim = new MatchSimulator(s);
        for (let b = 0; b < 100; b++) {
          const st = testSim.stepBall();
          if (st.status === 'HELD_FOR_BREAK') {
            if (st.pendingBreakHold?.holdState === 'STATE_C') {
              return testSim;
            }
            testSim.skipPendingBreak();
          }
        }
      }
      throw new Error('State C not found in search');
    }

    it('enables Wicket Break, Over Break and Strategic Timeout together', () => {
      const cSim = advanceToStateC();
      const state = cSim.getState();

      expect(state.pendingBreakHold?.holdState).toBe('STATE_C');
      expect(state.pendingBreakHold?.reasonText).toBe(
        'Wicket on the last ball: choose Wicket Break, Over Break or Strategic Timeout'
      );
      expect(state.team1.ballsInOver).toBe(0);

      const buttons = getButtonStates(state);
      expect(buttons.wicket.disabled).toBe(false);
      expect(buttons.over.disabled).toBe(false);
      expect(buttons.strategic.disabled).toBe(false);
    });

    it('Choice 1 (Wicket): airs 90s pod, no double wicket count, resumes next over, no duplicate hold', () => {
      const cSim = advanceToStateC();
      const stateAtHold = cSim.getState();
      const wicketsAtFall = stateAtHold.team1.wickets;
      const overAtFall = stateAtHold.team1.oversCompleted;

      // Operator picks Wicket Break
      const breakRes = cSim.triggerOperatorBreak('WICKET');
      expect(breakRes.breakPod.breakType).toBe('Wicket_Break');
      expect(breakRes.breakPod.targetDuration).toBe(90);

      // Verify wickets did NOT increment again (single count at the fall)
      expect(breakRes.state.team1.wickets).toBe(wicketsAtFall);

      // During active break, all buttons disabled
      const activeBreak: ActiveOneShotBreak = {
        type: 'WICKET',
        status: 'ACTIVE',
        pod: breakRes.breakPod,
        targetDuration: 90,
        remainingSeconds: 90,
        initialDuration: 90
      };
      const midBreakButtons = getButtonStates(breakRes.state, activeBreak);
      expect(midBreakButtons.wicket.disabled).toBe(true);
      expect(midBreakButtons.over.disabled).toBe(true);
      expect(midBreakButtons.strategic.disabled).toBe(true);
      expect(midBreakButtons.wicket.title).toBe('A break is already on air.');

      // Break concludes and match resumes
      const resumed = cSim.resumeAfterBreak();
      expect(resumed.status).toBe('RUNNING');
      expect(resumed.team1.wickets).toBe(wicketsAtFall);
      expect(resumed.team1.oversCompleted).toBe(overAtFall);
      expect(resumed.team1.ballsInOver).toBe(0);

      // Next ball stepped is ball 1 of the NEXT over
      const nextBall = cSim.stepBall();
      expect(nextBall.team1.oversCompleted).toBe(overAtFall);
      expect(nextBall.team1.ballsInOver).toBe(1);

      // Assert NO second hold appeared for the same boundary!
      expect(nextBall.status).not.toBe('HELD_FOR_BREAK');
    });

    it('Choice 2 (Over): airs 60s pod, does NOT add wicket, resumes next over with new batter in, no duplicate hold', () => {
      const cSim = advanceToStateC();
      const stateAtHold = cSim.getState();
      const wicketsAtFall = stateAtHold.team1.wickets;
      const overAtFall = stateAtHold.team1.oversCompleted;

      // Operator picks Over Break
      const breakRes = cSim.triggerOperatorBreak('OVER');
      expect(breakRes.breakPod.breakType).toBe('Over_Break');
      expect(breakRes.breakPod.targetDuration).toBe(60);

      // Verify wickets did NOT increment and no wicket break aired
      expect(breakRes.state.team1.wickets).toBe(wicketsAtFall);

      // Break concludes
      const resumed = cSim.resumeAfterBreak();
      expect(resumed.status).toBe('RUNNING');
      expect(resumed.team1.wickets).toBe(wicketsAtFall);
      expect(resumed.team1.oversCompleted).toBe(overAtFall);
      expect(resumed.team1.ballsInOver).toBe(0);

      // Advances into next over without re-holding
      const nextBall = cSim.stepBall();
      expect(nextBall.team1.ballsInOver).toBe(1);
      expect(nextBall.status).not.toBe('HELD_FOR_BREAK');
    });

    it('Choice 3 (Strategic): airs 300s pod, does NOT add wicket, resumes next over, no duplicate hold', () => {
      const cSim = advanceToStateC();
      const stateAtHold = cSim.getState();
      const wicketsAtFall = stateAtHold.team1.wickets;
      const overAtFall = stateAtHold.team1.oversCompleted;

      // Operator picks Strategic Timeout
      const breakRes = cSim.triggerOperatorBreak('STRATEGIC');
      expect(breakRes.breakPod.breakType).toBe('Strategic_Timeout');
      expect(breakRes.breakPod.targetDuration).toBe(300);

      // Verify wickets count remained exactly the same
      expect(breakRes.state.team1.wickets).toBe(wicketsAtFall);

      // Break concludes
      const resumed = cSim.resumeAfterBreak();
      expect(resumed.status).toBe('RUNNING');
      expect(resumed.team1.wickets).toBe(wicketsAtFall);

      const nextBall = cSim.stepBall();
      expect(nextBall.team1.ballsInOver).toBe(1);
      expect(nextBall.status).not.toBe('HELD_FOR_BREAK');
    });
  });

  describe('10th Wicket on the Last Ball (All-Out)', () => {
    it('innings-end flow takes over (HALF_TIME) and Over/Strategic/Wicket are not offered', () => {
      // Force 9 wickets first
      for (let w = 0; w < 9; w++) {
        sim.recordWicketDismissal('OPERATOR_BUTTON');
        sim.resumeAfterBreak();
      }
      expect(sim.getState().team1.wickets).toBe(9);

      // Step until ball 5 of an over
      while (sim.getState().team1.ballsInOver !== 5) {
        sim.stepBall();
        if (sim.getState().status === 'HELD_FOR_BREAK') {
          sim.skipPendingBreak();
        }
      }

      expect(sim.getState().team1.ballsInOver).toBe(5);

      // 10th wicket falls on ball 6 (last ball of over)
      sim.recordWicketDismissal('SIMULATION');
      const state = sim.getState();

      expect(state.team1.wickets).toBe(10);
      expect(state.team1.ballsInOver).toBe(0);

      // Innings-end flow takes over
      expect(state.status).toBe('HELD_FOR_BREAK');
      expect(state.pendingBreakHold?.type).toBe('HALF_TIME');
      expect(state.pendingBreakHold?.holdState).toBe('HALF_TIME');

      const buttons = getButtonStates(state);
      // Over, Strategic, and Wicket must be disabled
      expect(buttons.over.disabled).toBe(true);
      expect(buttons.strategic.disabled).toBe(true);
      expect(buttons.wicket.disabled).toBe(true);
      // Half-time must be enabled
      expect(buttons.halfTime.disabled).toBe(false);
    });
  });

  describe('Mid-over while balls are in play (over is running)', () => {
    it('enables Wicket Break so operator can trigger manual wicket and air 90s pod at any time', () => {
      // Step 2 legal balls into an over
      sim.reseed(42);
      sim.stepBall(); // ball 1
      sim.stepBall(); // ball 2
      const state = sim.getState();

      expect(state.pendingBreakHold).toBeNull();
      expect(state.team1.ballsInOver).toBe(2);
      const wicketsBefore = state.team1.wickets;

      const buttons = getButtonStates(state);
      expect(buttons.wicket.disabled).toBe(false);
      expect(buttons.wicket.title).toContain('Click to record a wicket');

      // Operator triggers Wicket Break mid-over
      const breakRes = sim.triggerOperatorBreak('WICKET');
      expect(breakRes.breakPod.breakType).toBe('Wicket_Break');
      expect(breakRes.breakPod.targetDuration).toBe(90);
      expect(breakRes.state.team1.wickets).toBe(wicketsBefore + 1);
      expect(breakRes.state.status).toBe('PAUSED_AT_BREAK');

      // Match resumes after break from next ball
      const resumed = sim.resumeAfterBreak();
      expect(resumed.status).toBe('RUNNING');
      expect(resumed.team1.wickets).toBe(wicketsBefore + 1);
    });
  });
});
