import { AdPod, BreakType, MatchContext } from './types';
import { PRNG } from './prng';
import { OneShotBreakType } from './autopilot/types';

export type BallOutcome =
  | 'DOT'
  | 'SINGLE'
  | 'DOUBLE'
  | 'THREE'
  | 'FOUR'
  | 'SIX'
  | 'WICKET'
  | 'WIDE'
  | 'NO_BALL';

export interface BallDetail {
  innings: 1 | 2;
  over: number;
  ball: number;
  outcome: BallOutcome;
  runsScored: number;
  isLegalBall: boolean;
  isWicket: boolean;
  batsman: string;
  bowler: string;
  commentary: string;
  scoreAfter: {
    runs: number;
    wickets: number;
    oversCompleted: number;
    ballsInOver: number;
  };
}

export type PendingBreakType = 'OVER' | 'WICKET' | 'STRATEGIC' | 'HALF_TIME';

export type HoldStateKind = 'STATE_A' | 'STATE_B' | 'STATE_C' | 'HALF_TIME';

export interface PendingBreakHold {
  type: PendingBreakType;
  holdState: HoldStateKind;
  reasonText: string;
  atScore: { runs: number; wickets: number };
  atOver: number;
  atBall: number;
  timestamp: string;
}

export interface MatchState {
  status: 'NOT_STARTED' | 'RUNNING' | 'HELD_FOR_BREAK' | 'PAUSED_AT_BREAK' | 'INNINGS_BREAK' | 'MATCH_OVER';
  innings: 1 | 2;
  over: number; // 0 to 50
  ball: number; // 0 to 6
  team1: { name: string; score: number; wickets: number; oversCompleted: number; ballsInOver: number };
  team2: { name: string; score: number; wickets: number; oversCompleted: number; ballsInOver: number };
  currentBattingTeam: string;
  currentBowlingTeam: string;
  currentStriker: string;
  currentNonStriker: string;
  currentBowler: string;
  currentRunRate: number;
  requiredRunRate?: number;
  targetRuns?: number;
  lastBall?: BallDetail;
  commentaryLog: string[];
  activeBreak?: AdPod;
  pendingBreakHold: PendingBreakHold | null;
  pendingBreakQueue: AdPod[];
  strategicTimeoutsTakenInnings1: number;
  strategicTimeoutsTakenInnings2: number;
  totalPodsGenerated: number;
  isCustomLoadedMatch: boolean;
  customTimelineName?: string;
}

const INDIA_LINEUP = [
  'Rohit Sharma (c)',
  'Shubman Gill',
  'Virat Kohli',
  'Shreyas Iyer',
  'KL Rahul (wk)',
  'Suryakumar Yadav',
  'Ravindra Jadeja',
  'Kuldeep Yadav',
  'Jasprit Bumrah',
  'Mohammed Shami',
  'Mohammed Siraj'
];

const AUSTRALIA_LINEUP = [
  'David Warner',
  'Travis Head',
  'Mitchell Marsh',
  'Steven Smith',
  'Marnus Labuschagne',
  'Glenn Maxwell',
  'Josh Inglis (wk)',
  'Pat Cummins (c)',
  'Mitchell Starc',
  'Adam Zampa',
  'Josh Hazlewood'
];

export class MatchSimulator {
  private prng: PRNG;
  private state: MatchState;
  private customPods: AdPod[] = [];
  private customPodIndex: number = 0;

  constructor(seed: number = 1337) {
    this.prng = new PRNG(seed);
    this.state = this.getInitialState();
  }

  public getInitialState(): MatchState {
    return {
      status: 'NOT_STARTED',
      innings: 1,
      over: 0,
      ball: 0,
      team1: { name: 'India', score: 0, wickets: 0, oversCompleted: 0, ballsInOver: 0 },
      team2: { name: 'Australia', score: 0, wickets: 0, oversCompleted: 0, ballsInOver: 0 },
      currentBattingTeam: 'India',
      currentBowlingTeam: 'Australia',
      currentStriker: INDIA_LINEUP[0],
      currentNonStriker: INDIA_LINEUP[1],
      currentBowler: AUSTRALIA_LINEUP[8], // Starc
      currentRunRate: 0,
      commentaryLog: ['Welcome to the Wankhede Stadium for this flagship ODI clash! Broadcaster MCR Guard is standing by on air.'],
      pendingBreakHold: null,
      pendingBreakQueue: [],
      strategicTimeoutsTakenInnings1: 0,
      strategicTimeoutsTakenInnings2: 0,
      totalPodsGenerated: 0,
      isCustomLoadedMatch: false
    };
  }

