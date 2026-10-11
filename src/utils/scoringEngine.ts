/**
 * Scorecall — Unified Gully Cricket Scoring Engine
 *
 * Ground Rule: All scoring goes through applyBall, and all totals are
 * derived from the ball log. Keypad, voice, bot and undo all use it.
 */

import {
  BallRecord,
  BallEventType,
  DismissalType,
  MatchRules,
  MatchState,
  MatchStatus,
  InningsData,
  BatterStats,
  BowlerStats,
  FallOfWicket,
} from '../types/cricket';

export const DEFAULT_RULES: MatchRules = {
  totalOvers: 5,
  ballsPerOver: 6,
  maxWickets: 5, // squadSize - 1 for 6 players
  lastManBats: false,
  noBallRun: 1,
  wideRun: 1,
  freeHitOnNoBall: true,
};

export const INITIAL_MATCH: MatchState = {
  id: 'gully-match-initial',
  createdAt: Date.now(),
  status: 'in_progress',
  currentInnings: 1,
  rules: { ...DEFAULT_RULES },

  // Default squads — ensure no shared names between batting and bowling
  teamBatting: 'Gully Kings',
  teamBowling: 'Street Blasters',
  battingSquad: ['Ravi', 'Suresh', 'Ajay', 'Deepak', 'Manoj', 'Bunty'],
  bowlingSquad: ['Kiran', 'Prasad', 'Naresh', 'Venkat', 'Chanti', 'Ramu'],

  // Active players
  striker: 'Ravi',
  nonStriker: 'Suresh',
  currentBowler: 'Kiran',

  // Start strictly with empty ball log and zero score, wickets, extras
  totalRuns: 0,
  wickets: 0,
  overs: 0,
  ballsInOver: 0,
  isFreeHit: false,
  extras: {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
  },
  balls: [],
  retiredBatters: [],
};

export interface BallInput {
  eventType: BallEventType;
  runs?: number;
  runsOffBat?: number;
  runsRun?: number;
  dismissalType?: DismissalType;
  dismissedBatter?: string;
  batter?: string; // target batter if explicitly specified
  bowler?: string; // for change_bowler
  newBatter?: string; // for new_batter or retire
  commentary?: string;
}

/**
 * Calculates effective max wickets:
 * min(rules.maxWickets, battingSquad.length - 1) or squad length if lastManBats.
 */
export function getEffectiveMaxWickets(
  rules: MatchRules,
  squadLength: number
): number {
  if (rules.lastManBats) {
    return Math.min(rules.maxWickets, squadLength);
  }
  // In gully cricket, if only 2 openers are specified in squad, do not prematurely
  // end the innings after 1 wicket if rules.maxWickets was configured higher.
  if (squadLength <= 2 && rules.maxWickets > 1) {
    return rules.maxWickets;
  }
  return Math.min(rules.maxWickets, Math.max(1, squadLength - 1));
}

/**
 * Finds the next available batter from battingSquad who has not yet batted
 * and is not currently on the pitch or retired.
 */
export function getNextBatter(
  squad: string[],
  balls: BallRecord[],
  currentStriker: string,
  currentNonStriker: string,
  retiredBatters: string[] = []
): string | null {
  const battedNames = new Set<string>();
  const addName = (n?: string) => {
    if (n && n.trim()) battedNames.add(n.trim().toLowerCase());
  };

  for (const b of balls) {
    addName(b.striker);
    addName(b.nonStriker);
    addName(b.dismissedBatter);
    if (b.eventType === 'retire') addName(b.striker);
    if (b.eventType === 'new_batter') addName(b.striker);
  }
  for (const r of retiredBatters) {
    addName(r);
  }
  addName(currentStriker);
  addName(currentNonStriker);

  for (const player of squad) {
    if (player && !battedNames.has(player.trim().toLowerCase())) {
      return player.trim();
    }
  }
  return null;
}

/**
 * Unified state calculator: takes raw balls and match settings,
 * recalculates all figures cleanly.
 */
