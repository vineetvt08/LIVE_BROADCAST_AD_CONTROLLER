import React from 'react';
import { Radio, Tv } from 'lucide-react';

interface BackToLiveSlateProps {
  countdown: number; // 3, 2, 1
}

export const BackToLiveSlate: React.FC<BackToLiveSlateProps> = ({ countdown }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 text-white backdrop-blur-md p-6 select-none animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-slate-800 border-2 border-red-500 rounded-3xl p-8 text-center shadow-2xl flex flex-col items-center gap-4">
        <div className="p-4 rounded-full bg-red-600 text-white animate-pulse">
          <Radio className="w-10 h-10" />
        </div>

        <div className="flex items-center gap-2 text-xs uppercase font-extrabold tracking-widest text-red-400 bg-red-950/60 px-3 py-1 rounded-full border border-red-700">
          <Tv className="w-4 h-4" />
          <span>Master Control Transition</span>
        </div>

        <h2 className="text-2xl font-black tracking-wide text-white">
          RETURNING TO LIVE MATCH
        </h2>

        <p className="text-xs text-slate-300">
          Commercial stoppage concluded. Unfreezing ball clock and live broadcast feed in:
        </p>

        <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-red-500 flex items-center justify-center text-5xl font-mono font-black text-amber-400 shadow-inner my-2">
          {countdown}
        </div>

        <p className="text-[11px] text-slate-400 font-mono">
          State preserved: exact ball, score, and bowler ready
        </p>
      </div>
    </div>
  );
};
