import React, { useState } from 'react';
import { MatchState, GullyRules } from '../types/cricket';
import { CloseThickIcon, CheckThickIcon } from './CricketIcons';
import { importCricsheetMatch } from '../utils/cricsheetImporter';
import { SAMPLE_CRICSHEET_DATA } from '../utils/sampleCricsheet';

interface MatchSetupSheetProps {
  isOpen: boolean;
  currentMatch: MatchState;
  onClose: () => void;
  onSaveMatch: (newMatchState: MatchState) => void;
}

export const MatchSetupSheet: React.FC<MatchSetupSheetProps> = ({
  isOpen,
  currentMatch,
  onClose,
  onSaveMatch,
}) => {
  if (!isOpen) return null;

  const [matchName, setMatchName] = useState(currentMatch.matchName);
  const [battingTeam, setBattingTeam] = useState(currentMatch.battingTeam);
  const [bowlingTeam, setBowlingTeam] = useState(currentMatch.bowlingTeam);
  const [overs, setOvers] = useState<number>(currentMatch.rules.maxOvers);
  const [innings, setInnings] = useState<1 | 2>(currentMatch.innings || 1);
  const [target, setTarget] = useState<number>(currentMatch.target || 0);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Local rules state
  const [onePitchCatch, setOnePitchCatch] = useState(currentMatch.rules.onePitchCatch);
  const [tipAndRun, setTipAndRun] = useState(currentMatch.rules.tipAndRun);
  const [noLbw, setNoLbw] = useState(currentMatch.rules.noLbw);
  const [lastManBats, setLastManBats] = useState(currentMatch.rules.lastManBats);
  const [wallTouchTwoRuns, setWallTouchTwoRuns] = useState(currentMatch.rules.wallTouchTwoRuns ?? true);
  const [selectedPreset, setSelectedPreset] = useState<'street' | 'terrace' | 'box'>('street');

  const applyPreset = (preset: 'street' | 'terrace' | 'box') => {
    setSelectedPreset(preset);
    if (preset === 'street') {
      setOvers(4);
      setOnePitchCatch(true);
      setTipAndRun(false);
      setNoLbw(true);
      setLastManBats(true);
      setWallTouchTwoRuns(true);
    } else if (preset === 'terrace') {
      setOvers(3);
      setOnePitchCatch(true);
      setTipAndRun(true);
      setNoLbw(true);
      setLastManBats(false);
      setWallTouchTwoRuns(false);
    } else if (preset === 'box') {
      setOvers(6);
      setOnePitchCatch(false);
      setTipAndRun(false);
      setNoLbw(true);
      setLastManBats(false);
      setWallTouchTwoRuns(false);
    }
  };

  // Rosters
  const defaultBattingSquad = currentMatch.battingPlayers || ["Ravi", "Suresh", "Anil", "Mahesh", "Chanti", "Kiran"];
  const defaultBowlingSquad = currentMatch.bowlingPlayers || ["Kiran", "Prasad", "Naresh", "Balu", "Gopi", "Srikanth"];

  const [battingSquadText, setBattingSquadText] = useState(defaultBattingSquad.join(', '));
  const [bowlingSquadText, setBowlingSquadText] = useState(defaultBowlingSquad.join(', '));

  const [striker, setStriker] = useState(currentMatch.striker);
  const [nonStriker, setNonStriker] = useState(currentMatch.nonStriker);
  const [bowler, setBowler] = useState(currentMatch.bowler);

  const battingList = battingSquadText.split(',').map(s => s.trim()).filter(Boolean);
  const bowlingList = bowlingSquadText.split(',').map(s => s.trim()).filter(Boolean);

  const handleLoadSampleCricsheet = () => {
    try {
      const matchData = importCricsheetMatch(SAMPLE_CRICSHEET_DATA);
      onSaveMatch(matchData);
      onClose();
    } catch (err: any) {
      setImportStatus(`Error: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const matchData = importCricsheetMatch(parsed);
        onSaveMatch(matchData);
        onClose();
      } catch (err: any) {
        setImportStatus(`Invalid Cricsheet JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleStartMatch = () => {
    const rules: GullyRules = {
      maxOvers: overs,
      onePitchCatch,
      tipAndRun,
      noLbw,
      lastManBats,
      wallTouchTwoRuns,
      runsForWide: 1,
      runsForNoBall: 1,
    };

    const initialBatters: Record<string, any> = {};
    battingList.forEach(name => {
      initialBatters[name] = {
        name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOut: false,
      };
    });

    const initialBowlers: Record<string, any> = {};
    bowlingList.forEach(name => {
      initialBowlers[name] = {
        name,
        overs: 0,
        balls: 0,
        runsConceded: 0,
        wickets: 0,
        maidens: 0,
        dots: 0,
      };
    });

    const newMatch: MatchState = {
      matchName,
      innings,
      battingTeam,
      bowlingTeam,
      target: innings === 2 ? Number(target) || undefined : undefined,
      rules,
      score: 0,
      wickets: 0,
      oversCompleted: 0,
      ballsInCurrentOver: 0,
      striker: striker || battingList[0] || 'Batter 1',
      nonStriker: nonStriker || battingList[1] || 'Batter 2',
      bowler: bowler || bowlingList[0] || 'Bowler 1',
      batters: initialBatters,
      bowlers: initialBowlers,
      battingOrder: battingList,
      battingPlayers: battingList,
      bowlingPlayers: bowlingList,
      currentOverBalls: [],
      allBalls: [],
    };

    onSaveMatch(newMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#F4EFE6] border-4 border-[#191C18] shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-[#D32F1E] rounded-xs" />
            <h2 className="font-display text-2xl tracking-wide uppercase">Kotha Match Setup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#D5CEBD] hover:text-white press-action"
            aria-label="Close setup"
          >
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-semibold">
          {/* Cricsheet Import Section */}
          <div className="bg-[#FAF0D9] border-2 border-[#E0BD62] rounded-lg p-2.5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6D4C00]">
                Import Real Match (Cricsheet JSON)
              </span>
              <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                Cricsheet Data
              </span>
            </div>
            <p className="text-[10px] text-[#7A5B0F]">
              Load official ball-by-ball match JSON to test Live Scoring and the Story Generator.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <label className="h-8 bg-white border border-[#CFA842] rounded flex items-center justify-center font-bold text-[11px] cursor-pointer hover:bg-amber-50 press-action">
                <span>Upload .json</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={handleLoadSampleCricsheet}
                className="h-8 bg-[#191C18] text-white rounded font-bold text-[11px] press-action flex items-center justify-center"
              >
                Load Sample T20
              </button>
            </div>
            {importStatus && <p className="text-[10px] font-bold text-red-700">{importStatus}</p>}
          </div>

          {/* Quick Rule Presets Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
              Quick Rule Preset
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyPreset('street')}
                className={`py-2 px-1 rounded border-2 font-bold press-action text-center ${
                  selectedPreset === 'street'
                    ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                <span className="block font-display text-base leading-tight">Street Road</span>
                <span className="text-[9px] opacity-75 font-normal">1-Pitch · 4ov · 2R</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('terrace')}
                className={`py-2 px-1 rounded border-2 font-bold press-action text-center ${
                  selectedPreset === 'terrace'
                    ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                <span className="block font-display text-base leading-tight">Terrace Roof</span>
                <span className="text-[9px] opacity-75 font-normal">Tip&Run · 3ov</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('box')}
                className={`py-2 px-1 rounded border-2 font-bold press-action text-center ${
                  selectedPreset === 'box'
                    ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                <span className="block font-display text-base leading-tight">Box Turf</span>
                <span className="text-[9px] opacity-75 font-normal">Direct · 6ov</span>
              </button>
            </div>
          </div>

          {/* Innings & Target selector */}
          <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FAF3E3] border border-[#E5CFA0] rounded-lg">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#75591C] mb-1">
                Innings
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setInnings(1)}
                  className={`flex-1 py-1.5 rounded font-bold text-xs ${
                    innings === 1 ? 'bg-[#191C18] text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  1st Inn
                </button>
                <button
                  type="button"
                  onClick={() => setInnings(2)}
                  className={`flex-1 py-1.5 rounded font-bold text-xs ${
                    innings === 2 ? 'bg-[#D32F1E] text-white' : 'bg-white text-gray-700'
                  }`}
                >
                  2nd (Chase)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#75591C] mb-1">
                Target Score (Runs to Win)
              </label>
              <input
                type="number"
                disabled={innings === 1}
                value={target || ''}
                onChange={e => setTarget(Number(e.target.value))}
                placeholder={innings === 1 ? 'N/A (1st Inn)' : 'e.g. 45'}
                className="w-full bg-white border border-[#C7B58B] rounded px-2.5 py-1 text-xs font-bold text-[#191C18] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Match Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
              Match / Tournament Name
            </label>
            <input
              type="text"
              value={matchName}
              onChange={e => setMatchName(e.target.value)}
              className="w-full bg-white border-2 border-[#191C18] rounded px-3 py-2 text-sm font-bold text-[#191C18] focus:outline-none"
            />
          </div>

          {/* Teams */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
                Batting Team
              </label>
              <input
                type="text"
                value={battingTeam}
                onChange={e => setBattingTeam(e.target.value)}
                className="w-full bg-white border-2 border-[#191C18] rounded px-2.5 py-1.5 text-xs font-bold text-[#191C18]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
                Bowling Team
              </label>
              <input
                type="text"
                value={bowlingTeam}
                onChange={e => setBowlingTeam(e.target.value)}
                className="w-full bg-white border-2 border-[#191C18] rounded px-2.5 py-1.5 text-xs font-bold text-[#191C18]"
              />
            </div>
          </div>

          {/* Overs Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
              Match Overs (Street standard)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[3, 4, 6, 8].map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOvers(o)}
                  className={`h-11 border-2 border-[#191C18] rounded font-display text-xl flex items-center justify-center press-action ${
                    overs === o
                      ? 'bg-[#D32F1E] text-white shadow-xs'
                      : 'bg-white text-[#191C18]'
                  }`}
                >
                  {o} Ov
                </button>
              ))}
            </div>
          </div>

          {/* LOCAL GULLY RULES TOGGLES */}
          <div className="bg-[#EBE5D8] border-2 border-[#D3CABB] p-3 rounded-lg space-y-2">
            <span className="block text-[11px] font-bold uppercase text-[#544D3F] mb-1">
              Gully Rules Config (Ground Niyamas)
            </span>

            {/* Rule 1: One-pitch catch */}
            <label className="flex items-center justify-between p-2 bg-white rounded border border-[#C7BEAD] cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#191C18]">1-Pitch Catch (One-Bounce Catch Out)</span>
                <p className="text-[10px] text-gray-500">1 bounce catch is out</p>
              </div>
              <input
                type="checkbox"
                checked={onePitchCatch}
                onChange={e => setOnePitchCatch(e.target.checked)}
                className="w-5 h-5 accent-[#D32F1E]"
              />
            </label>

            {/* Rule 2: Tip & Run */}
            <label className="flex items-center justify-between p-2 bg-white rounded border border-[#C7BEAD] cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#191C18]">Tip-and-Run (Bat touch mandatory run)</span>
                <p className="text-[10px] text-gray-500">If bat hits ball, runners must cross</p>
              </div>
              <input
                type="checkbox"
                checked={tipAndRun}
                onChange={e => setTipAndRun(e.target.checked)}
                className="w-5 h-5 accent-[#D32F1E]"
              />
            </label>

            {/* Rule 3: No LBW */}
            <label className="flex items-center justify-between p-2 bg-white rounded border border-[#C7BEAD] cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#191C18]">No LBW (Gully staple)</span>
                <p className="text-[10px] text-gray-500">Leg-before is strictly not given</p>
              </div>
              <input
                type="checkbox"
                checked={noLbw}
                onChange={e => setNoLbw(e.target.checked)}
                className="w-5 h-5 accent-[#D32F1E]"
              />
            </label>

            {/* Rule 4: Last Man Bats */}
            <label className="flex items-center justify-between p-2 bg-white rounded border border-[#C7BEAD] cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#191C18]">Last-Man-Bats (Single batter)</span>
                <p className="text-[10px] text-gray-500">Final batter plays solo until out</p>
              </div>
              <input
                type="checkbox"
                checked={lastManBats}
                onChange={e => setLastManBats(e.target.checked)}
                className="w-5 h-5 accent-[#D32F1E]"
              />
            </label>

            {/* Rule 5: Wall-touch 2 runs */}
            <label className="flex items-center justify-between p-2 bg-white rounded border border-[#C7BEAD] cursor-pointer">
              <div>
                <span className="font-bold text-xs text-[#191C18]">Wall-Touch = 2 Runs (Godha Rule)</span>
                <p className="text-[10px] text-gray-500">Hitting the boundary wall directly or rolling</p>
              </div>
              <input
                type="checkbox"
                checked={wallTouchTwoRuns}
                onChange={e => setWallTouchTwoRuns(e.target.checked)}
                className="w-5 h-5 accent-[#D32F1E]"
              />
            </label>
          </div>

          {/* Player Squads */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-0.5">
                Batters list (comma separated)
              </label>
              <input
                type="text"
                value={battingSquadText}
                onChange={e => setBattingSquadText(e.target.value)}
                className="w-full bg-white border border-[#191C18] rounded px-2.5 py-1.5 text-xs text-[#191C18]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-0.5">
                Bowlers list (comma separated)
              </label>
              <input
                type="text"
                value={bowlingSquadText}
                onChange={e => setBowlingSquadText(e.target.value)}
                className="w-full bg-white border border-[#191C18] rounded px-2.5 py-1.5 text-xs text-[#191C18]"
              />
            </div>
          </div>

          {/* Opening Crease Pickers */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#D9D1C2]">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#615A4B] mb-0.5">
                Striker
              </label>
              <select
                value={striker}
                onChange={e => setStriker(e.target.value)}
                className="w-full bg-white border border-[#191C18] rounded p-1 text-xs font-bold text-[#191C18]"
              >
                {battingList.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#615A4B] mb-0.5">
                Runner
              </label>
              <select
                value={nonStriker}
                onChange={e => setNonStriker(e.target.value)}
                className="w-full bg-white border border-[#191C18] rounded p-1 text-xs font-bold text-[#191C18]"
              >
                {battingList.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-[#615A4B] mb-0.5">
                1st Bowler
              </label>
              <select
                value={bowler}
                onChange={e => setBowler(e.target.value)}
                className="w-full bg-white border border-[#191C18] rounded p-1 text-xs font-bold text-[#191C18]"
              >
                {bowlingList.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Action bar */}
        <div className="p-3 bg-[#EAE3D4] border-t-2 border-[#191C18] flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border-2 border-[#191C18] bg-white rounded-lg text-xs font-bold press-action"
          >
            Cancel
          </button>
          <button
            onClick={handleStartMatch}
            className="px-5 py-2.5 bg-[#D32F1E] text-white border-2 border-[#191C18] rounded-lg font-display text-lg tracking-wide flex items-center gap-1.5 press-action shadow-xs"
          >
            <CheckThickIcon className="w-4 h-4" />
            <span>START MATCH (PO PODHAM)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
