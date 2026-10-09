export type UILanguage = 'en' | 'te' | 'hi';
export type RulePreset = 'street' | 'terrace' | 'box';

export interface GullyRules {
  maxOvers: number;
  onePitchCatch: boolean; // Tappa catch (ball bounces once and caught with one hand or two)
  tipAndRun: boolean;     // Bat touch = must run
  noLbw: boolean;         // Gully staple: absolutely no LBW
  lastManBats: boolean;   // Final player bats alone until out
  wallTouchTwoRuns: boolean; // Gully rule: hitting specific wall is automatic 2 runs
  runsForWide: number;    // Usually 1 + reball
  runsForNoBall: number;  // 1 + free hit / reball
  preset?: RulePreset;
}

export type DismissalType =
  | 'bowled'
  | 'caught'
  | 'one_pitch_caught'
  | 'run_out'
  | 'stumped'
  | 'hit_wicket'
  | 'retired';

export interface BallRecord {
  id: string;
  overIndex: number;
  ballInOver: number; // 1 to 6 (or more if extras)
  isLegal: boolean;
  type: 'run' | 'dot' | 'wide' | 'no_ball' | 'bye' | 'leg_bye' | 'wicket';
  runs: number;
  extras: number;
  isBoundary?: boolean;
  striker: string;
  nonStriker: string;
  bowler: string;
  wicket?: {
    dismissal: DismissalType;
    outBatter: string;
    fielder?: string | null;
  };
  spokenPrompt?: string;
  timestamp: number;
}

export interface BatterScore {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalInfo?: string;
}

export interface BowlerStats {
  name: string;
  overs: number; // e.g. 1.2
  balls: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
  dots: number;
}

export interface MatchState {
  matchName: string;
  innings: 1 | 2;
  battingTeam: string;
  bowlingTeam: string;
  target?: number;
  rules: GullyRules;
  score: number;
  wickets: number;
  oversCompleted: number;
  ballsInCurrentOver: number;
  striker: string;
  nonStriker: string;
  bowler: string;
  partnership?: { runs: number; balls: number };
  batters: Record<string, BatterScore>;
  bowlers: Record<string, BowlerStats>;
  battingOrder: string[];
  battingPlayers?: string[];
  bowlingPlayers?: string[];
  currentOverBalls: BallRecord[];
  allBalls: BallRecord[];
}

export type ParsedEventType =
  | 'runs'
  | 'wide'
  | 'no_ball'
  | 'bye'
  | 'leg_bye'
  | 'wicket'
  | 'dot'
  | 'undo'
  | 'retire'
  | 'new_batter'
  | 'change_bowler';

export interface ParsedEvent {
  type: ParsedEventType;
  runs?: number;
  boundary?: boolean;
  batter?: string;
  bowler?: string;
  dismissal?: DismissalType;
  fielder?: string | null;
  newBatter?: string;
  newBowler?: string;
  confidence: number;
}

export interface ParseResult {
  events?: ParsedEvent[];
  needs_clarification?: boolean;
  question?: string;
  rawText: string;
  engine?: 'claude-haiku-5-5' | 'offline-rule-based';
}
