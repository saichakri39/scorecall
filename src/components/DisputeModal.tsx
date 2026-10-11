/**
 * Scorecall — Gully Cricket Dispute & Over Log Modal
 *
 * Requirements (Stage 3, Item 15):
 * - allBalls is newest-first, so use slice(0, 6)
 * - Skip strike_swap entries
 * - Number overs from 1 (e.g. "Over 1", not "Over 0")
 * - Label bye, leg bye and retired
 */

import React from 'react';
import { X, AlertCircle, History, RotateCcw } from 'lucide-react';
import { BallRecord } from '../types/cricket';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  balls: BallRecord[];
  onUndoLastBall: () => void;
}

export const DisputeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  balls,
  onUndoLastBall,
}) => {
  if (!isOpen) {
    return null;
  }

  // Requirement 15: allBalls is newest-first, skip strike_swap entries, use slice(0, 6)
  const newestFirstBalls = [...balls].reverse().filter((b) => b.eventType !== 'strike_swap');
  const recentBalls = newestFirstBalls.slice(0, 6);

  const getEventBadge = (ball: BallRecord) => {
    switch (ball.eventType) {
      case 'wicket':
        return (
          <span className="px-2 py-0.5 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-sm border border-[#191C18]">
            OUT ({ball.dismissalType || 'caught'})
          </span>
        );
      case 'wide':
        return (
          <span className="px-2 py-0.5 bg-amber-400 text-[#191C18] font-['Bebas_Neue'] text-sm border border-[#191C18]">
            WIDE (+{ball.runs})
          </span>
        );
      case 'no_ball':
        return (
          <span className="px-2 py-0.5 bg-amber-400 text-[#191C18] font-['Bebas_Neue'] text-sm border border-[#191C18]">
            NO BALL (+{ball.runs})
          </span>
        );
      case 'bye':
        return (
          <span className="px-2 py-0.5 bg-stone-200 text-[#191C18] font-['Bebas_Neue'] text-sm border border-[#191C18]">
            BYE (+{ball.runs})
          </span>
        );
      case 'leg_bye':
        return (
          <span className="px-2 py-0.5 bg-stone-200 text-[#191C18] font-['Bebas_Neue'] text-sm border border-[#191C18]">
            LEG BYE (+{ball.runs})
          </span>
        );
      case 'retire':
        return (
          <span className="px-2 py-0.5 bg-stone-300 text-[#191C18] font-['Bebas_Neue'] text-sm border border-[#191C18]">
            RETIRED
          </span>
        );
      case 'boundary':
        return (
          <span className="px-2 py-0.5 bg-[#F59E0B] text-[#191C18] font-['Bebas_Neue'] text-sm border border-[#191C18]">
            {ball.runs === 6 ? 'SIX (6)' : 'FOUR (4)'}
          </span>
        );
      case 'dot':
        return (
          <span className="px-2 py-0.5 bg-stone-100 text-[#191C18] font-['Bebas_Neue'] text-sm border border-[#191C18]">
            DOT (0)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-white text-[#191C18] font-['Bebas_Neue'] text-sm border border-[#191C18]">
            {ball.runs} RUN{ball.runs === 1 ? '' : 'S'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <History size={20} className="text-[#F59E0B]" />
            <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
              Dispute / Over Log
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

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="text-xs text-stone-700 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Recent Deliveries (Last 6 Balls)</span>
            <span className="text-[#D32F1E]">Newest first</span>
          </div>

          {recentBalls.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-500 italic bg-white border-2 border-[#191C18]">
              No deliveries recorded in this innings yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentBalls.map((b, idx) => {
                // Requirement 15: Number overs from 1
                const displayOverNumber = b.overNumber + 1;
                return (
                  <div
                    key={b.id || idx}
                    className="p-2.5 bg-white border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-['Bebas_Neue'] text-base text-[#D32F1E]">
                          Over {displayOverNumber}.{b.ballNumber}
                        </span>
                        {getEventBadge(b)}
                      </div>
                      <div className="text-xs text-stone-700 font-semibold">
                        Batter: <span className="font-bold">{b.striker}</span> | Bowler: <span className="font-bold">{b.bowler}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-['Bebas_Neue'] text-2xl text-[#191C18]">
                        +{b.runs}
                      </div>
                      <div className="text-[10px] text-stone-500 font-bold uppercase">
                        {b.isLegal ? 'Legal' : 'Extra'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-[#191C18] bg-[#E8E2D2] flex gap-2">
          <button
            onClick={() => {
              onUndoLastBall();
              onClose();
            }}
            disabled={balls.length === 0}
            className="flex-1 py-2.5 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-lg tracking-wider flex items-center justify-center gap-1.5 border-2 border-[#191C18] hover:bg-red-700 disabled:opacity-50 transition-colors shadow-[2px_2px_0px_#191C18]"
          >
            <RotateCcw size={16} />
            Undo Last Ball
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white text-[#191C18] font-['Bebas_Neue'] text-lg tracking-wider border-2 border-[#191C18] hover:bg-stone-100 transition-colors shadow-[2px_2px_0px_#191C18]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