  public getState(): MatchState {
    return { ...this.state };
  }

  public reseed(seed: number): void {
    this.prng.seed(seed);
    this.state = this.getInitialState();
  }

  /**
   * Load real match timeline / pods from parsed CSV or JSON
   */
  public loadCustomMatchTimeline(pods: AdPod[], title: string = 'Real Match Broadcast Replay'): void {
    this.customPods = [...pods];
    this.customPodIndex = 0;
    this.state = {
      ...this.getInitialState(),
      isCustomLoadedMatch: true,
      customTimelineName: title,
      commentaryLog: [`Loaded replay timeline: ${title} with ${pods.length} broadcast pods.`]
    };
  }

  /**
   * Simulates the next legal/extra ball in the match
   */
  public stepBall(): MatchState {
    if (this.state.status === 'MATCH_OVER' || this.state.status === 'PAUSED_AT_BREAK' || this.state.status === 'HELD_FOR_BREAK') {
      return this.getState();
    }

    // If using custom preloaded timeline, advance to the next preloaded pod
    if (this.state.isCustomLoadedMatch && this.customPods.length > 0) {
      if (this.customPodIndex < this.customPods.length) {
        const nextPod = this.customPods[this.customPodIndex++];
        this.state.activeBreak = nextPod;
        this.state.status = 'PAUSED_AT_BREAK';
        this.state.totalPodsGenerated++;
        this.state.innings = nextPod.innings;
        this.state.over = nextPod.overNo;
        this.state.commentaryLog.unshift(
          `[${nextPod.timestamp || 'LIVE'}] Break Trigger: ${nextPod.breakType.replace(/_/g, ' ')} at Over ${nextPod.overNo} (${nextPod.targetDuration}s duration required).`
        );
        return this.getState();
      } else {
        this.state.status = 'MATCH_OVER';
        this.state.commentaryLog.unshift('Match completed! All broadcast pods concluded.');
        return this.getState();
      }
    }

    if (this.state.status === 'NOT_STARTED') {
      this.state.status = 'RUNNING';
    }

    const currentTeam = this.state.innings === 1 ? this.state.team1 : this.state.team2;
    const opponentTeam = this.state.innings === 1 ? this.state.team2 : this.state.team1;

    // Ball Probabilities (ODI standard distribution):
    // Dot: 50%, Single: 26%, Double: 7%, Three: 1%, Four: 8%, Six: 3%, Wicket: 3%, Wide: 1.5%, No-ball: 0.5%
    const rand = this.prng.next();
    let outcome: BallOutcome = 'DOT';
    let runs = 0;
    let isLegal = true;

    if (rand < 0.48) {
      outcome = 'DOT';
      runs = 0;
    } else if (rand < 0.74) {
      outcome = 'SINGLE';
      runs = 1;
    } else if (rand < 0.81) {
      outcome = 'DOUBLE';
      runs = 2;
    } else if (rand < 0.82) {
      outcome = 'THREE';
      runs = 3;
    } else if (rand < 0.90) {
      outcome = 'FOUR';
      runs = 4;
    } else if (rand < 0.93) {
      outcome = 'SIX';
      runs = 6;
    } else if (rand < 0.96) {
      // Wicket dismissal occurs through unified single recordWicketDismissal method
      this.recordWicketDismissal('SIMULATION');
      return this.getState();
    } else if (rand < 0.985) {
      outcome = 'WIDE';
      runs = 1;
      isLegal = false;
    } else {
      outcome = 'NO_BALL';
      runs = 1;
      isLegal = false;
    }

    currentTeam.score += runs;

    if (isLegal) {
      currentTeam.ballsInOver++;
      this.state.ball = currentTeam.ballsInOver;

      if (currentTeam.ballsInOver === 6) {
        currentTeam.oversCompleted++;
        currentTeam.ballsInOver = 0;
        this.state.over = currentTeam.oversCompleted;
        this.state.ball = 0;
      }
    }

    // Commentary creation
    const overStr = `${currentTeam.oversCompleted}.${currentTeam.ballsInOver}`;
    let comm = '';
    const isWicket = false;
    const striker = this.state.currentStriker;
    const bowler = this.state.currentBowler;

    switch (outcome) {
      case 'DOT':
        comm = `${bowler} to ${striker}, no run. Solid defensive block into the covers.`;
        break;
      case 'SINGLE':
        comm = `${bowler} to ${striker}, 1 run. Driven down to long-on for a brisk single.`;
        break;
      case 'DOUBLE':
        comm = `${bowler} to ${striker}, 2 runs. Nicely tucked away into the deep midwicket gap.`;
        break;
      case 'THREE':
        comm = `${bowler} to ${striker}, 3 runs. Great placement through point, cut off inside the rope.`;
        break;
      case 'FOUR':
        comm = `${bowler} to ${striker}, FOUR! Cracking boundary through extra cover!`;
        break;
      case 'SIX':
        comm = `${bowler} to ${striker}, SIX! Dispatched into the upper tier! Huge maximum!`;
        break;
      case 'WIDE':
        comm = `${bowler} sprays it wide down the leg side, signaled wide by the umpire.`;
        break;
      case 'NO_BALL':
        comm = `${bowler} oversteps the crease! No ball signaled! Free hit coming up.`;
        break;
    }

    const ballDetail: BallDetail = {
      innings: this.state.innings,
      over: currentTeam.oversCompleted,
      ball: currentTeam.ballsInOver,
      outcome,
      runsScored: runs,
      isLegalBall: isLegal,
      isWicket,
      batsman: striker,
      bowler,
      commentary: `${overStr}: ${comm}`,
      scoreAfter: {
        runs: currentTeam.score,
        wickets: currentTeam.wickets,
        oversCompleted: currentTeam.oversCompleted,
        ballsInOver: currentTeam.ballsInOver
      }
    };

    this.state.lastBall = ballDetail;
    this.state.commentaryLog.unshift(ballDetail.commentary);
    if (this.state.commentaryLog.length > 50) this.state.commentaryLog.pop();

    // Rotate strike on odd runs
    if (runs % 2 === 1 && !isWicket) {
      const temp = this.state.currentStriker;
      this.state.currentStriker = this.state.currentNonStriker;
      this.state.currentNonStriker = temp;
    }

    // Handle new batsman on wicket
    if (isWicket) {
      const lineup = this.state.innings === 1 ? INDIA_LINEUP : AUSTRALIA_LINEUP;
      const nextIndex = currentTeam.wickets + 1;
      if (nextIndex < lineup.length) {
        this.state.currentStriker = lineup[nextIndex];
      }
    }

    // Rotate strike at end of over
    if (isLegal && currentTeam.ballsInOver === 0 && currentTeam.oversCompleted > 0) {
      const temp = this.state.currentStriker;
      this.state.currentStriker = this.state.currentNonStriker;
      this.state.currentNonStriker = temp;
      // Change bowler
      const bowlers = this.state.innings === 1 ? AUSTRALIA_LINEUP.slice(7) : INDIA_LINEUP.slice(7);
      this.state.currentBowler = bowlers[(currentTeam.oversCompleted) % bowlers.length];
    }

    // Calculate run rates
    const totalOversDec = currentTeam.oversCompleted + currentTeam.ballsInOver / 6;
    this.state.currentRunRate = totalOversDec > 0 ? Number((currentTeam.score / totalOversDec).toFixed(2)) : 0;

    if (this.state.innings === 2 && this.state.targetRuns) {
      const runsRemaining = this.state.targetRuns - currentTeam.score;
      const oversRemaining = 50 - totalOversDec;
      this.state.requiredRunRate = oversRemaining > 0 ? Number((Math.max(0, runsRemaining) / oversRemaining).toFixed(2)) : 0;
    }

    // Check Match End or Innings Transition
    if (this.state.innings === 2 && this.state.targetRuns && currentTeam.score >= this.state.targetRuns) {
      this.state.status = 'MATCH_OVER';
      this.state.commentaryLog.unshift(`MATCH OVER: ${currentTeam.name} wins the match by ${10 - currentTeam.wickets} wickets!`);
      return this.getState();
    }

    // Check Innings End (50 overs)
    if (currentTeam.wickets >= 10 || currentTeam.oversCompleted >= 50) {
      if (this.state.innings === 1) {
        this.state.pendingBreakHold = {
          type: 'HALF_TIME',
          holdState: 'HALF_TIME',
          reasonText: 'Innings complete: awaiting Half-time Break',
          atScore: { runs: currentTeam.score, wickets: currentTeam.wickets },
          atOver: currentTeam.oversCompleted,
          atBall: currentTeam.ballsInOver,
          timestamp: new Date().toLocaleTimeString()
        };
        this.state.status = 'HELD_FOR_BREAK';
        this.state.activeBreak = undefined;
        this.state.commentaryLog.unshift('INNINGS 1 COMPLETE: Awaiting Half-time Break.');
        return this.getState();
      } else {
        this.state.status = 'MATCH_OVER';
        const winTeam = this.state.team1.score > this.state.team2.score ? this.state.team1.name : this.state.team2.name;
        this.state.commentaryLog.unshift(`MATCH OVER: ${winTeam} wins! Broadcast wrapping up.`);
        return this.getState();
      }
    }

    // Hold at Strategic Timeout points (Overs 22 & 41)
    if (isLegal && currentTeam.ballsInOver === 0 && currentTeam.oversCompleted > 0) {
      const currentOvers = currentTeam.oversCompleted;
      const timeoutsTaken = this.state.innings === 1 ? this.state.strategicTimeoutsTakenInnings1 : this.state.strategicTimeoutsTakenInnings2;

      if ((currentOvers === 22 || currentOvers === 41) && timeoutsTaken < 2) {
        this.state.pendingBreakHold = {
          type: 'STRATEGIC',
          holdState: 'STATE_A',
          reasonText: 'Strategic timeout point reached: choose Over Break or Strategic Timeout',
          atScore: { runs: currentTeam.score, wickets: currentTeam.wickets },
          atOver: currentOvers,
          atBall: 0,
          timestamp: new Date().toLocaleTimeString()
        };
        this.state.status = 'HELD_FOR_BREAK';
        this.state.activeBreak = undefined;
        this.state.commentaryLog.unshift(`STRATEGIC TIMEOUT POINT REACHED (Over ${currentOvers}): Choose Over Break or Strategic Timeout.`);
        return this.getState();
      }

      // Regular Over Complete Hold (STATE_A: Over complete, no wicket on last ball)
      this.state.pendingBreakHold = {
        type: 'OVER',
        holdState: 'STATE_A',
        reasonText: 'Over complete: choose Over Break or Strategic Timeout',
        atScore: { runs: currentTeam.score, wickets: currentTeam.wickets },
        atOver: currentOvers,
        atBall: 0,
        timestamp: new Date().toLocaleTimeString()
      };
      this.state.status = 'HELD_FOR_BREAK';
      this.state.activeBreak = undefined;
      this.state.commentaryLog.unshift(`OVER ${currentOvers} COMPLETE: Choose Over Break or Strategic Timeout.`);
      return this.getState();
    }

    return this.getState();
  }

