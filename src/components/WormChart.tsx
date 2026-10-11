/**
 * Scorecall — Worm Chart & Run Rate Progression
 * Small SVG worm chart tracking cumulative runs by over/ball.
 */

import React from 'react';
import { MatchState } from '../types/cricket';

interface Props {
  match: MatchState;
}

export const WormChart: React.FC<Props> = ({ match }) => {
  const currentInningsBalls = match.balls;

  // Build cumulative runs for current innings
  let runningRuns = 0;
  const currentPoints: { ball: number; runs: number; isWicket: boolean }[] = [
    { ball: 0, runs: 0, isWicket: false },
  ];

  let legalIndex = 0;
  for (const b of currentInningsBalls) {
    runningRuns += b.runs;
    if (b.isLegal) {
      legalIndex += 1;
      currentPoints.push({
        ball: legalIndex,
        runs: runningRuns,
        isWicket: b.isWicket,
      });
    }
  }

  // First innings points if in 2nd innings
  const firstInningsPoints: { ball: number; runs: number }[] = [];
  if (match.firstInnings) {
    firstInningsPoints.push({ ball: 0, runs: 0 });
    let fRuns = 0;
    let fLegal = 0;
    for (const b of match.firstInnings.balls) {
      fRuns += b.runs;
      if (b.isLegal) {
        fLegal += 1;
        firstInningsPoints.push({ ball: fLegal, runs: fRuns });
      }
    }
  }

  const maxBalls = match.rules.totalOvers * match.rules.ballsPerOver;
  const maxRuns = Math.max(
    50,
    runningRuns + 15,
    match.firstInnings ? match.firstInnings.totalRuns + 15 : 0
  );

  const width = 320;
  const height = 120;
  const padding = 20;

  const scaleX = (b: number) => padding + (b / maxBalls) * (width - 2 * padding);
  const scaleY = (r: number) => height - padding - (r / maxRuns) * (height - 2 * padding);

  const buildPath = (pts: { ball: number; runs: number }[]) => {
    if (pts.length < 2) return '';
    return pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.ball)} ${scaleY(p.runs)}`)
      .join(' ');
  };

  return (
    <div className="border-2 border-[#191C18] bg-white p-3 shadow-[2px_2px_0px_#191C18]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-['Bebas_Neue'] text-lg text-[#191C18]">
          Worm Chart (Innings Progression)
        </span>
        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-[#D32F1E]">
            <span className="w-2.5 h-0.5 bg-[#D32F1E] inline-block" /> Current
          </span>
          {match.firstInnings && (
            <span className="flex items-center gap-1 text-stone-500">
              <span className="w-2.5 h-0.5 bg-stone-400 inline-block" /> 1st Innings
            </span>
          )}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        {/* Grid lines */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#191C18"
          strokeWidth="1.5"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#191C18"
          strokeWidth="1.5"
        />

        {/* 1st innings line */}
        {firstInningsPoints.length > 1 && (
          <path
            d={buildPath(firstInningsPoints)}
            fill="none"
            stroke="#A8A29E"
            strokeWidth="2"
            strokeDasharray="3 3"
          />
        )}

        {/* Current innings path */}
        {currentPoints.length > 1 && (
          <path
            d={buildPath(currentPoints)}
            fill="none"
            stroke="#D32F1E"
            strokeWidth="2.5"
          />
        )}

        {/* Wicket dots */}
        {currentPoints
          .filter((p) => p.isWicket)
          .map((p, i) => (
            <circle
              key={i}
              cx={scaleX(p.ball)}
              cy={scaleY(p.runs)}
              r="3.5"
              fill="#D32F1E"
              stroke="#191C18"
              strokeWidth="1"
            />
          ))}
      </svg>
    </div>
  );
};
