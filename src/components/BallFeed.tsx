/**
 * Scorecall — Ball-by-Ball Feed, Partnership & Second Innings Target Bar
 *
 * Requirements (User Item 6):
 * - Ball-by-ball feed with spoken transcripts
 * - Partnership indicator
 * - Target bar in the second innings
 * - Over summary cards
 * - Free-hit indicator
 */

import React from 'react';
import { MatchState, BallRecord } from '../types/cricket';
import { deriveMatchStats } from '../utils/scoringEngine';
import { Zap, Users, Target, Activity } from 'lucide-react';

interface Props {
  match: MatchState;
  onOpenDispute?: () => void;
}

export const BallFeed: React.FC<Props> = ({ match, onOpenDispute }) => {
  const derived = deriveMatchStats(match.balls, match);

  // Calculate current partnership
  let partnershipRuns = 0;
  let partnershipBalls = 0;
  for (let i = match.balls.length - 1; i >= 0; i--) {
    const b = match.balls[i];
    if (b.isWicket || b.eventType === 'retire') break;
    partnershipRuns += b.runs;
    if (b.isLegal) partnershipBalls += 1;
  }

  // 2nd innings target calculations
  const isSecondInnings = match.currentInnings === 2 && Boolean(match.target);
  const target = match.target || 0;
  const runsNeeded = Math.max(0, target - derived.totalRuns);
  const totalLegalBalls = derived.overs * match.rules.ballsPerOver + derived.ballsInOver;
  const maxLegalBalls = match.rules.totalOvers * match.rules.ballsPerOver;
  const ballsRemaining = Math.max(0, maxLegalBalls - totalLegalBalls);
  const rrr =
    ballsRemaining > 0
      ? ((runsNeeded / ballsRemaining) * match.rules.ballsPerOver).toFixed(2)
      : '0.00';
  const targetProgressPercent = target > 0 ? Math.min(100, Math.round((derived.totalRuns / target) * 100)) : 0;

  // Group deliveries into overs for over summaries
  const reverseBalls = [...match.balls].reverse().filter((b) => b.eventType !== 'strike_swap');
  const recentBalls = reverseBalls.slice(0, 10);

  return (
    <div className="w-full space-y-2 select-none">
      {/* Free Hit Alert Banner */}
      {derived.isFreeHit && (
        <div className="w-full bg-[#D32F1E] text-white p-2 border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] flex items-center justify-between font-['Bebas_Neue'] text-lg tracking-wider animate-pulse">
          <div className="flex items-center gap-1.5">
            <Zap size={18} className="text-[#F59E0B]" />
            <span>FREE HIT NEXT DELIVERY — NO WICKET EXCEPT RUN OUT!</span>
          </div>
          <span className="bg-white text-[#D32F1E] px-2 py-0.5 text-xs font-bold uppercase font-sans">
            ACTIVE
          </span>
        </div>
      )}

      {/* Target Progress Bar (Second Innings) */}
      {isSecondInnings && (
        <div className="border-2 border-[#191C18] bg-white p-3 shadow-[2px_2px_0px_#191C18] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1 text-[#191C18] uppercase">
              <Target size={14} className="text-[#D32F1E]" />
              Target: <span className="font-['Bebas_Neue'] text-base text-[#D32F1E]">{target}</span>
            </span>
            <span className="text-[#D32F1E]">
              Need {runsNeeded} runs from {ballsRemaining} balls (RRR: {rrr})
            </span>
          </div>

          {/* Bar track */}
          <div className="w-full h-3.5 bg-[#F3EFE6] border border-[#191C18] overflow-hidden">
            <div
              className="h-full bg-[#D32F1E] transition-all duration-300"
              style={{ width: `${targetProgressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase">
            <span>{derived.totalRuns} Scored</span>
            <span>{targetProgressPercent}% of Target</span>
          </div>
        </div>
      )}

      {/* Partnership Strip */}
      <div className="border-2 border-[#191C18] bg-[#E8E2D2] px-3 py-1.5 shadow-[2px_2px_0px_#191C18] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-bold text-[#191C18]">
          <Users size={14} className="text-[#D32F1E]" />
          <span className="uppercase text-[10px] tracking-wider text-stone-700">Partnership</span>
          <span className="font-['Bebas_Neue'] text-lg text-[#191C18] leading-none ml-1">
            {partnershipRuns} runs
          </span>
          <span className="text-stone-600 font-sans text-xs">({partnershipBalls} balls)</span>
        </div>
        <div className="text-[11px] font-bold text-stone-700 truncate max-w-[180px]">
          {derived.striker} & {derived.nonStriker}
        </div>
      </div>

      {/* Ball-by-Ball Feed Header & Over Dispute Link */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1">
          <Activity size={14} className="text-[#D32F1E]" />
          Ball-by-Ball Feed
        </span>
        {onOpenDispute && (
          <button
            onClick={onOpenDispute}
            className="text-[11px] font-bold text-[#D32F1E] hover:underline uppercase"
          >
            Dispute / Replay (Last 6)
          </button>
        )}
      </div>

      {/* Deliveries list with spoken transcripts */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
        {recentBalls.length === 0 ? (
          <div className="p-3 bg-white border border-[#191C18] text-center text-xs text-stone-500 italic">
            Waiting for first ball of the match...
          </div>
        ) : (
          recentBalls.map((b) => {
            const overDisplay = `${b.overNumber}.${b.ballNumber}`;
            let badgeBg = 'bg-stone-100 text-[#191C18] border-[#191C18]';
            let badgeLabel = `${b.runs}`;

            if (b.isWicket) {
              badgeBg = 'bg-[#D32F1E] text-white border-[#191C18]';
              badgeLabel = `W (${b.dismissalType || 'out'})`;
            } else if (b.eventType === 'wide') {
              badgeBg = 'bg-[#F59E0B] text-[#191C18] border-[#191C18]';
              badgeLabel = `WD (+${b.runs})`;
            } else if (b.eventType === 'no_ball') {
              badgeBg = 'bg-[#F59E0B] text-[#191C18] border-[#191C18]';
              badgeLabel = `NB (+${b.runs})`;
            } else if (b.batterRuns === 4 || b.batterRuns === 6) {
              badgeBg = 'bg-[#F59E0B] text-[#191C18] border-[#191C18]';
              badgeLabel = b.batterRuns === 6 ? 'SIX (6)' : 'FOUR (4)';
            } else if (b.eventType === 'dot') {
              badgeLabel = 'DOT';
            } else if (b.eventType === 'retire') {
              badgeBg = 'bg-stone-300 text-[#191C18] border-[#191C18]';
              badgeLabel = 'RETIRED';
            }

            return (
              <div
                key={b.id}
                className="p-2 bg-white border-2 border-[#191C18] shadow-[1px_1px_0px_#191C18] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-['Bebas_Neue'] text-base text-[#D32F1E] shrink-0">
                    {overDisplay}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[#191C18] truncate">
                      {b.striker} vs {b.bowler}
                    </div>
                    {b.commentary && (
                      <div className="text-[10px] text-stone-500 italic truncate font-sans">
                        Spoken: "{b.commentary}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  <span
                    className={`px-2 py-0.5 font-['Bebas_Neue'] text-sm tracking-wide border ${badgeBg}`}
                  >
                    {badgeLabel}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