export function deriveMatchStats(
  balls: BallRecord[],
  match: MatchState
): {
  totalRuns: number;
  wickets: number;
  overs: number;
  ballsInOver: number;
  extras: { wides: number; noBalls: number; byes: number; legByes: number };
  striker: string;
  nonStriker: string;
  currentBowler: string;
  batters: Record<string, BatterStats>;
  bowlers: Record<string, BowlerStats>;
  fallOfWickets: FallOfWicket[];
  retiredBatters: string[];
  isFreeHit: boolean;
  status: MatchStatus;
  resultText?: string;
} {
  const { rules, battingSquad, bowlingSquad } = match;
  const effectiveMaxWickets = getEffectiveMaxWickets(rules, battingSquad.length);

  let totalRuns = 0;
  let wickets = 0;
  let legalBallsTotal = 0;
  let widesTotal = 0;
  let noBallsTotal = 0;
  let byesTotal = 0;
  let legByesTotal = 0;

  let currentStriker = match.battingSquad[0] || 'Batter 1';
  let currentNonStriker = match.battingSquad[1] || 'Batter 2';
  let currentBowler = match.bowlingSquad[0] || 'Bowler 1';
  let isFreeHit = false;

  const batters: Record<string, BatterStats> = {};
  const bowlers: Record<string, BowlerStats> = {};
  const fallOfWickets: FallOfWicket[] = [];
  const retiredBatters: string[] = [];

  const ensureBatter = (name: string): BatterStats => {
    if (!batters[name]) {
      batters[name] = {
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        isOut: false,
      };
    }
    return batters[name];
  };

  const ensureBowler = (name: string): BowlerStats => {
    if (!bowlers[name]) {
      bowlers[name] = {
        name,
        balls: 0,
        overs: '0.0',
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
        dots: 0,
        wides: 0,
        noBalls: 0,
      };
    }
    return bowlers[name];
  };

  ensureBatter(currentStriker);
  ensureBatter(currentNonStriker);
  ensureBowler(currentBowler);

  let ballsInCurrentOver = 0;
  let runsInCurrentOver = 0;

  // Process balls in chronological order
  for (let i = 0; i < balls.length; i++) {
    const ball = balls[i];

    // Handle administrative / state change events
    if (ball.eventType === 'change_bowler') {
      if (ball.bowler) {
        currentBowler = ball.bowler;
        ensureBowler(currentBowler);
      }
      continue;
    }

    if (ball.eventType === 'strike_swap') {
      const temp = currentStriker;
      currentStriker = currentNonStriker;
      currentNonStriker = temp;
      continue;
    }

    if (ball.eventType === 'retire') {
      const retiring = ball.striker || currentStriker;
      const bStat = ensureBatter(retiring);
      bStat.isRetired = true;
      if (!retiredBatters.includes(retiring)) {
        retiredBatters.push(retiring);
      }
      const next =
        ball.tag ||
        getNextBatter(
          battingSquad,
          balls.slice(0, i),
          retiring,
          currentNonStriker,
          retiredBatters
        );
      if (next) {
        currentStriker = next;
        ensureBatter(currentStriker);
      } else {
        // No more batters
      }
      continue;
    }

    if (ball.eventType === 'new_batter') {
      if (ball.striker) {
        currentStriker = ball.striker;
        ensureBatter(currentStriker);
      }
      continue;
    }

    // Standard ball event
    const activeStriker = ball.striker || currentStriker;
    const activeNonStriker = ball.nonStriker || currentNonStriker;
    const activeBowler = ball.bowler || currentBowler;

    const bStat = ensureBatter(activeStriker);
    const bowlStat = ensureBowler(activeBowler);

    totalRuns += ball.runs;
    runsInCurrentOver += ball.runs;

    widesTotal += ball.extras.wides;
    noBallsTotal += ball.extras.noBalls;
    byesTotal += ball.extras.byes;
    legByesTotal += ball.extras.legByes;

    // Batter stats:
    // Legal ball or No-ball counts as ball faced for batter; wide does NOT count as ball faced.
    if (ball.eventType !== 'wide') {
      bStat.balls += 1;
    }
    bStat.runs += ball.batterRuns;
    if (ball.batterRuns === 4) bStat.fours += 1;
    if (ball.batterRuns === 6) bStat.sixes += 1;
    bStat.strikeRate =
      bStat.balls > 0 ? Number(((bStat.runs / bStat.balls) * 100).toFixed(1)) : 0;

    // Bowler stats:
    // Requirement 11: charge bat runs to the bowler on wicket balls too!
    // Byes and leg-byes are team extras, not charged to bowler.
    // Wides, no balls and bat runs are charged to bowler.
    const chargedToBowler = ball.batterRuns + ball.extras.wides + ball.extras.noBalls;
    bowlStat.runs += chargedToBowler;

    if (ball.isLegal) {
      legalBallsTotal += 1;
      ballsInCurrentOver += 1;
      bowlStat.balls += 1;
      if (ball.runs === 0) {
        bowlStat.dots += 1;
      }
    } else {
      if (ball.extras.wides > 0) bowlStat.wides += ball.extras.wides;
      if (ball.extras.noBalls > 0) bowlStat.noBalls += ball.extras.noBalls;
    }

    // Wickets:
    if (ball.isWicket) {
      wickets += 1;
      const dismissed = ball.dismissedBatter || activeStriker;
      const dStat = ensureBatter(dismissed);
      dStat.isOut = true;
      dStat.dismissal = ball.dismissalType || 'caught';
      dStat.bowler = activeBowler;

      // Bowler credit: all dismissals except run-out and retired
      if (ball.dismissalType !== 'run_out' && ball.dismissalType !== 'retired') {
        bowlStat.wickets += 1;
      }

      // Record Fall of Wicket:
      const completedOversBefore = Math.floor(legalBallsTotal / rules.ballsPerOver);
      const ballsInCurrentOverBefore = legalBallsTotal % rules.ballsPerOver;
      fallOfWickets.push({
        wicketNumber: wickets,
        score: totalRuns,
        overs: `${completedOversBefore}.${ballsInCurrentOverBefore}`,
        batter: dismissed,
      });

      // Dismissed batter must never stay on strike!
      const isStrikerDismissed =
        dismissed.trim().toLowerCase() === activeStriker.trim().toLowerCase();

      if (wickets < effectiveMaxWickets) {
        const next = getNextBatter(
          battingSquad,
          balls.slice(0, i + 1),
          isStrikerDismissed ? activeNonStriker : activeStriker,
          isStrikerDismissed ? '' : activeNonStriker,
          retiredBatters
        );

        // Fallback incoming batter so match continues smoothly if squad was small
        const incoming =
          next || (rules.lastManBats ? '' : `Batter ${wickets + 2}`);

        if (isStrikerDismissed) {
          currentStriker = incoming;
          if (currentStriker) ensureBatter(currentStriker);
        } else {
          currentNonStriker = incoming;
          if (currentNonStriker) ensureBatter(currentNonStriker);
        }
      } else {
        // Last wicket fallen
        if (isStrikerDismissed) {
          currentStriker = rules.lastManBats ? activeNonStriker : '';
        } else {
          currentNonStriker = '';
        }
      }
    }

    // Strike rotation on runs run:
    // If runs run/batter runs is odd, swap strike
    const runsForRotation =
      ball.eventType === 'wide'
        ? ball.runs - ball.extras.wides // extra runs on wide
        : ball.batterRuns + ball.extras.byes + ball.extras.legByes;

    if (runsForRotation % 2 === 1 && !ball.isWicket) {
      const temp = currentStriker;
      currentStriker = currentNonStriker;
      currentNonStriker = temp;
    }

    // Free hit handling
    isFreeHit = ball.nextBallFreeHit;

    // Over completion check
    if (ball.isLegal && ballsInCurrentOver === rules.ballsPerOver) {
      // Over completed! Maiden check:
      if (runsInCurrentOver === 0) {
        bowlStat.maidens += 1;
      }
      runsInCurrentOver = 0;
      ballsInCurrentOver = 0;

      // Strike rotates at the end of the over
      const temp = currentStriker;
      currentStriker = currentNonStriker;
      currentNonStriker = temp;
    }
  }

  // Calculate bowler overs and economy using rules.ballsPerOver
  for (const bName of Object.keys(bowlers)) {
    const b = bowlers[bName];
    const compOvers = Math.floor(b.balls / rules.ballsPerOver);
    const remBalls = b.balls % rules.ballsPerOver;
    b.overs = `${compOvers}.${remBalls}`;
    const oversFraction = b.balls / rules.ballsPerOver;
    b.economy =
      oversFraction > 0 ? Number((b.runs / oversFraction).toFixed(2)) : 0;
  }

  // Check warnings rather than clamping (requirement 11)
  const completedOvers = Math.floor(legalBallsTotal / rules.ballsPerOver);
  const remainingBalls = legalBallsTotal % rules.ballsPerOver;

  if (completedOvers > rules.totalOvers) {
    console.warn(`Overs bowled (${completedOvers}) exceeds total overs (${rules.totalOvers})`);
  }
  if (wickets > effectiveMaxWickets) {
    console.warn(`Wickets lost (${wickets}) exceeds effective max wickets (${effectiveMaxWickets})`);
  }

  // Status & Target determination
  let status: MatchStatus = match.status;
  let resultText = match.resultText;

  const isInningsFinished =
    wickets >= effectiveMaxWickets ||
    (completedOvers >= rules.totalOvers && remainingBalls === 0);

  if (match.currentInnings === 1) {
    if (isInningsFinished) {
      status = 'innings_break';
    }
  } else {
    // 2nd innings
    const target = match.target || (match.firstInnings ? match.firstInnings.totalRuns + 1 : 0);
    if (target > 0 && totalRuns >= target) {
      status = 'completed';
      const wicketsLeft = effectiveMaxWickets - wickets;
      resultText = `${match.teamBatting} won by ${wicketsLeft} wicket${wicketsLeft === 1 ? '' : 's'}!`;
    } else if (isInningsFinished) {
      status = 'completed';
      if (totalRuns === target - 1) {
        resultText = 'Match Tied!';
      } else {
        const runDiff = target - 1 - totalRuns;
        resultText = `${match.teamBowling} won by ${runDiff} run${runDiff === 1 ? '' : 's'}!`;
      }
    }
  }

  return {
    totalRuns,
    wickets,
    overs: completedOvers,
    ballsInOver: remainingBalls,
    extras: {
      wides: widesTotal,
      noBalls: noBallsTotal,
      byes: byesTotal,
      legByes: legByesTotal,
    },
    striker: currentStriker,
    nonStriker: currentNonStriker,
    currentBowler,
    batters,
    bowlers,
    fallOfWickets,
    retiredBatters,
    isFreeHit,
    status,
    resultText,
  };
}

