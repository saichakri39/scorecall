/**
 * Scorecall — Fast Offline Speech Matcher for Gully Cricket
 *
 * Supports Telugu, Hindi, and Indian English colloquial cricket terms.
 * Handles single-ball and compound ("four then out caught") voice calls.
 */

import { ParsedEvent, ParseResult } from '../types/cricket';

interface FuzzyMatchResult {
  matched: boolean;
  score: number;
}

/**
 * Levenshtein distance calculation
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy word matcher.
 * Requirement 7: Disable fuzzy matching for words under 4 letters (exact match only).
 */
export function matchesFuzzy(
  input: string,
  target: string,
  maxDistance = 1
): FuzzyMatchResult {
  const cleanInput = input.trim().toLowerCase();
  const cleanTarget = target.trim().toLowerCase();

  if (cleanInput === cleanTarget) {
    return { matched: true, score: 1.0 };
  }

  // Under 4 letters: exact match only
  if (cleanInput.length < 4 || cleanTarget.length < 4) {
    return { matched: false, score: 0 };
  }

  const dist = levenshtein(cleanInput, cleanTarget);
  if (dist <= maxDistance) {
    const score = 1.0 - dist / Math.max(cleanInput.length, cleanTarget.length);
    return { matched: true, score };
  }

  return { matched: false, score: 0 };
}

/**
 * Helper to clean token: strips leading/trailing punctuation while keeping Unicode letters, marks, and numbers
 */
function cleanToken(t: string): string {
  return t.replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '').toLowerCase();
}

/**
 * Helper to check if any token matches target, respecting .matched flag
 */
function containsKeyword(
  tokens: string[],
  keywords: string[],
  allowFuzzy = true
): { matched: boolean; keyword?: string; score: number } {
  const cleanedTokens = tokens.map(cleanToken).filter(Boolean);
  for (const token of cleanedTokens) {
    for (const kw of keywords) {
      if (token === kw) {
        return { matched: true, keyword: kw, score: 1.0 };
      }
      if (allowFuzzy && kw.length >= 4 && token.length >= 4) {
        const fuzzy = matchesFuzzy(token, kw, 1);
        if (fuzzy.matched) {
          return { matched: true, keyword: kw, score: fuzzy.score };
        }
      }
    }
  }
  return { matched: false, score: 0 };
}

/**
 * Checks token matches or whole segment matches (for multi-word phrases and non-Latin scripts)
 */
function matchesAnyKeywordOrPhrase(
  segment: string,
  tokens: string[],
  keywords: string[],
  allowFuzzy = true
): { matched: boolean; keyword?: string; score: number } {
  const tokenMatch = containsKeyword(tokens, keywords, allowFuzzy);
  if (tokenMatch.matched) return tokenMatch;

  const cleanSeg = segment.toLowerCase();
  for (const kw of keywords) {
    if (kw.length >= 2) {
      const isAscii = /^[\x00-\x7F]+$/.test(kw);
      if (isAscii) {
        // Word boundary match for ASCII keywords (escape regex specials)
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('(?:\\b|^)' + escaped + '(?:\\b|$)', 'i');
        if (regex.test(cleanSeg)) {
          return { matched: true, keyword: kw, score: 1.0 };
        }
      } else {
        // Substring match for non-ASCII Indic scripts (Hindi, Telugu, Tamil, Kannada, Bengali)
        if (cleanSeg.includes(kw)) {
          return { matched: true, keyword: kw, score: 1.0 };
        }
      }
    }
  }
  return { matched: false, score: 0 };
}

/**
 * Extracts player names from squads if mentioned in text
 */
function extractPlayerName(
  text: string,
  squad: string[]
): string | undefined {
  const lower = text.toLowerCase();
  for (const name of squad) {
    if (lower.includes(name.toLowerCase())) {
      return name;
    }
  }
  return undefined;
}

/**
 * Multilingual Gully Cricket Keywords
 */
