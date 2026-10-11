/**
 * Scorecall — Bot Engine Test Suite
 *
 * Verifies that the bot answers:
 * - "who is bowling" in English, Telugu, and Hindi
 * - "who is batting" in English, Telugu, and Hindi
 * - "how many wickets" in English, Telugu, and Hindi
 * - partnership & run rate
 */

import { answerMatchQuestion } from './botEngine';
import { INITIAL_MATCH, applyBall } from './scoringEngine';
import { MatchState } from '../types/cricket';

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
console.log('      RUNNING SCORECALL BOT ENGINE TESTS     ');
console.log('=============================================\n');

let testMatch: MatchState = {
  ...INITIAL_MATCH,
  teamBatting: 'Gully Kings',
  teamBowling: 'Street Blasters',
  striker: 'Ravi',
  nonStriker: 'Suresh',
  currentBowler: 'Kiran',
};

// Add 2 balls: 4 runs then wicket
testMatch = applyBall(testMatch, {
  eventType: 'boundary',
  runs: 4,
  runsOffBat: 4,
});
testMatch = applyBall(testMatch, {
  eventType: 'wicket',
  dismissalType: 'caught',
});

// 1. Who is bowling
// English
const bowlEn = answerMatchQuestion('Who is bowling right now?', testMatch);
assert(
  bowlEn.text.includes('Kiran') && bowlEn.lang === 'en',
  'Answers "who is bowling" in English'
);

// Telugu
const bowlTe = answerMatchQuestion('బౌలింగ్ ఎవరు చేస్తున్నారు?', testMatch);
assert(
  bowlTe.text.includes('Kiran') && bowlTe.lang === 'te',
  'Answers "who is bowling" in Telugu'
);

// Hindi
const bowlHi = answerMatchQuestion('गेंदबाजी कौन कर रहा है?', testMatch);
assert(
  bowlHi.text.includes('Kiran') && bowlHi.lang === 'hi',
  'Answers "who is bowling" in Hindi'
);

// 2. Who is batting
// English
const batEn = answerMatchQuestion('Who is batting?', testMatch);
assert(
  batEn.text.includes('strike') && batEn.lang === 'en',
  'Answers "who is batting" in English'
);

// Telugu
const batTe = answerMatchQuestion('క్రీజులో బ్యాటింగ్ ఎవరు చేస్తున్నారు?', testMatch);
assert(
  batTe.text.includes('స్ట్రైకర్‌గా') && batTe.lang === 'te',
  'Answers "who is batting" in Telugu'
);

// Hindi
const batHi = answerMatchQuestion('बल्लेबाजी कौन कर रहा है?', testMatch);
assert(
  batHi.text.includes('क्रीज') && batHi.lang === 'hi',
  'Answers "who is batting" in Hindi'
);

// 3. How many wickets
// English
const wktEn = answerMatchQuestion('How many wickets have fallen?', testMatch);
assert(
  wktEn.text.includes('1') && wktEn.lang === 'en',
  'Answers "how many wickets" in English'
);

// Telugu
const wktTe = answerMatchQuestion('ఎన్ని వికెట్లు పడ్డాయి?', testMatch);
assert(
  wktTe.text.includes('1') && wktTe.text.includes('వికెట్లు') && wktTe.lang === 'te',
  'Answers "how many wickets" in Telugu'
);

// Hindi
const wktHi = answerMatchQuestion('कितने विकेट गिर चुके हैं?', testMatch);
assert(
  wktHi.text.includes('1') && wktHi.text.includes('विकेट') && wktHi.lang === 'hi',
  'Answers "how many wickets" in Hindi'
);

// 4. Partnership
const partEn = answerMatchQuestion('What is the partnership?', testMatch);
assert(
  partEn.text.includes('partnership'),
  'Answers partnership query'
);

// 5. Run Rate
const rrEn = answerMatchQuestion('What is the run rate?', testMatch);
assert(
  rrEn.text.includes('run rate') || rrEn.text.includes('CRR'),
  'Answers run rate query'
);

console.log('\n---------------------------------------------');
console.log(`BOT ENGINE TESTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('---------------------------------------------\n');

if (failedCount > 0) {
  process.exit(1);
}
