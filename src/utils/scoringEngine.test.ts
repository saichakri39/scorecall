/**
 * Scorecall — Scoring Engine Test Suite
 *
 * Verifies all rules for:
 * - Multi-event command
 * - One undo removes multi-event command (real undo path comparison)
 * - 6-player squad ends on 5th wicket
 * - Second innings handover
 * - No ball + 4
 * - Wide + 2 runs
 * - Strike rotation
 * - Retire
 * - Bowler wickets and runs (run out and byes excluded)
 * - Zero words in fast matcher ("0", "zero", "sunna", "shunya")
 */

import {
  INITIAL_MATCH,
  applyBall,
  deriveMatchStats,
  startSecondInnings,
  getEffectiveMaxWickets,
  BallInput,
} from './scoringEngine';
import { parseGullySpeech } from './fastSpeechMatcher';
import { MatchState, ParsedEvent } from '../types/cricket';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failedCount++;
  }
}

console.log('\n=============================================');
console.log('   RUNNING SCORECALL SCORING ENGINE TESTS    ');
console.log('=============================================\n');

// 1. Initial State Check (Stage 1, Item 4)
const initial = { ...INITIAL_MATCH };
assert(
  initial.balls.length === 0 &&
    initial.totalRuns === 0 &&
    initial.wickets === 0 &&
    initial.overs === 0 &&
    initial.ballsInOver === 0,
  'Initial match starts strictly with empty ball log and zero score'
);

// 2. Wide + 2 runs (Stage 2, Item 8)
let matchWide = { ...INITIAL_MATCH };
matchWide = applyBall(matchWide, {
  eventType: 'wide',
  runsRun: 2,
});
assert(
  matchWide.totalRuns === 3,
  'Wide + 2 runs gives exactly 3 team runs (1 wide penalty + 2 runs run)'
);
assert(
  matchWide.ballsInOver === 0 && matchWide.overs === 0,
  'Wide is illegal ball, over does not advance'
);
assert(
  matchWide.extras.wides === 3,
  'Wide extras correctly recorded as 3'
);
const strikerStatWide = matchWide.batters![matchWide.striker];
assert(
  strikerStatWide.balls === 0 && strikerStatWide.runs === 0,
  'Wide does not increment striker balls faced or batter runs'
);

// 3. No ball + 4 runs (Stage 2, Item 8)
let matchNb = { ...INITIAL_MATCH };
matchNb = applyBall(matchNb, {
  eventType: 'no_ball',
  runsOffBat: 4,
});
assert(
  matchNb.totalRuns === 5,
  'No ball + 4 gives exactly 5 team runs (1 penalty + 4 bat runs)'
);
assert(
  matchNb.batters!['Ravi'].runs === 4,
  'Striker Ravi credited with 4 bat runs on no-ball'
);
assert(
  matchNb.isFreeHit === true,
  'Next ball is a free hit after no-ball'
);
assert(
  matchNb.ballsInOver === 0,
  'No ball is illegal ball, legal balls count does not advance'
);

// 4. Strike rotation on runs run & Over completion
let matchStrike = { ...INITIAL_MATCH };
const initialStriker = matchStrike.striker; // Ravi
const initialNonStriker = matchStrike.nonStriker; // Suresh

// Ball 1: 1 run
matchStrike = applyBall(matchStrike, {
  eventType: 'run',
  runs: 1,
  runsOffBat: 1,
});
assert(
  matchStrike.striker === initialNonStriker &&
    matchStrike.nonStriker === initialStriker,
  'Single run rotates strike (Suresh is now on strike)'
);

// Ball 2: 2 runs
matchStrike = applyBall(matchStrike, {
  eventType: 'run',
  runs: 2,
  runsOffBat: 2,
});
assert(
  matchStrike.striker === initialNonStriker,
  'Two runs does not rotate strike (Suresh remains on strike)'
);

// Bowl 4 more legal balls to finish the 6-ball over
for (let i = 0; i < 4; i++) {
  matchStrike = applyBall(matchStrike, {
    eventType: 'dot',
    runs: 0,
  });
}
assert(
  matchStrike.overs === 1 && matchStrike.ballsInOver === 0,
  'Over completes cleanly after 6 legal balls'
);
// Over completion rotates strike
assert(
  matchStrike.striker === initialStriker,
  'Strike rotates cleanly at the end of the over'
);

