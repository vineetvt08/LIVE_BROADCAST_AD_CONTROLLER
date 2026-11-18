import React, { useState } from 'react';
import { AdPod } from '../engine/types';
import { buildPodsFromCsv, SAMPLE_DATASET_CSV } from '../data/sampleDataset';
import { Upload, FileText, RefreshCw, X, Check, Database } from 'lucide-react';

interface MatchReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadPreloadedPods: (pods: AdPod[], title: string) => void;
  onReseedPrng: (seed: number) => void;
}

export const MatchReplayModal: React.FC<MatchReplayModalProps> = ({
  isOpen,
  onClose,
  onLoadPreloadedPods,
  onReseedPrng
}) => {
  const [customSeed, setCustomSeed] = useState('1337');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleLoadBuiltinCsvDataset = () => {
    try {
      const pods = buildPodsFromCsv(SAMPLE_DATASET_CSV);
      onLoadPreloadedPods(pods, 'Official World Cup ODI Broadcast Dataset (120 Pods)');
      setStatusMessage(`Successfully loaded ${pods.length} broadcast pods from official sample dataset.`);
      setTimeout(onClose, 800);
    } catch (err: any) {
      setStatusMessage(`Error parsing dataset: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        if (file.name.endsWith('.csv')) {
          const pods = buildPodsFromCsv(content);
          onLoadPreloadedPods(pods, file.name);
          setStatusMessage(`Loaded ${pods.length} pods from CSV "${file.name}".`);
          setTimeout(onClose, 800);
        } else {
          const parsed = JSON.parse(content);
          const pods: AdPod[] = Array.isArray(parsed) ? parsed : parsed.pods || [];
          if (pods.length === 0) throw new Error('No pods array found in JSON file.');
          onLoadPreloadedPods(pods, file.name);
          setStatusMessage(`Loaded ${pods.length} pods from JSON "${file.name}".`);
          setTimeout(onClose, 800);
        }
      } catch (err: any) {
        setStatusMessage(`Error parsing file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleApplySeed = (e: React.FormEvent) => {
    e.preventDefault();
    const seedNum = parseInt(customSeed, 10);
    if (isNaN(seedNum)) {
      setStatusMessage('Please enter a valid numeric seed.');
      return;
    }
    onReseedPrng(seedNum);
    setStatusMessage(`PRNG reseeded to ${seedNum}. Match simulation reset.`);
    setTimeout(onClose, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print text-slate-800">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-wide">
                Replay Real Match Timeline & Seed Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Load actual historical ODI broadcast pods or configure deterministic seed
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option 1: 1-Click Load Built-in 120-Pod Dataset */}
        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                1-Click: Broadcaster Sample Dataset (120 Pods)
              </span>
            </div>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold border border-blue-200">
              Innings 1 & 2
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Instantly loads the 120 real-style broadcast pods provided in your sample dataset (Over breaks, wicket breaks, strategic timeouts, and half-time blocks) with timestamps and brand assignments.
          </p>
          <button
            onClick={handleLoadBuiltinCsvDataset}
            className="w-full mt-1 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            <span>Load 120-Pod Sample Match Dataset</span>
          </button>
        </div>

        {/* Option 2: Upload Custom CSV / JSON */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Upload External JSON or CSV Timeline File
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Upload your own match JSON/CSV file with columns: Pod_ID, Innings, Over_No, Break_Type, Timestamp, Slot_No, Brand_Name, Duration_Sec.
          </p>
          <label className="w-full py-2 px-3 border border-slate-300 hover:border-slate-400 border-dashed rounded-xl bg-white text-xs text-slate-600 cursor-pointer flex items-center justify-center gap-2 transition shadow-xs">
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Select .csv or .json file...</span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Option 3: Reseed Deterministic PRNG */}
        <form onSubmit={handleApplySeed} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Deterministic Simulation Replay (Seeded PRNG)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Every integer seed generates the exact same sequence of balls, wickets, runs, and break triggers.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="number"
              value={customSeed}
              onChange={(e) => setCustomSeed(e.target.value)}
              placeholder="e.g. 1337, 2024, 777"
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition shadow-xs"
            >
              Apply Seed & Reset
            </button>
          </div>
        </form>

        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-blue-100 border border-blue-300 text-xs text-blue-900 text-center font-bold">
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
};
