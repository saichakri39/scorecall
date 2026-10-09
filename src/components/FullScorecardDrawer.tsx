import React, { useState } from 'react';
import { MatchState } from '../types/cricket';
import { CloseThickIcon, BatIcon, StumpsIcon } from './CricketIcons';

interface FullScorecardDrawerProps {
  isOpen: boolean;
  match: MatchState;
  onClose: () => void;
}

export const FullScorecardDrawer: React.FC<FullScorecardDrawerProps> = ({
  isOpen,
  match,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'batting' | 'bowling'>('batting');

  // Compute extras
  const wides = match.allBalls.filter(b => b.type === 'wide').reduce((sum, b) => sum + (b.extras || 1), 0);
  const noBalls = match.allBalls.filter(b => b.type === 'no_ball').reduce((sum, b) => sum + (b.extras || 1), 0);
  const totalExtras = wides + noBalls;

  // Fall of wickets
  const fallOfWickets = match.allBalls
    .filter(b => b.type === 'wicket' || b.wicket)
    .map((b, idx) => ({
      wicketNum: idx + 1,
      scoreAtWicket: match.allBalls.slice(0, match.allBalls.indexOf(b) + 1).reduce((s, curr) => s + curr.runs + curr.extras, 0),
      batter: b.wicket?.outBatter || b.striker,
      over: `${b.overIndex}.${b.ballInOver}`,
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md h-full bg-[#FAF7F0] border-l-4 border-[#191C18] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-4 flex items-center justify-between border-b-2 border-[#191C18] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#D32F1E] rounded-full" />
              <h2 className="font-display text-2xl tracking-wide uppercase">Scorecard</h2>
            </div>
            <p className="text-xs text-[#B5AE9E] uppercase font-semibold mt-0.5">
              {match.battingTeam} · {match.score}/{match.wickets} ({match.oversCompleted}.{match.ballsInCurrentOver} ov)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#D3CABB] hover:text-white press-action rounded"
            aria-label="Close scorecard"
          >
            <CloseThickIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="p-3 bg-[#EAE4D5] border-b-2 border-[#191C18] flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('batting')}
            className={`flex-1 py-2 rounded-lg font-display text-lg tracking-wide border-2 border-[#191C18] press-action flex items-center justify-center gap-1.5 ${
              activeTab === 'batting'
                ? 'bg-[#D32F1E] text-white shadow-xs'
                : 'bg-white text-[#191C18]'
            }`}
          >
            <BatIcon className="w-4 h-4" />
            <span>BATTING INNINGS</span>
          </button>
          <button
            onClick={() => setActiveTab('bowling')}
            className={`flex-1 py-2 rounded-lg font-display text-lg tracking-wide border-2 border-[#191C18] press-action flex items-center justify-center gap-1.5 ${
              activeTab === 'bowling'
                ? 'bg-[#191C18] text-white shadow-xs'
                : 'bg-white text-[#191C18]'
            }`}
          >
            <StumpsIcon className="w-4 h-4" />
            <span>BOWLING FIGURES</span>
          </button>
        </div>

        {/* Content Tab */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {activeTab === 'batting' ? (
            <div className="space-y-4">
              {/* Batting Table */}
              <div className="bg-white border-2 border-[#191C18] rounded-xl overflow-hidden chalk-border">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#191C18] text-[#EBE5D8] font-mono text-[11px] uppercase border-b border-[#191C18]">
                      <th className="p-2.5">Batter</th>
                      <th className="p-2.5 text-center">R</th>
                      <th className="p-2.5 text-center">B</th>
                      <th className="p-2.5 text-center">4s</th>
                      <th className="p-2.5 text-center">6s</th>
                      <th className="p-2.5 text-right">SR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E0D0] font-semibold text-[#191C18]">
                    {Object.values(match.batters).map((b) => {
                      const isStriker = b.name === match.striker;
                      const isNonStriker = b.name === match.nonStriker;
                      const isCurrent = isStriker || isNonStriker;
                      const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : "0";

                      return (
                        <tr key={b.name} className={isCurrent ? "bg-[#FFF9F2]" : ""}>
                          <td className="p-2.5">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-sm">
                                {b.name} {isStriker ? "*" : ""}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#70695B]">
                              {b.isOut ? (b.dismissalInfo || "out") : isCurrent ? "batting" : "yet to bat"}
                            </div>
                          </td>
                          <td className="p-2.5 text-center font-display text-lg text-[#191C18]">{b.runs}</td>
                          <td className="p-2.5 text-center font-mono text-xs">{b.balls}</td>
                          <td className="p-2.5 text-center font-mono text-xs text-[#70695B]">{b.fours}</td>
                          <td className="p-2.5 text-center font-mono text-xs text-[#70695B]">{b.sixes}</td>
                          <td className="p-2.5 text-right font-mono text-xs font-bold text-[#8F170C]">{sr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Extras & Total Summary */}
                <div className="p-2.5 bg-[#F6F2E8] border-t-2 border-[#191C18] space-y-1 text-xs">
                  <div className="flex justify-between text-[#615A4C]">
                    <span>Extras (wd {wides}, nb {noBalls})</span>
                    <span className="font-bold font-mono">{totalExtras}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#191C18] pt-1 border-t border-[#DFD8C9]">
                    <span>Total Score</span>
                    <span className="font-display text-xl leading-none">
                      {match.score}/{match.wickets} ({match.oversCompleted}.{match.ballsInCurrentOver} Ov)
                    </span>
                  </div>
                </div>
              </div>

              {/* Fall of Wickets */}
              <div className="bg-white border-2 border-[#191C18] rounded-xl p-3 chalk-border">
                <h4 className="font-display text-lg tracking-wide uppercase text-[#191C18] mb-2 border-b border-[#E6E0D0] pb-1">
                  Fall of Wickets
                </h4>
                {fallOfWickets.length > 0 ? (
                  <div className="space-y-1.5">
                    {fallOfWickets.map(f => (
                      <div key={f.wicketNum} className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#8F170C]">
                          {f.wicketNum} - {f.scoreAtWicket} ({f.batter})
                        </span>
                        <span className="font-mono text-gray-500">{f.over} ov</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#7A7365] italic">No wickets fallen yet in this innings</p>
                )}
              </div>
            </div>
          ) : (
            /* Bowling Table */
            <div className="bg-white border-2 border-[#191C18] rounded-xl overflow-hidden chalk-border">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#191C18] text-[#EBE5D8] font-mono text-[11px] uppercase border-b border-[#191C18]">
                    <th className="p-2.5">Bowler</th>
                    <th className="p-2.5 text-center">O</th>
                    <th className="p-2.5 text-center">M</th>
                    <th className="p-2.5 text-center">R</th>
                    <th className="p-2.5 text-center">W</th>
                    <th className="p-2.5 text-right">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D0] font-semibold text-[#191C18]">
                  {Object.values(match.bowlers).map((b) => {
                    const isCurrent = b.name === match.bowler;
                    const oversFloat = Math.floor(b.balls / 6) + (b.balls % 6) / 6;
                    const econ = oversFloat > 0 ? (b.runsConceded / oversFloat).toFixed(1) : "0.0";
                    const overDisplay = `${Math.floor(b.balls / 6)}.${b.balls % 6}`;

                    return (
                      <tr key={b.name} className={isCurrent ? "bg-[#FFF9F2]" : ""}>
                        <td className="p-2.5">
                          <span className="font-bold text-sm">
                            {b.name} {isCurrent ? "⚡" : ""}
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono">{overDisplay}</td>
                        <td className="p-2.5 text-center font-mono">{b.maidens}</td>
                        <td className="p-2.5 text-center font-display text-lg text-[#191C18]">{b.runsConceded}</td>
                        <td className="p-2.5 text-center font-display text-xl text-[#D32F1E] font-bold">{b.wickets}</td>
                        <td className="p-2.5 text-right font-mono text-xs font-bold text-[#8F170C]">{econ}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#EAE4D5] border-t-2 border-[#191C18] shrink-0">
          <button
            onClick={onClose}
            className="w-full h-12 bg-[#191C18] text-white rounded-lg font-display text-xl tracking-wide press-action flex items-center justify-center gap-2"
          >
            <span>BACK TO LIVE SCORING (HERO)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
