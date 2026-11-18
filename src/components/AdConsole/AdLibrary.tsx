import React, { useState, useMemo } from 'react';
import { BrandAd, BreakType, SpotDuration, Tier } from '../../engine/types';
import { Search, AlertCircle } from 'lucide-react';

interface AdLibraryProps {
  brands: BrandAd[];
  currentInnings: 1 | 2;
  currentBreakType: BreakType;
  selectedSlotNumber: number;
  onSelectBrandForSlot: (brand: BrandAd) => void;
}

export const AdLibrary: React.FC<AdLibraryProps> = ({
  brands,
  currentInnings,
  currentBreakType,
  selectedSlotNumber,
  onSelectBrandForSlot
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDuration, setSelectedDuration] = useState<number | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = useState<Tier | 'ALL'>('ALL');
  const [onlyContractEligible, setOnlyContractEligible] = useState(true);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    brands.forEach(b => set.add(b.category));
    return ['ALL', ...Array.from(set).sort()];
  }, [brands]);

  // Filter brands
  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      // Search text
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(term);
        const matchesCat = b.category.toLowerCase().includes(term);
        const matchesTag = b.tagline?.toLowerCase().includes(term);
        if (!matchesName && !matchesCat && !matchesTag) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && b.category !== selectedCategory) return false;

      // Duration
      if (selectedDuration !== 'ALL' && !b.availableDurations.includes(selectedDuration as SpotDuration)) return false;

      // Tier
      if (selectedTier !== 'ALL' && b.tier !== selectedTier) return false;

      // Contract eligibility
      if (onlyContractEligible) {
        const canInnings = b.contract.allowedInnings.includes(currentInnings);
        const canBreak = b.contract.allowedBreakTypes.includes(currentBreakType);
        if (!canInnings || !canBreak) return false;
      }

      return true;
    });
  }, [brands, searchTerm, selectedCategory, selectedDuration, selectedTier, onlyContractEligible, currentInnings, currentBreakType]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 shadow-sm h-full text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-wide flex items-center gap-2">
            <span>Synthetic Advertiser Library</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {filteredBrands.length} Brands
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Targeting <span className="text-blue-600 font-bold">Slot #{selectedSlotNumber}</span> (Click any brand to assign)
          </p>
        </div>

        {/* Contract toggle */}
        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyContractEligible}
            onChange={(e) => setOnlyContractEligible(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-0"
          />
          <span className="text-[11px]">Contract-Eligible Only</span>
        </label>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search brand, category, or campaign..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Category dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-slate-700 text-xs font-medium focus:outline-none focus:border-blue-500"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
          ))}
        </select>

        {/* Duration filter */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[11px]">
          {(['ALL', 15, 30, 45] as const).map(d => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`px-2 py-0.5 font-bold rounded-md ${
                selectedDuration === d ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {d === 'ALL' ? 'All' : `${d}s`}
            </button>
          ))}
        </div>

        {/* Tier filter */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[11px]">
          {(['ALL', 'Gold', 'Silver', 'Bronze'] as const).map(t => (
            <button
              key={t}
              onClick={() => setSelectedTier(t)}
              className={`px-2 py-0.5 font-bold rounded-md ${
                selectedTier === t ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[380px] pr-1">
        {filteredBrands.map(brand => {
          const isEligibleInnings = brand.contract.allowedInnings.includes(currentInnings);
          const isEligibleBreak = brand.contract.allowedBreakTypes.includes(currentBreakType);
          const isContractEligible = isEligibleInnings && isEligibleBreak;

          return (
            <div
              key={brand.id}
              onClick={() => onSelectBrandForSlot(brand)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition cursor-pointer select-none group ${
                isContractEligible
                  ? 'bg-slate-50/70 border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 shadow-xs'
                  : 'bg-red-50/60 border-red-200 opacity-80 hover:opacity-100 hover:border-red-400'
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-700 transition">
                      {brand.name}
                    </h4>
                    <span
                      className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                        brand.tier === 'Gold'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : brand.tier === 'Silver'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {brand.tier}
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                    {brand.category}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {brand.availableDurations.map(d => (
                    <span
                      key={d}
                      className="text-[9px] font-mono px-1 py-0.2 bg-white text-slate-600 rounded border border-slate-200 font-bold"
                    >
                      {d}s
                    </span>
                  ))}
                </div>
              </div>

              {brand.tagline && (
                <p className="text-[9px] text-slate-500 italic truncate">
                  "{brand.tagline}"
                </p>
              )}

              {/* Safety & Rival Tags */}
              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                {brand.safetyTags.includes('avoid_after_wicket') && (
                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    Avoid Post-Wicket
                  </span>
                )}
                {brand.safetyTags.includes('needs_positive_context') && (
                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-300">
                    Needs Positive Mood
                  </span>
                )}
                {brand.rivalBrandIds.length > 0 && (
                  <span className="text-[8px] font-mono text-slate-500 truncate max-w-[120px]">
                    Rivals: {brand.rivalBrandIds.length}
                  </span>
                )}
              </div>

              {!isContractEligible && (
                <div className="text-[9px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" />
                  <span>Outside Contract Window (Requires Override)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
