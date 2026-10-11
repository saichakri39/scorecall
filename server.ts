/**
 * Scorecall — Express Backend Server with Gemini AI Integration
 *
 * Requirements (Stage 2 & 3):
 * 1. Single model constant: const GEMINI_MODEL = 'gemini-3.8-flash';
 * 2. Rate limiter: 30 requests per minute per IP on /api routes.
 * 3. Validate Gemini parse output (allowed event types only, runs 0..6, confidence 0..1, else needs_clarification).
 * 4. Update PARSER_SYSTEM_PROMPT and schema:
 *    - no_ball sends runsOffBat (4 or 6), never total runs
 *    - wide sends runsRun, never runs
 *    - examples: 'no ball four' = no_ball with runsOffBat 4; 'wide' = wide with runsRun 0
 * 5. Accept only story styles: telugu_commentator, tweet_thread, dramatic_report, roast_mode.
 * 6. /api/summary either calls Gemini or returns model: 'template' and removes the word 'Kirrak'.
 * 7. /api/live/:id stores and retrieves latest match state for spectators.
 * 8. Mount Vite middlewares in development mode; listen on port 3000.
 */

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Requirement 21: Model name in one constant
const GEMINI_MODEL = 'gemini-3.8-flash';

const hasValidApiKey = Boolean(
  process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' &&
    process.env.GEMINI_API_KEY.trim() !== ''
);

// Gemini client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.use(express.json());

// In-memory live match store for /api/live/:id (Requirement 20)
const liveMatchStore = new Map<string, any>();

// Simple per-IP rate limiter: 30 requests per minute (Requirement 21)
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const ipRateLimits = new Map<string, RateLimitRecord>();

function apiRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  let record = ipRateLimits.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    ipRateLimits.set(ip, record);
    return next();
  }

  if (record.count >= maxRequests) {
    res.status(429).json({
      error: 'Too many requests. Please wait before calling the AI server again.',
    });
    return;
  }

  record.count += 1;
  next();
}

app.use('/api', apiRateLimiter);

// Allowed event types per Requirement 21
const ALLOWED_EVENT_TYPES = new Set([
  'run',
  'wicket',
  'dot',
  'wide',
  'no_ball',
  'bye',
  'leg_bye',
  'retire',
  'new_batter',
  'change_bowler',
  'strike_swap',
  'boundary',
]);

// Allowed story styles per Requirement 21
const ALLOWED_STORY_STYLES = new Set([
  'telugu_commentator',
  'tweet_thread',
  'dramatic_report',
  'roast_mode',
]);

// PARSER_SYSTEM_PROMPT per Requirement 8 & 21
const PARSER_SYSTEM_PROMPT = `
You are Scorecall's cricket speech parser for Indian gully cricket (Telugu, Hindi, and English slang).
Translate the commentator's or scorer's voice transcript into an array of structured cricket events.

CRITICAL RULES:
1. No ball plus runs: Send runsOffBat (e.g. 4 or 6), NEVER a total in runs!
   Example: "no ball four" -> event: "no_ball", runsOffBat: 4 (scorer adds the 1 no-ball penalty automatically).
2. Wides: Extra runs go in runsRun, NEVER in runs.
   Example: "wide" -> event: "wide", runsRun: 0 (scorer adds the 1 wide penalty automatically).
   Example: "wide two" -> event: "wide", runsRun: 2.
3. Multi-event phrases must be split:
   Example: "Ravi hit a four, then got out caught" ->
     Event 1: boundary (runsOffBat: 4, batter: "Ravi")
     Event 2: wicket (dismissal: "caught", dismissedPlayer: "Ravi")
4. Allowed types: dot, run, boundary, wicket, wide, no_ball, bye, leg_bye, retire, new_batter, change_bowler, strike_swap.
5. Runs must be between 0 and 6.
6. Confidence must be between 0.0 and 1.0.
`;

/**
 * Route: POST /api/parse-speech
 */