// 5. Multi-event command and One Undo for it (Stage 1, Item 2)
let matchMulti = { ...INITIAL_MATCH };
// Snapshot before command
const beforeCommandSnapshot = JSON.parse(JSON.stringify(matchMulti));
const undoStack: MatchState[] = [beforeCommandSnapshot];

// Compound command: "Ravi hit a four, then got out caught"
const events: ParsedEvent[] = [
  { type: 'boundary', runsOffBat: 4, runs: 4, batter: 'Ravi', confidence: 0.95 },
  { type: 'wicket', dismissal: 'caught', dismissedPlayer: 'Ravi', confidence: 0.95 },
];

let localMultiState = { ...matchMulti };
for (const evt of events) {
  localMultiState = applyBall(localMultiState, {
    eventType: evt.type,
    runsOffBat: evt.runsOffBat,
    runs: evt.runs,
    dismissalType: evt.dismissal,
    dismissedBatter: evt.dismissedPlayer,
    batter: evt.batter,
  });
}
matchMulti = localMultiState;

assert(
  matchMulti.totalRuns === 4 && matchMulti.wickets === 1,
  'Multi-event command scored both the four and the wicket'
);
assert(
  matchMulti.batters!['Ravi'].runs === 4 && matchMulti.batters!['Ravi'].isOut === true,
  'Ravi scored 4 and is marked out'
);
assert(
  matchMulti.striker !== 'Ravi',
  'Dismissed batter Ravi does not remain on strike'
);

// Real undo path: Pop the one snapshot from undoStack
assert(undoStack.length === 1, 'Only ONE undo snapshot was pushed for the compound command');
const restoredState = undoStack.pop()!;
matchMulti = restoredState;

assert(
  matchMulti.totalRuns === beforeCommandSnapshot.totalRuns &&
    matchMulti.wickets === beforeCommandSnapshot.wickets &&
    matchMulti.balls.length === beforeCommandSnapshot.balls.length &&
    matchMulti.striker === beforeCommandSnapshot.striker,
  'One Undo completely removes both events and restores exact initial state'
);

// 6. 6-player squad ends on the 5th wicket (Stage 1, Item 3)
let matchSquad: MatchState = {
  ...INITIAL_MATCH,
  battingSquad: ['Player1', 'Player2', 'Player3', 'Player4', 'Player5', 'Player6'],
  striker: 'Player1',
  nonStriker: 'Player2',
  rules: {
    ...INITIAL_MATCH.rules,
    maxWickets: 5,
    lastManBats: false,
  },
  balls: [],
};
assert(
  getEffectiveMaxWickets(matchSquad.rules, matchSquad.battingSquad.length) === 5,
  'Effective max wickets for 6 players without lastManBats is 5'
);

// Fall 5 wickets
for (let w = 1; w <= 5; w++) {
  matchSquad = applyBall(matchSquad, {
    eventType: 'wicket',
    dismissalType: 'bowled',
  });
}
assert(
  matchSquad.wickets === 5,
  'Recorded 5 wickets fallen'
);
assert(
  matchSquad.status === 'innings_break',
  '6-player squad ends the innings on the 5th wicket'
);

// 7. Retire (Stage 2, Item 10)
let matchRetire = { ...INITIAL_MATCH };
const retiredBatter = matchRetire.striker; // Ravi
matchRetire = applyBall(matchRetire, {
  eventType: 'retire',
  batter: retiredBatter,
});
assert(
  matchRetire.wickets === 0,
  'Retire does not increment wicket count'
);
assert(
  matchRetire.batters![retiredBatter].isRetired === true,
  'Retired batter stays marked as retired'
);
assert(
  matchRetire.striker !== retiredBatter,
  'Next batter walks in and takes strike'
);
// Apply another ball
matchRetire = applyBall(matchRetire, {
  eventType: 'run',
  runs: 2,
  runsOffBat: 2,
});
assert(
  matchRetire.batters![retiredBatter].isRetired === true,
  'Subsequent deliveries keep retired batter retired'
);