  /**
   * Single unified Wicket Event function.
   * Increments wickets by 1, records dismissal (batter, bowler, ball), updates scoreboard,
   * updates lineup and holds match at the exact ball.
   */
  public recordWicketDismissal(source: 'SIMULATION' | 'OPERATOR_BUTTON'): {
    state: MatchState;
    dismissedBatter: string;
  } | null {
    if (this.state.status === 'MATCH_OVER') {
      return null;
    }

    const currentTeam = this.state.innings === 1 ? this.state.team1 : this.state.team2;
    if (currentTeam.wickets >= 10) {
      return null;
    }

    const dismissedBatter = this.state.currentStriker;
    const bowler = this.state.currentBowler;

    // Advance ball count
    currentTeam.ballsInOver++;
    this.state.ball = currentTeam.ballsInOver;
    if (currentTeam.ballsInOver === 6) {
      currentTeam.oversCompleted++;
      currentTeam.ballsInOver = 0;
      this.state.over = currentTeam.oversCompleted;
      this.state.ball = 0;
    }

    // Increment wickets count exactly once
    currentTeam.wickets++;

    const overStr = `${currentTeam.oversCompleted}.${currentTeam.ballsInOver}`;
    const comm = `OUT! ${bowler} strikes! ${dismissedBatter} is dismissed!`;

    const ballDetail: BallDetail = {
      innings: this.state.innings,
      over: currentTeam.oversCompleted,
      ball: currentTeam.ballsInOver,
      outcome: 'WICKET',
      runsScored: 0,
      isLegalBall: true,
      isWicket: true,
      batsman: dismissedBatter,
      bowler,
      commentary: `${overStr}: ${comm}`,
      scoreAfter: {
        runs: currentTeam.score,
        wickets: currentTeam.wickets,
        oversCompleted: currentTeam.oversCompleted,
        ballsInOver: currentTeam.ballsInOver
      }
    };
    this.state.lastBall = ballDetail;
    this.state.commentaryLog.unshift(ballDetail.commentary);
    if (this.state.commentaryLog.length > 50) this.state.commentaryLog.pop();

    // Next batter in
    const lineup = this.state.innings === 1 ? INDIA_LINEUP : AUSTRALIA_LINEUP;
    const nextIndex = currentTeam.wickets + 1;
    if (nextIndex < lineup.length) {
      this.state.currentStriker = lineup[nextIndex];
    }

    // Check all-out condition (10 wickets)
    if (currentTeam.wickets >= 10) {
      if (this.state.innings === 1) {
        this.state.pendingBreakHold = {
          type: 'HALF_TIME',
          holdState: 'HALF_TIME',
          reasonText: 'Innings complete: awaiting Half-time Break',
          atScore: { runs: currentTeam.score, wickets: currentTeam.wickets },
          atOver: currentTeam.oversCompleted,
          atBall: currentTeam.ballsInOver,
          timestamp: new Date().toLocaleTimeString()
        };
        this.state.status = 'HELD_FOR_BREAK';
        this.state.activeBreak = undefined;
        this.state.commentaryLog.unshift(`ALL OUT (${currentTeam.wickets} wkts)! Innings 1 concluded. Awaiting Half-time Break.`);
        return { state: this.getState(), dismissedBatter };
      } else {
        this.state.status = 'MATCH_OVER';
        const winTeam = this.state.team1.score > this.state.team2.score ? this.state.team1.name : this.state.team2.name;
        this.state.commentaryLog.unshift(`MATCH OVER: ${winTeam} wins!`);
        return { state: this.getState(), dismissedBatter };
      }
    }

    const isLastBallOfOver = currentTeam.ballsInOver === 0;

    if (isLastBallOfOver) {
      // STATE_C: Wicket fell on the LAST ball of an over
      this.state.pendingBreakHold = {
        type: 'WICKET',
        holdState: 'STATE_C',
        reasonText: 'Wicket on the last ball: choose Wicket Break, Over Break or Strategic Timeout',
        atScore: { runs: currentTeam.score, wickets: currentTeam.wickets },
        atOver: currentTeam.oversCompleted,
        atBall: 0,
        timestamp: new Date().toLocaleTimeString()
      };
      this.state.status = 'HELD_FOR_BREAK';
      this.state.activeBreak = undefined;
      this.state.commentaryLog.unshift(`WICKET ON LAST BALL OF OVER: ${dismissedBatter} out. Choose Wicket Break, Over Break or Strategic Timeout.`);
    } else {
      // STATE_B: Wicket fell mid-over (not the last ball)
      this.state.pendingBreakHold = {
        type: 'WICKET',
        holdState: 'STATE_B',
        reasonText: 'Wicket fell mid-over: awaiting Wicket Break',
        atScore: { runs: currentTeam.score, wickets: currentTeam.wickets },
        atOver: currentTeam.oversCompleted,
        atBall: currentTeam.ballsInOver,
        timestamp: new Date().toLocaleTimeString()
      };
      this.state.status = 'HELD_FOR_BREAK';
      this.state.activeBreak = undefined;
      this.state.commentaryLog.unshift(`WICKET FELL: ${dismissedBatter} out. Match holding for operator Wicket Break.`);
    }

    return { state: this.getState(), dismissedBatter };
  }

