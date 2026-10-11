# Scorecall — Voice-First Gully Cricket Scorer

Scorecall is a voice-first, ball-by-ball gully cricket scorer built for bright sunlight, one-handed street play, local street rules (last-man-bats, box cricket boundaries, local overs), and multilingual speech calls across Telugu, Hindi, and English.

## Features
- **Voice-First Scoring**: Speak gully cricket calls naturally (e.g. "Ravi hit a four, then got out caught", "wide two", "dot ball", "shunya", "clean bowled").
- **Offline Fast Speech Matcher & Gemini Server AI**: Instant local regex/phonetic parsing with server-side Gemini fallback.
- **Single Source of Truth (`applyBall`)**: All totals, batter figures, bowler figures, fall of wickets, and undo states derive directly from the ball log.
- **Street Keypad**: High-contrast, tactile keypad designed for bright sunlight street play.
- **Full Scorecard & Over Dispute Log**: Chronological fall of wickets, bowler figures (charged runs & wickets strictly verified), and over-by-over delivery dispute logs.
- **2nd Innings Handover**: Automatic innings break, target calculation (+1 run), squad handover, and live required run rate.
- **Scorecall Assistant Bot**: Instant spoken match answers in English, Telugu, and Hindi ("Who is bowling?", "Who is batting?", "How many wickets?", "Partnership", "Run rate").
- **Share & Story Generator**: AI commentary in multiple narrative styles verified against the match scorecard.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Add your Gemini API key in `.env`:
```bash
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Run Development Server
```bash
npm run dev
```
The app will start on `http://localhost:3000`.

### 4. Running the Automated Tests
```bash
npm test
```
Or run directly with `tsx`:
```bash
npx tsx src/utils/scoringEngine.test.ts
npx tsx src/utils/botEngine.test.ts
```
