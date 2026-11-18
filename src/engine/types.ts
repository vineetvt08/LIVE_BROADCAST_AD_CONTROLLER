// Core domain types for MCR Guard

export type AdCategory =
  | 'Auto'
  | 'Beverage'
  | 'Telecom'
  | 'Fintech'
  | 'Travel'
  | 'Electronics'
  | 'Insurance'
  | 'Ecommerce'
  | 'Food_Delivery'
  | 'Dairy_Food'
  | 'FMCG'
  | 'EdTech'
  | 'Tyres'
  | 'Construction'
  | 'Home_Decor'
  | 'Gaming'
  | 'Channel_Promo'
  | 'Personal_Care';

export type Tier = 'Gold' | 'Silver' | 'Bronze';

export type BreakType =
  | 'Over_Break'
  | 'Wicket_Break'
  | 'Strategic_Timeout'
  | 'Half_Time_Break_Part1'
  | 'Half_Time_Break_Part2'
  | 'Half_Time_Break_Part3'
  | 'Half_Time_Break_Part4';

export type SpotDuration = 15 | 30 | 45;

export interface BrandContract {
  allowedInnings: (1 | 2)[];
  allowedBreakTypes: BreakType[];
  targetAirings: number;
}

export type SafetyTag =
  | 'avoid_after_wicket'
  | 'avoid_loss_situation'
  | 'needs_positive_context'
  | 'high_energy'
  | 'family_safe';

export interface BrandAd {
  id: string;
  name: string;
  category: AdCategory;
  availableDurations: SpotDuration[];
  contract: BrandContract;
  tier: Tier;
  rivalBrandIds: string[]; // Explicit excluded neighbours
  safetyTags: SafetyTag[];
  isSynthetic: true; // Always labeled synthetic in UI
  tagline?: string;
}

export interface PodSlot {
  slotNumber: number; // 1-based
  duration: SpotDuration;
  brand?: BrandAd;
  isOverridden?: boolean;
  overrideReason?: string;
}

export interface AdPod {
  id: string;
  innings: 1 | 2;
  overNo: number;
  breakType: BreakType;
  targetDuration: number; // in seconds (60, 90, 300)
  slots: PodSlot[];
  timestamp?: string;
  isAired?: boolean;
  matchContext: MatchContext;
}

export interface MatchContext {
  innings: 1 | 2;
  over: number;
  ball: number;
  battingTeam: string;
  bowlingTeam: string;
  runs: number;
  wickets: number;
  targetRuns?: number;
  lastEvent: string;
  wicketJustFell: boolean;
  favouriteWicketFell: boolean; // e.g. Kohli or Rohit dismissed
  runRate: number;
  requiredRunRate?: number;
}

export type RuleSeverity = 'BLOCK' | 'WARN' | 'INFO';

export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  severity: RuleSeverity;
  slotNumber: number;
  message: string;
  whyItHarms: string;
  recommendation: string;
  relatedBrandName?: string;
  relatedCategory?: string;
}

export type SlotSafetyStatus = 'GREEN' | 'AMBER' | 'RED';

export interface SlotEvaluation {
  slotNumber: number;
  status: SlotSafetyStatus;
  violations: RuleViolation[];
}

export interface PodEvaluation {
  isValidForAir: boolean;
  canGoLiveWithOverrides: boolean;
  hasBlockingViolations: boolean;
  durationUsed: number;
  targetDuration: number;
  slotEvaluations: SlotEvaluation[];
  allViolations: RuleViolation[];
  validCompletionsRemaining: number;
}

export interface OverrideLogEntry {
  id: string;
  timestamp: string;
  podId: string;
  innings: 1 | 2;
  overNo: number;
  breakType: BreakType;
  slotNumber: number;
  brandName: string;
  ruleId: string;
  ruleName: string;
  severity: RuleSeverity;
  reason: string;
}

export interface PodSuggestion {
  id: string;
  title: string;
  score: number;
  slots: {
    slotNumber: number;
    duration: SpotDuration;
    brand: BrandAd;
  }[];
  rationale: string[];
  metrics: {
    tierScore: number;
    fairnessScore: number;
    diversityScore: number;
    contextSafetyScore: number;
  };
}

export interface MathAnalysisResult {
  slotCount: number;
  mDisjointPairs: number;
  pieDisjointCount: number; // Inclusion-Exclusion formula result
  exactBacktrackingCount: number; // General graph count
  rookPolynomialFormula: string;
  rookValidAssignments: number;
  derangementCount: number; // !n
  previousPodBrands: string[];
  currentAssignedCount: number;
  remainingValidCompletions: number;
}

export interface AdvertiserReputationScore {
  brandId: string;
  brandName: string;
  category: AdCategory;
  tier: Tier;
  totalAirings: number;
  primeSlotCount: number;
  overriddenIncidents: number;
  contextMismatches: number;
  reputationRiskScore: number; // 0 (pristine) to 100 (critical risk)
  status: 'Safe' | 'Moderate Risk' | 'High Risk';
}

export interface DurationMixStats {
  count15: number;
  count30: number;
  count45: number;
  totalSpots: number;
  percent15: number;
  percent30: number;
  percent45: number;
  podPatterns: { podId: string; breakType: string; pattern: number[]; duration: number }[];
}

export interface EndOfMatchReportData {
  totalPods: number;
  totalAdsAired: number;
  ruleViolationsAvoided: number;
  overridesMade: OverrideLogEntry[];
  advertiserScores: AdvertiserReputationScore[];
  stoppageAudits?: import('./autopilot/types').StoppageAuditRecord[];
  totalStoppageTimeSeconds?: number;
  durationMixStats?: DurationMixStats;
  matchSummary: {
    team1: string;
    team2: string;
    innings1Score: string;
    innings2Score: string;
    result: string;
  };
}
