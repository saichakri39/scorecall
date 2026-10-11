/**
 * Scorecall — Match History & Leaderboard Modal
 * Shows past saved matches, player statistics, and match export.
 */

import React, { useState } from 'react';
import { X, Trophy, Download, Calendar, Users } from 'lucide-react';
import { SavedMatchSummary } from '../types/cricket';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  savedMatches: SavedMatchSummary[];
  onLoadMatch?: (matchSummary: SavedMatchSummary) => void;
}

export const MatchHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  savedMatches,
  onLoadMatch,
}) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'leaderboard'>('matches');

  if (!isOpen) return null;

  // Derive player stats across all saved matches
  const playerStats: Record<
    string,
    { runs: number; wickets: number; matches: number }
  > = {};

  for (const m of savedMatches) {
    const s = m.matchState;
    if (!s) continue;
    for (const p of s.battingSquad) {
      if (!playerStats[p]) playerStats[p] = { runs: 0, wickets: 0, matches: 0 };
      playerStats[p].matches += 1;
    }
    for (const p of s.bowlingSquad) {
      if (!playerStats[p]) playerStats[p] = { runs: 0, wickets: 0, matches: 0 };
      playerStats[p].matches += 1;
    }
    for (const b of s.balls) {
      if (b.striker && playerStats[b.striker]) {
        playerStats[b.striker].runs += b.batterRuns;
      }
      if (b.bowler && playerStats[b.bowler] && b.isWicket && b.dismissalType !== 'run_out') {
        playerStats[b.bowler].wickets += 1;
      }
    }
  }

  const exportMatchJson = (m: SavedMatchSummary) => {
    const jsonStr = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(m.matchState, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `scorecall_${m.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-[#F59E0B]" />
            <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
              Gully Archives & Stats
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-[#191C18] bg-[#E8E2D2]">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 py-2 font-['Bebas_Neue'] text-lg tracking-wider text-center transition-colors ${
              activeTab === 'matches'
                ? 'bg-[#D32F1E] text-white'
                : 'text-[#191C18] hover:bg-[#DDD5C0]'
            }`}
          >
            Saved Matches ({savedMatches.length})
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 font-['Bebas_Neue'] text-lg tracking-wider text-center transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-[#D32F1E] text-white'
                : 'text-[#191C18] hover:bg-[#DDD5C0]'
            }`}
          >
            Street Leaderboard
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {activeTab === 'matches' ? (
            savedMatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 italic bg-white border-2 border-[#191C18]">
                No completed matches saved yet. Matches are automatically archived upon starting a new game!
              </div>
            ) : (
              savedMatches.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-white border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] flex items-center justify-between"
                >
                  <div>
                    <div className="font-['Bebas_Neue'] text-lg text-[#191C18]">
                      {m.teamA} vs {m.teamB}
                    </div>
                    <div className="text-xs text-stone-600 font-semibold">
                      {m.firstInningsRuns}/{m.firstInningsWickets} ({m.firstInningsOvers} ov)
                      {m.secondInningsRuns !== undefined &&
                        ` vs ${m.secondInningsRuns}/${m.secondInningsWickets} (${m.secondInningsOvers} ov)`}
                    </div>
                    <div className="text-[11px] font-bold text-[#D32F1E] mt-0.5">
                      {m.result}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => exportMatchJson(m)}
                      title="Export JSON"
                      className="p-2 border border-[#191C18] bg-[#F3EFE6] hover:bg-stone-200 transition-colors"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="space-y-2">
              <div className="border-2 border-[#191C18] bg-white overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#191C18] text-white font-['Bebas_Neue'] text-sm tracking-wide">
                    <tr>
                      <th className="p-2">Player</th>
                      <th className="p-2 text-right">Runs</th>
                      <th className="p-2 text-right">Wickets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#191C18]/20 font-bold">
                    {Object.entries(playerStats)
                      .sort((a, b) => b[1].runs - a[1].runs)
                      .map(([name, stat]) => (
                        <tr key={name} className="hover:bg-amber-50">
                          <td className="p-2">{name}</td>
                          <td className="p-2 text-right font-['Bebas_Neue'] text-base text-[#191C18]">
                            {stat.runs}
                          </td>
                          <td className="p-2 text-right font-['Bebas_Neue'] text-base text-[#D32F1E]">
                            {stat.wickets}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
