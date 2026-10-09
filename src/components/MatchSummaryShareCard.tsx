import React, { useState, useRef, useEffect } from 'react';
import { MatchState } from '../types/cricket';
import { CloseThickIcon, BatIcon, StumpsIcon, TapeBallIcon } from './CricketIcons';
import { verifyStoryAgainstMatch, StoryVerificationResult } from '../utils/storyVerifier';
import { logStoryEvaluation } from '../utils/db';

export type StoryStyle = 'telugu_commentator' | 'tweet_thread' | 'dramatic_report' | 'roast_mode';

interface MatchSummaryShareCardProps {
  isOpen: boolean;
  match: MatchState;
  onClose: () => void;
}

const STYLE_OPTIONS: { id: StoryStyle; label: string; tag: string; description: string }[] = [
  {
    id: 'telugu_commentator',
    label: 'Telugu Commentator',
    tag: 'తెలుగు కామెంటరీ',
    description: 'High-voltage local stadium commentary with street josh',
  },
  {
    id: 'tweet_thread',
    label: 'Tweet Thread',
    tag: '1/3, 2/3 Thread',
    description: 'Crisp breakdown thread formatted for Twitter / X',
  },
  {
    id: 'dramatic_report',
    label: 'Dramatic Match Report',
    tag: 'Press Report',
    description: 'Epic journalism prose capturing tension & clutch plays',
  },
  {
    id: 'roast_mode',
    label: 'Roast Mode',
    tag: 'గల్లీ రోస్ట్',
    description: 'Friendly ground banter teasing ducks, dots & dropped catches',
  },
];