  /**
   * One-Shot Break Trigger method invoked exclusively by operator button click.
   */
  public triggerOperatorBreak(type: OneShotBreakType): {
    state: MatchState;
    breakPod: AdPod;
  } {
    const currentTeam = this.state.innings === 1 ? this.state.team1 : this.state.team2;

    if (type === 'WICKET') {
      // If a wicket was ALREADY pending, the click only airs the break and must NOT add another wicket!
      if (this.state.pendingBreakHold?.type === 'WICKET') {
        this.state.pendingBreakHold = null;
      } else if (this.state.pendingBreakHold === null) {
        // If NO wicket is pending, clicking Wicket calls the single wicket function once (manual wicket)
        this.recordWicketDismissal('OPERATOR_BUTTON');
        this.state.pendingBreakHold = null;
      }

      const isFavourite = this.state.currentStriker.includes('Kohli') || this.state.currentStriker.includes('Rohit');
      const breakPod = this.createBreakPod('Wicket_Break', 90, this.state.innings, currentTeam.oversCompleted, true, isFavourite);
      this.state.activeBreak = breakPod;
      this.state.status = 'PAUSED_AT_BREAK';
      return { state: this.getState(), breakPod };
    }

    if (type === 'STRATEGIC') {
      if (this.state.innings === 1) this.state.strategicTimeoutsTakenInnings1++;
      else this.state.strategicTimeoutsTakenInnings2++;

      this.state.pendingBreakHold = null;
      const breakPod = this.createBreakPod('Strategic_Timeout', 300, this.state.innings, currentTeam.oversCompleted, false, false);
      this.state.activeBreak = breakPod;
      this.state.status = 'PAUSED_AT_BREAK';
      this.state.commentaryLog.unshift(`STRATEGIC TIMEOUT (300s): Operator initiated break window.`);
      return { state: this.getState(), breakPod };
    }

    if (type === 'HALF_TIME') {
      this.state.pendingBreakHold = null;
      if (this.state.innings === 1) {
        this.state.innings = 2;
        this.state.targetRuns = this.state.team1.score + 1;
        this.state.currentBattingTeam = 'Australia';
        this.state.currentBowlingTeam = 'India';
        this.state.currentStriker = AUSTRALIA_LINEUP[0];
        this.state.currentNonStriker = AUSTRALIA_LINEUP[1];
        this.state.currentBowler = INDIA_LINEUP[8];
        this.state.status = 'INNINGS_BREAK';
        // Half-Time Show: 30 minutes total (1800s) = 20 mins commercial ads (4 x 300s) + 10 mins live studio talk (2 x 300s)
        const breakPod = this.createBreakPod('Half_Time_Break_Part1', 300, 1, currentTeam.oversCompleted, false, false);
        this.state.activeBreak = breakPod;
        this.state.status = 'PAUSED_AT_BREAK';
        this.state.commentaryLog.unshift(`HALF-TIME SHOW (30m total: 20m ads + 10m studio talk): Operator started innings transition.`);
        return { state: this.getState(), breakPod };
      } else {
        const breakPod = this.createBreakPod('Half_Time_Break_Part2', 300, 2, currentTeam.oversCompleted, false, false);
        this.state.activeBreak = breakPod;
        this.state.status = 'PAUSED_AT_BREAK';
        return { state: this.getState(), breakPod };
      }
    }

    // Default: 'OVER'
    this.state.pendingBreakHold = null;
    const breakPod = this.createBreakPod('Over_Break', 60, this.state.innings, currentTeam.oversCompleted, false, false);
    this.state.activeBreak = breakPod;
    this.state.status = 'PAUSED_AT_BREAK';
    this.state.commentaryLog.unshift(`OVER BREAK (60s): Operator started Over ${currentTeam.oversCompleted} commercial pod.`);
    return { state: this.getState(), breakPod };
  }

