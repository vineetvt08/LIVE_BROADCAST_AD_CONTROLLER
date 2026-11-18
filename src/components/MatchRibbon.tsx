import React from 'react';
import { MatchState } from '../engine/matchSimulator';
import { Activity } from 'lucide-react';

interface MatchRibbonProps {
  matchState: MatchState;
}

export const MatchRibbon: React.FC<MatchRibbonProps> = ({ matchState }) => {
  const currentTeam = matchState.innings === 1 ? matchState.team1 : matchState.team2;
  const opponentTeam = matchState.innings === 1 ? matchState.team2 : matchState.team1;

  const currentOverFormatted = `${currentTeam.oversCompleted}.${currentTeam.ballsInOver}`;
  const isSecondInnings = matchState.innings === 2;

  return (
    <section className="bg-white border-b border-slate-200 px-4 py-2.5 text-slate-800 no-print shadow-sm">
      <div className="max-w-[1700px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Main Scoreboard Ribbon */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Batting Team Badge */}
          <div className="flex items-center gap-2.5 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {matchState.innings === 1 ? '1st Innings' : '2nd Innings (Chase)'}
              </div>
              <div className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                <span>{currentTeam.name.toUpperCase()}</span>
                <span className="text-blue-700 font-mono text-xl">
                  {currentTeam.score}/{currentTeam.wickets}
                </span>
                <span className="text-slate-500 text-xs font-normal">
                  ({currentOverFormatted} / 50 ov)
                </span>
              </div>
            </div>
          </div>

          {/* Opponent score if 2nd innings */}
          {isSecondInnings && (
            <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-semibold">{opponentTeam.name}: </span>
              <span className="font-bold text-slate-800">
                {opponentTeam.score}/{opponentTeam.wickets} (50 ov)
              </span>
              <div className="text-[11px] text-amber-700 font-bold mt-0.5">
                Target: {matchState.targetRuns} (Need {Math.max(0, (matchState.targetRuns || 0) - currentTeam.score)} runs in {Math.max(0, 300 - (currentTeam.oversCompleted * 6 + currentTeam.ballsInOver))} balls)
              </div>
            </div>
          )}

          {/* Run Rates */}
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">CRR</span>
              <span className="text-emerald-700 font-bold text-sm">{matchState.currentRunRate}</span>
            </div>
            {isSecondInnings && matchState.requiredRunRate !== undefined && (
              <div className="border-l border-slate-200 pl-3">
                <span className="text-slate-500 block text-[9px] uppercase font-sans font-bold">RRR</span>
                <span className={`font-bold text-sm ${matchState.requiredRunRate > 9 ? 'text-red-600' : 'text-blue-700'}`}>
                  {matchState.requiredRunRate}
                </span>
              </div>
            )}
          </div>

          {/* On-pitch participants */}
          <div className="hidden md:flex items-center gap-4 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[9px] uppercase text-slate-500 font-bold block">Striker</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <span className="text-amber-600 font-bold">*</span>
                {matchState.currentStriker}
              </span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[9px] uppercase text-slate-500 font-bold block">Non-Striker</span>
              <span className="text-slate-700 font-medium">{matchState.currentNonStriker}</span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[9px] uppercase text-slate-500 font-bold block">Bowler</span>
              <span className="font-semibold text-blue-700">{matchState.currentBowler}</span>
            </div>
          </div>
        </div>

        {/* Latest Ball Commentary Ticker */}
        <div className="flex-1 lg:max-w-md bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-200 flex items-center gap-2 overflow-hidden shadow-inner">
          <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="truncate text-xs font-medium text-slate-700">
            {matchState.commentaryLog[0] || 'Broadcaster feed standby...'}
          </div>
        </div>
      </div>
    </section>
  );
};