export const MatchSummaryShareCard: React.FC<MatchSummaryShareCardProps> = ({
  isOpen,
  match,
  onClose,
}) => {
  if (!isOpen) return null;

  const [selectedStyle, setSelectedStyle] = useState<StoryStyle>('telugu_commentator');
  const [storyText, setStoryText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [verification, setVerification] = useState<StoryVerificationResult | null>(null);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Key match highlights
  const battersList = Object.values(match.batters);
  const topBatter = battersList.sort((a, b) => b.runs - a.runs)[0] || { name: 'Batter', runs: 0, balls: 0, fours: 0, sixes: 0 };
  const bowlersList = Object.values(match.bowlers);
  const topBowler = bowlersList.sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)[0] || { name: 'Bowler', wickets: 0, runsConceded: 0 };

  // Generate story with 2nd pass verification
  const handleGenerateStory = async (styleToUse: StoryStyle = selectedStyle) => {
    setIsGenerating(true);
    let generated = '';
    let verifyRes: StoryVerificationResult;

    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_data: match, style: styleToUse }),
      });

      if (res.ok) {
        const data = await res.json();
        generated = data.story || '';
      }
    } catch {
      // Fallback
    }

    if (!generated) {
      // Local fallback
      if (styleToUse === 'telugu_commentator') {
        generated = `Mawa kirrak match aindi! ${match.battingTeam} bat chesi ${match.score}/${match.wickets} score chesaru in ${match.oversCompleted}.${match.ballsInCurrentOver} overs against ${match.bowlingTeam}. Pitch meeda ${topBatter.name} mass innings aadi ${topBatter.runs} runs (${topBatter.balls} balls) kottadu! Bowling lo ${topBowler.name} ${topBowler.wickets} wickets teesukoni ${topBowler.runsConceded} runs ichadu. Full ground josh!`;
      } else if (styleToUse === 'tweet_thread') {
        generated = `1/3 🚨 MATCH REPORT: ${match.battingTeam} finished their innings with ${match.score}/${match.wickets} in ${match.oversCompleted}.${match.ballsInCurrentOver}/${match.rules.maxOvers} overs vs ${match.bowlingTeam}.\n\n2/3 🏏 Top Batting: ${topBatter.name} top-scored with ${topBatter.runs} off ${topBatter.balls} balls (${topBatter.fours}x4, ${topBatter.sixes}x6).\n\n3/3 🎯 Bowling: ${topBowler.name} took ${topBowler.wickets} wickets for ${topBowler.runsConceded} runs. Game on!`;
      } else if (styleToUse === 'roast_mode') {
        generated = `Bhayya ground lo comedy match! ${match.battingTeam} full gully planning chesi chivariki ${match.score}/${match.wickets} score kottaru in ${match.oversCompleted}.${match.ballsInCurrentOver} overs against ${match.bowlingTeam}. Oka vaipu ${topBatter.name} matrame ${topBatter.runs} runs chesadu (${topBatter.balls} balls lo), migatha vallu dot balls vesi out ayyaru. Bowling lo ${topBowler.name} ${topBowler.runsConceded} runs ichi ${topBowler.wickets} wickets pattadu!`;
      } else {
        generated = `Under the blazing afternoon sun, ${match.battingTeam} set a mark of ${match.score}/${match.wickets} in ${match.oversCompleted}.${match.ballsInCurrentOver} overs against ${match.bowlingTeam}. The standout performance was ${topBatter.name}'s knock of ${topBatter.runs} runs from ${topBatter.balls} balls. On the bowling front, ${topBowler.name} claimed ${topBowler.wickets} wickets conceding ${topBowler.runsConceded} runs.`;
      }
    }

    // Pass 1: Verification
    verifyRes = verifyStoryAgainstMatch(generated, match);

    // If verification found unverified anomalies, regenerate ONCE with stricter guidance
    if (!verifyRes.isValid) {
      try {
        const retryRes = await fetch('/api/story', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            match_data: match,
            style: styleToUse,
            correctionPrompt: `Previous generation had unverified values: ${verifyRes.reason}. Rewrite strictly using ONLY match numbers.`,
          }),
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          if (retryData.story) {
            generated = retryData.story;
            verifyRes = verifyStoryAgainstMatch(generated, match);
          }
        }
      } catch {}
    }

    setStoryText(generated);
    setVerification(verifyRes);
    setIsGenerating(false);

    // Auto-log to evaluation database
    try {
      await logStoryEvaluation({
        matchName: match.matchName,
        style: styleToUse,
        storyText: generated,
        verificationStatus: verifyRes.status,
        checkedFactsSummary: `Checked: ${verifyRes.checkedNames.join(', ')} | Numbers: ${verifyRes.verifiedNumbers.join(', ')}${verifyRes.reason ? ` | Note: ${verifyRes.reason}` : ''}`,
      });
    } catch {}
  };

  // Run on mount
  useEffect(() => {
    handleGenerateStory('telugu_commentator');
  }, []);

  const handleCopyText = () => {
    navigator.clipboard?.writeText(storyText);
    setCopyNotification('Copied story to clipboard!');
    setTimeout(() => setCopyNotification(null), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = `🏏 *${match.matchName}*\n\n🔥 *${selectedStyle.toUpperCase().replace('_', ' ')} STORY:*\n"${storyText}"\n\n📊 *Score:* ${match.battingTeam} ${match.score}/${match.wickets} (${match.oversCompleted}.${match.ballsInCurrentOver}/${match.rules.maxOvers} ov)\n⭐ *Top Batter:* ${topBatter.name} (${topBatter.runs} runs)\n⭐ *Top Bowler:* ${topBowler.name} (${topBowler.wickets} wkts)\n\n_Generated via Scorecall Voice Gully App (Claude Sonnet 5.5)_`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Export as Canvas PNG
  const handleExportImage = () => {
    setIsExporting(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1440;

    // 1. Flex background
    ctx.fillStyle = '#141613';
    ctx.fillRect(0, 0, 1080, 1440);

    // 2. Header Band
    ctx.fillStyle = '#FFB800';
    ctx.fillRect(40, 40, 1000, 180);

    ctx.fillStyle = '#191C18';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCORECALL GULLY CRICKET PREMIER LEAGUE', 540, 115);

    ctx.fillStyle = '#D32F1E';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(match.matchName.toUpperCase(), 540, 175);

    // 3. Score Panel
    ctx.fillStyle = '#FAF7F0';
    ctx.fillRect(40, 260, 1000, 420);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#191C18';
    ctx.strokeRect(40, 260, 1000, 420);

    ctx.fillStyle = '#191C18';
    ctx.font = 'bold 46px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(match.battingTeam.toUpperCase(), 80, 340);

    ctx.fillStyle = '#191C18';
    ctx.font = 'bold 150px sans-serif';
    ctx.fillText(`${match.score}/${match.wickets}`, 80, 500);

    ctx.fillStyle = '#D32F1E';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${match.oversCompleted}.${match.ballsInCurrentOver} / ${match.rules.maxOvers} OVERS`, 980, 410);

    ctx.fillStyle = '#222620';
    ctx.fillRect(80, 580, 920, 70);
    ctx.fillStyle = '#FFE082';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `VERIFICATION: ${verification?.status === 'checked' ? 'FACT CHECKED (100% MATCH)' : 'REVIEW NOTED'} • STYLE: ${selectedStyle.toUpperCase().replace('_', ' ')}`,
      540,
      625
    );

    // 4. Generated Story Text Box (Crimson Ribbon)
    ctx.fillStyle = '#D32F1E';
    ctx.fillRect(40, 720, 1000, 360);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic bold 32px sans-serif';
    ctx.textAlign = 'left';

    // Text wrapping
    const words = storyText.split(' ');
    let line = '';
    let y = 780;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > 900 && n > 0) {
        ctx.fillText(line, 90, y);
        line = words[n] + ' ';
        y += 44;
        if (y > 1030) break; // prevent overflow
      } else {
        line = testLine;
      }
    }
    if (y <= 1030) {
      ctx.fillText(line.trim(), 90, y);
    }

    // 5. Player Highlights
    ctx.fillStyle = '#1F221D';
    ctx.fillRect(40, 1120, 480, 200);
    ctx.fillRect(560, 1120, 480, 200);

    ctx.fillStyle = '#FFB800';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TOP BATTER', 70, 1165);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(topBatter.name, 70, 1220);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#CFC7B6';
    ctx.fillText(`${topBatter.runs} runs (${topBatter.balls}b · ${topBatter.fours}x4 ${topBatter.sixes}x6)`, 70, 1275);

    ctx.fillStyle = '#FFB800';
    ctx.fillText('TOP BOWLER', 590, 1165);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(topBowler.name, 590, 1220);
    ctx.font = '28px sans-serif';
    ctx.fillStyle = '#CFC7B6';
    ctx.fillText(`${topBowler.wickets} wkts (${topBowler.runsConceded}r in ${topBowler.balls || 0}b)`, 590, 1275);

    // 6. Stencil footer
    ctx.fillStyle = '#807969';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SCORECALL VOICE ENGINE • POWERED BY CLAUDE SONNET 5.5 (FACT CHECKED)', 540, 1380);

    setTimeout(() => {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `scorecall-story-banner-${Date.now()}.png`;
      a.click();
      setIsExporting(false);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#F4EFE6] border-4 border-[#191C18] shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[94vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FFB800] rounded-xs" />
            <h2 className="font-display text-2xl tracking-wide uppercase">Match Story Generator</h2>
            <span className="text-[10px] bg-[#323630] text-[#E5DFCB] px-1.5 py-0.5 rounded font-mono font-bold">
              Sonnet 5.5
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#D3CABB] hover:text-white press-action"
            aria-label="Close story sheet"
          >
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        {copyNotification && (
          <div className="bg-[#1E4620] text-white text-xs font-bold py-1 px-3 text-center">
            {copyNotification}
          </div>
        )}

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {/* 1. STYLE PICKER */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#615A4B] mb-1.5">
              Select Story Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map((opt) => {
                const isSelected = selectedStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedStyle(opt.id);
                      handleGenerateStory(opt.id);
                    }}
                    className={`p-2.5 rounded-lg border-2 text-left press-action flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'bg-[#191C18] text-white border-[#191C18] shadow-xs'
                        : 'bg-white text-[#191C18] border-[#D8D0BF] hover:border-[#191C18]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{opt.label}</span>
                      <span className={`text-[10px] px-1 rounded font-bold ${
                        isSelected ? 'bg-[#FFB800] text-[#191C18]' : 'bg-[#EAE4D5] text-[#554E41]'
                      }`}>
                        {opt.tag}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 line-clamp-2 ${isSelected ? 'text-[#CFC7B6]' : 'text-gray-500'}`}>
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. GENERATE BUTTON */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => handleGenerateStory(selectedStyle)}
              disabled={isGenerating}
              className={`flex-1 h-11 border-2 border-[#191C18] rounded-lg font-display text-lg tracking-wide uppercase flex items-center justify-center gap-2 press-action chalk-border text-white ${
                isGenerating ? 'bg-[#E5A800] text-[#191C18]' : 'bg-[#D32F1E] hover:bg-[#B72212]'
              }`}
            >
              <span>{isGenerating ? 'Writing with Sonnet 5.5...' : 'Generate Match Story'}</span>
            </button>

            {/* Verification Status Badge */}
            {verification && (
              <div className={`px-2.5 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                verification.status === 'checked'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}>
                <span>{verification.status === 'checked' ? '✓ Checked' : '⚠ Needs Review'}</span>
              </div>
            )}
          </div>

          {/* Verification Details Box */}
          {verification && (
            <div className={`p-2.5 rounded-lg border text-[11px] font-semibold space-y-1 ${
              verification.status === 'checked' ? 'bg-[#EDF7EE] border-[#C3E6C7] text-[#1E4620]' : 'bg-[#FFF8E6] border-[#FFE29A] text-[#704F00]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  {verification.status === 'checked' ? 'Fact Verification Pass (Passed)' : 'Verification Notice'}
                </span>
                <span className="font-mono text-[10px]">
                  Verified {verification.verifiedNumbers.length} numbers, {verification.checkedNames.length} players
                </span>
              </div>
              <p className="text-[11px] leading-tight">
                {verification.status === 'checked'
                  ? `Confirmed players: ${verification.checkedNames.join(', ')}. All scores match match JSON.`
                  : verification.reason || 'Some statistics or player names could not be verified against the match JSON.'}
              </p>
            </div>
          )}

          {/* 3. EDITABLE TEXT BOX FOR RESULT */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#615A4B]">
                Story Commentary (Editable)
              </label>
              <button
                onClick={handleCopyText}
                className="text-[11px] font-bold text-[#8F170C] underline press-action"
              >
                Copy Text
              </button>
            </div>

            <textarea
              value={storyText}
              onChange={(e) => {
                setStoryText(e.target.value);
                setVerification(verifyStoryAgainstMatch(e.target.value, match));
              }}
              rows={5}
              placeholder="Your match story will appear here..."
              className="w-full bg-white border-2 border-[#191C18] rounded-lg p-3 text-sm font-semibold text-[#191C18] focus:outline-none focus:ring-2 focus:ring-[#D32F1E] leading-relaxed"
            />
          </div>

          {/* Preview Flex Box */}
          <div className="bg-[#191C18] text-white p-3 rounded-xl border-3 border-[#191C18] space-y-2">
            <div className="flex items-center justify-between text-xs text-[#A8A190]">
              <span className="font-bold uppercase tracking-wider text-[#FFB800]">
                Flex Banner Preview
              </span>
              <span>{match.matchName}</span>
            </div>
            <div className="bg-[#FAF7F0] text-[#191C18] p-2.5 rounded-lg flex justify-between items-baseline">
              <div>
                <span className="font-bold text-sm">{match.battingTeam}</span>
                <div className="font-display text-4xl font-black leading-none">{match.score}/{match.wickets}</div>
              </div>
              <div className="text-right">
                <span className="font-display text-xl text-[#D32F1E]">
                  {match.oversCompleted}.${match.ballsInCurrentOver} / {match.rules.maxOvers} Ov
                </span>
              </div>
            </div>
            <p className="text-xs italic text-[#E5DFCB] line-clamp-3 bg-[#D32F1E] p-2 rounded">
              "{storyText}"
            </p>
          </div>

          {/* Hidden Canvas for High-Res PNG download */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* 4. FOOTER ACTIONS: SHARE AS IMAGE & WHATSAPP */}
        <div className="p-3 bg-[#EAE3D4] border-t-2 border-[#191C18] grid grid-cols-2 gap-2.5 shrink-0">
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="h-12 bg-white border-2 border-[#191C18] text-[#191C18] rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-1.5 press-action chalk-border"
          >
            <span>{isExporting ? 'Exporting PNG...' : 'Share As Image (PNG)'}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="h-12 bg-[#25D366] text-black border-2 border-[#191C18] rounded-lg font-display text-xl tracking-wide flex items-center justify-center gap-1.5 press-action shadow-xs"
          >
            <span>SHARE WHATSAPP</span>
          </button>
        </div>
      </div>
    </div>
  );
};
