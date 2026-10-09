import React, { useState } from 'react';
import { MatchState } from '../types/cricket';
import { CloseThickIcon, BatIcon, StumpsIcon } from './CricketIcons';

export type ActionModalType = 'retire' | 'new_batter' | 'change_bowler' | 'mic_help' | null;

interface QuickPlayerActionsModalProps {
  type: ActionModalType;
  match: MatchState;
  onClose: () => void;
  onRetireBatter: (retiringBatter: string, newBatter: string) => void;
  onSelectNewBatter: (batterName: string, isStriker: boolean) => void;
  onChangeBowler: (bowlerName: string) => void;
}

export const QuickPlayerActionsModal: React.FC<QuickPlayerActionsModalProps> = ({
  type,
  match,
  onClose,
  onRetireBatter,
  onSelectNewBatter,
  onChangeBowler,
}) => {
  if (!type) return null;

  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [retireTarget, setRetireTarget] = useState<string>(match.striker);
  const [targetRole, setTargetRole] = useState<'striker' | 'nonStriker'>('striker');

  const battingRoster = match.battingPlayers || match.battingOrder || [];
  const bowlingRoster = match.bowlingPlayers || Object.keys(match.bowlers);

  // Available batters who aren't currently on the pitch and aren't out
  const availableBatters = battingRoster.filter(
    (name) => name !== match.striker && name !== match.nonStriker && !match.batters[name]?.isOut
  );

  // Available bowlers who aren't the current bowler
  const availableBowlers = bowlingRoster.filter((name) => name !== match.bowler);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-[#FAF7F0] border-4 border-[#191C18] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FFB800] rounded-xs" />
            <h2 className="font-display text-xl tracking-wide uppercase">
              {type === 'retire' && 'Retire Batter'}
              {type === 'new_batter' && 'Select New Batter'}
              {type === 'change_bowler' && 'Change Bowler'}
              {type === 'mic_help' && 'Microphone Access Help'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white press-action">
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* RETIRE BATTER */}
          {type === 'retire' && (
            <div className="space-y-3">
              <p className="text-[#554F42] font-semibold">
                Mark a batter as retired (hurt/voluntary) and bring in the next batsman:
              </p>
              
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
                  Retiring Batter:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRetireTarget(match.striker)}
                    className={`p-2 rounded border-2 font-bold press-action text-left ${
                      retireTarget === match.striker
                        ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                        : 'border-[#CCC4B2] bg-white text-[#191C18]'
                    }`}
                  >
                    Striker: {match.striker}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRetireTarget(match.nonStriker)}
                    className={`p-2 rounded border-2 font-bold press-action text-left ${
                      retireTarget === match.nonStriker
                        ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                        : 'border-[#CCC4B2] bg-white text-[#191C18]'
                    }`}
                  >
                    Runner: {match.nonStriker}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
                  Replacement Batsman:
                </label>
                {availableBatters.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded text-amber-900 font-semibold">
                    No remaining bench batters available in squad.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {availableBatters.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedPlayer(b)}
                        className={`w-full p-2 rounded border-2 text-left font-bold press-action flex items-center justify-between ${
                          selectedPlayer === b
                            ? 'border-[#191C18] bg-[#191C18] text-white'
                            : 'border-[#CCC4B2] bg-white text-[#191C18] hover:bg-gray-50'
                        }`}
                      >
                        <span>{b}</span>
                        <span className="text-[10px] opacity-75">Ready to Bat</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedPlayer}
                onClick={() => {
                  onRetireBatter(retireTarget, selectedPlayer);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#D32F1E] text-white rounded font-display text-lg tracking-wide uppercase press-action disabled:opacity-50"
              >
                Confirm Batter Retirement
              </button>
            </div>
          )}

          {/* NEW BATTER */}
          {type === 'new_batter' && (
            <div className="space-y-3">
              <p className="text-[#554F42] font-semibold">
                Select next player walking onto the pitch:
              </p>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
                  Batting Position:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetRole('striker')}
                    className={`p-2 rounded border-2 font-bold press-action text-center ${
                      targetRole === 'striker'
                        ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                        : 'border-[#CCC4B2] bg-white text-[#191C18]'
                    }`}
                  >
                    On Strike (Striker)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetRole('nonStriker')}
                    className={`p-2 rounded border-2 font-bold press-action text-center ${
                      targetRole === 'nonStriker'
                        ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                        : 'border-[#CCC4B2] bg-white text-[#191C18]'
                    }`}
                  >
                    At Non-Striker End
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
                  Choose Batter from Team:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {battingRoster.map((name) => {
                    const isOut = match.batters[name]?.isOut;
                    const isOnPitch = name === match.striker || name === match.nonStriker;
                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={isOut || isOnPitch}
                        onClick={() => setSelectedPlayer(name)}
                        className={`w-full p-2 rounded border-2 text-left font-bold press-action flex items-center justify-between ${
                          selectedPlayer === name
                            ? 'border-[#191C18] bg-[#191C18] text-white'
                            : isOut
                            ? 'border-gray-200 bg-gray-100 text-gray-400 line-through opacity-60'
                            : isOnPitch
                            ? 'border-amber-200 bg-amber-50 text-amber-900 opacity-60'
                            : 'border-[#CCC4B2] bg-white text-[#191C18] hover:bg-gray-50'
                        }`}
                      >
                        <span>{name}</span>
                        <span className="text-[10px]">
                          {isOut ? 'OUT' : isOnPitch ? 'ON PITCH' : 'AVAILABLE'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedPlayer}
                onClick={() => {
                  onSelectNewBatter(selectedPlayer, targetRole === 'striker');
                  onClose();
                }}
                className="w-full py-2.5 bg-[#191C18] text-white rounded font-display text-lg tracking-wide uppercase press-action disabled:opacity-50"
              >
                Set Active Batter
              </button>
            </div>
          )}

          {/* CHANGE BOWLER */}
          {type === 'change_bowler' && (
            <div className="space-y-3">
              <p className="text-[#554F42] font-semibold">
                Select bowler to take the tape ball:
              </p>
              
              <div className="p-2 bg-[#FAF7F0] border border-[#DDD7C9] rounded">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Current Bowler:</span>
                <span className="font-bold text-sm text-[#191C18]">{match.bowler}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
                  Choose New Bowler:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {bowlingRoster.map((name) => {
                    const isCurrent = name === match.bowler;
                    const stats = match.bowlers[name];
                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={isCurrent}
                        onClick={() => setSelectedPlayer(name)}
                        className={`w-full p-2 rounded border-2 text-left font-bold press-action flex items-center justify-between ${
                          selectedPlayer === name
                            ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                            : isCurrent
                            ? 'border-gray-200 bg-gray-100 text-gray-400 opacity-60'
                            : 'border-[#CCC4B2] bg-white text-[#191C18] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <StumpsIcon className="w-3.5 h-3.5 text-gray-500" />
                          <span>{name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-600">
                          {stats ? `${stats.wickets}/${stats.runsConceded}` : '0/0'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={!selectedPlayer}
                onClick={() => {
                  onChangeBowler(selectedPlayer);
                  onClose();
                }}
                className="w-full py-2.5 bg-[#D32F1E] text-white rounded font-display text-lg tracking-wide uppercase press-action disabled:opacity-50"
              >
                Hand Over Ball to {selectedPlayer || 'Bowler'}
              </button>
            </div>
          )}

          {/* MIC HELP MODAL */}
          {type === 'mic_help' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#FFF3D6] border-2 border-[#E5A800] rounded-lg text-[#6B4F00] space-y-1.5">
                <span className="font-bold text-sm block">🔒 Why is the Mic blocked or not working?</span>
                <p className="leading-relaxed">
                  Modern browsers (Chrome, Edge, Safari) <b>strictly forbid</b> microphone access on local Wi-Fi IP addresses (like <code className="bg-amber-100 px-1 rounded">http://172.x.x.x:3000</code>) unless served over <b>HTTPS</b> or <b>localhost</b>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-2.5 bg-white border border-[#D5CEBC] rounded-lg space-y-1">
                  <span className="font-bold text-[#191C18] block">Option 1: Use on Laptop / PC</span>
                  <p className="text-gray-600">
                    Open <b className="text-black">http://localhost:3000</b> directly in your PC browser. Chrome automatically trusts localhost and speech recognition works seamlessly!
                  </p>
                </div>

                <div className="p-2.5 bg-white border border-[#D5CEBC] rounded-lg space-y-1">
                  <span className="font-bold text-[#191C18] block">Option 2: Android Chrome Unsafe Origin Flag</span>
                  <p className="text-gray-600">
                    On your phone's Chrome, go to <code className="bg-gray-100 px-1 rounded">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>, add your PC IP (e.g. <code className="bg-gray-100 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : 'http://172.29.131.31:3000'}</code>), and relaunch Chrome.
                  </p>
                </div>

                <div className="p-2.5 bg-white border border-[#D5CEBC] rounded-lg space-y-1">
                  <span className="font-bold text-[#191C18] block">Option 3: Tap-to-Type or Presets</span>
                  <p className="text-gray-600">
                    Tap the <b>⌨ Text</b> button beside the mic or use the quick manual keypad below. You can also use your mobile keyboard's built-in microphone key!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-[#191C18] text-white rounded font-display text-lg tracking-wide uppercase press-action"
              >
                Got It, Return to Scorer
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
