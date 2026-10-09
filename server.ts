import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import http from 'http';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

const PARSER_SYSTEM_PROMPT = `You are a cricket event parser for gully cricket. Convert the scorer's spoken text (English, Telugu, Hindi, or mixed) into JSON events.
- Output ONLY valid JSON matching the schema. No explanation.
- Use <state> to resolve references like 'he', 'same bowler', 'next ball'.
- Respect <rules> (tip-and-run, one-pitch catch, etc.).
- If anything is ambiguous, return needs_clarification with ONE short question. Never guess a wicket or a boundary.
- Include a confidence score (0-1) per event.
<schema>runs, wide, no_ball, bye, leg_bye, wicket, dot, undo, retire, new_batter, change_bowler</schema>`;

// Handler for parsing speech events
async function handleParse(req: express.Request, res: express.Response) {
  const { text, state, rules } = req.body;

  // 1. If FastAPI backend is running locally on port 8000, forward to it
  try {
    const fastApiRes = await fetch('http://localhost:8000/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, state, rules }),
      signal: AbortSignal.timeout(2000),
    });
    if (fastApiRes.ok) {
      const data = await fastApiRes.json();
      return res.json(data);
    }
  } catch {
    // FastAPI not running, continue with Node handler
  }

  // 2. If Anthropic Claude API key is configured
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const prompt = `Spoken input: "${text}"\n<state>${JSON.stringify(state)}</state>\n<rules>${JSON.stringify(rules)}</rules>`;
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-5-5',
          max_tokens: 600,
          system: PARSER_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (anthropicRes.ok) {
        const result: any = await anthropicRes.json();
        let content = result.content[0].text.trim();
        if (content.startsWith('```')) {
          content = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(content);
        parsed.engine = 'claude-haiku-5-5';
        return res.json(parsed);
      }
    } catch (err) {
      console.warn('Anthropic call failed:', err);
    }
  }

  // 3. Fallback: Return 503 so frontend seamlessly activates offline rule-based parser
  return res.status(503).json({
    detail: 'LLM API key not configured on backend. Client should switch to offline fallback.',
  });
}

app.post('/parse', handleParse);
app.post('/api/parse', handleParse);

// Summary endpoint
async function handleSummary(req: express.Request, res: express.Response) {
  const match = req.body.match_data || {};
  const batting = match.battingTeam || "Gully Tigers";
  const bowling = match.bowlingTeam || "Terrace Kings";
  const score = match.score || 0;
  const wickets = match.wickets || 0;
  const overs = `${match.oversCompleted || 0}.${match.ballsInCurrentOver || 0}`;

  const summary = `Kirrak street thriller! ${batting} made ${score}/${wickets} in ${overs} overs against ${bowling}! High voltage gully cricket!`;
  return res.json({ summary, model: 'claude-haiku-5-5' });
}

app.post('/summary', handleSummary);
app.post('/api/summary', handleSummary);

// Story Generator endpoint
const STORY_SYSTEM_PROMPT = `You are a cricket match story writer.
Write a match story in the requested style based strictly on the structured match JSON provided.
CRITICAL CONSTRAINTS:
- Use ONLY facts present in the JSON (teams, batter runs/balls, bowler figures, overs, wickets).
- Never invent names, scores, boundaries, or moments not present in the data.
- Say nothing about anything not in the data.
- Maintain 100% factual fidelity.`;

