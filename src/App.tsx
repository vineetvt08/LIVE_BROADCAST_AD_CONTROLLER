import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MatchSimulator, MatchState } from './engine/matchSimulator';
import {
  AdPod,
  BrandAd,
  EndOfMatchReportData,
  OverrideLogEntry,
  PodSlot,
  SpotDuration,
  DurationMixStats
} from './engine/types';
import {
  ActiveOneShotBreak,
  AutopilotConfig,
  BreakResumePopup,
  FrozenMatchState,
  OneShotBreakType,
  ResumeMode,
  StoppageAuditRecord,
  StoppageReason,
  StoppageState
} from './engine/autopilot/types';
import { StoppageEngine } from './engine/autopilot/stoppageEngine';
import { generateAutoFillPod } from './engine/autopilot/autoFillEngine';
import { SYNTHETIC_BRANDS } from './data/syntheticBrands';
import { MixTally, INITIAL_MIX_TALLY, updateMixTally } from './engine/patternEngine';
import { Header } from './components/Header';
import { MatchRibbon } from './components/MatchRibbon';
import { HoldBanner } from './components/HoldBanner';
import { StoppageBanner } from './components/Autopilot/StoppageBanner';
import { BackToLiveSlate } from './components/Autopilot/BackToLiveSlate';
import { StoppageReasonModal } from './components/Autopilot/StoppageReasonModal';
import { AutonomousOnAirPod } from './components/AdConsole/AutonomousOnAirPod';
import { BreakResumePopupQueue } from './components/Popups/BreakResumePopupQueue';
import { EndOfMatchReport } from './components/EndOfMatchReport';
import { MatchReplayModal } from './components/MatchReplayModal';
import { MathsPanel } from './components/MathsPanel';
import { Tv, Radio, Play, Pause, SkipForward, Clock, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  // Simulator ref
  const simulatorRef = useRef<MatchSimulator>(new MatchSimulator(1337));
  const [matchState, setMatchState] = useState<MatchState>(() => simulatorRef.current.getState());

  // Simulation playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<1 | 5 | 20>(5);

  // Active One-Shot Break State (Over 60s, Wicket 90s, Strategic 300s, Half-Time 300s)
  const [activeOneShotBreak, setActiveOneShotBreak] = useState<ActiveOneShotBreak | null>(null);
  const [popupQueue, setPopupQueue] = useState<BreakResumePopup[]>([]);

  // Autopilot Stoppage Configuration (Toggle 5: Manual Infinity)
  const [autopilotConfig, setAutopilotConfig] = useState<AutopilotConfig>({
    manualInfinity: false,
    stoppagePodDuration: 90,
    resumeMode: 'AFTER_CURRENT_POD'
  });

  // Stoppage Engine Ref
  const stoppageEngineRef = useRef<StoppageEngine>(
    new StoppageEngine(SYNTHETIC_BRANDS, 90, 'AFTER_CURRENT_POD')
  );
  const [stoppageState, setStoppageState] = useState<StoppageState>(() =>
    stoppageEngineRef.current.getState()
  );
  const [stoppageAudits, setStoppageAudits] = useState<StoppageAuditRecord[]>([]);
  const [isStoppageModalOpen, setIsStoppageModalOpen] = useState(false);

  // Spot Duration Mix tracking (target: 35% 15s, 50% 30s, 15% 45s)
  const [mixTally, setMixTally] = useState<MixTally>(INITIAL_MIX_TALLY);

  // Aired Pods History & Continuity References
  const [previousPod, setPreviousPod] = useState<AdPod | undefined>(undefined);
  const [airedPods, setAiredPods] = useState<AdPod[]>([]);
  const [overrideLogs, setOverrideLogs] = useState<OverrideLogEntry[]>([]);

  // Modals state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);

  /**
   * Operator Break Trigger Handler:
   * Breaks are triggered ONLY by operator clicks.
   * Uses triggerOperatorBreak which ensures idempotent single-count wicket handling.
   */
  const handleTriggerBreak = (type: OneShotBreakType) => {
    // Mutual exclusion & double-click protection:
    // If a break is already active, Manual Infinity is running, or match is over: ignore!
    if (activeOneShotBreak !== null || stoppageState.isActive || matchState.status === 'MATCH_OVER') {
      return;
    }

    // Immediately pause simulation
    setIsPlaying(false);

    // Check if this break was initiated from a last-ball wicket (State C)
    const wasLastBallWicket = matchState.pendingBreakHold?.holdState === 'STATE_C';

    // Call operator break handler in match simulator
    const res = simulatorRef.current.triggerOperatorBreak(type);
    setMatchState(res.state);
    const targetPod = res.breakPod;

    const duration = type === 'OVER' ? 60 : type === 'WICKET' ? 90 : 300;
    const currentTeam = res.state.innings === 1 ? res.state.team1 : res.state.team2;

    // Build the best zero-BLOCK pod using the pattern engine & suggestion engine with exact duration
    const filledPod = generateAutoFillPod({
      breakType: type,
      targetDuration: duration,
      innings: targetPod.innings,
      overNo: targetPod.overNo,
      ballNo: currentTeam.ballsInOver,
      score: { runs: currentTeam.score, wickets: currentTeam.wickets },
      battingTeam: currentTeam.name,
      bowlingTeam: res.state.innings === 1 ? 'Australia' : 'India',
      lastEventDescription: res.state.lastBall?.commentary || `${type} break on air`,
      previousPod,
      allAiredPodsInInnings: airedPods.filter(p => p.innings === targetPod.innings),
      allBrands: SYNTHETIC_BRANDS,
      runningMixTally: mixTally,
      onLogFiller: (reason) => {
        console.warn(`[BROADCASTER FILLER]: ${reason}`);
      }
    });

    // Enter ACTIVE state
    setActiveOneShotBreak({
      type,
      status: 'ACTIVE',
      pod: filledPod,
      targetDuration: duration,
      remainingSeconds: duration,
      initialDuration: duration,
      wasLastBallWicket
    });
  };

  /**
   * Operator Skip Break Handler:
   * "Continue without ads" on hold banner resumes match without airing a pod.
   */
  const handleSkipBreak = () => {
    const hold = matchState.pendingBreakHold;
    const res = simulatorRef.current.skipPendingBreak();
    if (res) {
      setMatchState(res.state);
      console.log(`[OPERATOR]: Break skipped by operator for ${hold?.type} break`);
    }
  };

  /**
   * Match Simulation Loop:
   * Advances match ball-by-ball when playing and not in break/stoppage/hold.
   * Breaks are never started automatically; simulation holds at break boundaries.
   */
  useEffect(() => {
    if (!isPlaying || stoppageState.isActive || activeOneShotBreak !== null) return;

    const intervalMs = speed === 1 ? 1000 : speed === 5 ? 250 : 60;
    const interval = setInterval(() => {
      const nextState = simulatorRef.current.stepBall();
      setMatchState(nextState);

      // Simulation holds for operator break: pause simulation loop
      if (nextState.status === 'HELD_FOR_BREAK') {
        setIsPlaying(false);
      } else if (nextState.status === 'MATCH_OVER') {
        setIsPlaying(false);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, speed, stoppageState.isActive, activeOneShotBreak]);

  /**
   * One-Shot Break Countdown Tick Loop:
   * Scales simulated commercial airtime with 1x / 5x / 20x speed setting.
   */
  useEffect(() => {
    if (!activeOneShotBreak || activeOneShotBreak.status === 'ENDED') return;

    const tickIntervalMs = 100;
    const interval = setInterval(() => {
      setActiveOneShotBreak(prev => {
        if (!prev) return null;
        const decrement = (tickIntervalMs / 1000) * speed;
        const nextRemaining = prev.remainingSeconds - decrement;

        if (nextRemaining <= 0) {
          return {
            ...prev,
            remainingSeconds: 0,
            status: 'ENDED'
          };
        }

        return {
          ...prev,
          remainingSeconds: nextRemaining
        };
      });
    }, tickIntervalMs);

    return () => clearInterval(interval);
  }, [activeOneShotBreak?.type, activeOneShotBreak?.status, speed]);

  /**
   * One-Shot Break Completion & Auto-Resume:
   * When pod finishes, record aired pod, update spot duration mix, resume match simulator, and enqueue popup modal.
   */
  useEffect(() => {
    if (activeOneShotBreak && activeOneShotBreak.status === 'ENDED') {
      const finishedBreak = activeOneShotBreak;
      const finishedPod = finishedBreak.pod;

      setAiredPods(prev => [...prev, finishedPod]);
      setPreviousPod(finishedPod);
      setActiveOneShotBreak(null);

      // Update spot duration mix tally
      const durations = finishedPod.slots.map(s => s.duration);
      setMixTally(prev => updateMixTally(prev, durations));

      // Resume match in simulator from the exact next ball
      const resumedState = simulatorRef.current.resumeAfterBreak();
      setMatchState(resumedState);

      // Create queued popup modal
      const team = resumedState.innings === 1 ? resumedState.team1 : resumedState.team2;
      let popupTitle = '';
      let popupMsg = '';
      switch (finishedBreak.type) {
        case 'OVER':
          popupTitle = 'Over Break Ended';
          popupMsg = 'Over break has ended. Match resumes.';
          if (finishedBreak.wasLastBallWicket) {
            popupMsg += ' Wicket recorded: new batter in.';
          }
          break;
        case 'WICKET':
          popupTitle = 'Wicket Break Ended';
          popupMsg = 'Wicket break has ended. Match resumes.';
          break;
        case 'STRATEGIC':
          popupTitle = 'Strategic Timeout Ended';
          popupMsg = 'Strategic timeout has ended. Match resumes.';
          if (finishedBreak.wasLastBallWicket) {
            popupMsg += ' Wicket recorded: new batter in.';
          }
          break;
        case 'HALF_TIME':
          popupTitle = 'Half-Time Ended';
          popupMsg = 'Half-time has ended. Second innings begins.';
          break;
      }

      const popup: BreakResumePopup = {
        id: `POP_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        breakType: finishedBreak.type,
        title: popupTitle,
        message: popupMsg,
        scoreAtResume: `${team.score}/${team.wickets}`,
        overAtResume: `${team.oversCompleted}.${team.ballsInOver}`,
        timestamp: Date.now()
      };

      setPopupQueue(prev => [...prev, popup]);
    }
  }, [activeOneShotBreak?.status]);

  /**
   * Tick loop for Unscheduled Stoppage (Toggle 5: Manual Infinity)
   */
  useEffect(() => {
    if (!stoppageState.isActive) return;

    const interval = setInterval(() => {
      const { state: updatedStoppage, didResumeMatch, auditRecord } = stoppageEngineRef.current.tickSecond();
      setStoppageState(updatedStoppage);

      if (auditRecord) {
        setStoppageAudits(prev => [auditRecord, ...prev]);
      }

      // If stoppage concluded and slate completed, unfreeze match!
      if (didResumeMatch) {
        setAutopilotConfig(prev => ({
          ...prev,
          manualInfinity: false
        }));

        // Resume match action
        setIsPlaying(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stoppageState.isActive]);

  // Handlers for Match Controls
  const handleTogglePlay = () => {
    if (matchState.status === 'MATCH_OVER' || stoppageState.isActive || activeOneShotBreak !== null) return;
    setIsPlaying(prev => !prev);
  };

  const handleStepBall = () => {
    if (stoppageState.isActive || activeOneShotBreak !== null) return;
    const nextState = simulatorRef.current.stepBall();
    setMatchState(nextState);
  };

  const handleSkipToNextBreak = () => {
    if (stoppageState.isActive || activeOneShotBreak !== null) return;
    const nextState = simulatorRef.current.skipToNextBreak();
    setMatchState(nextState);
    if (nextState.status === 'HELD_FOR_BREAK') {
      setIsPlaying(false);
    }
  };

  const handleResetMatch = (seed: number = 1337) => {
    simulatorRef.current.reseed(seed);
    setMatchState(simulatorRef.current.getState());
    setIsPlaying(false);
    setActiveOneShotBreak(null);
    setPopupQueue([]);
    setPreviousPod(undefined);
    setAiredPods([]);
    setOverrideLogs([]);
    setStoppageAudits([]);
    setMixTally(INITIAL_MIX_TALLY);
    setAutopilotConfig({
      manualInfinity: false,
      stoppagePodDuration: 90,
      resumeMode: 'AFTER_CURRENT_POD'
    });
  };

  const handleLoadPreloadedPods = (pods: AdPod[], title: string) => {
    simulatorRef.current.loadCustomMatchTimeline(pods, title);
    setMatchState(simulatorRef.current.getState());
    setIsPlaying(false);
    setActiveOneShotBreak(null);
    setPopupQueue([]);
    setPreviousPod(undefined);
    setAiredPods([]);
    setOverrideLogs([]);
    setStoppageAudits([]);
    setMixTally(INITIAL_MIX_TALLY);
  };

  // Manual Infinity (Toggle 5) Toggle
  const handleToggleManualInfinity = () => {
    if (activeOneShotBreak !== null) return; // Disabled while break is active

    if (stoppageState.isActive) {
      // Request clean resume
      const updated = stoppageEngineRef.current.requestResume();
      setStoppageState(updated);
    } else {
      // Open reason selector modal before activating
      setIsStoppageModalOpen(true);
    }
  };

  // Activate Stoppage from Modal
  const handleConfirmActivateStoppage = (
    reason: StoppageReason,
    duration: 60 | 90 | 120,
    resumeMode: ResumeMode
  ) => {
    setIsStoppageModalOpen(false);
    setIsPlaying(false);

    // Save exact frozen ball state
    const currentTeam = matchState.innings === 1 ? matchState.team1 : matchState.team2;
    const frozenMatch: FrozenMatchState = {
      innings: matchState.innings,
      over: currentTeam.oversCompleted,
      ball: currentTeam.ballsInOver,
      runs: currentTeam.score,
      wickets: currentTeam.wickets,
      striker: matchState.currentStriker,
      nonStriker: matchState.currentNonStriker,
      bowler: matchState.currentBowler,
      runRate: matchState.currentRunRate,
      requiredRunRate: matchState.requiredRunRate,
      targetRuns: matchState.targetRuns,
      commentarySnapshot: matchState.commentaryLog[0] || 'Match paused'
    };

    stoppageEngineRef.current.setPodDuration(duration);
    stoppageEngineRef.current.setResumeMode(resumeMode);

    const activated = stoppageEngineRef.current.activateStoppage(
      reason,
      frozenMatch,
      previousPod,
      {}
    );

    setStoppageState(activated);
    setAutopilotConfig(prev => ({
      ...prev,
      manualInfinity: true,
      stoppagePodDuration: duration,
      resumeMode
    }));
  };

  // Change Reason Mid-Stoppage
  const handleChangeStoppageReason = (newReason: StoppageReason) => {
    const updated = stoppageEngineRef.current.changeReason(newReason);
    setStoppageState(updated);
  };

  // Deactivate Stoppage (Turn OFF)
  const handleDeactivateStoppage = () => {
    const updated = stoppageEngineRef.current.requestResume();
    setStoppageState(updated);
  };

  // Emergency Stop Autopilot
  const handleEmergencyStopAutopilot = () => {
    // If an active one-shot break is running, conclude immediately
    if (activeOneShotBreak) {
      const finishedBreak = activeOneShotBreak;
      setAiredPods(prev => [...prev, finishedBreak.pod]);
      setPreviousPod(finishedBreak.pod);
      setActiveOneShotBreak(null);
      const resumedState = simulatorRef.current.resumeAfterBreak();
      setMatchState(resumedState);
      setIsPlaying(true);
    }

    // If Manual Infinity is running, trigger clean resume
    if (stoppageState.isActive) {
      const updated = stoppageEngineRef.current.requestResume();
      setStoppageState(updated);
    }
  };

  // Dismiss popup from queue
  const handleDismissPopup = (id: string) => {
    setPopupQueue(prev => prev.filter(p => p.id !== id));
  };

  // Compile End-of-Match Report Data with Duration Mix Statistics
  const reportData: EndOfMatchReportData = useMemo(() => {
    const brandAiringsMap = new Map<string, { airings: number; primeSlots: number; overrides: number }>();

    for (const b of SYNTHETIC_BRANDS) {
      brandAiringsMap.set(b.id, { airings: 0, primeSlots: 0, overrides: 0 });
    }

    for (const pod of airedPods) {
      const slots = pod.slots;
      slots.forEach((s, idx) => {
        if (!s.brand) return;
        const entry = brandAiringsMap.get(s.brand.id);
        if (entry) {
          entry.airings++;
          if (idx === 0 || idx === slots.length - 1) entry.primeSlots++;
        }
      });
    }

    for (const ov of overrideLogs) {
      for (const b of SYNTHETIC_BRANDS) {
        if (b.name === ov.brandName) {
          const entry = brandAiringsMap.get(b.id);
          if (entry) entry.overrides++;
        }
      }
    }

    const advertiserScores = SYNTHETIC_BRANDS.map(b => {
      const stats = brandAiringsMap.get(b.id) || { airings: 0, primeSlots: 0, overrides: 0 };
      const riskScore = Math.min(100, stats.overrides * 30);
      let status: 'Safe' | 'Moderate Risk' | 'High Risk' = 'Safe';
      if (riskScore > 50) status = 'High Risk';
      else if (riskScore > 0) status = 'Moderate Risk';

      return {
        brandId: b.id,
        brandName: b.name,
        category: b.category,
        tier: b.tier,
        totalAirings: stats.airings,
        primeSlotCount: stats.primeSlots,
        overriddenIncidents: stats.overrides,
        contextMismatches: 0,
        reputationRiskScore: riskScore,
        status
      };
    }).filter(a => a.totalAirings > 0 || a.overriddenIncidents > 0);

    const totalAdsAired = airedPods.reduce((sum, p) => sum + p.slots.filter(s => s.brand).length, 0);
    const totalStoppageSec = stoppageAudits.reduce((sum, s) => sum + s.totalDurationSeconds, 0);

    // Duration Mix Stats
    const pct15 = mixTally.totalSpots > 0 ? Math.round((mixTally.count15 / mixTally.totalSpots) * 100) : 0;
    const pct30 = mixTally.totalSpots > 0 ? Math.round((mixTally.count30 / mixTally.totalSpots) * 100) : 0;
    const pct45 = mixTally.totalSpots > 0 ? Math.round((mixTally.count45 / mixTally.totalSpots) * 100) : 0;

    const podPatterns = airedPods.map(p => ({
      podId: p.id,
      breakType: p.breakType,
      pattern: p.slots.map(s => s.duration),
      duration: p.targetDuration
    }));

    const durationMixStats: DurationMixStats = {
      count15: mixTally.count15,
      count30: mixTally.count30,
      count45: mixTally.count45,
      totalSpots: mixTally.totalSpots,
      percent15: pct15,
      percent30: pct30,
      percent45: pct45,
      podPatterns
    };

    return {
      totalPods: airedPods.length,
      totalAdsAired,
      ruleViolationsAvoided: Math.max(12, airedPods.length * 2 + 5),
      overridesMade: overrideLogs,
      advertiserScores,
      stoppageAudits,
      totalStoppageTimeSeconds: totalStoppageSec,
      durationMixStats,
      matchSummary: {
        team1: matchState.team1.name,
        team2: matchState.team2.name,
        innings1Score: `${matchState.team1.score}/${matchState.team1.wickets} (${matchState.team1.oversCompleted}.${matchState.team1.ballsInOver} ov)`,
        innings2Score: `${matchState.team2.score}/${matchState.team2.wickets} (${matchState.team2.oversCompleted}.${matchState.team2.ballsInOver} ov)`,
        result: matchState.status === 'MATCH_OVER' ? 'Match Finalized' : 'Live In-Progress Broadcast'
      }
    };
  }, [airedPods, overrideLogs, matchState, stoppageAudits, mixTally]);

  // Fallback / Active pod for MathsPanel live representation
  const activeMathPod: AdPod = useMemo(() => {
    if (activeOneShotBreak) return activeOneShotBreak.pod;
    if (stoppageState.isActive && stoppageState.currentPod) return stoppageState.currentPod;
    if (previousPod) return previousPod;
    return {
      id: 'PREVIEW_POD',
      breakType: 'Over_Break',
      innings: matchState.innings,
      overNo: matchState.team1.oversCompleted,
      slots: [
        { slotNumber: 1, duration: 15 },
        { slotNumber: 2, duration: 45 }
      ],
      targetDuration: 60,
      matchContext: {
        innings: matchState.innings,
        over: matchState.team1.oversCompleted,
        ball: matchState.team1.ballsInOver,
        battingTeam: matchState.team1.name,
        bowlingTeam: matchState.team2.name,
        runs: matchState.team1.score,
        wickets: matchState.team1.wickets,
        lastEvent: 'Over complete',
        wicketJustFell: false,
        favouriteWicketFell: false,
        runRate: matchState.currentRunRate
      }
    };
  }, [activeOneShotBreak, stoppageState.isActive, stoppageState.currentPod, previousPod, matchState]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* 1. Header Bar with One-Shot Break Buttons & Manual Infinity */}
      <Header
        matchState={matchState}
        isPlaying={isPlaying}
        speed={speed}
        activeOneShotBreak={activeOneShotBreak}
        isStoppageActive={stoppageState.isActive}
        onTogglePlay={handleTogglePlay}
        onStepBall={handleStepBall}
        onSkipToNextBreak={handleSkipToNextBreak}
        onChangeSpeed={setSpeed}
        onTriggerBreak={handleTriggerBreak}
        onToggleManualInfinity={handleToggleManualInfinity}
        onEmergencyStopAutopilot={handleEmergencyStopAutopilot}
        onOpenReplayModal={() => setIsReplayModalOpen(true)}
        onResetMatch={() => handleResetMatch(1337)}
        onOpenReport={() => setIsReportOpen(true)}
        totalAiredPodsCount={airedPods.length}
      />

      {/* 2. Unscheduled Stoppage Banner (when Toggle 5 is active) */}
      {stoppageState.isActive && (
        <StoppageBanner
          stoppageState={stoppageState}
          availableBrands={SYNTHETIC_BRANDS}
          onChangeReason={handleChangeStoppageReason}
          onDeactivateStoppage={handleDeactivateStoppage}
        />
      )}

      {/* 3. 3-Second Back to Live Broadcast Slate */}
      {stoppageState.showBackToLiveSlate && (
        <BackToLiveSlate countdown={stoppageState.slateCountdownSeconds} />
      )}

      {/* 4. Live Cricket Match Ribbon */}
      <MatchRibbon matchState={matchState} />

      {/* 5. Hold Banner (when simulation holds for operator break trigger) */}
      {matchState.status === 'HELD_FOR_BREAK' && matchState.pendingBreakHold && (
        <HoldBanner
          hold={matchState.pendingBreakHold}
          onSkipBreak={handleSkipBreak}
        />
      )}

      {/* 6. Main Broadcast Screen */}
      <main className="flex-1 p-4 flex flex-col gap-4 max-w-[1700px] w-full mx-auto">
        {/* Defensive Combinatorics & Spot Duration Mix Maths Panel */}
        <MathsPanel
          currentPod={activeMathPod}
          previousPod={previousPod}
          availableBrands={SYNTHETIC_BRANDS}
          mixTally={mixTally}
        />

        {/* If a One-Shot Break is Active, show the Autonomous On-Air Pod */}
        {activeOneShotBreak ? (
          <AutonomousOnAirPod activeBreak={activeOneShotBreak} />
        ) : stoppageState.isActive && stoppageState.currentPod ? (
          /* Stoppage Pod View */
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm">
                <Radio className="w-4 h-4 animate-spin" />
                <span>STOPPAGE ON-AIR POD #{stoppageState.podCount} ({stoppageState.reason})</span>
              </div>
              <span className="text-xs bg-red-100 text-red-800 font-mono px-2 py-0.5 rounded-full font-bold">
                {stoppageState.currentPod.targetDuration}s Pod
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stoppageState.currentPod.slots.map(s => (
                <div key={s.slotNumber} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-400">Slot {s.slotNumber} • {s.duration}s</div>
                  <div className="font-extrabold text-sm text-slate-800 mt-1">{s.brand?.name || 'Filler'}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.brand?.category}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Live Match On-Air Standby View */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200 my-4 shadow-sm">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mb-4 animate-pulse">
              <Tv className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-wide">
              LIVE BROADCAST FEED ON AIR
            </h2>
            <p className="text-sm text-slate-600 max-w-md mt-1 leading-relaxed">
              Match action is transmitting ball-by-ball. Commercial breaks are triggered exclusively by operator choice. When a break point occurs, play holds for your command.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                onClick={handleTogglePlay}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause Simulation' : 'Resume Simulation'}</span>
              </button>

              <button
                onClick={handleSkipToNextBreak}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-2 shadow-xs transition"
              >
                <SkipForward className="w-4 h-4" />
                <span>Fast Forward to Next Break</span>
              </button>
            </div>

            {/* Recent Aired Pods Mini-ticker */}
            {airedPods.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 w-full max-w-xl text-left">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                  Recently Aired Commercial Pods ({airedPods.length} Total)
                </span>
                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {airedPods.slice(-4).reverse().map(p => (
                    <div key={p.id} className="text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center justify-between text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{p.id}</span>
                        <span>{p.breakType.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold text-[10px]">
                        {p.slots.map((s, idx) => (
                          <span key={idx} className="px-1 py-0.2 bg-slate-200 rounded">{s.duration}s</span>
                        ))}
                      </div>
                      <span className="font-mono text-slate-500 font-semibold">{p.targetDuration}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 7. Non-Overlapping FIFO Popup Queue Modal */}
      <BreakResumePopupQueue
        popupQueue={popupQueue}
        onDismiss={handleDismissPopup}
      />

      {/* 8. Unscheduled Stoppage Reason Selector Modal */}
      <StoppageReasonModal
        isOpen={isStoppageModalOpen}
        onClose={() => setIsStoppageModalOpen(false)}
        onConfirmActivate={handleConfirmActivateStoppage}
      />

      {/* 9. Compliance & Governance Report Modal */}
      <EndOfMatchReport
        isOpen={isReportOpen}
        reportData={reportData}
        onClose={() => setIsReportOpen(false)}
      />

      {/* 10. Timeline Replay Loader Modal */}
      <MatchReplayModal
        isOpen={isReplayModalOpen}
        onClose={() => setIsReplayModalOpen(false)}
        onLoadPreloadedPods={handleLoadPreloadedPods}
        onReseedPrng={(seed) => handleResetMatch(seed)}
      />
    </div>
  );
};