export const FOUR_KEYWORDS = [
  '4', 'four', 'fours', 'fourer', 'boundary', 'boundaries', 'border',
  'for', 'fore', 'ford', 'fau', 'fo', '4r', '4s',
  'four runs', '4 runs', 'four run', '4 run', 'hit a four', 'hit four', 'shot four', 'boundary four', 'four boundary',
  // Hindi / Urdu
  'chaar', 'char', 'chauka', 'chouka', 'chowka', 'choka', 'chauke', 'chouke',
  'chawka', 'chawwa', 'chavva', 'chavka', 'chowa', 'chovva',
  'chaar run', 'char run', 'chaar runs', 'char runs', 'chauka mara', 'chauka laga', 'chouka mara',
  // Telugu
  'nalugu', 'naalugu', 'nalgu', 'charlu', 'charu', 'fouru', 'foru',
  'nalugu runs', 'naalugu runs', 'nalugu parugulu', 'naalugu parugulu',
  'four kottadu', 'four vachindi', 'four padindi',
  // Tamil
  'naangu', 'naalu', 'nangu', 'fouru',
  // Kannada
  'naalku', 'nalku', 'naalakku',
  // Marathi / Bengali
  'choukar', 'chaukar', 'chari',
  // Devanagari script (Hindi, Marathi)
  'चार', 'चौका', 'चौके', 'चौकार', '४', 'बाउंड्री',
  'फोर', 'फोर रन', 'चार रन', 'चौका मारा', 'चौका लगा', 'चौक', 'चौक्के',
  // Telugu script
  'నాలుగు', 'నలుగు', '౪', 'బౌండరీ', 'చౌక',
  'ఫోర్', 'ఫోరు', 'ఫోర్ రన్స్', 'ఫోర్ రన్', 'నాలుగు పరుగులు', 'నలుగు పరుగులు', 'నాలుగు రన్స్', 'నలుగు రన్స్', 'ఫోర్ కొట్టాడు',
  // Tamil script
  'நான்கு', 'நாலு', '௪', 'பவுண்டரி', 'போர்', 'போர் ரன்', 'நான்கு ரன்',
  // Kannada script
  'ನಾಲ್ಕು', '೪', 'ಫೋರ್', 'ನಾಲ್ಕು ರನ್',
  // Bengali script
  'চার', 'বাউন্ডারি', 'চার রান',
  // Malayalam script
  'നാല്', 'ഫോർ', 'ഫോർ റൺസ്',
  // Gujarati script
  'ચાર', 'ચોગ્ગો', 'ફોર',
];

export const SIX_KEYWORDS = [
  '6', 'six', 'sixer', 'sixes', 'maximum', 'maxima',
  // Hindi / Urdu
  'chakka', 'chhakka', 'chakke', 'chhakke', 'chhe', 'chhah',
  // Telugu
  'aaru', 'aar',
  // Marathi
  'shatkar', 'saha',
  // Devanagari script (Hindi, Marathi)
  'छक्का', 'छक्के', 'सिक्स', 'सिक्सर', 'छह', '६', 'षटकार',
  // Telugu script
  'ఆరు', 'సిక్స్', 'సిక్సర్', '౬', 'చక్కా',
  // Tamil script
  'ஆறு', 'சிக்ஸ்', 'சிக்ஸர்', '௬',
  // Kannada script
  'ಆరు', '೬',
  // Bengali script
  'ছয়', 'ছক্কা',
];

export const ONE_KEYWORDS = [
  '1', 'one', 'single', 'okati', 'ek', 'onnu', 'ondu', 'one run', '1 run', 'single run', 'ek run', 'okati run',
  'ఒకటి', 'ఒక', 'एक', 'ஒன்று', 'ஒன்னு', 'ಒಂದು', '१', '౧', '௧', '೧', 'এক', 'एक रन', 'ఒకటి రన్'
];

export const TWO_KEYWORDS = [
  '2', 'two', 'double', 'rendu', 'do', 'irandu', 'eradu', 'two runs', '2 runs', 'do run', 'rendu runs',
  'రెండు', 'दो', 'இரண்டு', 'ரெண்டு', 'ಎರಡು', '२', '౨', '௨', '೨', 'দুই', 'दो रन', 'రెండు రన్స్'
];

export const THREE_KEYWORDS = [
  '3', 'three', 'triple', 'moodu', 'teen', 'moonu', 'mooru', 'three runs', '3 runs', 'teen run', 'moodu runs',
  'మూడు', 'तीन', 'மூன்று', 'மூணு', 'ಮೂರು', '३', '౩', '௩', '೩', 'তিন', 'तीन रन', 'మూడు రన్స్'
];

export const DOT_KEYWORDS = [
  '0', 'zero', 'dot', 'dot ball', 'sunna', 'shunya', 'tappa', 'khali', 'bindu', 'no run', 'zero run',
  'సున్నా', 'శూన్య', 'డాట్', 'పూజ్యం', '०', '౦', 'டாட்', 'முட்டை', '০', 'डॉट'
];

