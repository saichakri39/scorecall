import React, { useState } from 'react';
import { BatIcon, StumpsIcon, TapeBallIcon, MicIcon, CheckThickIcon } from './CricketIcons';

interface LandingPageProps {
  onLaunchScorer: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunchScorer }) => {
  // Interactive Phone Mockup state
  const [mockScore, setMockScore] = useState(38);
  const [mockWickets, setMockWickets] = useState(2);
  const [mockOver, setMockOver] = useState("2.4");
  const [mockStrikerRuns, setMockStrikerRuns] = useState(22);
  const [lastAction, setLastAction] = useState<string>("Ravi 4 kottadu");
  const [previewStyle, setPreviewStyle] = useState<'telugu' | 'tweet'>('telugu');

  const handleSimulateVoice = (phrase: string, runs: number, isWicket: boolean = false) => {
    setLastAction(phrase);
    if (isWicket) {
      setMockWickets(w => w + 1);
    } else {
      setMockScore(s => s + runs);
      setMockStrikerRuns(r => r + runs);
    }
    setMockOver("2.5");
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#191C18] antialiased selection:bg-[#D32F1E] selection:text-white pb-24">
      
      {/* 1. TOP FLEX BANNER NAVBAR */}
      <nav className="bg-[#191C18] text-[#F3EFE6] border-b-4 border-[#191C18] px-4 py-3 sticky top-0 z-40 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#D32F1E] text-white flex items-center justify-center font-display text-2xl font-bold rounded-xs border-2 border-white/20">
              S
            </div>
            <div>
              <span className="font-display text-2xl tracking-wider uppercase text-white block leading-none">
                SCORECALL
              </span>
              <span className="text-[10px] text-[#A69E8D] uppercase font-bold tracking-tight">
                Gully Cricket by Voice · గల్లీ క్రికెట్ స్కోరర్
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onLaunchScorer}
              className="px-4 py-2 bg-[#D32F1E] text-white rounded font-display text-lg tracking-wide uppercase press-action chalk-border"
            >
              Launch Live App
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO: TOURNAMENT BANNER + INTERACTIVE PHONE MOCKUP */}
      <header className="relative border-b-4 border-[#191C18] bg-[#FAF7F0] px-4 py-12 md:py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Tournament Headline */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 bg-[#191C18] text-[#FFB800] px-3 py-1 font-mono text-xs uppercase font-bold rounded-xs">
              <span className="w-2 h-2 rounded-full bg-[#D32F1E] animate-pulse" />
              <span>Voice-First · Offline-First · Local Rules</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl leading-none text-[#191C18] uppercase tracking-tight">
              Score Gully Cricket <br />
              <span className="text-[#D32F1E] underline decoration-4 underline-offset-4">By Speaking.</span> Not Tapping.
            </h1>

            <p className="font-body text-base md:text-lg text-[#474134] font-medium leading-relaxed max-w-xl">
              Just say <span className="font-bold text-[#191C18] bg-[#FFDE6B]/50 px-1">"Ravi hit a four, then got out caught"</span> under blinding midday sun. Scorecall converts Tanglish, Hinglish, and regional speech into live ball-by-ball scorecards, partnership stats, and match flex cards.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onLaunchScorer}
                className="h-14 px-8 bg-[#D32F1E] text-white font-display text-2xl tracking-wide uppercase rounded-lg press-action chalk-border-thick flex items-center gap-2"
              >
                <span>Open Scorecall Live</span>
                <span className="text-xl">➔</span>
              </button>
              <div className="text-xs text-[#6A6353] font-semibold">
                No sign-up required · Works 100% offline
              </div>
            </div>
          </div>

          {/* Right: Interactive Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] bg-[#191C18] p-3 rounded-2xl shadow-2xl border-4 border-[#191C18]">
              {/* Phone Speaker Notch */}
              <div className="w-24 h-4 bg-[#282C25] rounded-full mx-auto mb-3" />

              {/* Screen Mockup */}
              <div className="bg-[#FAF7F0] rounded-xl overflow-hidden border-2 border-white/20 p-3 space-y-3">
                {/* Scoreboard */}
                <div className="bg-[#191C18] text-white p-3 rounded-lg text-center relative overflow-hidden">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    GULLY TIGERS · INNINGS 1
                  </div>
                  <div className="font-display text-6xl font-black text-white leading-none my-1">
                    {mockScore}<span className="text-[#D32F1E]">/{mockWickets}</span>
                  </div>
                  <div className="text-xs font-mono text-[#FFB800]">
                    {mockOver} / 4 Overs · CRR: 9.1
                  </div>
                </div>

                {/* Batter on pitch */}
                <div className="bg-white border-2 border-[#191C18] p-2 rounded flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold">Ravi * (Striker)</span>
                    <span className="block text-[10px] text-gray-500">{mockStrikerRuns} runs (10 balls)</span>
                  </div>
                  <span className="text-[10px] bg-[#D32F1E] text-white font-bold px-1 py-0.5 rounded">STRIKE</span>
                </div>

                {/* Speech Simulation Box */}
                <div className="bg-[#FAF0D9] border border-[#E0BD62] p-2 rounded space-y-1.5 text-center">
                  <span className="text-[10px] font-bold uppercase text-[#6D4C00] block">
                    Interactive Demo: Tap to speak a line
                  </span>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-semibold">
                    <button
                      onClick={() => handleSimulateVoice("Ravi sixer kottadu!", 6)}
                      className="p-1 bg-white border border-[#C5A23E] rounded press-action text-left"
                    >
                      "Ravi sixer kottadu!" (+6)
                    </button>
                    <button
                      onClick={() => handleSimulateVoice("Ravi four kottadu", 4)}
                      className="p-1 bg-white border border-[#C5A23E] rounded press-action text-left"
                    >
                      "Ravi four kottadu" (+4)
                    </button>
                    <button
                      onClick={() => handleSimulateVoice("Out! 1-pitch catch", 0, true)}
                      className="p-1 bg-white border border-[#C5A23E] rounded press-action text-left text-red-700"
                    >
                      "Out! 1-pitch catch" (W)
                    </button>
                    <button
                      onClick={() => handleSimulateVoice("Dot ball, zero run", 0)}
                      className="p-1 bg-white border border-[#C5A23E] rounded press-action text-left"
                    >
                      "Dot ball, zero run" (•)
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-center font-mono text-gray-600 bg-[#E8E2D3] p-1 rounded">
                  Last Voice Event: <b>"{lastAction}"</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. PROCESS STRIP: Speak > Understand > Confirm > Scorecard > Story */}
      <section className="bg-[#191C18] text-white py-6 border-b-4 border-[#191C18] px-4 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-center min-w-[680px]">
          <div className="flex-1 p-2 bg-[#262A24] border border-[#3E453A] rounded">
            <span className="font-display text-xl text-[#FFB800] block">01. SPEAK</span>
            <span className="text-[11px] text-gray-300">Telugu / Hindi / English</span>
          </div>
          <span className="text-xl font-bold text-gray-500">➔</span>
          <div className="flex-1 p-2 bg-[#262A24] border border-[#3E453A] rounded">
            <span className="font-display text-xl text-[#FFB800] block">02. PARSE</span>
            <span className="text-[11px] text-gray-300">Claude Haiku / Offline</span>
          </div>
          <span className="text-xl font-bold text-gray-500">➔</span>
          <div className="flex-1 p-2 bg-[#262A24] border border-[#3E453A] rounded">
            <span className="font-display text-xl text-[#FFB800] block">03. CONFIRM</span>
            <span className="text-[11px] text-gray-300">1-Tap "Pakka" verify</span>
          </div>
          <span className="text-xl font-bold text-gray-500">➔</span>
          <div className="flex-1 p-2 bg-[#262A24] border border-[#3E453A] rounded">
            <span className="font-display text-xl text-[#FFB800] block">04. SCORECARD</span>
            <span className="text-[11px] text-gray-300">Ball-by-ball & figures</span>
          </div>
          <span className="text-xl font-bold text-gray-500">➔</span>
          <div className="flex-1 p-2 bg-[#D32F1E] border border-white/20 rounded">
            <span className="font-display text-xl text-white block">05. STORY</span>
            <span className="text-[11px] text-white/90">WhatsApp flex banner</span>
          </div>
        </div>
      </section>

      {/* 4. BEFORE / AFTER: Paper Scorebook vs Scorecall */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-[#191C18]">
            Paper Scorebook vs Scorecall
          </h2>
          <p className="text-sm font-semibold text-[#554F42]">
            Why gully cricket needs voice intelligence on the street
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* The Old Paper Way */}
          <div className="bg-[#EBE5D8] border-3 border-[#A69E8D] p-5 rounded-xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b-2 border-[#C5BDAE] pb-2">
              <span className="font-display text-2xl text-red-800 uppercase">Old Paper Scorebook</span>
              <span className="text-xs font-mono font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">Friction</span>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-[#4F493B]">
              <li>✗ Lost pencils, torn ruled notebooks, and sweat smudges under 38°C sun.</li>
              <li>✗ "Did Suresh face 3 balls or 4?" — endless shouting matches at the end of every over.</li>
              <li>✗ Scorer misses half the match doing manual addition while fielding.</li>
              <li>✗ Zero record once the match is over; disappears into an old pocket.</li>
            </ul>
          </div>

          {/* The Scorecall Way */}
          <div className="bg-white border-3 border-[#191C18] chalk-border-thick p-5 rounded-xl space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b-2 border-[#191C18] pb-2">
              <span className="font-display text-2xl text-[#1E4620] uppercase">Scorecall Voice Scorer</span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">Ground Native</span>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-[#191C18]">
              <li>✓ Just speak with one hand: "Ravi four kottadu, next ball out".</li>
              <li>✓ Dispute Button replays the exact voice transcript and balls of the last over.</li>
              <li>✓ Voice Audio Read-Back announces each score so everyone on the ground hears it.</li>
              <li>✓ Exports high-resolution WhatsApp Flex Banners with LLM commentary stories.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. STORY GENERATOR PREVIEW IN TWO STYLES */}
      <section className="bg-[#FAF7F0] border-y-4 border-[#191C18] py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-4xl uppercase tracking-tight text-[#191C18]">
                Match Story Generator
              </h2>
              <p className="text-xs font-bold text-gray-600">
                Powered by Claude Sonnet 5.5 with 100% strict fact-verification
              </p>
            </div>

            {/* Style switcher */}
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewStyle('telugu')}
                className={`px-3 py-1.5 rounded font-display text-sm uppercase border-2 border-[#191C18] press-action ${
                  previewStyle === 'telugu' ? 'bg-[#D32F1E] text-white' : 'bg-white text-[#191C18]'
                }`}
              >
                Telugu Commentator
              </button>
              <button
                onClick={() => setPreviewStyle('tweet')}
                className={`px-3 py-1.5 rounded font-display text-sm uppercase border-2 border-[#191C18] press-action ${
                  previewStyle === 'tweet' ? 'bg-[#191C18] text-white' : 'bg-white text-[#191C18]'
                }`}
              >
                Tweet Thread
              </button>
            </div>
          </div>

          {/* Story Quote Card */}
          <div className="bg-[#191C18] text-white p-5 rounded-xl border-3 border-[#191C18] shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#FFB800] uppercase tracking-wider font-mono">
                {previewStyle === 'telugu' ? 'తెలుగు కామెంటరీ (TELUGU JOSH)' : 'X / TWITTER THREAD (1/3, 2/3)'}
              </span>
              <span className="text-[11px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
                ✓ Checked (100% Fact Match)
              </span>
            </div>

            <p className="font-body text-base md:text-lg italic text-[#FAF7F0] leading-relaxed bg-[#262A24] p-4 rounded border border-[#3E453A]">
              {previewStyle === 'telugu' ? (
                `"Mawa kirrak match aindi! Gully Tigers bat chesi 38/2 score chesaru in 2.4 overs against Terrace Kings. Pitch meeda Ravi mass batting aadi 22 runs (10 balls, 2 fours, 1 six) kottadu! Bowling lo Kiran 2 wickets teesukoni 14 runs ichadu. Full ground josh!"`
              ) : (
                `"1/3 🚨 MATCH REPORT: Gully Tigers completed their innings scoring 38/2 in 2.4/4 overs against Terrace Kings.\n\n2/3 🏏 Top Batting: Ravi top-scored with 22 off 10 balls (2x4, 1x6).\n\n3/3 🎯 Bowling: Kiran led the attack claiming 2 wickets for 14 runs."`
              )}
            </p>
          </div>
        </div>
      </section>

      {/* 6. LANGUAGES & RULE PRESETS */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-6">
        <h2 className="font-display text-4xl uppercase tracking-tight text-[#191C18] text-center">
          Languages & Gully Rule Presets
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border-3 border-[#191C18] chalk-border p-4 rounded-xl space-y-2">
            <span className="font-display text-2xl uppercase text-[#D32F1E] block">Street Preset</span>
            <p className="text-xs text-gray-600 font-semibold">Standard neighborhood road match</p>
            <ul className="text-xs font-semibold space-y-1 text-[#191C18] pt-2 border-t border-gray-200">
              <li>✓ 1-Pitch Catch (One-Bounce Catch Out) ON</li>
              <li>✓ No LBW strictly enforced</li>
              <li>✓ Wall-touch = 2 Runs (Godha)</li>
              <li>✓ Last-Man-Bats supported</li>
            </ul>
          </div>

          <div className="bg-white border-3 border-[#191C18] chalk-border p-4 rounded-xl space-y-2">
            <span className="font-display text-2xl uppercase text-[#191C18] block">Terrace Preset</span>
            <p className="text-xs text-gray-600 font-semibold">Rooftop play with tight boundary rules</p>
            <ul className="text-xs font-semibold space-y-1 text-[#191C18] pt-2 border-t border-gray-200">
              <li>✓ Tip-and-Run mandatory</li>
              <li>✓ Direct ball over parapet = OUT</li>
              <li>✓ 3-4 Over short sprints</li>
              <li>✓ Single bowler 2 over cap</li>
            </ul>
          </div>

          <div className="bg-white border-3 border-[#191C18] chalk-border p-4 rounded-xl space-y-2">
            <span className="font-display text-2xl uppercase text-[#D32F1E] block">Box Cricket Preset</span>
            <p className="text-xs text-gray-600 font-semibold">Turf net box tournament laws</p>
            <ul className="text-xs font-semibold space-y-1 text-[#191C18] pt-2 border-t border-gray-200">
              <li>✓ Net rebounds in play</li>
              <li>✓ 6 Over standard innings</li>
              <li>✓ Re-ball on wides</li>
              <li>✓ Fall of wickets tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. PROJECT EVALUATION RESULTS TABLE (EMPTY CELLS TO FILL AFTER TESTING) */}
      <section className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <div className="border-b-2 border-[#191C18] pb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="font-display text-3xl uppercase tracking-tight text-[#191C18]">
              Model Evaluation & Benchmarking Sheet
            </h2>
            <p className="text-xs font-semibold text-gray-600">
              Fill these empty rows during field testing to calculate speech parsing accuracy for your report.
            </p>
          </div>
          <span className="text-xs font-mono bg-[#191C18] text-white px-2 py-1 rounded">
            Report Template v1.0
          </span>
        </div>

        <div className="bg-white border-3 border-[#191C18] rounded-xl overflow-x-auto chalk-border">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#191C18] text-[#EFE8D8] font-mono text-[11px] uppercase">
                <th className="p-3 border-r border-[#3E423B]">Test #</th>
                <th className="p-3 border-r border-[#3E423B]">Spoken Input (Audio / Transcript)</th>
                <th className="p-3 border-r border-[#3E423B]">Ground Truth Events</th>
                <th className="p-3 border-r border-[#3E423B]">Parsed Output JSON</th>
                <th className="p-3 border-r border-[#3E423B]">Fact Check Status</th>
                <th className="p-3 text-center">Accuracy (✓/✗)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0D8C8] text-[#191C18] font-mono text-[11px]">
              <tr>
                <td className="p-3 font-bold bg-[#FAF7F0] border-r">01 (Example)</td>
                <td className="p-3 border-r">"Ravi hit a four, then got out caught"</td>
                <td className="p-3 border-r">4 runs (Ravi), Wicket (caught)</td>
                <td className="p-3 border-r">{"{ runs: 4, wicket: 'caught' }"}</td>
                <td className="p-3 border-r text-emerald-800 font-bold">Passed (100%)</td>
                <td className="p-3 text-center text-emerald-700 font-black">✓ Match</td>
              </tr>
              {/* Empty rows ready for student / researcher testing */}
              {[2, 3, 4, 5, 6, 7].map((num) => (
                <tr key={num} className="h-12 hover:bg-amber-50/50">
                  <td className="p-3 font-bold bg-[#FAF7F0] border-r">{num < 10 ? `0${num}` : num}</td>
                  <td className="p-3 border-r text-gray-400 italic font-sans">[Empty — Speak commentary on ground]</td>
                  <td className="p-3 border-r text-gray-400 italic font-sans">[Empty — Actual ground event]</td>
                  <td className="p-3 border-r text-gray-400 italic">[Empty — Model response]</td>
                  <td className="p-3 border-r text-gray-400 italic font-sans">[Checked / Needs review]</td>
                  <td className="p-3 text-center text-gray-400">[ _ ]</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 8. FOOTER STENCIL */}
      <footer className="max-w-6xl mx-auto px-4 pt-10 text-center text-xs text-[#6B6353] border-t-2 border-[#D5CEBC] space-y-2">
        <p className="font-bold uppercase tracking-wider text-[#191C18]">
          SCORECALL — VOICE GULLY CRICKET SCORER
        </p>
        <p>Built for harsh sunlight, street noise, patchy internet, and high-energy tape ball matches.</p>
      </footer>
    </div>
  );
};
