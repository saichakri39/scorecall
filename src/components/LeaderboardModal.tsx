import React from 'react';
import { MatchState } from '../types/cricket';
import { CloseThickIcon, BatIcon, StumpsIcon } from './CricketIcons';

interface LeaderboardModalProps {
  isOpen: boolean;
  match: MatchState;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  match,
  onClose,
}) => {
  if (!isOpen) return null;

  const batters = Object.values(match.batters).sort((a, b) => b.runs - a.runs);
  const bowlers = Object.values(match.bowlers).sort((a, b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#FAF7F0] border-4 border-[#191C18] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FFB800] rounded-xs" />
            <h2 className="font-display text-2xl tracking-wide uppercase">Match Leaderboard</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white press-action">
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Top Batters */}
          <div className="bg-white border-2 border-[#191C18] rounded-lg p-3 chalk-border space-y-2">
            <div className="flex items-center gap-1.5 border-b border-[#E0D8C8] pb-1">
              <BatIcon className="w-4 h-4 text-[#D32F1E]" />
              <h3 className="font-display text-lg tracking-wide uppercase text-[#191C18]">Top Run Scorers</h3>
            </div>
            <div className="space-y-1.5">
              {batters.map((b, idx) => (
                <div key={b.name} className="flex items-center justify-between py-1 border-b border-[#F0EBE0] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-xs bg-[#191C18] text-white flex items-center justify-center font-display text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-[#191C18]">{b.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-black text-[#D32F1E]">{b.runs}</span>
                    <span className="text-[11px] font-mono text-gray-500">({b.balls}b · {b.fours}×4 {b.sixes}×6)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Bowlers */}
          <div className="bg-white border-2 border-[#191C18] rounded-lg p-3 chalk-border space-y-2">
            <div className="flex items-center gap-1.5 border-b border-[#E0D8C8] pb-1">
              <StumpsIcon className="w-4 h-4 text-[#D32F1E]" />
              <h3 className="font-display text-lg tracking-wide uppercase text-[#191C18]">Top Wicket Takers</h3>
            </div>
            <div className="space-y-1.5">
              {bowlers.map((b, idx) => (
                <div key={b.name} className="flex items-center justify-between py-1 border-b border-[#F0EBE0] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-xs bg-[#191C18] text-white flex items-center justify-center font-display text-sm font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-[#191C18]">{b.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-black text-[#D32F1E]">{b.wickets} Wkts</span>
                    <span className="text-[11px] font-mono text-gray-500">({b.runsConceded}r in {b.balls || 0}b)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-[#EAE3D4] border-t-2 border-[#191C18] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#191C18] text-white rounded-lg font-display text-lg tracking-wide uppercase press-action"
          >
            Close Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
};
