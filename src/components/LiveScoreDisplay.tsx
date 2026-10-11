/**
 * Scorecall — Main Live Scoreboard Display
 *
 * Design: Painted-wall / flex-banner look, cream background, red & yellow accents,
 * Bebas Neue numbers, Plus Jakarta Sans text.
 * No emojis, no purple badges, no gradients/glassmorphism.
 */

import React from 'react';
import { MatchState } from '../types/cricket';
import { deriveMatchStats } from '../utils/scoringEngine';
import { Zap, Play, Trophy } from 'lucide-react';

interface Props {
  match: MatchState;
  onStartSecondInnings: () => void;
  onOpenScorecard: () => void;
  onOpenDispute: () => void;
}

export const LiveScoreDisplay: React.FC<Props> = ({
  match,
  onStartSecondInnings,
  onOpenScorecard,
  onOpenDispute,
}) => {
  const derived = deriveMatchStats(match.balls, match);

  const strikerStat = derived.batters[derived.striker] || {
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
  };
  const nonStrikerStat = derived.batters[derived.nonStriker] || {
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
  };
  const bowlerStat = derived.bowlers[derived.currentBowler] || {
    overs: '0.0',
    runs: 0,
    wickets: 0,
  };

  const totalLegalBalls = derived.overs * match.rules.ballsPerOver + derived.ballsInOver;
  const crr =
    totalLegalBalls > 0
      ? ((derived.totalRuns / totalLegalBalls) * match.rules.ballsPerOver).toFixed(2)
      : '0.00';

  let rrr = '0.00';
  let runsNeeded = 0;
  let ballsRemaining = 0;

  if (match.currentInnings === 2 && match.target) {
    runsNeeded = Math.max(0, match.target - derived.totalRuns);
    const maxLegalBalls = match.rules.totalOvers * match.rules.ballsPerOver;
    ballsRemaining = Math.max(0, maxLegalBalls - totalLegalBalls);
    rrr =
      ballsRemaining > 0
        ? ((runsNeeded / ballsRemaining) * match.rules.ballsPerOver).toFixed(2)
        : '0.00';
  }

  // Get last 6 legal/extra balls for visual dots
  const recentBalls = match.balls.slice(-6);

  return (
    <div className="w-full bg-[#F3EFE6] text-[#191C18] space-y-3">
      {/* Top Banner / Match Info */}
      <div className="flex items-center justify-between border-2 border-[#191C18] bg-[#E8E2D2] px-3 py-1.5 shadow-[2px_2px_0px_#191C18]">
        <div className="flex items-center gap-2">
          <span className="font-['Bebas_Neue'] text-lg tracking-wider text-[#D32F1E]">
            {match.currentInnings === 1 ? '1ST INNINGS' : '2ND INNINGS'}
          </span>
          <span className="text-xs font-bold text-stone-600 uppercase">
            {match.teamBatting} vs {match.teamBowling}
          </span>
        </div>
        <div className="text-xs font-bold text-[#191C18] bg-white px-2 py-0.5 border border-[#191C18]">
          {match.rules.totalOvers} OVERS ({match.rules.ballsPerOver}b/ov)
        </div>
      </div>

      {/* Main Big Scoreboard Box */}
      <div className="relative border-4 border-[#191C18] bg-white p-4 shadow-[4px_4px_0px_#191C18]">
        {/* Free hit ribbon if active */}
        {derived.isFreeHit && (
          <div className="absolute top-2 right-2 bg-[#D32F1E] text-white px-2 py-0.5 text-xs font-['Bebas_Neue'] tracking-wider border border-[#191C18] flex items-center gap-1 animate-pulse">
            <Zap size={14} className="text-[#F59E0B]" />
            FREE HIT
          </div>
        )}

        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
              {match.teamBatting} Batting
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-['Bebas_Neue'] text-7xl text-[#191C18] leading-none">
                {derived.totalRuns}/{derived.wickets}
              </span>
              <span className="font-['Bebas_Neue'] text-3xl text-stone-700">
                ({derived.overs}.{derived.ballsInOver} ov)
              </span>
            </div>
          </div>

          {/* Rates */}
          <div className="text-right">
            <div className="text-xs font-bold text-stone-600 uppercase">CRR</div>
            <div className="font-['Bebas_Neue'] text-3xl text-[#191C18] leading-none">
              {crr}
            </div>
            {match.currentInnings === 2 && match.target && (
              <div className="mt-1">
                <div className="text-[10px] font-bold text-[#D32F1E] uppercase">RRR</div>
                <div className="font-['Bebas_Neue'] text-2xl text-[#D32F1E] leading-none">
                  {rrr}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Target or Chase Summary */}
        {match.currentInnings === 2 && match.target && (
          <div className="mt-2 pt-2 border-t-2 border-[#191C18] flex items-center justify-between text-xs font-bold">
            <span className="text-[#191C18]">
              Target: <span className="font-['Bebas_Neue'] text-lg text-[#D32F1E]">{match.target}</span>
            </span>
            <span className="text-[#D32F1E]">
              Need {runsNeeded} runs from {ballsRemaining} balls
            </span>
          </div>
        )}

        {/* Result banner if completed */}
        {match.status === 'completed' && match.resultText && (
          <div className="mt-3 p-2 bg-[#F59E0B] text-[#191C18] border-2 border-[#191C18] text-center font-['Bebas_Neue'] text-2xl tracking-wide flex items-center justify-center gap-2">
            <Trophy size={20} className="text-[#D32F1E]" />
            {match.resultText}
          </div>
        )}

        {/* 1st Innings break banner with START 2ND INNINGS BUTTON (Requirement 12) */}
        {match.status === 'innings_break' && match.currentInnings === 1 && (
          <div className="mt-3 p-3 bg-[#E8E2D2] border-2 border-[#191C18] text-center space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Innings Break — {match.teamBatting} scored {derived.totalRuns}/{derived.wickets}
            </div>
            <button
              onClick={onStartSecondInnings}
              className="w-full py-2.5 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-xl tracking-wider border-2 border-[#191C18] shadow-[3px_3px_0px_#191C18] hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play size={18} />
              Start 2nd Innings (Target: {derived.totalRuns + 1})
            </button>
          </div>
        )}
      </div>

      {/* Batters & Bowler Mini Strip */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Batters */}
        <div className="border-2 border-[#191C18] bg-white p-2 shadow-[2px_2px_0px_#191C18] space-y-1">
          <div className="flex items-center justify-between pb-1 border-b border-[#191C18]/20">
            <div className="font-bold text-[#191C18] flex items-center gap-1 min-w-0 pr-1">
              <span className="text-[#D32F1E] font-black">*</span>
              <span className="truncate">{derived.striker}</span>
            </div>
            <div className="font-['Bebas_Neue'] text-base text-[#191C18] shrink-0">
              {strikerStat.runs} <span className="text-xs font-sans text-stone-500">({strikerStat.balls})</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="font-semibold text-stone-600 truncate min-w-0 pr-1">
              {derived.nonStriker}
            </div>
            <div className="font-['Bebas_Neue'] text-base text-stone-700 shrink-0">
              {nonStrikerStat.runs} <span className="text-xs font-sans text-stone-500">({nonStrikerStat.balls})</span>
            </div>
          </div>
        </div>

        {/* Bowler */}
        <div className="border-2 border-[#191C18] bg-white p-2 shadow-[2px_2px_0px_#191C18] flex flex-col justify-between">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
            Current Bowler
          </div>
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm text-[#191C18] truncate min-w-0">
              {derived.currentBowler}
            </span>
            <span className="font-['Bebas_Neue'] text-xl text-[#D32F1E] shrink-0">
              {bowlerStat.wickets}-{bowlerStat.runs}
              <span className="text-xs font-sans text-stone-600 ml-1">
                ({bowlerStat.overs})
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Recent Deliveries Ball Dots */}
      <div
        onClick={onOpenDispute}
        className="cursor-pointer border-2 border-[#191C18] bg-white px-3 py-2 shadow-[2px_2px_0px_#191C18] flex items-center justify-between hover:bg-amber-50/50 transition-colors"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
          This Over
        </span>
        <div className="flex items-center gap-1.5">
          {recentBalls.length === 0 ? (
            <span className="text-xs text-stone-400 italic font-medium">New over starts</span>
          ) : (
            recentBalls.map((b, i) => {
              let bg = 'bg-stone-100 text-[#191C18]';
              let text = `${b.runs}`;
              if (b.isWicket) {
                bg = 'bg-[#D32F1E] text-white';
                text = 'W';
              } else if (b.eventType === 'wide') {
                // Requirement: NO purple! Use amber/yellow palette
                bg = 'bg-[#F59E0B] text-[#191C18]';
                text = 'WD';
              } else if (b.eventType === 'no_ball') {
                bg = 'bg-[#F59E0B] text-[#191C18]';
                text = 'NB';
              } else if (b.batterRuns === 4 || b.batterRuns === 6) {
                bg = 'bg-[#F59E0B] text-[#191C18]';
                text = `${b.batterRuns}`;
              } else if (b.eventType === 'dot') {
                text = '•';
              }
              return (
                <div
                  key={b.id || i}
                  className={`w-6 h-6 border border-[#191C18] flex items-center justify-center font-['Bebas_Neue'] text-xs font-bold ${bg}`}
                >
                  {text}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
