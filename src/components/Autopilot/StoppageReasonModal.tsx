import React, { useState } from 'react';
import { ResumeMode, StoppageReason } from '../../engine/autopilot/types';
import { AlertOctagon, X, Check, Clock, ShieldAlert } from 'lucide-react';

interface StoppageReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmActivate: (reason: StoppageReason, duration: 60 | 90 | 120, resumeMode: ResumeMode) => void;
}

export const StoppageReasonModal: React.FC<StoppageReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirmActivate
}) => {
  const [selectedReason, setSelectedReason] = useState<StoppageReason>('Rain');
  const [podDuration, setPodDuration] = useState<60 | 90 | 120>(90);
  const [resumeMode, setResumeMode] = useState<ResumeMode>('AFTER_CURRENT_POD');

  if (!isOpen) return null;

  const reasons: { reason: StoppageReason; description: string }[] = [
    { reason: 'Rain', description: 'Weather delay. Allows neutral ads; softly prioritizes beverage/home sectors.' },
    { reason: 'Floodlight failure', description: 'Stadium lighting malfunction. Neutral-safe commercial rotation.' },
    { reason: 'Player injury', description: 'On-field medical attention. Excludes celebratory, humorous, and high-energy ads.' },
    { reason: 'Crowd/pitch disturbance', description: 'Security or pitch invasion delay. Excludes high-energy ads.' },
    { reason: 'Technical fault', description: 'DRS/broadcast technical interruption. Standard safe rotation.' },
    { reason: 'Other', description: 'Unforeseen match pause. Neutral-safe ads only.' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmActivate(selectedReason, podDuration, resumeMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
      <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-800">
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 border border-red-300 text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-wide">
                Initiate Unscheduled Stoppage (Manual Infinity)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Freezes match clock at current ball and airs autonomous ad pods
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Stoppage Reason (Sets Brand-Safety Policy):
            </label>
            <div className="flex flex-col gap-1.5">
              {reasons.map(({ reason, description }) => (
                <label
                  key={reason}
                  className={`p-2.5 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                    selectedReason === reason
                      ? 'bg-red-50 border-red-500 text-slate-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="stoppageReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="mt-0.5 text-red-600 focus:ring-0"
                  />
                  <div>
                    <div className="text-xs font-bold">{reason}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Pod Duration Configuration */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Stoppage Pod Duration:
              </label>
              <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                {([60, 90, 120] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setPodDuration(d)}
                    className={`flex-1 py-1 text-xs font-bold rounded ${
                      podDuration === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {d}s {d === 90 ? '(Default)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Resumption Exit Rule:
              </label>
              <select
                value={resumeMode}
                onChange={(e) => setResumeMode(e.target.value as ResumeMode)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="AFTER_CURRENT_POD">Resume after current pod (Recommended)</option>
                <option value="AFTER_CURRENT_SPOT">Resume after current spot</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-md shadow-red-200 transition"
            >
              <Check className="w-4 h-4" />
              <span>Activate Unscheduled Stoppage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
