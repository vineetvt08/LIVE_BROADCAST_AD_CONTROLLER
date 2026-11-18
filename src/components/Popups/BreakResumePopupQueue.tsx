import React, { useEffect, useState } from 'react';
import { BreakResumePopup } from '../../engine/autopilot/types';
import { Radio, CheckCircle, Clock } from 'lucide-react';

interface BreakResumePopupQueueProps {
  popupQueue: BreakResumePopup[];
  onDismiss: (id: string) => void;
}

export const BreakResumePopupQueue: React.FC<BreakResumePopupQueueProps> = ({
  popupQueue,
  onDismiss
}) => {
  const currentPopup = popupQueue.length > 0 ? popupQueue[0] : null;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);

  useEffect(() => {
    if (!currentPopup) return;

    setSecondsRemaining(5);
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss(currentPopup.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentPopup?.id, onDismiss]);

  if (!currentPopup) return null;

  const getBreakBadge = () => {
    switch (currentPopup.breakType) {
      case 'OVER':
        return { label: 'OVER BREAK COMPLETE', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'WICKET':
        return { label: 'WICKET BREAK COMPLETE', color: 'bg-red-100 text-red-800 border-red-300' };
      case 'STRATEGIC':
        return { label: 'STRATEGIC TIMEOUT COMPLETE', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'HALF_TIME':
        return { label: 'HALF-TIME BREAK COMPLETE', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  const badge = getBreakBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden transform transition-all animate-scaleUp">
        {/* Header Bar */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-slate-800">
              Live Feed Status
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200 shadow-inner">
            <CheckCircle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {currentPopup.title}
            </h3>
            <p className="text-sm font-semibold text-slate-600 mt-1">
              {currentPopup.message}
            </p>
          </div>

          {/* Match State Context Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-around text-xs">
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Score at Resume</span>
              <span className="font-extrabold text-slate-800 text-sm">{currentPopup.scoreAtResume}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 font-medium block text-[10px] uppercase">Match Over</span>
              <span className="font-extrabold text-blue-600 text-sm">{currentPopup.overAtResume}</span>
            </div>
          </div>

          {/* Auto-Dismiss Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Auto-resuming feed
              </span>
              <span className="font-mono font-bold text-slate-700">{secondsRemaining}s</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(secondsRemaining / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Button */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={() => onDismiss(currentPopup.id)}
            className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition active:scale-[0.99]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