/**
 * The single master function that applies a ball event to the match.
 * Voice, keypad, bot, and undo all resolve through this.
 */
export function applyBall(
  match: MatchState,
  input: BallInput
): MatchState {
  const { rules, battingSquad } = match;
  const effectiveMaxWickets = getEffectiveMaxWickets(rules, battingSquad.length);

  // If match already completed, return as is
  if (match.status === 'completed') {
    return match;
  }

  // Handle administrative events directly
  if (input.eventType === 'change_bowler') {
    const bowler = input.bowler || input.newBatter || match.currentBowler;
    const adminBall: BallRecord = {
      id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ballNumber: match.ballsInOver,
      overNumber: match.overs,
      striker: match.striker,
      nonStriker: match.nonStriker,
      bowler,
      runs: 0,
      batterRuns: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      isWicket: false,
      isLegal: false,
      isFreeHit: match.isFreeHit,
      nextBallFreeHit: match.isFreeHit,
      timestamp: Date.now(),
      eventType: 'change_bowler',
      commentary: input.commentary || `Bowler changed to ${bowler}`,
    };
    const updatedBalls = [...match.balls, adminBall];
    const derived = deriveMatchStats(updatedBalls, match);
    return {
      ...match,
      ...derived,
      balls: updatedBalls,
    };
  }

  if (input.eventType === 'strike_swap') {
    const adminBall: BallRecord = {
      id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ballNumber: match.ballsInOver,
      overNumber: match.overs,
      striker: match.nonStriker,
      nonStriker: match.striker,
      bowler: match.currentBowler,
      runs: 0,
      batterRuns: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      isWicket: false,
      isLegal: false,
      isFreeHit: match.isFreeHit,
      nextBallFreeHit: match.isFreeHit,
      timestamp: Date.now(),
      eventType: 'strike_swap',
      commentary: 'Strike rotated manually',
    };
    const updatedBalls = [...match.balls, adminBall];
    const derived = deriveMatchStats(updatedBalls, match);
    return {
      ...match,
      ...derived,
      balls: updatedBalls,
    };
  }

  if (input.eventType === 'retire') {
    const retiringBatter = input.batter || match.striker;
    const incoming =
      input.newBatter ||
      getNextBatter(
        battingSquad,
        match.balls,
        match.striker,
        match.nonStriker,
        [...match.retiredBatters, retiringBatter]
      ) ||
      '';

    const adminBall: BallRecord = {
      id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ballNumber: match.ballsInOver,
      overNumber: match.overs,
      striker: retiringBatter,
      nonStriker: match.nonStriker,
      bowler: match.currentBowler,
      runs: 0,
      batterRuns: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      isWicket: false,
      isLegal: false,
      isFreeHit: match.isFreeHit,
      nextBallFreeHit: match.isFreeHit,
      timestamp: Date.now(),
      eventType: 'retire',
      tag: incoming,
      commentary: `${retiringBatter} retired. ${incoming ? `${incoming} walked in.` : ''}`,
    };
    const updatedBalls = [...match.balls, adminBall];
    const derived = deriveMatchStats(updatedBalls, match);
    return {
      ...match,
      ...derived,
      balls: updatedBalls,
    };
  }

  if (input.eventType === 'new_batter') {
    const newBatterName = input.newBatter || input.batter || '';
    const adminBall: BallRecord = {
      id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ballNumber: match.ballsInOver,
      overNumber: match.overs,
      striker: newBatterName,
      nonStriker: match.nonStriker,
      bowler: match.currentBowler,
      runs: 0,
      batterRuns: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
      isWicket: false,
      isLegal: false,
      isFreeHit: match.isFreeHit,
      nextBallFreeHit: match.isFreeHit,
      timestamp: Date.now(),
      eventType: 'new_batter',
      commentary: `${newBatterName} came in to bat`,
    };
    const updatedBalls = [...match.balls, adminBall];
    const derived = deriveMatchStats(updatedBalls, match);
    return {
      ...match,
      ...derived,
      balls: updatedBalls,
    };
  }

  // Determine active striker / non-striker for attribution
  // Requirement 9: Use evt.batter to decide who gets runs
  let activeStriker = match.striker;
  let activeNonStriker = match.nonStriker;
  if (input.batter) {
    if (input.batter.toLowerCase() === match.nonStriker.toLowerCase()) {
      // Non-striker was specified as taking runs
      activeStriker = match.nonStriker;
      activeNonStriker = match.striker;
    } else if (input.batter.toLowerCase() === match.striker.toLowerCase()) {
      activeStriker = match.striker;
      activeNonStriker = match.nonStriker;
    }
  }

  // Calculate ball metrics based on event type
  let runs = 0;
  let batterRuns = 0;
  const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
  let isWicket = false;
  let isLegal = true;
  let nextBallFreeHit = false;
  let dismissalType: DismissalType | undefined;
  let dismissedBatter: string | undefined;

  switch (input.eventType) {
    case 'dot':
      runs = 0;
      batterRuns = 0;
      isLegal = true;
      break;

    case 'run':
    case 'boundary':
      batterRuns = input.runsOffBat ?? input.runs ?? 0;
      runs = batterRuns;
      isLegal = true;
      break;

    case 'wide':
      // Requirement 8: extra runs go in runsRun, never in runs. Total = 1 + runsRun
      const wideRunsRun = input.runsRun ?? 0;
      extras.wides = rules.wideRun + wideRunsRun;
      runs = extras.wides;
      batterRuns = 0; // Wide does not credit batter
      isLegal = false;
      nextBallFreeHit = match.isFreeHit; // Free hit carries over on wide
      break;

    case 'no_ball':
      // Requirement 8: parsers send runsOffBat (4 or 6), never total runs.
      // Total = noBallRun + runsOffBat
      const nbRunsOffBat = input.runsOffBat ?? input.runs ?? 0;
      extras.noBalls = rules.noBallRun;
      batterRuns = nbRunsOffBat;
      runs = extras.noBalls + batterRuns;
      isLegal = false;
      nextBallFreeHit = rules.freeHitOnNoBall;
      break;

    case 'bye':
      runs = input.runsRun ?? input.runs ?? 1;
      extras.byes = runs;
      batterRuns = 0;
      isLegal = true;
      break;

    case 'leg_bye':
      runs = input.runsRun ?? input.runs ?? 1;
      extras.legByes = runs;
      batterRuns = 0;
      isLegal = true;
      break;

    case 'wicket':
      isWicket = true;
      dismissalType = input.dismissalType || 'caught';
      dismissedBatter = input.dismissedBatter || activeStriker;
      // Requirement 11: charge bat runs to the bowler on wicket balls too
      batterRuns = input.runsOffBat ?? input.runsRun ?? input.runs ?? 0;
      runs = batterRuns;
      isLegal = true;
      break;

    default:
      runs = input.runs || 0;
      batterRuns = input.runsOffBat || 0;
      isLegal = true;
  }

  const ballNumber = isLegal ? match.ballsInOver + 1 : match.ballsInOver;

  const newBall: BallRecord = {
    id: `ball_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    ballNumber,
    overNumber: match.overs,
    striker: activeStriker,
    nonStriker: activeNonStriker,
    bowler: match.currentBowler,
    runs,
    batterRuns,
    extras,
    isWicket,
    dismissalType,
    dismissedBatter,
    isLegal,
    isFreeHit: match.isFreeHit,
    nextBallFreeHit,
    timestamp: Date.now(),
    eventType: input.eventType,
    commentary: input.commentary,
  };

  const updatedBalls = [...match.balls, newBall];
  const derived = deriveMatchStats(updatedBalls, match);

  return {
    ...match,
    ...derived,
    balls: updatedBalls,
  };
}

/**
 * Creates 2nd innings handover state:
 * - Saves 1st innings summary and balls
 * - Swaps batting & bowling teams and squads
 * - Resets scores, balls, wickets, extras, free hit
 * - Sets target = 1st innings runs + 1
 */
export function startSecondInnings(match: MatchState): MatchState {
  const firstInningsDerived = deriveMatchStats(match.balls, match);

  const firstInningsSummary: InningsData = {
    teamName: match.teamBatting,
    squad: [...match.battingSquad],
    totalRuns: firstInningsDerived.totalRuns,
    wickets: firstInningsDerived.wickets,
    oversCompleted: firstInningsDerived.overs,
    ballsInCurrentOver: firstInningsDerived.ballsInOver,
    extras: {
      ...firstInningsDerived.extras,
      total:
        firstInningsDerived.extras.wides +
        firstInningsDerived.extras.noBalls +
        firstInningsDerived.extras.byes +
        firstInningsDerived.extras.legByes,
    },
    balls: [...match.balls],
    batters: { ...firstInningsDerived.batters },
    bowlers: { ...firstInningsDerived.bowlers },
    fallOfWickets: [...firstInningsDerived.fallOfWickets],
  };

  const newBattingTeam = match.teamBowling;
  const newBowlingTeam = match.teamBatting;
  const newBattingSquad = [...match.bowlingSquad];
  const newBowlingSquad = [...match.battingSquad];

  const target = firstInningsSummary.totalRuns + 1;

  const secondInningsState: MatchState = {
    ...match,
    status: 'in_progress',
    currentInnings: 2,
    teamBatting: newBattingTeam,
    teamBowling: newBowlingTeam,
    battingSquad: newBattingSquad,
    bowlingSquad: newBowlingSquad,
    striker: newBattingSquad[0] || 'Batter 1',
    nonStriker: newBattingSquad[1] || 'Batter 2',
    currentBowler: newBowlingSquad[0] || 'Bowler 1',
    totalRuns: 0,
    wickets: 0,
    overs: 0,
    ballsInOver: 0,
    isFreeHit: false,
    extras: {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
    },
    balls: [],
    retiredBatters: [],
    firstInnings: firstInningsSummary,
    target,
    resultText: undefined,
  };

  return secondInningsState;
}
