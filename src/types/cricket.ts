/**
 * Scorecall — Gully Cricket Domain Types
 */

export type MatchStatus = 'in_progress' | 'innings_break' | 'completed';

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'run_out'
  | 'stumped'
  | 'lbw'
  | 'hit_wicket'
  | 'retired'
  | 'other';

export type BallEventType =
  | 'dot'
  | 'run'
  | 'boundary'
  | 'wicket'
  | 'wide'
  | 'no_ball'
  | 'bye'
  | 'leg_bye'
  | 'retire'
  | 'new_batter'
  | 'change_bowler'
  | 'strike_swap';

export interface ParsedEvent {
  type: BallEventType;
  runs?: number;             // Total runs or legacy runs
  runsOffBat?: number;       // Runs scored off bat (e.g. 4 on a no-ball)
  runsRun?: number;          // Runs run between wickets (e.g. 2 on a wide)
  dismissal?: DismissalType;
  dismissedPlayer?: string;
  batter?: string;           // Target batter name if specified in voice ("Suresh took two")
  bowler?: string;           // New bowler name for change_bowler
  newBatter?: string;        // New batter name for new_batter or retire
  confidence: number;
  rawText?: string;
}

export interface ParseResult {
  events: ParsedEvent[];
  originalText: string;
  confidence: number;
  source: 'rule' | 'gemini' | 'manual';
  needsClarification?: boolean;
}

export interface BallRecord {
  id: string;
  ballNumber: number; // Legal ball count in current over (1..ballsPerOver)
  overNumber: number; // 0-indexed over number
  striker: string;
  nonStriker: string;
  bowler: string;
  runs: number; // Total runs added to team score on this ball
  batterRuns: number; // Runs credited to the batter (striker or specified batter)
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  isWicket: boolean;
  dismissalType?: DismissalType;
  dismissedBatter?: string;
  isLegal: boolean; // false for wide / no-ball
  isFreeHit: boolean;
  nextBallFreeHit: boolean;
  commentary?: string;
  timestamp: number;
  eventType: BallEventType;
  tag?: string;
}

export interface BatterStats {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  isRetired?: boolean;
  dismissal?: string;
  bowler?: string;
}

export interface BowlerStats {
  name: string;
  balls: number;
  overs: string; // e.g. "2.3"
  maidens: number;
  runs: number; // Runs charged to bowler (byes/leg-byes excluded)
  wickets: number; // Wickets credited to bowler (run-out excluded)
  economy: number;
  dots: number;
  wides: number;
  noBalls: number;
}

export interface FallOfWicket {
  wicketNumber: number; // 1, 2, 3...
  score: number; // Team score at dismissal
  overs: string; // Over string, e.g. "3.4"
  batter: string;
}

export interface InningsData {
  teamName: string;
  squad: string[];
  totalRuns: number;
  wickets: number;
  oversCompleted: number; // Integer completed overs
  ballsInCurrentOver: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  balls: BallRecord[];
  batters: Record<string, BatterStats>;
  bowlers: Record<string, BowlerStats>;
  fallOfWickets: FallOfWicket[];
  target?: number;
}

export interface MatchRules {
  totalOvers: number;
  ballsPerOver: number;
  maxWickets: number; // default squad size - 1
  lastManBats: boolean;
  noBallRun: number;
  wideRun: number;
  freeHitOnNoBall: boolean;
  boxCricketBoundaryRuns?: number;
}

export interface BallInput {
  eventType: BallEventType;
  runs?: number;
  runsOffBat?: number;
  runsRun?: number;
  dismissalType?: DismissalType;
  dismissedBatter?: string;
  batter?: string;
  bowler?: string;
  newBatter?: string;
  commentary?: string;
}

export interface MatchState {
  id: string;
  createdAt: number;
  status: MatchStatus;
  currentInnings: 1 | 2;
  rules: MatchRules;
  
  // Teams
  teamBatting: string;
  teamBowling: string;
  battingSquad: string[];
  bowlingSquad: string[];

  // Active players
  striker: string;
  nonStriker: string;
  currentBowler: string;

  // Active innings data
  totalRuns: number;
  wickets: number;
  overs: number; // completed overs count
  ballsInOver: number; // current over's legal balls (0..ballsPerOver-1)
  isFreeHit: boolean;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };

  balls: BallRecord[];
  retiredBatters: string[];

  // Optional derived structures
  batters?: Record<string, BatterStats>;
  bowlers?: Record<string, BowlerStats>;
  fallOfWickets?: FallOfWicket[];

  // First innings archive for 2nd innings
  firstInnings?: InningsData;
  target?: number; // 1st innings total + 1
  resultText?: string;
}

export interface SavedMatchSummary {
  id: string;
  date: string;
  teamA: string;
  teamB: string;
  firstInningsRuns: number;
  firstInningsWickets: number;
  firstInningsOvers: string;
  secondInningsRuns?: number;
  secondInningsWickets?: number;
  secondInningsOvers?: string;
  winner?: string;
  result: string;
  matchState: MatchState;
}

export type StoryStyle =
  | 'telugu_commentator'
  | 'tweet_thread'
  | 'dramatic_report'
  | 'roast_mode';