app.post('/api/parse-speech', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transcript, battingSquad, bowlingSquad } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'Missing transcript' });
      return;
    }

    if (!hasValidApiKey) {
      res.json({
        events: [],
        confidence: 0,
        needsClarification: true,
        source: 'fallback',
      });
      return;
    }

    const prompt = `
Transcript: "${transcript}"
Batting Squad: ${JSON.stringify(battingSquad || [])}
Bowling Squad: ${JSON.stringify(bowlingSquad || [])}
Parse this utterance into cricket events.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: PARSER_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  runs: { type: Type.INTEGER },
                  runsOffBat: { type: Type.INTEGER },
                  runsRun: { type: Type.INTEGER },
                  dismissal: { type: Type.STRING },
                  dismissedPlayer: { type: Type.STRING },
                  batter: { type: Type.STRING },
                  bowler: { type: Type.STRING },
                  newBatter: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
                required: ['type'],
              },
            },
            confidence: { type: Type.NUMBER },
            needsClarification: { type: Type.BOOLEAN },
          },
          required: ['events'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    const rawEvents = parsedJson.events || [];

    // Validation per Requirement 21: allowed event types only, runs 0 to 6, confidence 0 to 1
    const validEvents: any[] = [];
    let isFullyValid = true;

    for (const evt of rawEvents) {
      if (!ALLOWED_EVENT_TYPES.has(evt.type)) {
        isFullyValid = false;
        break;
      }

      const runs = evt.runs ?? evt.runsOffBat ?? evt.runsRun ?? 0;
      if (typeof runs === 'number' && (runs < 0 || runs > 6)) {
        isFullyValid = false;
        break;
      }

      const conf = evt.confidence ?? 0.95;
      if (typeof conf === 'number' && (conf < 0 || conf > 1)) {
        isFullyValid = false;
        break;
      }

      validEvents.push({
        ...evt,
        confidence: Math.min(1, Math.max(0, conf)),
      });
    }

    if (!isFullyValid || validEvents.length === 0) {
      res.json({
        events: [],
        confidence: 0,
        needsClarification: true,
      });
      return;
    }

    res.json({
      events: validEvents,
      confidence: parsedJson.confidence ?? 0.95,
      needsClarification: parsedJson.needsClarification ?? false,
      source: 'gemini',
    });
  } catch (err: any) {
    const status = err?.status ?? err?.code ?? err?.response?.status;
    const message = err?.message || 'Unknown Gemini API error';
    // 503/429 responses are temporary provider/rate-limit failures, not scoring failures.
    // Return an empty parse so the client can use its offline cricket-command matcher.
    if (status === 503 || status === 429 || /UNAVAILABLE|high demand|RESOURCE_EXHAUSTED/i.test(message)) {
      console.warn(`Gemini temporarily unavailable (${status || 'provider error'}); using offline speech matcher.`);
    } else {
      console.warn('Gemini parse error:', message);
    }
    res.json({
      events: [],
      confidence: 0,
      needsClarification: true,
      source: 'fallback',
    });
  }
});

/**
 * Route: POST /api/generate-story
 */
app.post('/api/generate-story', async (req: Request, res: Response): Promise<void> => {
  try {
    const { match, style } = req.body;

    // Requirement 21: Accept only allowed story styles
    if (!style || !ALLOWED_STORY_STYLES.has(style)) {
      res.status(400).json({ error: 'Invalid story style' });
      return;
    }

    if (!hasValidApiKey) {
      const fallback = `${match.teamBatting} battled ${match.teamBowling} in a thrilling street match! Total score: ${match.totalRuns}/${match.wickets}. Match ended with fierce street pride!`;
      res.json({ story: fallback });
      return;
    }

    const styleInstructions: Record<string, string> = {
      telugu_commentator:
        'Deliver electrifying Telugu gully cricket commentary with native hype, Hyderabad/Andhra gully slang, and loud punchlines!',
      tweet_thread:
        'Write a punchy, viral 3-tweet match recap with hashtags and street cricket moments.',
      dramatic_report:
        'Write an epic, cinematic cricket report portraying the street match like a high-stakes championship clash.',
      roast_mode:
        'Write a hilarious, good-natured roast of the match, teasing the dropped catches, wild bowling, and street disputes.',
    };

    const prompt = `
Match Data:
Batting Team: ${match.teamBatting}
Bowling Team: ${match.teamBowling}
Score: ${match.totalRuns}/${match.wickets} in ${match.overs}.${match.ballsInOver} overs
Rules: ${match.rules.totalOvers} overs match
Result: ${match.resultText || 'Match in progress'}
Deliveries Log: ${JSON.stringify(match.balls?.slice(-12) || [])}

Instruction:
${styleInstructions[style]}
Strict Rule: Ensure player names and scores match the data exactly! Do not invent player names not in the squad.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });

    res.json({ story: response.text || '' });
  } catch (err: any) {
    console.warn('Generate story error:', err?.message || err);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

/**
 * Route: GET & POST /api/summary
 * Requirement 21: make /api/summary either call Gemini or return model: "template"
 * and remove the word "Kirrak".
 */
app.post('/api/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { match } = req.body;

    if (!hasValidApiKey) {
      // Template fallback without the word "Kirrak"
      const templateSummary = `${match.teamBatting} scored ${match.totalRuns} runs for ${match.wickets} wickets against ${match.teamBowling}. A high-energy gully cricket showdown.`;
      res.json({
        summary: templateSummary,
        model: 'template',
      });
      return;
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Provide a concise 2-sentence match summary for ${match.teamBatting} (${match.totalRuns}/${match.wickets}) vs ${match.teamBowling}. Do not use the word Kirrak.`,
    });

    const text = (response.text || '').replace(/kirrak/gi, 'super');

    res.json({
      summary: text,
      model: GEMINI_MODEL,
    });
  } catch (err) {
    res.json({
      summary: 'A thrilling street cricket match between two competitive gully sides.',
      model: 'template',
    });
  }
});

/**
 * Route: GET & POST /api/live/:id
 * Stores latest match state and allows spectator clients to poll (Requirement 20)
 */
app.post('/api/live/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  liveMatchStore.set(id, {
    matchState: req.body,
    updatedAt: Date.now(),
  });
  res.json({ success: true });
});

app.get('/api/live/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const data = liveMatchStore.get(id);
  if (!data) {
    res.status(404).json({ error: 'Match not found' });
    return;
  }
  res.json(data);
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Scorecall server running on port ${PORT} using model ${GEMINI_MODEL}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
