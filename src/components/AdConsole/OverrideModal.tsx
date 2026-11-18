import React, { useState } from 'react';
import { PodSlot, RuleViolation } from '../../engine/types';
import { X, Check, ShieldAlert } from 'lucide-react';

interface OverrideModalProps {
  isOpen: boolean;
  slotNumber: number;
  slot?: PodSlot;
  violations: RuleViolation[];
  onClose: () => void;
  onConfirmOverride: (slotNumber: number, reason: string) => void;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  isOpen,
  slotNumber,
  slot,
  violations,
  onClose,
  onConfirmOverride
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !slot) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A written broadcast justification is mandatory for compliance auditing.');
      return;
    }
    onConfirmOverride(slotNumber, reason.trim());
    setReason('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print text-slate-800">
      <div className="bg-white border border-red-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-wide">
                Operator Defensive Override — Slot #{slotNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Brand: <strong className="text-slate-900">{slot.brand?.name}</strong> ({slot.brand?.category})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Violations Summary */}
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {violations.map((v, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-red-50/60 border border-red-200 text-xs text-slate-800 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between font-bold text-red-700">
                <span>{v.ruleName}</span>
                <span className="px-1.5 py-0.2 rounded bg-red-200 text-red-900 text-[10px] uppercase font-mono">
                  {v.severity}
                </span>
              </div>
              <p className="text-slate-700 leading-tight">{v.message}</p>
              <p className="text-slate-500 italic text-[11px] mt-1">
                <strong>Why it harms advertiser:</strong> {v.whyItHarms}
              </p>
            </div>
          ))}
        </div>

        {/* Justification Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Required Operator Justification (Logged to Internal Audit Trail):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Approved by Agency VP under live make-good arrangement; client granted written waiver for this break..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:bg-white transition"
              autoFocus
            />
            {error && <p className="text-xs text-red-600 mt-1 font-bold">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-md shadow-red-200 transition"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Override & Audit Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
