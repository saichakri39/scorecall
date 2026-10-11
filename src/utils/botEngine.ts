/**
 * Scorecall — Gully Cricket Voice Assistant Engine
 * Answers gully cricket match queries in English, Telugu, and Hindi (script & transliterated).
 */

import { MatchState } from '../types/cricket';
import { deriveMatchStats } from './scoringEngine';

export interface BotAnswer {
  text: string;
  lang: 'en' | 'te' | 'hi';
}

function detectQueryLanguage(query: string): 'te' | 'hi' | 'en' {
  const lower = query.toLowerCase();

  // Telugu scripts or keywords
  if (
    /[\u0C00-\u0C7F]/.test(query) ||
    lower.includes('evaru') ||
    lower.includes('entha') ||
    lower.includes('enni') ||
    lower.includes('padayi') ||
    lower.includes('aadutunnaru')
  ) {
    return 'te';
  }

  // Hindi scripts or keywords
  if (
    /[\u0900-\u097F]/.test(query) ||
    lower.includes('kaun') ||
    lower.includes('kitne') ||
    lower.includes('kya') ||
    lower.includes('hai') ||
    lower.includes('gire') ||
    lower.includes('raha')
  ) {
    return 'hi';
  }

  return 'en';
}

export function answerMatchQuestion(
  query: string,
  match: MatchState
): BotAnswer {
  const lang = detectQueryLanguage(query);
  const q = query.toLowerCase().trim();
  const derived = deriveMatchStats(match.balls, match);

  const striker = derived.striker || 'None';
  const nonStriker = derived.nonStriker || 'None';
  const bowler = derived.currentBowler || 'None';
  const totalRuns = derived.totalRuns;
  const wickets = derived.wickets;
  const oversStr = `${derived.overs}.${derived.ballsInOver}`;

  const legalBalls = derived.overs * match.rules.ballsPerOver + derived.ballsInOver;
  const crr =
    legalBalls > 0
      ? ((totalRuns / legalBalls) * match.rules.ballsPerOver).toFixed(2)
      : '0.00';

  // 1. Who is bowling: supports English, Telugu script / transliteration, Hindi script / transliteration
  const isBowlingQuery =
    q.includes('who is bowling') ||
    q.includes('bowling') ||
    q.includes('bowler') ||
    q.includes('బౌలింగ్') ||
    q.includes('బౌలర్') ||
    q.includes('गेंदबाजी') ||
    q.includes('गेंदबाज') ||
    q.includes('evaru bowling') ||
    q.includes('kaun bowling');

  // 2. Who is batting: supports English, Telugu script / transliteration, Hindi script / transliteration
  const isBattingQuery =
    q.includes('who is batting') ||
    q.includes('batting') ||
    q.includes('batter') ||
    q.includes('striker') ||
    q.includes('బ్యాటింగ్') ||
    q.includes('స్ట్రైకర్') ||
    q.includes('बल्लेबाजी') ||
    q.includes('बल्लेबाज') ||
    q.includes('evaru batting') ||
    q.includes('kaun batting');

  // 3. How many wickets
  const isWicketsQuery =
    q.includes('how many wickets') ||
    q.includes('wickets') ||
    q.includes('wicket') ||
    q.includes('వికెట్లు') ||
    q.includes('వికెట్') ||
    q.includes('विकेट') ||
    q.includes('आउट') ||
    q.includes('enno wickets') ||
    q.includes('enni wickets') ||
    q.includes('kitne wicket');

  // 4. Partnership
  const isPartnershipQuery =
    q.includes('partnership') ||
    q.includes('భాగస్వామ్యం') ||
    q.includes('sajhedari') ||
    q.includes('साझेदारी');

  // 5. Run Rate
  const isRunRateQuery =
    q.includes('run rate') ||
    q.includes('crr') ||
    q.includes('rrr') ||
    q.includes('రన్ రేట్') ||
    q.includes('रन रेट') ||
    q.includes('rate');

  // Execution:
  if (isBowlingQuery) {
    if (lang === 'te') {
      return {
        text: `ప్రస్తుతం ${bowler} బౌలింగ్ చేస్తున్నాడు.`,
        lang: 'te',
      };
    }
    if (lang === 'hi') {
      return {
        text: `अभी ${bowler} गेंदबाजी कर रहा है।`,
        lang: 'hi',
      };
    }
    return {
      text: `${bowler} is bowling right now.`,
      lang: 'en',
    };
  }

  if (isBattingQuery) {
    if (lang === 'te') {
      return {
        text: `క్రీజులో స్ట్రైకర్‌గా ${striker}, నాన్-స్ట్రైకర్‌గా ${nonStriker} బ్యాటింగ్ చేస్తున్నారు.`,
        lang: 'te',
      };
    }
    if (lang === 'hi') {
      return {
        text: `क्रीज पर ${striker} स्ट्राइक पर हैं और ${nonStriker} नॉन-स्ट्राइक पर हैं।`,
        lang: 'hi',
      };
    }
    return {
      text: `${striker} is on strike and ${nonStriker} is at the non-striker end.`,
      lang: 'en',
    };
  }

  if (isWicketsQuery) {
    if (lang === 'te') {
      return {
        text: `${wickets} వికెట్లు పడ్డాయి. స్కోరు ${totalRuns}/${wickets} (${oversStr} ఓవర్లలో).`,
        lang: 'te',
      };
    }
    if (lang === 'hi') {
      return {
        text: `${wickets} विकेट गिर चुके हैं। स्कोर ${totalRuns}/${wickets} (${oversStr} ओवर में) है।`,
        lang: 'hi',
      };
    }
    return {
      text: `${wickets} wickets down. Score is ${totalRuns}/${wickets} in ${oversStr} overs.`,
      lang: 'en',
    };
  }

  if (isPartnershipQuery) {
    let pRuns = 0;
    let pBalls = 0;
    for (let i = match.balls.length - 1; i >= 0; i--) {
      const b = match.balls[i];
      if (b.isWicket || b.eventType === 'retire') break;
      pRuns += b.runs;
      if (b.isLegal) pBalls += 1;
    }
    if (lang === 'te') {
      return {
        text: `ప్రస్తుత భాగస్వామ్యం ${pRuns} పరుగులు (${pBalls} బంతుల్లో) ${striker} మరియు ${nonStriker} మధ్య.`,
        lang: 'te',
      };
    }
    if (lang === 'hi') {
      return {
        text: `वर्तमान साझेदारी ${pRuns} रन (${pBalls} गेंदों में) है ${striker} और ${nonStriker} के बीच।`,
        lang: 'hi',
      };
    }
    return {
      text: `Current partnership is ${pRuns} runs off ${pBalls} balls between ${striker} and ${nonStriker}.`,
      lang: 'en',
    };
  }

  if (isRunRateQuery) {
    let rrrTextEn = '';
    let rrrTextTe = '';
    let rrrTextHi = '';

    if (match.currentInnings === 2 && match.target) {
      const runsNeeded = Math.max(0, match.target - totalRuns);
      const totalLegalBalls = match.rules.totalOvers * match.rules.ballsPerOver;
      const ballsLeft = Math.max(0, totalLegalBalls - legalBalls);
      const rrrVal =
        ballsLeft > 0
          ? ((runsNeeded / ballsLeft) * match.rules.ballsPerOver).toFixed(2)
          : '0.00';
      rrrTextEn = `. Need ${runsNeeded} runs from ${ballsLeft} balls (RRR: ${rrrVal})`;
      rrrTextTe = `. గెలవడానికి ${ballsLeft} బంతుల్లో ${runsNeeded} పరుగులు అవసరం (RRR: ${rrrVal})`;
      rrrTextHi = `. जीतने के लिए ${ballsLeft} गेंदों में ${runsNeeded} रन चाहिए (RRR: ${rrrVal})`;
    }

    if (lang === 'te') {
      return {
        text: `ప్రస్తుత రన్ రేట్ ${crr}${rrrTextTe}.`,
        lang: 'te',
      };
    }
    if (lang === 'hi') {
      return {
        text: `वर्तमान रन रेट ${crr} है${rrrTextHi}।`,
        lang: 'hi',
      };
    }
    return {
      text: `Current run rate is ${crr}${rrrTextEn}.`,
      lang: 'en',
    };
  }

  // Default: Score
  if (lang === 'te') {
    return {
      text: `స్కోరు ${totalRuns}/${wickets}, ${oversStr} ఓవర్లలో. రన్ రేట్ ${crr}.`,
      lang: 'te',
    };
  }
  if (lang === 'hi') {
    return {
      text: `स्कोर ${totalRuns}/${wickets} है, ${oversStr} ओवर में। रन रेट ${crr} है।`,
      lang: 'hi',
    };
  }
  return {
    text: `The score is ${totalRuns} for ${wickets} in ${oversStr} overs (CRR: ${crr}).`,
    lang: 'en',
  };
}
