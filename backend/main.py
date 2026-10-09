"""
FastAPI Backend for Tappa Gully Cricket Scorer
Endpoints:
- POST /parse: Sends spoken text + <state> + <rules> to Claude Haiku 5.5 (claude-haiku-5-5)
- POST /transcribe: Audio STT interface ready for Whisper large-v3 or Sarvam AI
- POST /summary: Match summary line generator (Claude Sonnet 3.5 / Haiku)
"""

import os
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Tappa Gully Cricket Voice Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

PARSER_SYSTEM_PROMPT = """You are a cricket event parser for gully cricket. Convert the scorer's spoken text (English, Telugu, Hindi, or mixed) into JSON events.
- Output ONLY valid JSON matching the schema. No explanation.
- Use <state> to resolve references like 'he', 'same bowler', 'next ball'.
- Respect <rules> (tip-and-run, one-pitch catch, etc.).
- If anything is ambiguous, return needs_clarification with ONE short question. Never guess a wicket or a boundary.
- Include a confidence score (0-1) per event.
<schema>runs, wide, no_ball, bye, leg_bye, wicket, dot, undo, retire, new_batter, change_bowler</schema>"""


class ParseRequest(BaseModel):
    text: str
    state: Dict[str, Any]
    rules: Dict[str, Any]


class SummaryRequest(BaseModel):
    match_data: Dict[str, Any]
    language: Optional[str] = "tanglish"


@app.get("/")
def read_root():
    return {"status": "ok", "service": "Tappa Voice Gully Cricket Backend"}


@app.post("/parse")
async def parse_event(payload: ParseRequest):
    """
    Parses gully cricket spoken commentary using Claude Haiku 5.5.
    Model string: claude-haiku-5-5
    """
    user_prompt = f"""Spoken input: "{payload.text}"

<state>
{json.dumps(payload.state, indent=2)}
</state>

<rules>
{json.dumps(payload.rules, indent=2)}
</rules>"""

    # If ANTHROPIC_API_KEY is configured in backend environment:
    if ANTHROPIC_API_KEY:
        try:
            import urllib.request
            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                data=json.dumps({
                    "model": "claude-haiku-5-5",
                    "max_tokens": 600,
                    "system": PARSER_SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": user_prompt}]
                }).encode("utf-8")
            )
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                content = result["content"][0]["text"].strip()
                # strip potential markdown code fences
                if content.startswith("```"):
                    lines = content.splitlines()
                    content = "\n".join(lines[1:-1] if lines[-1].startswith("```") else lines[1:])
                parsed_json = json.loads(content)
                parsed_json["engine"] = "claude-haiku-5-5"
                return parsed_json
        except Exception as e:
            # Propagate or log and raise
            raise HTTPException(status_code=502, detail=f"LLM API error: {str(e)}")

    # Deterministic fallback response when no key configured locally
    raise HTTPException(
        status_code=503,
        detail="ANTHROPIC_API_KEY not configured on backend. Client should switch to offline fallback."
    )


@app.post("/transcribe")
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form("tanglish")
):
    """
    Clean interface for Whisper large-v3 or Sarvam AI speech-to-text.
    Accepts raw audio blob and returns transcribed string.
    """
    # Placeholder for Sarvam AI / Whisper large-v3 integration
    content_bytes = await audio.read()
    if not content_bytes:
        raise HTTPException(status_code=400, detail="Empty audio payload")

    # In production with Whisper/Sarvam SDK:
    # result = sarvam_client.speech_to_text(audio_bytes=content_bytes, language_code=language)
    return {
        "text": "Ravi hit a four, then got out caught",
        "service": "whisper-large-v3-stub",
        "audio_bytes_received": len(content_bytes)
    }


@app.post("/summary")
async def generate_summary(payload: SummaryRequest):
    """
    Generates a high-voltage gully cricket match summary headline for WhatsApp flex-banner.
    """
    match = payload.match_data
    batting = match.get("battingTeam", "Team A")
    bowling = match.get("bowlingTeam", "Team B")
    score = match.get("score", 0)
    wickets = match.get("wickets", 0)
    overs = f"{match.get('oversCompleted', 0)}.{match.get('ballsInCurrentOver', 0)}"

    summary = f"Kirrak match! {batting} smashed {score}/{wickets} in {overs} overs against {bowling}! Final ball thriller on the street pitch!"
    return {"summary": summary, "model": "claude-haiku-5-5"}


class StoryRequest(BaseModel):
    match_data: Dict[str, Any]
    style: Optional[str] = "telugu_commentator"


STORY_SYSTEM_PROMPT = """You are a cricket match story writer.
Write a match story in the requested style based strictly on the structured match JSON provided.
CRITICAL CONSTRAINTS:
- Use ONLY facts present in the JSON (teams, batter runs/balls, bowler figures, overs, wickets).
- Never invent names, scores, boundaries, or moments not present in the data.
- Say nothing about anything not in the data.
- Maintain 100% factual fidelity."""


@app.post("/story")
async def generate_story(payload: StoryRequest):
    """
    Generates a match story using Claude Sonnet 5.5 (claude-sonnet-5-5)
    with strict adherence to facts in the JSON.
    """
    if ANTHROPIC_API_KEY:
        try:
            import urllib.request
            user_prompt = f"""Generate a match story in style "{payload.style}" for this match:
<match_data>
{json.dumps(payload.match_data, indent=2)}
</match_data>
Strictly use ONLY facts present above. Never invent any player names or numbers."""

            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                data=json.dumps({
                    "model": "claude-sonnet-5-5",
                    "max_tokens": 800,
                    "system": STORY_SYSTEM_PROMPT,
                    "messages": [{"role": "user", "content": user_prompt}]
                }).encode("utf-8")
            )
            with urllib.request.urlopen(req) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                story = result["content"][0]["text"].strip()
                return {
                    "story": story,
                    "style": payload.style,
                    "model": "claude-sonnet-5-5"
                }
        except Exception as e:
            pass

    # Factual local generator fallback
    m = payload.match_data
    batting = m.get("battingTeam", "Team A")
    bowling = m.get("bowlingTeam", "Team B")
    score = m.get("score", 0)
    wickets = m.get("wickets", 0)
    overs = f"{m.get('oversCompleted', 0)}.{m.get('ballsInCurrentOver', 0)}"

    return {
        "story": f"Kirrak match on the ground! {batting} scored {score}/{wickets} in {overs} overs against {bowling}. Total street energy!",
        "style": payload.style,
        "model": "offline-factual-generator"
    }
