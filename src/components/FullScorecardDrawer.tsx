/**
 * Scorecall — Full Scorecard Drawer
 *
 * Requirements:
 * 1. Move ALL hooks above early return (Stage 1).
 * 2. Fall of wickets: reverse to chronological order, keep running team total
 *    using ball.runs only (already includes extras), number wickets 1, 2, 3 in order.
 * 3. Use rules.ballsPerOver for bowler overs and economy (Stage 3).
 * 4. Support viewing 1st innings and 2nd innings.
 */

import React, { useState, useEffect } from 'react';
import { X, Trophy, User, Shield } from 'lucide-react';
import { MatchState } from '../types/cricket';
import { deriveMatchStats } from '../utils/scoringEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: MatchState;
}

export const FullScorecardDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  match,
}) => {
  // Requirement 1: Move every hook above early return
  const [selectedInnings, setSelectedInnings] = useState<1 | 2>(
    match.currentInnings
  );

  useEffect(() => {
    setSelectedInnings(match.currentInnings);
  }, [match.currentInnings]);

  // If not open, return null AFTER hooks
  if (!isOpen) {
    return null;
  }

  // Determine which innings to display
  const showFirstInningsArchive =
    selectedInnings === 1 && match.firstInnings && match.currentInnings === 2;

  const currentDerived = deriveMatchStats(match.balls, match);

  const displayData = showFirstInningsArchive && match.firstInnings
    ? {
        teamBatting: match.firstInnings.teamName,
        teamBowling: match.teamBatting, // original bowling team was current batting team
        totalRuns: match.firstInnings.totalRuns,
        wickets: match.firstInnings.wickets,
        overs: `${match.firstInnings.oversCompleted}.${match.firstInnings.ballsInCurrentOver}`,
        extras: match.firstInnings.extras,
        batters: match.firstInnings.batters,
        bowlers: match.firstInnings.bowlers,
        fallOfWickets: match.firstInnings.fallOfWickets,
      }
    : {
        teamBatting: match.teamBatting,
        teamBowling: match.teamBowling,
        totalRuns: currentDerived.totalRuns,
        wickets: currentDerived.wickets,
        overs: `${currentDerived.overs}.${currentDerived.ballsInOver}`,
        extras: {
          ...currentDerived.extras,
          total:
            currentDerived.extras.wides +
            currentDerived.extras.noBalls +
            currentDerived.extras.byes +
            currentDerived.extras.legByes,
        },
        batters: currentDerived.batters,
        bowlers: currentDerived.bowlers,
        // Requirement 16: chronological order, number wickets 1, 2, 3 in order
        fallOfWickets: currentDerived.fallOfWickets,
      };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[1px]">
      <div className="relative w-full max-w-lg h-full bg-[#F3EFE6] text-[#191C18] border-l-4 border-[#191C18] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-4 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#F59E0B] font-bold">
              Full Match Scorecard
            </div>
            <h2 className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">
              {displayData.teamBatting}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border-2 border-[#191C18]"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Innings Tabs if 2nd innings exists */}
        {match.firstInnings && (
          <div className="flex border-b-2 border-[#191C18] bg-[#E8E2D2]">
            <button
              onClick={() => setSelectedInnings(1)}
              className={`flex-1 py-2 font-['Bebas_Neue'] text-lg tracking-wider text-center transition-colors ${
                selectedInnings === 1
                  ? 'bg-[#D32F1E] text-white'
                  : 'text-[#191C18] hover:bg-[#DDD5C0]'
              }`}
            >
              1st Innings ({match.firstInnings.teamName})
            </button>
            <button
              onClick={() => setSelectedInnings(2)}
              className={`flex-1 py-2 font-['Bebas_Neue'] text-lg tracking-wider text-center transition-colors ${
                selectedInnings === 2
                  ? 'bg-[#D32F1E] text-white'
                  : 'text-[#191C18] hover:bg-[#DDD5C0]'
              }`}
            >
              2nd Innings ({match.teamBatting})
            </button>
          </div>
        )}

        {/* Innings Score Summary Banner */}
        <div className="p-4 bg-[#F59E0B] border-b-2 border-[#191C18] flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#191C18]">
              Innings Score
            </div>
            <div className="font-['Bebas_Neue'] text-4xl text-[#191C18] leading-none">
              {displayData.totalRuns} / {displayData.wickets}
              <span className="text-xl ml-2 font-sans font-bold">
                ({displayData.overs} ov)
              </span>
            </div>
          </div>
          {match.resultText && (
            <div className="bg-[#191C18] text-[#F59E0B] px-3 py-1 text-xs font-bold uppercase tracking-wider border border-[#191C18]">
              {match.resultText}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Batting Table */}
          <div className="border-2 border-[#191C18] bg-white shadow-[2px_2px_0px_#191C18]">
            <div className="bg-[#191C18] text-[#F3EFE6] px-3 py-2 font-['Bebas_Neue'] text-xl tracking-wider flex items-center gap-2">
              <User size={18} className="text-[#F59E0B]" />
              Batting
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-[#191C18] bg-[#F3EFE6] text-xs font-bold uppercase text-[#191C18]">
                    <th className="p-2">Batter</th>
                    <th className="p-2 text-right">R</th>
                    <th className="p-2 text-right">B</th>
                    <th className="p-2 text-right">4s</th>
                    <th className="p-2 text-right">6s</th>
                    <th className="p-2 text-right">SR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#191C18]/20 font-medium">
                  {Object.values(displayData.batters).map((b) => (
                    <tr key={b.name} className="hover:bg-amber-50/50">
                      <td className="p-2">
                        <div className="font-bold text-[#191C18]">{b.name}</div>
                        <div className="text-xs text-[#D32F1E] font-semibold">
                          {b.isRetired
                            ? 'retired'
                            : b.isOut
                            ? `${b.dismissal || 'out'}${b.bowler ? ` b ${b.bowler}` : ''}`
                            : 'not out'}
                        </div>
                      </td>
                      <td className="p-2 text-right font-bold text-base font-['Bebas_Neue']">
                        {b.runs}
                      </td>
                      <td className="p-2 text-right text-xs">{b.balls}</td>
                      <td className="p-2 text-right text-xs">{b.fours}</td>
                      <td className="p-2 text-right text-xs">{b.sixes}</td>
                      <td className="p-2 text-right text-xs">{b.strikeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Extras line */}
            <div className="p-2 bg-[#F3EFE6] border-t-2 border-[#191C18] text-xs font-bold text-[#191C18] flex justify-between">
              <span>Extras (WD {displayData.extras.wides}, NB {displayData.extras.noBalls}, B {displayData.extras.byes}, LB {displayData.extras.legByes})</span>
              <span className="font-['Bebas_Neue'] text-base">{displayData.extras.total}</span>
            </div>
          </div>

          {/* Bowling Table */}
          <div className="border-2 border-[#191C18] bg-white shadow-[2px_2px_0px_#191C18]">
            <div className="bg-[#191C18] text-[#F3EFE6] px-3 py-2 font-['Bebas_Neue'] text-xl tracking-wider flex items-center gap-2">
              <Shield size={18} className="text-[#F59E0B]" />
              Bowling
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-[#191C18] bg-[#F3EFE6] text-xs font-bold uppercase text-[#191C18]">
                    <th className="p-2">Bowler</th>
                    <th className="p-2 text-right">O</th>
                    <th className="p-2 text-right">M</th>
                    <th className="p-2 text-right">R</th>
                    <th className="p-2 text-right">W</th>
                    <th className="p-2 text-right">Dots</th>
                    <th className="p-2 text-right">Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#191C18]/20 font-medium">
                  {Object.values(displayData.bowlers).map((bw) => (
                    <tr key={bw.name} className="hover:bg-amber-50/50">
                      <td className="p-2 font-bold text-[#191C18]">{bw.name}</td>
                      <td className="p-2 text-right font-['Bebas_Neue'] text-base">
                        {bw.overs}
                      </td>
                      <td className="p-2 text-right text-xs">{bw.maidens}</td>
                      <td className="p-2 text-right font-bold text-base font-['Bebas_Neue']">
                        {bw.runs}
                      </td>
                      <td className="p-2 text-right font-bold text-base font-['Bebas_Neue'] text-[#D32F1E]">
                        {bw.wickets}
                      </td>
                      <td className="p-2 text-right text-xs">{bw.dots}</td>
                      <td className="p-2 text-right text-xs">{bw.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fall of Wickets (Requirement 16) */}
          <div className="border-2 border-[#191C18] bg-white shadow-[2px_2px_0px_#191C18] p-3">
            <div className="font-['Bebas_Neue'] text-xl text-[#191C18] mb-2 flex items-center gap-2">
              <Trophy size={18} className="text-[#D32F1E]" />
              Fall of Wickets
            </div>
            {displayData.fallOfWickets.length === 0 ? (
              <p className="text-xs text-stone-500 font-medium italic">
                No wickets fallen yet in this innings.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayData.fallOfWickets.map((fow) => (
                  <div
                    key={fow.wicketNumber}
                    className="border border-[#191C18] bg-[#F3EFE6] px-2 py-1 text-xs"
                  >
                    <span className="font-bold text-[#D32F1E]">
                      {fow.wicketNumber}-{fow.score}
                    </span>{' '}
                    <span className="text-[#191C18]">({fow.batter}, {fow.overs} ov)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
