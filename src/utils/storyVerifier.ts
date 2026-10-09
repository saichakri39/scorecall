import { MatchState } from '../types/cricket';

export interface StoryVerificationResult {
  isValid: boolean;
  status: 'checked' | 'needs_review';
  checkedNames: string[];
  anomalousNames: string[];
  verifiedNumbers: number[];
  unverifiedNumbers: number[];
  reason?: string;
}

/**
 * Second verification pass:
 * Extracts numbers and candidate player names from the generated story,
 * and validates each fact against the ground-truth match JSON.
 */
export function verifyStoryAgainstMatch(
  storyText: string,
  match: MatchState
): StoryVerificationResult {
  if (!storyText || !storyText.trim()) {
    return {
      isValid: false,
      status: 'needs_review',
      checkedNames: [],
      anomalousNames: [],
      verifiedNumbers: [],
      unverifiedNumbers: [],
      reason: 'Empty story generated',
    };
  }

  // 1. Gather all authorized names from the Match JSON
  const validPlayerNames = new Set<string>();
  const validTeamNames = new Set<string>();

  if (match.battingTeam) validTeamNames.add(match.battingTeam.toLowerCase());
  if (match.bowlingTeam) validTeamNames.add(match.bowlingTeam.toLowerCase());

  Object.keys(match.batters).forEach(name => validPlayerNames.add(name.toLowerCase()));
  Object.keys(match.bowlers).forEach(name => validPlayerNames.add(name.toLowerCase()));
  (match.battingPlayers || []).forEach(name => validPlayerNames.add(name.toLowerCase()));
  (match.bowlingPlayers || []).forEach(name => validPlayerNames.add(name.toLowerCase()));

  // 2. Gather all verified numbers from the Match JSON
  const validNumbers = new Set<number>();
  validNumbers.add(match.score);
  validNumbers.add(match.wickets);
  validNumbers.add(match.oversCompleted);
  validNumbers.add(match.ballsInCurrentOver);
  validNumbers.add(match.rules.maxOvers);

  // Common legitimate cricket counting numbers
  [0, 1, 2, 3, 4, 6].forEach(n => validNumbers.add(n));

  Object.values(match.batters).forEach(b => {
    validNumbers.add(b.runs);
    validNumbers.add(b.balls);
    validNumbers.add(b.fours);
    validNumbers.add(b.sixes);
    if (b.balls > 0) {
      validNumbers.add(Math.round((b.runs / b.balls) * 100)); // Strike rate
    }
  });

  Object.values(match.bowlers).forEach(b => {
    validNumbers.add(b.wickets);
    validNumbers.add(b.runsConceded);
    validNumbers.add(b.maidens);
    validNumbers.add(b.dots);
    validNumbers.add(Math.floor(b.balls / 6));
  });

  // Calculate run rate
  const totalBalls = match.oversCompleted * 6 + match.ballsInCurrentOver;
  if (totalBalls > 0) {
    validNumbers.add(Math.round((match.score / totalBalls) * 6));
  }

  // 3. Extract numbers from story
  const numberMatches = storyText.match(/\b\d+(\.\d+)?\b/g) || [];
  const verifiedNumbers: number[] = [];
  const unverifiedNumbers: number[] = [];

  for (const numStr of numberMatches) {
    const val = parseFloat(numStr);
    const intVal = Math.round(val);
    if (validNumbers.has(val) || validNumbers.has(intVal)) {
      if (!verifiedNumbers.includes(val)) verifiedNumbers.push(val);
    } else {
      // Check if it's a valid decimal like over representation (e.g. 2.3)
      const isOverMatch = numStr === `${match.oversCompleted}.${match.ballsInCurrentOver}`;
      if (isOverMatch) {
        if (!verifiedNumbers.includes(val)) verifiedNumbers.push(val);
      } else {
        if (!unverifiedNumbers.includes(val)) unverifiedNumbers.push(val);
      }
    }
  }

  // 4. Check player names cited in the story
  const checkedNames: string[] = [];
  for (const validName of validPlayerNames) {
    // Regex word boundary check for each authorized player name
    const reg = new RegExp(`\\b${validName}\\b`, 'i');
    if (reg.test(storyText)) {
      checkedNames.push(validName.charAt(0).toUpperCase() + validName.slice(1));
    }
  }

  // 5. Look for hallucinated proper names: capitalized tokens not in valid players, teams, or standard vocabulary
  const words = storyText.split(/[\s,.:;!?"'()\[\]]+/);
  const commonCricketVocab = new Set([
    'the', 'a', 'an', 'in', 'on', 'at', 'by', 'with', 'for', 'to', 'of', 'and', 'or', 'but',
    'over', 'overs', 'ball', 'balls', 'wicket', 'wickets', 'run', 'runs', 'four', 'six', 'sixer',
    'dot', 'wide', 'innings', 'match', 'cricket', 'pitch', 'stumps', 'bat', 'bowler', 'batter',
    'gully', 'street', 'tappa', 'boundary', 'captain', 'finals', 'league', 'kirrak', 'mawa',
    'hero', 'strike', 'powerplay', 'score', 'scorecard', 'chase', 'target', 'win', 'won', 'lost',
    'today', 'then', 'out', 'caught', 'bowled', 'last', 'first', 'super', 'mass', 'full',
    'telugu', 'kings', 'tigers', 'spl', 'ipl', 't20', 'final', 'game', 'team',
  ]);

  const anomalousNames: string[] = [];
  for (const w of words) {
    const cleanWord = w.trim();
    if (
      cleanWord.length > 2 &&
      /^[A-Z][a-z]+$/.test(cleanWord) &&
      !commonCricketVocab.has(cleanWord.toLowerCase()) &&
      !validPlayerNames.has(cleanWord.toLowerCase()) &&
      !validTeamNames.has(cleanWord.toLowerCase())
    ) {
      if (!anomalousNames.includes(cleanWord)) {
        anomalousNames.push(cleanWord);
      }
    }
  }

  // A story passes if there are NO hallucinated numbers and NO suspicious invented names
  const isValid = unverifiedNumbers.length === 0 && anomalousNames.length === 0;

  let reason = '';
  if (!isValid) {
    const parts: string[] = [];
    if (unverifiedNumbers.length > 0) {
      parts.push(`Unverified scores/numbers: ${unverifiedNumbers.join(', ')}`);
    }
    if (anomalousNames.length > 0) {
      parts.push(`Potential unverified names: ${anomalousNames.join(', ')}`);
    }
    reason = parts.join(' | ');
  }

  return {
    isValid,
    status: isValid ? 'checked' : 'needs_review',
    checkedNames,
    anomalousNames,
    verifiedNumbers,
    unverifiedNumbers,
    reason,
  };
}