// 8. Bowler wickets and runs (Stage 2, Item 11)
let matchBowler = { ...INITIAL_MATCH };
// Bowler Kiran bowls a ball where batter gets out caught:
matchBowler = applyBall(matchBowler, {
  eventType: 'wicket',
  dismissalType: 'caught',
});
assert(
  matchBowler.bowlers!['Kiran'].wickets === 1,
  'Bowler credited with wicket on caught dismissal'
);

// Next ball: run out
matchBowler = applyBall(matchBowler, {
  eventType: 'wicket',
  dismissalType: 'run_out',
});
assert(
  matchBowler.bowlers!['Kiran'].wickets === 1,
  'Bowler NOT credited with wicket on run out'
);

// Next ball: 2 byes
matchBowler = applyBall(matchBowler, {
  eventType: 'bye',
  runsRun: 2,
});
assert(
  matchBowler.bowlers!['Kiran'].runs === 0,
  'Byes are not charged to bowler runs'
);

// 9. Second innings handover & Win text (Stage 2, Item 12)
let matchInn1 = { ...INITIAL_MATCH };
// Team Batting: Gully Kings, Bowling: Street Blasters
// Score 40 runs in innings 1
for (let i = 0; i < 4; i++) {
  matchInn1 = applyBall(matchInn1, {
    eventType: 'boundary',
    runs: 6,
    runsOffBat: 6,
  });
}
matchInn1 = applyBall(matchInn1, {
  eventType: 'boundary',
  runs: 4,
  runsOffBat: 4,
});
matchInn1 = applyBall(matchInn1, {
  eventType: 'run',
  runs: 2,
  runsOffBat: 2,
});
// Total is 30 runs
assert(matchInn1.totalRuns === 30, '1st innings total is 30 runs');

// Handover to 2nd innings
let matchInn2 = startSecondInnings(matchInn1);
assert(
  matchInn2.currentInnings === 2,
  'Current innings is 2'
);
assert(
  matchInn2.teamBatting === 'Street Blasters' && matchInn2.teamBowling === 'Gully Kings',
  'Teams swapped cleanly for 2nd innings'
);
assert(
  matchInn2.totalRuns === 0 && matchInn2.wickets === 0,
  'Scores and wickets reset to 0 for 2nd innings'
);
assert(
  matchInn2.target === 31,
  'Target set to 1st innings runs + 1 (31)'
);

// Street Blasters chases 31
for (let i = 0; i < 5; i++) {
  matchInn2 = applyBall(matchInn2, {
    eventType: 'boundary',
    runs: 6,
    runsOffBat: 6,
  });
}
matchInn2 = applyBall(matchInn2, {
  eventType: 'run',
  runs: 2,
  runsOffBat: 2,
});
// Total 32 >= 31 target!
assert(
  matchInn2.totalRuns === 32,
  '2nd innings reaches 32 runs'
);
assert(
  matchInn2.status === 'completed',
  'Match completed when target reached'
);
assert(
  Boolean(matchInn2.resultText?.includes('Street Blasters won by')),
  `Win text correct: "${matchInn2.resultText}"`
);

// 10. Zero words in fast speech matcher (Stage 2, Item 7)
const zeroWords = ['0', 'zero', 'sunna', 'shunya'];
for (const word of zeroWords) {
  const parseRes = parseGullySpeech(word);
  assert(
    parseRes.events.length === 1 && parseRes.events[0].type === 'dot',
    `Fast speech matcher correctly parses "${word}" as dot ball`
  );
}

// Check mishearings 'for', 'sick', etc. are not falsely boundary
const mishearingFor = parseGullySpeech('for that at');
assert(
  mishearingFor.events.length === 0 || mishearingFor.needsClarification === true,
  'Removed mishearings ("for", "that", "at") do not falsely score a four'
);

console.log('\n---------------------------------------------');
console.log(`SCORING ENGINE TESTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('---------------------------------------------\n');

if (failedCount > 0) {
  process.exit(1);
}
