import React from 'react';
import { PendingBreakHold } from '../engine/matchSimulator';
import { AlertTriangle, FastForward, Clock, ShieldAlert } from 'lucide-react';

interface HoldBannerProps {
  hold: PendingBreakHold;
  onSkipBreak: () => void;
}

export const HoldBanner: React.FC<HoldBannerProps> = ({ hold, onSkipBreak }) => {
  const getBreakBadge = () => {
    if (hold.holdState === 'STATE_C') {
      return { label: 'LAST BALL WICKET: CHOOSE BREAK (WICKET / OVER / STRATEGIC)', color: 'bg-rose-600 text-white' };
    }
    if (hold.holdState === 'STATE_A') {
      return { label: 'OVER BOUNDARY: CHOOSE OVER OR STRATEGIC', color: 'bg-blue-600 text-white' };
    }
    switch (hold.type) {
      case 'OVER':
        return { label: 'OVER BREAK PENDING (60s)', color: 'bg-blue-600 text-white' };
      case 'WICKET':
        return { label: 'WICKET BREAK PENDING (90s)', color: 'bg-red-600 text-white' };
      case 'STRATEGIC':
        return { label: 'STRATEGIC TIMEOUT PENDING (300s)', color: 'bg-indigo-600 text-white' };
      case 'HALF_TIME':
        return { label: 'HALF-TIME BREAK PENDING (300s)', color: 'bg-purple-600 text-white' };
    }
  };

  const badge = getBreakBadge();

  return (
    <div className="bg-amber-50 border-y-2 border-amber-400 px-4 py-3 shadow-md no-print animate-fadeIn">
      <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Hold Information */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-400 text-amber-950 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">
                Holding at Over {hold.atOver}.{hold.atBall}
              </span>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {hold.reasonText}
            </h3>
            <p className="text-xs text-slate-600">
              The match is paused. Click the corresponding break button below to broadcast the pod, or continue immediately without ads.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Skip Break Button */}
          <button
            onClick={onSkipBreak}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-sm flex items-center gap-2 transition active:scale-98"
            title="Resume match play immediately without airing any commercial break"
          >
            <FastForward className="w-4 h-4 text-amber-600" />
            <span>Continue without ads</span>
          </button>
        </div>
      </div>
    </div>
  );
};
