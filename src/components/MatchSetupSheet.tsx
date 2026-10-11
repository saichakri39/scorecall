/**
 * Scorecall — Match Setup Sheet
 *
 * Requirements (Stage 3, Item 14):
 * - Batting squad must have at least maxWickets + 1 names (maxWickets if last-man-bats);
 * - Striker, non-striker and bowler must be in their respective squads;
 * - Striker and non-striker must differ;
 * - The two squads must not share a name (remove Kiran from default batting squad);
 * - Default maxWickets = squad size - 1;
 * - Show clear messages and disable Start only while invalid.
 */

import React, { useState, useMemo } from 'react';
import { X, Settings, Users, AlertTriangle, Check } from 'lucide-react';
import { MatchState, MatchRules } from '../types/cricket';
import { DEFAULT_RULES } from '../utils/scoringEngine';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (newMatchConfig: {
    teamBatting: string;
    teamBowling: string;
    battingSquad: string[];
    bowlingSquad: string[];
    striker: string;
    nonStriker: string;
    currentBowler: string;
    rules: MatchRules;
  }) => void;
  currentMatch?: MatchState;
}

export const MatchSetupSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  onStartMatch,
  currentMatch,
}) => {
  // Initial state values
  const [teamBatting, setTeamBatting] = useState(
    currentMatch?.teamBatting || 'Gully Kings'
  );
  const [teamBowling, setTeamBowling] = useState(
    currentMatch?.teamBowling || 'Street Blasters'
  );

  // Default batting squad without Kiran (Requirement 14)
  const [battingSquadText, setBattingSquadText] = useState(
    currentMatch?.battingSquad.join(', ') ||
      'Ravi, Suresh, Ajay, Deepak, Manoj, Bunty'
  );
  const [bowlingSquadText, setBowlingSquadText] = useState(
    currentMatch?.bowlingSquad.join(', ') ||
      'Kiran, Prasad, Naresh, Venkat, Chanti, Ramu'
  );

  const [totalOvers, setTotalOvers] = useState(
    currentMatch?.rules.totalOvers || 5
  );
  const [ballsPerOver, setBallsPerOver] = useState(
    currentMatch?.rules.ballsPerOver || 6
  );
  const [lastManBats, setLastManBats] = useState(
    currentMatch?.rules.lastManBats || false
  );

  // Derived squads
  const battingSquad = useMemo(
    () =>
      battingSquadText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [battingSquadText]
  );

  const bowlingSquad = useMemo(
    () =>
      bowlingSquadText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [bowlingSquadText]
  );

  // Default maxWickets = squad size - 1 (Requirement 14)
  const defaultMaxWickets = Math.max(1, battingSquad.length - 1);
  const [maxWickets, setMaxWickets] = useState<number>(defaultMaxWickets);

  const [striker, setStriker] = useState(battingSquad[0] || 'Ravi');
  const [nonStriker, setNonStriker] = useState(battingSquad[1] || 'Suresh');
  const [currentBowler, setCurrentBowler] = useState(bowlingSquad[0] || 'Kiran');

  // Comprehensive Validation per Requirement 14
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // 1. Minimum squad size check
    const minBattersNeeded = lastManBats ? maxWickets : maxWickets + 1;
    if (battingSquad.length < minBattersNeeded) {
      errors.push(
        `Batting squad must have at least ${minBattersNeeded} players for ${maxWickets} wickets (has ${battingSquad.length}).`
      );
    }

    if (bowlingSquad.length < 1) {
      errors.push('Bowling squad must have at least 1 player.');
    }

    // 2. Striker and non-striker in batting squad
    if (!battingSquad.includes(striker)) {
      errors.push(`Striker "${striker}" must be in the batting squad.`);
    }
    if (!battingSquad.includes(nonStriker)) {
      errors.push(`Non-striker "${nonStriker}" must be in the batting squad.`);
    }

    // 3. Striker and non-striker must differ
    if (striker === nonStriker && battingSquad.length > 1) {
      errors.push('Striker and Non-striker must be different players.');
    }

    // 4. Bowler in bowling squad
    if (!bowlingSquad.includes(currentBowler)) {
      errors.push(`Bowler "${currentBowler}" must be in the bowling squad.`);
    }

    // 5. Squads must not share a name
    const sharedNames = battingSquad.filter((name) =>
      bowlingSquad.some((bName) => bName.toLowerCase() === name.toLowerCase())
    );
    if (sharedNames.length > 0) {
      errors.push(
        `The two squads share player name(s): ${sharedNames.join(', ')}. Players cannot play for both teams.`
      );
    }

    return errors;
  }, [
    battingSquad,
    bowlingSquad,
    maxWickets,
    lastManBats,
    striker,
    nonStriker,
    currentBowler,
  ]);

  const isValid = validationErrors.length === 0;

  if (!isOpen) {
    return null;
  }

  const handleStart = () => {
    if (!isValid) return;

    onStartMatch({
      teamBatting,
      teamBowling,
      battingSquad,
      bowlingSquad,
      striker,
      nonStriker,
      currentBowler,
      rules: {
        ...DEFAULT_RULES,
        totalOvers,
        ballsPerOver,
        maxWickets,
        lastManBats,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-4 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <Settings size={22} className="text-[#F59E0B]" />
            <h2 className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">
              Gully Match Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Validation Warnings Box */}
          {validationErrors.length > 0 && (
            <div className="p-3 border-2 border-[#D32F1E] bg-red-100/80 text-[#191C18] text-xs space-y-1 font-semibold">
              <div className="flex items-center gap-1.5 text-[#D32F1E] font-bold uppercase tracking-wider">
                <AlertTriangle size={15} />
                Setup Incomplete
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Team Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Batting Team
              </label>
              <input
                type="text"
                value={teamBatting}
                onChange={(e) => setTeamBatting(e.target.value)}
                className="w-full p-2 border-2 border-[#191C18] bg-white text-sm font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Bowling Team
              </label>
              <input
                type="text"
                value={teamBowling}
                onChange={(e) => setTeamBowling(e.target.value)}
                className="w-full p-2 border-2 border-[#191C18] bg-white text-sm font-bold outline-none"
              />
            </div>
          </div>

          {/* Batting Squad */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Batting Squad ({battingSquad.length} players, comma separated)
            </label>
            <textarea
              rows={2}
              value={battingSquadText}
              onChange={(e) => setBattingSquadText(e.target.value)}
              className="w-full p-2 border-2 border-[#191C18] bg-white text-xs font-semibold outline-none"
            />
          </div>

          {/* Bowling Squad */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Bowling Squad ({bowlingSquad.length} players, comma separated)
            </label>
            <textarea
              rows={2}
              value={bowlingSquadText}
              onChange={(e) => setBowlingSquadText(e.target.value)}
              className="w-full p-2 border-2 border-[#191C18] bg-white text-xs font-semibold outline-none"
            />
          </div>

          {/* Opening Batters & Bowler */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Striker
              </label>
              <select
                value={striker}
                onChange={(e) => setStriker(e.target.value)}
                className="w-full p-1.5 border-2 border-[#191C18] bg-white text-xs font-bold"
              >
                {battingSquad.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Non-Striker
              </label>
              <select
                value={nonStriker}
                onChange={(e) => setNonStriker(e.target.value)}
                className="w-full p-1.5 border-2 border-[#191C18] bg-white text-xs font-bold"
              >
                {battingSquad.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Opening Bowler
              </label>
              <select
                value={currentBowler}
                onChange={(e) => setCurrentBowler(e.target.value)}
                className="w-full p-1.5 border-2 border-[#191C18] bg-white text-xs font-bold"
              >
                {bowlingSquad.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Match Rules: Overs & Wickets */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-[#191C18]/30">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Total Overs
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={totalOvers}
                onChange={(e) => setTotalOvers(parseInt(e.target.value, 10) || 5)}
                className="w-full p-1.5 border-2 border-[#191C18] bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Balls Per Over
              </label>
              <input
                type="number"
                min={4}
                max={8}
                value={ballsPerOver}
                onChange={(e) =>
                  setBallsPerOver(parseInt(e.target.value, 10) || 6)
                }
                className="w-full p-1.5 border-2 border-[#191C18] bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                Max Wickets
              </label>
              <input
                type="number"
                min={1}
                max={battingSquad.length}
                value={maxWickets}
                onChange={(e) =>
                  setMaxWickets(parseInt(e.target.value, 10) || defaultMaxWickets)
                }
                className="w-full p-1.5 border-2 border-[#191C18] bg-white text-xs font-bold"
              />
            </div>
          </div>

          {/* Last Man Bats Toggle */}
          <label className="flex items-center gap-2 p-2 bg-white border border-[#191C18] cursor-pointer">
            <input
              type="checkbox"
              checked={lastManBats}
              onChange={(e) => setLastManBats(e.target.checked)}
              className="accent-[#D32F1E] w-4 h-4"
            />
            <span className="text-xs font-bold text-[#191C18]">
              Last Man Bats Rule (Solo batting permitted for final wicket)
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-[#191C18] bg-[#E8E2D2] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-[#191C18] bg-white font-['Bebas_Neue'] text-xl tracking-wider hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={!isValid}
            className="flex-1 py-3 border-2 border-[#191C18] bg-[#D32F1E] font-['Bebas_Neue'] text-xl tracking-wider text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-[2px_2px_0px_#191C18]"
          >
            Start Match
          </button>
        </div>
      </div>
    </div>
  );
};