  /**
   * "Continue without ads" action: resumes play immediately without airing a commercial break.
   */
  public skipPendingBreak(): { state: MatchState; skippedType: PendingBreakType; reason: string } | null {
    if (!this.state.pendingBreakHold) return null;

    const hold = this.state.pendingBreakHold;
    const skippedType = hold.type;
    const reason = `Break skipped by operator: ${hold.type} break at Over ${hold.atOver}`;

    if (hold.type === 'HALF_TIME' && this.state.innings === 1) {
      this.state.innings = 2;
      this.state.targetRuns = this.state.team1.score + 1;
      this.state.currentBattingTeam = 'Australia';
      this.state.currentBowlingTeam = 'India';
      this.state.currentStriker = AUSTRALIA_LINEUP[0];
      this.state.currentNonStriker = AUSTRALIA_LINEUP[1];
      this.state.currentBowler = INDIA_LINEUP[8];
    }

    if (hold.type === 'STRATEGIC') {
      if (this.state.innings === 1) this.state.strategicTimeoutsTakenInnings1++;
      else this.state.strategicTimeoutsTakenInnings2++;
    }

    this.state.commentaryLog.unshift(`[OPERATOR ACTION]: ${reason}`);
    this.state.pendingBreakHold = null;
    this.state.activeBreak = undefined;
    this.state.status = 'RUNNING';

    return { state: this.getState(), skippedType, reason };
  }

