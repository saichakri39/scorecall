import React from 'react';
import { BallRecord } from '../types/cricket';
import { CloseThickIcon, StumpsIcon } from './CricketIcons';

interface DisputeModalProps {
  isOpen: boolean;
  recentBalls: BallRecord[];
  onClose: () => void;
  onUndoLast: () => void;
}

export const DisputeModal: React.FC<DisputeModalProps> = ({
  isOpen,
  recentBalls,
  onClose,
  onUndoLast,
}) => {
  if (!isOpen) return null;

  const lastSix = recentBalls.slice(-6).reverse();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#FAF7F0] border-4 border-[#191C18] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#D32F1E] text-white px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FFB800] rounded-xs animate-pulse" />
            <h2 className="font-display text-2xl tracking-wide uppercase">Ground Dispute Replay</h2>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white press-action">
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-[#FFF3D6] border-b-2 border-[#E5A800] text-[11px] text-[#6B4F00] font-bold">
          ⚡ Replaying the last 6 balls to settle ground arguments. Check the exact spoken commentary and outcome recorded.
        </div>

        {/* List of last 6 balls */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 text-xs">
          {lastSix.length === 0 ? (
            <p className="text-gray-500 italic text-center py-6">No balls bowled yet in this innings.</p>
          ) : (
            lastSix.map((b, idx) => (
              <div
                key={b.id || idx}
                className="bg-white border-2 border-[#191C18] rounded-lg p-2.5 flex items-start justify-between chalk-border shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 bg-[#191C18] text-[#F3EFE6] rounded-xs">
                      Ov {b.overIndex}.{b.ballInOver}
                    </span>
                    <span className="font-bold text-xs text-[#191C18]">
                      {b.type === 'wicket' ? 'WICKET / OUT' : b.type === 'wide' ? 'WIDE BALL' : b.type === 'no_ball' ? 'NO BALL' : b.runs === 0 ? 'DOT BALL' : `${b.runs} RUNS`}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#554F42] font-semibold">
                    Batter: <b>{b.striker}</b> · Bowler: <b>{b.bowler}</b>
                  </p>

                  {b.spokenPrompt && (
                    <div className="bg-[#F6F1E6] p-1.5 rounded border border-[#D8D0C0] text-[10px] text-[#704800] italic">
                      Spoken transcript: "{b.spokenPrompt}"
                    </div>
                  )}
                </div>

                {/* Score badge */}
                <div className="flex flex-col items-end">
                  <span className={`w-8 h-8 rounded flex items-center justify-center font-display text-lg font-bold ${
                    b.type === 'wicket' ? 'bg-[#D32F1E] text-white' : b.runs === 4 || b.runs === 6 ? 'bg-[#FFB800] text-[#191C18]' : 'bg-[#EAE4D5] text-[#191C18]'
                  }`}>
                    {b.type === 'wicket' ? 'W' : b.type === 'wide' ? 'WD' : b.runs}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-[#EAE3D4] border-t-2 border-[#191C18] flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              onUndoLast();
              onClose();
            }}
            className="flex-1 py-2.5 bg-[#191C18] text-white rounded-lg font-display text-lg tracking-wide uppercase press-action"
          >
            Undo Last Ball (Venakki)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white border-2 border-[#191C18] rounded-lg text-xs font-bold press-action"
          >
            Dispute Settled
          </button>
        </div>
      </div>
    </div>
  );
};
