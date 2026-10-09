import { MatchState, ParseResult, ParsedEvent } from '../types/cricket';
import { logEvaluation } from './db';

/**
 * Primary Parser: Calls backend /parse (FastAPI / Express proxy) which runs Claude Haiku 5.5.
 * If backend is unreachable or offline, seamlessly falls back to the local deterministic rule-based engine
 * and tags the result with engine: 'offline-rule-based'.
 */
export async function parseGullySpeechWithLLM(
  text: string,
  state: MatchState
): Promise<ParseResult> {
  const clean = text.trim();
  const minimalState = {
    striker: state.striker,
    nonStriker: state.nonStriker,
    bowler: state.bowler,
    over: `${state.oversCompleted}.${state.ballsInCurrentOver}`,
    score: `${state.score}/${state.wickets}`,
    batters: Object.keys(state.batters),
    bowlers: Object.keys(state.bowlers),
  };

  const payload = {
    text: clean,
    state: minimalState,
    rules: state.rules,
  };

  // Try calling the FastAPI / Express /parse endpoint
  const endpoints = ['/parse', '/api/parse', 'http://localhost:8000/parse'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(3500), // Quick timeout for gully responsiveness
      });

      if (response.ok) {
        const data = await response.json();
        const result: ParseResult = {
          rawText: clean,
          events: data.events || [],
          needs_clarification: data.needs_clarification || false,
          question: data.question,
          engine: 'claude-haiku-5-5',
        };

        // Log for project accuracy evaluation
        try {
          await logEvaluation({
            transcript: clean,
            model: 'claude-haiku-5-5',
            parsedJson: JSON.stringify(result.events || result.question || {}),
            groundTruthText: '',
          });
        } catch {}

        return result;
      }
    } catch {
      // Continue to next endpoint or fallback
    }
  }

  // Seamless offline fallback
  const fallbackResult = parseGullySpeechOffline(clean, state);
  fallbackResult.engine = 'offline-rule-based';

  try {
    await logEvaluation({
      transcript: clean,
      model: 'offline-rule-based',
      parsedJson: JSON.stringify(fallbackResult.events || fallbackResult.question || {}),
      groundTruthText: '',
    });
  } catch {}

  return fallbackResult;
}

/**
 * Audio STT interface for plugging in Whisper large-v3 or Sarvam AI via backend POST /transcribe.
 */
export async function transcribeAudioBlob(
  audioBlob: Blob,
  languageCode: string = 'tanglish'
): Promise<{ text: string; service: string }> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice_recording.webm');
  formData.append('language', languageCode);

  const endpoints = ['/transcribe', '/api/transcribe', 'http://localhost:8000/transcribe'];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        return { text: data.text, service: data.service || 'whisper-large-v3' };
      }
    } catch {}
  }

  throw new Error('Backend STT service unavailable. Use Web Speech API or manual keypad.');
}

/**
 * Offline rule-based fallback parser for no-internet gully conditions.
 */
export function parseGullySpeechOffline(text: string, state: MatchState): ParseResult {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. UNDO
  if (
    lower.includes('undo') ||
    lower.includes('thappu') ||
    lower.includes('vapas') ||
    lower.includes('cancel last') ||
    lower.includes('roll back') ||
    lower === 'undo that'
  ) {
    return {
      rawText: clean,
      events: [{ type: 'undo', confidence: 0.99 }],
      engine: 'offline-rule-based',
    };
  }

  // 2. Ambiguity check
  if (
    lower === 'he got out' ||
    lower === 'out ho gaya' ||
    lower === 'out ayyadu' ||
    lower === 'wicket padindi' ||
    lower === 'out'
  ) {
    return {
      rawText: clean,
      needs_clarification: true,
      question: `Evaru out ayyaru? (${state.striker} aa leda ${state.nonStriker} aa?) Mari ela out?`,
      engine: 'offline-rule-based',
    };
  }

  // 3. Multi-event split
  const splitRegex = /\b(?:then|tarvata|next ball|aur|and then|\band\b|,)\b/gi;
  const rawSegments = lower.split(splitRegex).map(s => s.trim()).filter(Boolean);
  const segments = rawSegments.length > 0 ? rawSegments : [lower];
  const events: ParsedEvent[] = [];

  for (const seg of segments) {
    const event = parseSingleSegment(seg, state);
    if (event) {
      events.push(event);
    }
  }

  if (events.length > 0) {
    return {
      rawText: clean,
      events,
      engine: 'offline-rule-based',
    };
  }

  // Fallback player check
  const matchedBatter = findKnownPlayer(lower, [state.striker, state.nonStriker, ...Object.keys(state.batters)]);
  if (matchedBatter && (lower.includes('out') || lower.includes('catch') || lower.includes('bowled'))) {
    return {
      rawText: clean,
      events: [{
        type: 'wicket',
        batter: matchedBatter,
        dismissal: lower.includes('catch') ? 'caught' : lower.includes('run out') ? 'run_out' : 'bowled',
        confidence: 0.85,
      }],
      engine: 'offline-rule-based',
    };
  }

  return {
    rawText: clean,
    needs_clarification: true,
    question: `Artham kaaledu ("${clean}"). Runs aa, Out aa, leda Extra aa?`,
    engine: 'offline-rule-based',
  };
}