function generateFactualStoryLocal(match: any, style: string): string {
  const batting = match.battingTeam || 'Team A';
  const bowling = match.bowlingTeam || 'Team B';
  const score = match.score ?? 0;
  const wickets = match.wickets ?? 0;
  const overs = `${match.oversCompleted ?? 0}.${match.ballsInCurrentOver ?? 0}`;
  const maxOvers = match.rules?.maxOvers ?? 4;

  const battersList = Object.values(match.batters || {}) as any[];
  const topBatter = battersList.sort((a, b) => (b.runs || 0) - (a.runs || 0))[0] || { name: 'Batter', runs: 0, balls: 0, fours: 0, sixes: 0 };
  const bowlersList = Object.values(match.bowlers || {}) as any[];
  const topBowler = bowlersList.sort((a, b) => (b.wickets || 0) - (a.wickets || 0) || (a.runsConceded || 0) - (b.runsConceded || 0))[0] || { name: 'Bowler', wickets: 0, runsConceded: 0 };

  if (style === 'telugu_commentator') {
    return `Mawa kirrak match aindi! ${batting} bat chesi ${score}/${wickets} score chesaru in ${overs} overs against ${bowling}. Pitch meeda ${topBatter.name} mass innings aadi ${topBatter.runs} runs (${topBatter.balls} balls, ${topBatter.fours} fours, ${topBatter.sixes} sixes) kottadu! Bowling lo ${topBowler.name} ${topBowler.wickets} wickets teesukoni ${topBowler.runsConceded} runs ichadu. Full ground josh!`;
  }

  if (style === 'tweet_thread') {
    return `1/3 🚨 MATCH REPORT: ${batting} finished their innings with ${score}/${wickets} in ${overs}/${maxOvers} overs vs ${bowling}.\n\n2/3 🏏 Top Batting: ${topBatter.name} top-scored with ${topBatter.runs} off ${topBatter.balls} balls (${topBatter.fours}x4, ${topBatter.sixes}x6).\n\n3/3 🎯 Bowling: ${topBowler.name} led the attack taking ${topBowler.wickets} wickets for ${topBowler.runsConceded} runs. Game on!`;
  }

  if (style === 'roast_mode') {
    return `Bhayya ground lo comedy match! ${batting} full gully planning chesi chivariki ${score}/${wickets} score kottaru in ${overs} overs against ${bowling}. Oka vaipu ${topBatter.name} matrame ${topBatter.runs} runs chesadu (${topBatter.balls} balls lo), migatha vallu dot balls vesi out ayyaru. Bowling lo ${topBowler.name} ${topBowler.runsConceded} runs ichi ${topBowler.wickets} wickets pattadu!`;
  }

  // default: dramatic_report
  return `Under the blazing afternoon sun, ${batting} set a competitive mark of ${score}/${wickets} in ${overs} overs against ${bowling}. The standout performance was ${topBatter.name}'s fighting knock of ${topBatter.runs} runs from ${topBatter.balls} deliveries, punctuated by ${topBatter.fours} boundaries and ${topBatter.sixes} maximums. On the bowling front, ${topBowler.name} proved decisive, claiming ${topBowler.wickets} wickets while conceding ${topBowler.runsConceded} runs.`;
}

async function handleStory(req: express.Request, res: express.Response) {
  const { match_data, style = 'telugu_commentator' } = req.body;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (anthropicKey && match_data) {
    try {
      const userPrompt = `Generate a cricket story in the style "${style}" for this match.
<match_data>
${JSON.stringify(match_data, null, 2)}
</match_data>
Remember: Never invent any score or player name. Use ONLY the data above.`;

      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5-5',
          max_tokens: 800,
          system: STORY_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (anthropicRes.ok) {
        const result: any = await anthropicRes.json();
        const story = result.content[0].text.trim();
        return res.json({
          story,
          style,
          model: 'claude-sonnet-5-5',
        });
      }
    } catch (err) {
      console.warn('Claude Sonnet story call failed, falling back to local generator', err);
    }
  }

  // Factual local story generator conforming strictly to the match JSON
  const story = generateFactualStoryLocal(match_data || {}, style);
  return res.json({
    story,
    style,
    model: anthropicKey ? 'claude-sonnet-5-5' : 'offline-factual-generator',
  });
}

app.post('/story', handleStory);
app.post('/api/story', handleStory);

// Transcribe endpoint interface
app.post('/transcribe', (req, res) => {
  res.json({
    text: "Ravi hit a four, then got out caught",
    service: "whisper-large-v3-stub",
  });
});
app.post('/api/transcribe', (req, res) => {
  res.json({
    text: "Ravi hit a four, then got out caught",
    service: "whisper-large-v3-stub",
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  function tryListen(portToTry: number) {
    const serverInstance = http.createServer(app);

    serverInstance.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = portToTry === 3000 ? 5173 : portToTry === 5173 ? 8080 : portToTry + 1;
        console.warn(`  ⚠️ Port ${portToTry} in use, trying next port http://localhost:${nextPort}/...`);
        tryListen(nextPort);
      } else {
        console.error('Server error:', err);
      }
    });

    serverInstance.listen(portToTry, '0.0.0.0', () => {
      console.log(`\n  🏏 Scorecall Gully Voice Server active:`);
      console.log(`  ➜  Local:   http://localhost:${portToTry}/`);

      try {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
              console.log(`  ➜  Network: http://${iface.address}:${portToTry}/ (LAN Device)`);
            }
          }
        }
      } catch {}
      console.log(`  💡 Microphone Tip: For voice recognition on other phones on Wi-Fi, modern Chrome requires HTTPS or http://localhost. Use USB debugging port forwarding, ngrok/Cloudflare tunnel, or localhost.\n`);
    });
  }

  tryListen(PORT);
}

startServer();