export const WICKET_KEYWORDS = [
  'out', 'wicket', 'bowled', 'caught', 'catch', 'stumped', 'runout', 'lbw',
  'padipoyindi', 'poyadu', 'gaya', 'gayi', 'nikla', 'khatam',
  'आउट', 'विकेट', 'कैच', 'बोल्ड', 'रनआउट', 'ఔట్', 'వికెట్', 'క్యాచ్', 'రనౌట్',
  'பவுல்ட்', 'கேட்ச்', 'அவுட்', 'விகெட்'
];

export const WIDE_KEYWORDS = [
  'wide', 'vaid', 'wayed', 'వైడ్', 'वाइड', 'வைட்', 'ವೈಡ್'
];

export const NO_BALL_KEYWORDS = [
  'no ball', 'noball', 'no-ball', 'नो बॉल', 'नोबॉल', 'నో బాల్', 'நோ பால்', 'ನೋ ಬಾಲ್'
];

/**
 * Parses gully speech into one or more ParsedEvents
 */
export function parseGullySpeech(
  rawTranscript: string,
  options?: {
    battingSquad?: string[];
    bowlingSquad?: string[];
  }
): ParseResult {
  const text = rawTranscript.trim().toLowerCase();
  if (!text) {
    return {
      events: [],
      originalText: rawTranscript,
      confidence: 0,
      source: 'rule',
      needsClarification: true,
    };
  }

  // Compound sentence splitter: e.g. "ravi hit a four, then got out caught"
  const splitRegex = /(?:\bthen\b|\band\b|,\s*|\bnext\b|\bafter that\b|\baur\b|\btarvatha\b|\btarvaatha\b|తర్వాత|మరియు|और|तथा)/i;
  const segments = text.split(splitRegex).map((s) => s.trim()).filter(Boolean);

  const battingSquad = options?.battingSquad || [];
  const bowlingSquad = options?.bowlingSquad || [];

  const allEvents: ParsedEvent[] = [];
  let minConfidence = 1.0;

  for (const segment of segments) {
    const rawTokens = segment.split(/\s+/);
    const tokens = rawTokens.map(cleanToken).filter(Boolean);

    // 1. Retire check
    if (
      tokens.some((t) => t === 'retire' || t === 'retired' || t === 'hurt') ||
      segment.includes('retire ayyadu')
    ) {
      const retiringBatter = extractPlayerName(segment, battingSquad);
      allEvents.push({
        type: 'retire',
        batter: retiringBatter,
        confidence: 0.96,
        rawText: segment,
      });
      continue;
    }

    // 2. Change bowler check
    if (segment.includes('bowler') || segment.includes('bowling change') || segment.includes('over change')) {
      const newBowler = extractPlayerName(segment, bowlingSquad);
      if (newBowler) {
        allEvents.push({
          type: 'change_bowler',
          bowler: newBowler,
          confidence: 0.95,
          rawText: segment,
        });
        continue;
      }
    }

    // 3. Dot ball check
    const dotMatch = matchesAnyKeywordOrPhrase(segment, tokens, DOT_KEYWORDS, true);
    if (dotMatch.matched) {
      const conf = dotMatch.score === 1.0 ? 0.96 : 0.90;
      allEvents.push({
        type: 'dot',
        runs: 0,
        runsOffBat: 0,
        confidence: conf,
        rawText: segment,
      });
      minConfidence = Math.min(minConfidence, conf);
      continue;
    }

    // 4. Wide check
    const wideMatch = matchesAnyKeywordOrPhrase(segment, tokens, WIDE_KEYWORDS, true);
    if (wideMatch.matched) {
      let extraRunsRun = 0;
      if (matchesAnyKeywordOrPhrase(segment, tokens, ONE_KEYWORDS, false).matched) {
        extraRunsRun = 1;
      } else if (matchesAnyKeywordOrPhrase(segment, tokens, TWO_KEYWORDS, false).matched) {
        extraRunsRun = 2;
      } else if (matchesAnyKeywordOrPhrase(segment, tokens, THREE_KEYWORDS, false).matched) {
        extraRunsRun = 3;
      } else if (matchesAnyKeywordOrPhrase(segment, tokens, FOUR_KEYWORDS, false).matched) {
        extraRunsRun = 4;
      }

      allEvents.push({
        type: 'wide',
        runsRun: extraRunsRun,
        confidence: 0.96,
        rawText: segment,
      });
      continue;
    }

    // 5. No ball check
    const noBallMatch = matchesAnyKeywordOrPhrase(segment, tokens, NO_BALL_KEYWORDS, true);
    if (noBallMatch.matched || segment.includes('no ball') || segment.includes('noball')) {
      let nbRunsOffBat = 0;
      if (matchesAnyKeywordOrPhrase(segment, tokens, FOUR_KEYWORDS, false).matched) {
        nbRunsOffBat = 4;
      } else if (matchesAnyKeywordOrPhrase(segment, tokens, SIX_KEYWORDS, false).matched) {
        nbRunsOffBat = 6;
      } else if (matchesAnyKeywordOrPhrase(segment, tokens, ONE_KEYWORDS, false).matched) {
        nbRunsOffBat = 1;
      } else if (matchesAnyKeywordOrPhrase(segment, tokens, TWO_KEYWORDS, false).matched) {
        nbRunsOffBat = 2;
      } else if (matchesAnyKeywordOrPhrase(segment, tokens, THREE_KEYWORDS, false).matched) {
        nbRunsOffBat = 3;
      }

      allEvents.push({
        type: 'no_ball',
        runsOffBat: nbRunsOffBat,
        confidence: 0.96,
        rawText: segment,
      });
      continue;
    }

    // 6. Wicket check
    const wicketMatch = matchesAnyKeywordOrPhrase(segment, tokens, WICKET_KEYWORDS, true);
    if (wicketMatch.matched || segment.includes('run out') || segment.includes('clean bowled')) {
      let dismissal: any = 'caught';
      if (segment.includes('bowled')) dismissal = 'bowled';
      else if (segment.includes('run out') || tokens.includes('runout') || segment.includes('रनआउट') || segment.includes('రనౌట్')) dismissal = 'run_out';
      else if (segment.includes('stumped')) dismissal = 'stumped';
      else if (segment.includes('lbw')) dismissal = 'lbw';

      const dismissedBatter = extractPlayerName(segment, battingSquad);

      allEvents.push({
        type: 'wicket',
        dismissal,
        dismissedPlayer: dismissedBatter,
        confidence: 0.96,
        rawText: segment,
      });
      continue;
    }

    // 7. Boundaries: Four and Six (Multilingual across all Indian languages)
    const batterMentioned = extractPlayerName(segment, battingSquad);

    const sixMatch = matchesAnyKeywordOrPhrase(segment, tokens, SIX_KEYWORDS, true);
    if (sixMatch.matched) {
      const conf = 0.96;
      allEvents.push({
        type: 'boundary',
        runsOffBat: 6,
        runs: 6,
        batter: batterMentioned,
        confidence: conf,
        rawText: segment,
      });
      minConfidence = Math.min(minConfidence, conf);
      continue;
    }

    const fourMatch = matchesAnyKeywordOrPhrase(segment, tokens, FOUR_KEYWORDS, true);
    if (fourMatch.matched) {
      const conf = 0.96;
      allEvents.push({
        type: 'boundary',
        runsOffBat: 4,
        runs: 4,
        batter: batterMentioned,
        confidence: conf,
        rawText: segment,
      });
      minConfidence = Math.min(minConfidence, conf);
      continue;
    }

    // 8. Regular runs (1, 2, 3)
    let runsScored = 0;
    if (matchesAnyKeywordOrPhrase(segment, tokens, ONE_KEYWORDS, false).matched) {
      runsScored = 1;
    } else if (matchesAnyKeywordOrPhrase(segment, tokens, TWO_KEYWORDS, false).matched) {
      runsScored = 2;
    } else if (matchesAnyKeywordOrPhrase(segment, tokens, THREE_KEYWORDS, false).matched) {
      runsScored = 3;
    }

    if (runsScored > 0) {
      allEvents.push({
        type: 'run',
        runs: runsScored,
        runsOffBat: runsScored,
        batter: batterMentioned,
        confidence: 0.96,
        rawText: segment,
      });
      continue;
    }

    // 9. Byes & Leg Byes
    if (segment.includes('leg bye') || segment.includes('legbye')) {
      allEvents.push({
        type: 'leg_bye',
        runsRun: 1,
        confidence: 0.95,
        rawText: segment,
      });
      continue;
    }
    if (tokens.includes('bye')) {
      allEvents.push({
        type: 'bye',
        runsRun: 1,
        confidence: 0.95,
        rawText: segment,
      });
      continue;
    }
  }

  if (allEvents.length === 0) {
    return {
      events: [],
      originalText: rawTranscript,
      confidence: 0,
      source: 'rule',
      needsClarification: true,
    };
  }

  return {
    events: allEvents,
    originalText: rawTranscript,
    confidence: minConfidence,
    source: 'rule',
    needsClarification: minConfidence < 0.95,
  };
}