  /**
   * Compatibility alias for triggerOperatorBreak
   */
  public triggerOneShotBreak(type: OneShotBreakType): { state: MatchState; breakPod: AdPod } {
    return this.triggerOperatorBreak(type);
  }

  /**
   * Compatibility alias for dismissing a wicket
   */
  public dismissWicket(source: 'SIMULATION' | 'USER_BUTTON' = 'USER_BUTTON'): { state: MatchState; breakPod: AdPod } | null {
    if (this.state.innings === 1 && this.state.team1.wickets >= 10) return null;
    if (this.state.innings === 2 && this.state.team2.wickets >= 10) return null;
    return this.triggerOperatorBreak('WICKET');
  }

  /**
   * Fast-forward simulation until the very next hold point
   */
  public skipToNextBreak(): MatchState {
    if (this.state.status === 'HELD_FOR_BREAK' || this.state.status === 'PAUSED_AT_BREAK' || this.state.status === 'MATCH_OVER') {
      return this.getState();
    }
    let steps = 0;
    while (
      (this.state.status as string) !== 'HELD_FOR_BREAK' &&
      (this.state.status as string) !== 'PAUSED_AT_BREAK' &&
      (this.state.status as string) !== 'MATCH_OVER' &&
      steps < 400
    ) {
      this.stepBall();
      steps++;
    }
    return this.getState();
  }

