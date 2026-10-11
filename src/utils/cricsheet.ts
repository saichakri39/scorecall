/**
 * Scorecall — Cricsheet Match Data Importer
 * Converts standard Cricsheet JSON deliveries to Scorecall MatchState.
 */

import { BallRecord, MatchState } from '../types/cricket';
import { DEFAULT_RULES, deriveMatchStats } from './scoringEngine';

export interface CricsheetDelivery {
  batter: string;
  bowler: string;
  non_striker: string;
  runs: {
    batter: number;
    extras: number;
    total: number;
  };
  wickets?: Array<{
    player_out: string;
    kind: string;
  }>;
  extras?: {
    wides?: number;
    noballs?: number;
    byes?: number;
    legbyes?: number;
  };
}

export function importCricsheetMatch(
  deliveries: CricsheetDelivery[],
  meta?: {
    teamBatting?: string;
    teamBowling?: string;
    battingSquad?: string[];
    bowlingSquad?: string[];
    totalOvers?: number;
  }
): MatchState {
  const teamBatting = meta?.teamBatting || 'Team Alpha';
  const teamBowling = meta?.teamBowling || 'Team Beta';

  const balls: BallRecord[] = [];
  let legalBallCount = 0;

  for (let i = 0; i < deliveries.length; i++) {
    const d = deliveries[i];
    const isWide = !!(d.extras && d.extras.wides);
    const isNoBall = !!(d.extras && d.extras.noballs);
    const isLegal = !isWide && !isNoBall;

    if (isLegal) {
      legalBallCount += 1;
    }

    const overNum = Math.floor((legalBallCount - (isLegal ? 1 : 0)) / 6);
    const ballNum = isLegal ? ((legalBallCount - 1) % 6) + 1 : legalBallCount % 6;

    let eventType: any = 'run';
    if (d.wickets && d.wickets.length > 0) eventType = 'wicket';
    else if (isWide) eventType = 'wide';
    else if (isNoBall) eventType = 'no_ball';
    else if (d.extras?.byes) eventType = 'bye';
    else if (d.extras?.legbyes) eventType = 'leg_bye';
    else if (d.runs.total === 0) eventType = 'dot';
    else if (d.runs.batter === 4 || d.runs.batter === 6) eventType = 'boundary';

    // Requirement 13: set ball.runs to the ball total and ball.batterRuns to the bat runs
    const ballTotal = d.runs.total;
    const batRuns = d.runs.batter;

    const ball: BallRecord = {
      id: `cric_ball_${i}`,
      ballNumber: ballNum,
      overNumber: overNum,
      striker: d.batter,
      nonStriker: d.non_striker,
      bowler: d.bowler,
      runs: ballTotal,
      batterRuns: batRuns,
      extras: {
        wides: d.extras?.wides || 0,
        noBalls: d.extras?.noballs || 0,
        byes: d.extras?.byes || 0,
        legByes: d.extras?.legbyes || 0,
      },
      isWicket: !!(d.wickets && d.wickets.length > 0),
      dismissalType: d.wickets?.[0]?.kind as any,
      dismissedBatter: d.wickets?.[0]?.player_out,
      isLegal,
      isFreeHit: false,
      nextBallFreeHit: isNoBall,
      timestamp: Date.now() + i * 1000,
      eventType,
    };

    balls.push(ball);
  }

  const initialSquadBat = meta?.battingSquad || Array.from(new Set(deliveries.map((d) => d.batter)));
  const initialSquadBowl = meta?.bowlingSquad || Array.from(new Set(deliveries.map((d) => d.bowler)));

  const baseMatch: MatchState = {
    id: `cricsheet_${Date.now()}`,
    createdAt: Date.now(),
    status: 'in_progress',
    currentInnings: 1,
    rules: {
      ...DEFAULT_RULES,
      totalOvers: meta?.totalOvers || 5,
    },
    teamBatting,
    teamBowling,
    battingSquad: initialSquadBat,
    bowlingSquad: initialSquadBowl,
    striker: deliveries[0]?.batter || 'Batter 1',
    nonStriker: deliveries[0]?.non_striker || 'Batter 2',
    currentBowler: deliveries[0]?.bowler || 'Bowler 1',
    totalRuns: 0,
    wickets: 0,
    overs: 0,
    ballsInOver: 0,
    isFreeHit: false,
    extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
    balls: [],
    retiredBatters: [],
  };

  const derived = deriveMatchStats(balls, baseMatch);

  return {
    ...baseMatch,
    ...derived,
    balls,
  };
}