function parseSingleSegment(segment: string, state: MatchState): ParsedEvent | null {
  const s = segment.toLowerCase().trim();
  if (!s) return null;

  // WIDE
  if (s.includes('wide') || s.includes('vaidu') || s.includes('vaid')) {
    let runs = 1;
    if (s.includes('two') || s.includes('rendu') || s.includes('2')) runs = 2;
    if (s.includes('four') || s.includes('4') || s.includes('chauka')) runs = 5;
    return { type: 'wide', runs, confidence: 0.97 };
  }

  // NO BALL
  if (s.includes('no ball') || s.includes('noball') || s.includes('no-ball')) {
    let runs = 1;
    if (s.includes('four') || s.includes('4')) runs = 5;
    if (s.includes('six') || s.includes('6')) runs = 7;
    return { type: 'no_ball', runs, confidence: 0.96 };
  }

  // WALL TOUCH RULE: If local wallTouchTwoRuns rule is on
  if ((s.includes('wall') || s.includes('godha') || s.includes('deewar')) && (state.rules.wallTouchTwoRuns || s.includes('touch'))) {
    return {
      type: 'runs',
      batter: state.striker,
      runs: 2,
      confidence: 0.96,
    };
  }

  // DOT BALL
  if (s.includes('dot') || s.includes('no run') || s.includes('dabba') || s.includes('zero') || s === '0' || s.includes('sunna')) {
    return { type: 'dot', confidence: 0.92 };
  }

  // WICKET
  if (s.includes('out') || s.includes('caught') || s.includes('bowled') || s.includes('wicket') || s.includes('catch')) {
    const matchedBatter = findKnownPlayer(s, [state.striker, state.nonStriker, ...Object.keys(state.batters)]) || state.striker;
    let dismissal: any = 'caught';
    if (s.includes('bowled') || s.includes('clean bowled')) dismissal = 'bowled';
    else if (s.includes('run out') || s.includes('runout')) dismissal = 'run_out';
    else if (s.includes('tappa') || s.includes('one pitch') || s.includes('one bounce')) dismissal = 'one_pitch_caught';
    else if (s.includes('stump')) dismissal = 'stumped';

    return {
      type: 'wicket',
      batter: matchedBatter,
      dismissal,
      confidence: 0.88,
    };
  }

  // RUNS / BOUNDARIES
  const matchedBatter = findKnownPlayer(s, [state.striker, state.nonStriker, ...Object.keys(state.batters)]) || state.striker;
  const matchedBowler = findKnownPlayer(s, [state.bowler, ...Object.keys(state.bowlers)]);

  if (s.includes('sixer') || s.includes('six') || s.includes('chhakka') || s.includes('aaru') || s.includes('6')) {
    return {
      type: 'runs',
      batter: matchedBatter,
      bowler: matchedBowler,
      runs: 6,
      boundary: true,
      confidence: 0.95,
    };
  }

  if (s.includes('four') || s.includes('chauka') || s.includes('chaar') || s.includes('naalugu') || s.includes('boundary') || s.includes('4')) {
    return {
      type: 'runs',
      batter: matchedBatter,
      bowler: matchedBowler,
      runs: 4,
      boundary: true,
      confidence: 0.95,
    };
  }

  if (s.includes('three') || s.includes('teen') || s.includes('moodu') || s.includes('3')) {
    return {
      type: 'runs',
      batter: matchedBatter,
      bowler: matchedBowler,
      runs: 3,
      confidence: 0.91,
    };
  }

  if (s.includes('two') || s.includes('rendu') || s.includes('do') || s.includes('double') || s.includes('2')) {
    return {
      type: 'runs',
      batter: matchedBatter,
      bowler: matchedBowler,
      runs: 2,
      confidence: 0.92,
    };
  }

  if (s.includes('one') || s.includes('single') || s.includes('oka') || s.includes('ek') || s.includes('1')) {
    return {
      type: 'runs',
      batter: matchedBatter,
      bowler: matchedBowler,
      runs: 1,
      confidence: 0.94,
    };
  }

  const numMatch = s.match(/\b([0-6])\b/);
  if (numMatch) {
    const val = parseInt(numMatch[1], 10);
    if (val === 0) return { type: 'dot', confidence: 0.9 };
    return {
      type: 'runs',
      batter: matchedBatter,
      runs: val,
      boundary: val === 4 || val === 6,
      confidence: 0.88,
    };
  }

  return null;
}

function findKnownPlayer(text: string, playerList: string[]): string | undefined {
  for (const name of playerList) {
    if (name && text.toLowerCase().includes(name.toLowerCase())) {
      return name;
    }
  }
  return undefined;
}
