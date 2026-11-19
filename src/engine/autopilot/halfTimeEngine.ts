import { AdPod, BrandAd } from '../types';
import { HalfTimeSegment, HalfTimeState } from './types';
import { generateAutoFillPod } from './autoFillEngine';
import { MixTally } from '../patternEngine';

interface CreateHalfTimeShowParams {
  innings1Score: { runs: number; wickets: number; oversCompleted: number; ballsInOver: number };
  team1Name: string;
  team2Name: string;
  previousPod?: AdPod;
  allAiredPodsInInnings: AdPod[];
  allBrands: BrandAd[];
  runningMixTally?: MixTally;
  onLogFiller?: (reason: string) => void;
}

/**
 * Creates the complete 30-Minute Broadcast Half-Time Show.
 * Total: 30 minutes (1,800s) = 20 minutes Commercial Ads (4 x 300s pods) + 10 minutes Live Studio Talk (2 x 300s segments)
 */
export function createHalfTimeShow(params: CreateHalfTimeShowParams): {
  segments: HalfTimeSegment[];
  initialState: HalfTimeState;
  initialPod: AdPod;
} {
  const {
    innings1Score,
    team1Name,
    team2Name,
    previousPod,
    allAiredPodsInInnings,
    allBrands,
    runningMixTally,
    onLogFiller
  } = params;

  let currentPrevPod = previousPod;
  const airedPodsContext = [...allAiredPodsInInnings];

  // Helper to build a 300s half-time commercial pod
  const buildHalfTimePod = (partNumber: 1 | 2 | 3 | 4, desc: string): AdPod => {
    const breakType = partNumber === 1
      ? 'Half_Time_Break_Part1'
      : partNumber === 2
      ? 'Half_Time_Break_Part2'
      : partNumber === 3
      ? 'Half_Time_Break_Part3'
      : 'Half_Time_Break_Part4';

    const pod = generateAutoFillPod({
      breakType: 'HALF_TIME',
      targetDuration: 300,
      innings: 1,
      overNo: innings1Score.oversCompleted,
      ballNo: innings1Score.ballsInOver,
      score: { runs: innings1Score.runs, wickets: innings1Score.wickets },
      battingTeam: team1Name,
      bowlingTeam: team2Name,
      lastEventDescription: `Half-time ${desc}`,
      previousPod: currentPrevPod,
      allAiredPodsInInnings: airedPodsContext,
      allBrands,
      runningMixTally,
      onLogFiller
    });

    // Update continuity references for subsequent pods
    currentPrevPod = pod;
    airedPodsContext.push(pod);
    return pod;
  };

  // Build the 4 Ad pods (each 300s = 5m -> Total 20m)
  const pod1 = buildHalfTimePod(1, 'Commercial Pod Part 1');
  const pod2 = buildHalfTimePod(2, 'Commercial Pod Part 2');
  const pod3 = buildHalfTimePod(3, 'Commercial Pod Part 3');
  const pod4 = buildHalfTimePod(4, 'Commercial Pod Part 4');

  const targetScore = innings1Score.runs + 1;
  const targetReqRR = (targetScore / 50).toFixed(2);

  // 6 Alternating Segments
  const segments: HalfTimeSegment[] = [
    // 1. Commercial Pod Part 1 (5m / 300s)
    {
      segmentIndex: 1,
      totalSegments: 6,
      type: 'AD_POD',
      title: 'Commercial Pod Part 1 (5m)',
      subtitle: 'Opening half-time commercial window (300s duration)',
      duration: 300,
      pod: pod1
    },
    // 2. Live Studio Talk Part 1 (5m / 300s)
    {
      segmentIndex: 2,
      totalSegments: 6,
      type: 'STUDIO_TALK',
      title: 'Live Studio Talk: 1st Innings Review & Batting Breakdown (5m)',
      subtitle: `Expert panel analyzes ${team1Name}'s ${innings1Score.runs}/${innings1Score.wickets} total`,
      duration: 300,
      studioTopic: '1st Innings Batting & Bowling Analysis',
      analysisPoints: [
        `${team1Name} finished on ${innings1Score.runs}/${innings1Score.wickets} in ${innings1Score.oversCompleted}.${innings1Score.ballsInOver} overs`,
        `Top partnerships and acceleration in the death overs`,
        `${team2Name}'s bowling execution: seam control, spin choke and death yorkers`,
        `Wagon wheel comparison & dot ball pressure breakdown`
      ]
    },
    // 3. Commercial Pod Part 2 (5m / 300s)
    {
      segmentIndex: 3,
      totalSegments: 6,
      type: 'AD_POD',
      title: 'Commercial Pod Part 2 (5m)',
      subtitle: 'Mid-break premium brand block (300s duration)',
      duration: 300,
      pod: pod2
    },
    // 4. Live Studio Talk Part 2 (5m / 300s)
    {
      segmentIndex: 4,
      totalSegments: 6,
      type: 'STUDIO_TALK',
      title: 'Live Studio Talk: Pitch Telemetry, Chase Strategy & Key Matchups (5m)',
      subtitle: `${team2Name} requires ${targetScore} runs to win (Required Run Rate: ${targetReqRR})`,
      duration: 300,
      studioTopic: '2nd Innings Target Chase & Pitch Conditions',
      analysisPoints: [
        `Target Equation: ${team2Name} need ${targetScore} runs from 300 balls (Req RR: ${targetReqRR})`,
        `Pitch telemetry: Surface wear, seam movement under floodlights and expected dew factor`,
        `Key player matchups: Opening pacers vs top-order power hitters`,
        `Keys to victory: Powerplay wickets vs middle-overs rotational strike`
      ]
    },
    // 5. Commercial Pod Part 3 (5m / 300s)
    {
      segmentIndex: 5,
      totalSegments: 6,
      type: 'AD_POD',
      title: 'Commercial Pod Part 3 (5m)',
      subtitle: 'Pre-chase commercial pod (300s duration)',
      duration: 300,
      pod: pod3
    },
    // 6. Commercial Pod Part 4 (5m / 300s)
    {
      segmentIndex: 6,
      totalSegments: 6,
      type: 'AD_POD',
      title: 'Commercial Pod Part 4 (5m)',
      subtitle: 'Final commercial pod before 2nd innings live action begins (300s duration)',
      duration: 300,
      pod: pod4
    }
  ];

  const initialState: HalfTimeState = {
    totalDurationSeconds: 1800, // 30 minutes
    adDurationSeconds: 1200,    // 20 minutes ads
    studioDurationSeconds: 600, // 10 minutes studio talk
    currentSegmentIndex: 1,
    currentSegmentRemainingSeconds: 300,
    segments,
    airedPodsCount: 0
  };

  return {
    segments,
    initialState,
    initialPod: pod1
  };
}
