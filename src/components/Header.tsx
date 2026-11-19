import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Upload,
  FileText,
  ShieldCheck,
  Radio,
  Tv,
  Clock,
  StopCircle,
  Zap,
  Flame,
  Coffee,
  Split
} from 'lucide-react';
import { MatchState } from '../engine/matchSimulator';
import { ActiveOneShotBreak, OneShotBreakType } from '../engine/autopilot/types';

interface HeaderProps {
  matchState: MatchState;
  isPlaying: boolean;
  speed: 1 | 5 | 20;
  activeOneShotBreak: ActiveOneShotBreak | null;
  isStoppageActive: boolean;
  onTogglePlay: () => void;
  onStepBall: () => void;
  onSkipToNextBreak: () => void;
  onChangeSpeed: (s: 1 | 5 | 20) => void;
  onTriggerBreak: (type: OneShotBreakType) => void;
  onToggleManualInfinity: () => void;
  onEmergencyStopAutopilot: () => void;
  onOpenReplayModal: () => void;
  onResetMatch: () => void;
  onOpenReport: () => void;
  totalAiredPodsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  matchState,
  isPlaying,
  speed,
  activeOneShotBreak,
  isStoppageActive,
  onTogglePlay,
  onStepBall,
  onSkipToNextBreak,
  onChangeSpeed,
  onTriggerBreak,
  onToggleManualInfinity,
  onEmergencyStopAutopilot,
  onOpenReplayModal,
  onResetMatch,
  onOpenReport,
  totalAiredPodsCount
}) => {
  const isMatchOver = matchState.status === 'MATCH_OVER';
  const isBreakActive = activeOneShotBreak !== null;
  const pendingHold = matchState.pendingBreakHold;
  const holdState = pendingHold?.holdState;

  const currentWickets = matchState.innings === 1 ? matchState.team1.wickets : matchState.team2.wickets;

  // 1. OVER BREAK (60s)
  let isOverDisabled = false;
  let overTitle = '';
  if (isBreakActive) {
    isOverDisabled = true;
    overTitle = 'A break is already on air.';
  } else if (isStoppageActive) {
    isOverDisabled = true;
    overTitle = 'Manual Infinity is running.';
  } else if (isMatchOver) {
    isOverDisabled = true;
    overTitle = 'Match concluded.';
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

  // 2. STRATEGIC TIMEOUT (300s)
  let isStrategicDisabled = false;
  let strategicTitle = '';
  if (isBreakActive) {
    isStrategicDisabled = true;
    strategicTitle = 'A break is already on air.';
  } else if (isStoppageActive) {
    isStrategicDisabled = true;
    strategicTitle = 'Manual Infinity is running.';
  } else if (isMatchOver) {
    isStrategicDisabled = true;
    strategicTitle = 'Match concluded.';
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

  // 3. WICKET BREAK (90s)
  let isWicketDisabled = false;
  let wicketTitle = '';
  if (currentWickets >= 10) {
    isWicketDisabled = true;
    wicketTitle = 'All 10 wickets fallen.';
  } else if (isBreakActive) {
    isWicketDisabled = true;
    wicketTitle = 'A break is already on air.';
  } else if (isStoppageActive) {
    isWicketDisabled = true;
    wicketTitle = 'Manual Infinity is running.';
  } else if (isMatchOver) {
    isWicketDisabled = true;
    wicketTitle = 'Match concluded.';
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
    // Over is running / balls in play:
    // Operator can click to record a wicket (+1 Wkt) and air 90s break immediately!
    isWicketDisabled = false;
    wicketTitle = 'Click to record a wicket (+1 Wkt) and broadcast 90s Wicket Break';
  }

  // 4. HALF-TIME BREAK (30m: 20m Ads + 10m Studio Talk)
  let isHalfTimeDisabled = false;
  let halfTimeTitle = '';
  if (isBreakActive) {
    isHalfTimeDisabled = true;
    halfTimeTitle = 'A break is already on air.';
  } else if (isStoppageActive) {
    isHalfTimeDisabled = true;
    halfTimeTitle = 'Manual Infinity is running.';
  } else if (isMatchOver) {
    isHalfTimeDisabled = true;
    halfTimeTitle = 'Match concluded.';
  } else if (pendingHold?.type === 'HALF_TIME') {
    isHalfTimeDisabled = false;
    halfTimeTitle = 'Innings complete: click to broadcast 30-minute Half-time Show (20m ads + 10m studio talk)';
  } else {
    isHalfTimeDisabled = true;
    halfTimeTitle = 'Half-time is available after the first innings (30 mins: 20 mins ads + 10 mins studio talk).';
  }

  // Format seconds countdown for active button
  const formatCountdown = (seconds: number) => {
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = Math.ceil(seconds % 60);
      return `${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${Math.ceil(seconds)}s`;
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-2 flex flex-col gap-2 select-none no-print shadow-sm">
      {/* Top Row: Brand, Playback & Reports */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <Tv className="w-5 h-5 text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wide text-sm text-slate-900">MCR GUARD</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200">
                  Broadcast Autonomous Edition
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Defensive Transmission & Instant Break Deck</p>
            </div>
          </div>

          {/* Live on-air state badge */}
          <div className="flex items-center gap-2">
            {isStoppageActive ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-300 text-red-700 text-xs font-bold animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping inline-block" />
                <span>UNSCHEDULED STOPPAGE ACTIVE</span>
              </div>
            ) : isBreakActive ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold animate-pulse">
                <Radio className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>POD AIRING: {activeOneShotBreak.type} ({formatCountdown(activeOneShotBreak.remainingSeconds)})</span>
              </div>
            ) : isMatchOver ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>MATCH CONCLUDED</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-on-air inline-block" />
                <span>ON AIR // LIVE FEED</span>
              </div>
            )}

            {/* Synthetic Data Label */}
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Synthetic Contracts
            </span>
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={onTogglePlay}
            disabled={isMatchOver || isBreakActive || isStoppageActive}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={onStepBall}
            disabled={isPlaying || isMatchOver || isBreakActive || isStoppageActive}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 disabled:opacity-40 transition"
          >
            1 Ball
          </button>

          {/* Speed selectors */}
          <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
            {([1, 5, 20] as const).map(s => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                  speed === s ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={onSkipToNextBreak}
            disabled={isMatchOver || isBreakActive || isStoppageActive}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Skip to Next Break</span>
          </button>
        </div>

        {/* Right: Timeline Load, Seed, Report */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReplayModal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Timeline</span>
          </button>

          <button
            onClick={onResetMatch}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 transition shadow-sm"
            title="Reset Match Simulator"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenReport}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Compliance Report</span>
            {totalAiredPodsCount > 0 && (
              <span className="bg-black/20 px-1.5 py-0.2 rounded-full text-[10px]">
                {totalAiredPodsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Row: Four One-Shot Break Buttons & Manual Infinity */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100 bg-slate-50/80 p-2 rounded-xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 pr-2 border-r border-slate-300">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>BREAK CONTROLS:</span>
          </div>

          {/* 1. Over Break Button (60s) */}
          <button
            type="button"
            onClick={() => onTriggerBreak('OVER')}
            disabled={isOverDisabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition shadow-xs ${
              activeOneShotBreak?.type === 'OVER'
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm animate-pulse'
                : !isOverDisabled
                ? 'bg-blue-600 text-white border-blue-700 shadow-md animate-bounce'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={overTitle}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Over (60s)</span>
            {activeOneShotBreak?.type === 'OVER' ? (
              <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-mono font-black animate-ping">
                ON AIR [{formatCountdown(activeOneShotBreak.remainingSeconds)}]
              </span>
            ) : null}
          </button>

          {/* 2. Wicket Break Button (90s) */}
          <button
            type="button"
            onClick={() => onTriggerBreak('WICKET')}
            disabled={isWicketDisabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition shadow-xs ${
              activeOneShotBreak?.type === 'WICKET'
                ? 'bg-red-600 text-white border-red-700 shadow-sm animate-pulse'
                : !isWicketDisabled && (holdState === 'STATE_B' || holdState === 'STATE_C')
                ? 'bg-red-600 text-white border-red-700 shadow-md animate-bounce'
                : !isWicketDisabled
                ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:text-red-800'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-red-50 hover:text-red-700 hover:border-red-300'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={wicketTitle}
          >
            <Flame className="w-3.5 h-3.5 text-red-600" />
            <span>Wicket (90s)</span>
            {activeOneShotBreak?.type === 'WICKET' ? (
              <span className="text-[10px] bg-amber-400 text-red-950 px-1.5 py-0.5 rounded-full font-mono font-black animate-ping">
                ON AIR [{formatCountdown(activeOneShotBreak.remainingSeconds)}]
              </span>
            ) : currentWickets >= 10 ? (
              <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded">10 WKTS</span>
            ) : null}
          </button>

          {/* 3. Half-Time Break Button (30m: 20m Ads + 10m Studio Talk) */}
          <button
            type="button"
            onClick={() => onTriggerBreak('HALF_TIME')}
            disabled={isHalfTimeDisabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition shadow-xs ${
              activeOneShotBreak?.type === 'HALF_TIME'
                ? 'bg-purple-600 text-white border-purple-700 shadow-sm animate-pulse'
                : !isHalfTimeDisabled
                ? 'bg-purple-600 text-white border-purple-700 shadow-md animate-bounce'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={halfTimeTitle}
          >
            <Split className="w-3.5 h-3.5 text-purple-600" />
            <span>Half-time (30m)</span>
            {activeOneShotBreak?.type === 'HALF_TIME' ? (
              <span className="text-[10px] bg-purple-900 text-white px-1.5 py-0.5 rounded-full font-mono font-black animate-ping">
                ON AIR [{formatCountdown(activeOneShotBreak.remainingSeconds)}]
              </span>
            ) : null}
          </button>

          {/* 4. Strategic Timeout Button (300s) */}
          <button
            type="button"
            onClick={() => onTriggerBreak('STRATEGIC')}
            disabled={isStrategicDisabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition shadow-xs ${
              activeOneShotBreak?.type === 'STRATEGIC'
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm animate-pulse'
                : !isStrategicDisabled
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md animate-bounce'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={strategicTitle}
          >
            <Coffee className="w-3.5 h-3.5 text-indigo-600" />
            <span>Strategic (300s)</span>
            {activeOneShotBreak?.type === 'STRATEGIC' ? (
              <span className="text-[10px] bg-indigo-900 text-white px-1.5 py-0.5 rounded-full font-mono font-black animate-ping">
                ON AIR [{formatCountdown(activeOneShotBreak.remainingSeconds)}]
              </span>
            ) : null}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-300 mx-1" />

          {/* Toggle 5: Manual Infinity (Unscheduled Stoppage) */}
          <button
            type="button"
            onClick={onToggleManualInfinity}
            disabled={isBreakActive}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border flex items-center gap-1.5 shadow-xs transition ${
              isStoppageActive
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Toggle 5: Unscheduled Stoppage (Manual Infinity). Freezes match clock at current ball and airs autonomous ad pods."
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Manual Infinity (Stoppage)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isStoppageActive ? 'bg-red-800 text-white' : 'bg-red-200 text-red-900'}`}>
              {isStoppageActive ? 'ACTIVE' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Emergency Stop Autopilot Button */}
        {(isBreakActive || isStoppageActive) && (
          <button
            onClick={onEmergencyStopAutopilot}
            className="px-3 py-1.5 rounded-lg text-xs font-black bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5 shadow-sm transition animate-bounce"
            title="Emergency halt of active commercial break or stoppage at the next spot boundary"
          >
            <StopCircle className="w-4 h-4" />
            <span>STOP AUTOPILOT</span>
          </button>
        )}
      </div>
    </header>
  );
};