  /**
   * Resume simulation after operator airs the current pod ("Go Live")
   */
  public resumeAfterBreak(): MatchState {
    this.state.activeBreak = undefined;
    this.state.pendingBreakHold = null;
    this.state.status = 'RUNNING';
    return this.getState();
  }

  private createBreakPod(
    breakType: BreakType,
    targetDuration: number,
    innings: 1 | 2,
    overNo: number,
    wicketFell: boolean,
    favouriteWicket: boolean
  ): AdPod {
    this.state.totalPodsGenerated++;
    const podId = `POD_${String(this.state.totalPodsGenerated).padStart(2, '0')}`;
    const battingTeam = this.state.innings === 1 ? this.state.team1.name : this.state.team2.name;
    const bowlingTeam = this.state.innings === 1 ? this.state.team2.name : this.state.team1.name;
    const currentScore = this.state.innings === 1 ? this.state.team1.score : this.state.team2.score;
    const currentWickets = this.state.innings === 1 ? this.state.team1.wickets : this.state.team2.wickets;

    // Create empty template slots fitting the target duration
    // e.g. 60s -> two 30s slots
    // 90s -> three 30s slots
    // 300s -> ten 30s slots
    const slotCount = targetDuration === 60 ? 2 : targetDuration === 90 ? 3 : 10;
    const defaultDuration = 30;
    const slots = Array.from({ length: slotCount }, (_, i) => ({
      slotNumber: i + 1,
      duration: defaultDuration as any
    }));

    return {
      id: podId,
      innings,
      overNo,
      breakType,
      targetDuration,
      slots,
      timestamp: new Date().toLocaleTimeString(),
      isAired: false,
      matchContext: {
        innings,
        over: overNo,
        ball: 0,
        battingTeam,
        bowlingTeam,
        runs: currentScore,
        wickets: currentWickets,
        targetRuns: this.state.targetRuns,
        lastEvent: this.state.lastBall?.commentary || 'Break Triggered',
        wicketJustFell: wicketFell,
        favouriteWicketFell: favouriteWicket,
        runRate: this.state.currentRunRate,
        requiredRunRate: this.state.requiredRunRate
      }
    };
  }
}
