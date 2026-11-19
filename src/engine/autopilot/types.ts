import { AdPod, BrandAd, BreakType, SpotDuration } from '../types';

export type OneShotBreakType = 'OVER' | 'WICKET' | 'STRATEGIC' | 'HALF_TIME';

export type BreakButtonState = 'IDLE' | 'ACTIVE' | 'ENDED';

export interface HalfTimeSegment {
  segmentIndex: number; // 1 to 6
  totalSegments: number; // 6
  type: 'AD_POD' | 'STUDIO_TALK';
  title: string;
  subtitle: string;
  duration: number; // in seconds (300 = 5 mins)
  pod?: AdPod; // defined when type === 'AD_POD'
  studioTopic?: string;
  analysisPoints?: string[];
}

export interface HalfTimeState {
  totalDurationSeconds: number; // 1800 (30 minutes)
  adDurationSeconds: number; // 1200 (20 minutes)
  studioDurationSeconds: number; // 600 (10 minutes)
  currentSegmentIndex: number; // 1 to 6
  currentSegmentRemainingSeconds: number;
  segments: HalfTimeSegment[];
  airedPodsCount: number;
}

export interface ActiveOneShotBreak {
  type: OneShotBreakType;
  status: 'ACTIVE' | 'ENDED';
  pod: AdPod;
  targetDuration: number;
  remainingSeconds: number;
  initialDuration: number;
  wasLastBallWicket?: boolean;
  halfTimeState?: HalfTimeState;
}

export interface BreakResumePopup {
  id: string;
  breakType: OneShotBreakType;
  title: string;
  message: string;
  scoreAtResume: string;
  overAtResume: string;
  timestamp: number;
}

export type StoppageReason =
  | 'Rain'
  | 'Floodlight failure'
  | 'Player injury'
  | 'Crowd/pitch disturbance'
  | 'Technical fault'
  | 'Other';

export type ResumeMode = 'AFTER_CURRENT_POD' | 'AFTER_CURRENT_SPOT';

export interface AutopilotConfig {
  manualInfinity: boolean;       // Toggle 5: Unscheduled Stoppage
  stoppagePodDuration: 60 | 90 | 120; // Default: 90s
  resumeMode: ResumeMode;        // Default: AFTER_CURRENT_POD
}

export interface FrozenMatchState {
  innings: 1 | 2;
  over: number;
  ball: number;
  runs: number;
  wickets: number;
  striker: string;
  nonStriker: string;
  bowler: string;
  runRate: number;
  requiredRunRate?: number;
  targetRuns?: number;
  commentarySnapshot: string;
}

export interface StoppageState {
  isActive: boolean;
  reason: StoppageReason;
  reasonHistory: { reason: StoppageReason; changedAtPod: number }[];
  startTimestamp: number;         // Date.now()
  elapsedSeconds: number;
  podCount: number;
  currentPod: AdPod | null;
  nextPrecomputedPod: AdPod | null;
  currentSpotIndex: number;
  spotElapsedSeconds: number;
  isResuming: boolean;            // "Resuming after current pod/spot..."
  showBackToLiveSlate: boolean;   // 3-second countdown slate
  slateCountdownSeconds: number;  // 3, 2, 1
  inventoryExhausted: boolean;
  brandAiringsInStoppage: Record<string, number>;
  fillerSpotsAired: number;
  frozenMatchState: FrozenMatchState | null;
  savedBreakToggles?: Record<string, boolean>;
}

export interface StoppageAuditRecord {
  id: string;
  reason: StoppageReason;
  reasonHistory: { reason: StoppageReason; changedAtPod: number }[];
  startTime: string;
  endTime: string;
  totalDurationSeconds: number;
  podsAiredCount: number;
  spotsAiredCount: number;
  brandsAired: Record<string, number>;
  fillersUsedCount: number;
  equivalentAirtimeCommercialValue: number; // in broadcaster value index
}
