/**
 * Scorecall — Story & Commentary Fact Verifier
 * Verifies that AI-generated stories or commentaries faithfully reflect
 * the ground truth numbers and names on the scorecard.
 */

import { MatchState } from '../types/cricket';
import { deriveMatchStats } from './scoringEngine';

export interface VerificationResult {
  verified: boolean;
  scoreMatch: boolean;
  teamsMatch: boolean;
  playersMentioned: string[];
  mismatches: string[];
  badgeText: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function verifyStoryAgainstMatch(
  story: string,
  match: MatchState
): VerificationResult {
  const derived = deriveMatchStats(match.balls, match);
  const mismatches: string[] = [];
  const text = story.toLowerCase();

  // 1. Whole string team name comparison (Requirement 19)
  const teamBattingMatches = text.includes(match.teamBatting.toLowerCase());
  const teamBowlingMatches = text.includes(match.teamBowling.toLowerCase());
  const teamsMatch = teamBattingMatches || teamBowlingMatches;
  if (!teamsMatch) {
    mismatches.push(`Team names (${match.teamBatting} / ${match.teamBowling}) not found`);
  }

  // 2. Escape player names in the regex & find mentions
  const allPlayers = [...match.battingSquad, ...match.bowlingSquad];
  const playersMentioned: string[] = [];

  for (const player of allPlayers) {
    const escaped = escapeRegex(player);
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(story)) {
      playersMentioned.push(player);
    }
  }

  // 3. Stat matching with context
  // Collect known valid statistics: total runs, wickets, individual batter runs, bowler wickets
  const validNumbers = new Set<number>();
  validNumbers.add(derived.totalRuns);
  validNumbers.add(derived.wickets);
  validNumbers.add(match.rules.totalOvers);

  for (const b of Object.values(derived.batters)) {
    if (b.runs > 0) validNumbers.add(b.runs);
  }
  for (const bowl of Object.values(derived.bowlers)) {
    if (bowl.wickets > 0) validNumbers.add(bowl.wickets);
    if (bowl.runs > 0) validNumbers.add(bowl.runs);
  }
  if (match.target) validNumbers.add(match.target);
  if (match.firstInnings) {
    validNumbers.add(match.firstInnings.totalRuns);
    validNumbers.add(match.firstInnings.wickets);
  }

  // Extract numbers from story
  const numberMatches = story.match(/\b\d+\b/g) || [];
  let scoreMatch = true;

  for (const numStr of numberMatches) {
    const n = parseInt(numStr, 10);
    // Common benign numbers like 1, 2, 4, 6 (runs/boundaries) or 0
    if (n <= 6) continue;
    if (!validNumbers.has(n)) {
      // Possible hallucinated number
      mismatches.push(`Number ${n} does not match any match stat`);
      scoreMatch = false;
    }
  }

  const verified = mismatches.length === 0;

  return {
    verified,
    scoreMatch,
    teamsMatch,
    playersMentioned,
    mismatches,
    badgeText: verified
      ? 'Checked: names and numbers match the scorecard'
      : 'Needs review',
  };
}
