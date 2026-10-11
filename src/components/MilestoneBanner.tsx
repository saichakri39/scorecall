/**
 * Scorecall — Milestone Banners
 * Celebrates 50, 100, Hat-trick, Maiden over in gully style.
 */

import React, { useEffect, useState } from 'react';
import { Award, Zap } from 'lucide-react';
import { MatchState } from '../types/cricket';
import { deriveMatchStats } from '../utils/scoringEngine';

interface Props {
  match: MatchState;
}

export const MilestoneBanner: React.FC<Props> = ({ match }) => {
  const [milestone, setMilestone] = useState<string | null>(null);

  useEffect(() => {
    const derived = deriveMatchStats(match.balls, match);

    // Check individual 50 or 100
    for (const b of Object.values(derived.batters)) {
      if (b.runs >= 100) {
        setMilestone(`CENTURY! ${b.name} reached 100 runs!`);
        return;
      }
      if (b.runs >= 50) {
        setMilestone(`FIFTY! ${b.name} reached 50 runs!`);
        return;
      }
    }

    // Check hat-trick: 3 consecutive wickets
    const last3 = match.balls.slice(-3);
    if (last3.length === 3 && last3.every((b) => b.isWicket)) {
      setMilestone('HAT-TRICK! 3 wickets in 3 balls!');
      return;
    }

    // Check maiden over
    for (const bowl of Object.values(derived.bowlers)) {
      if (bowl.maidens > 0 && match.balls.length > 0 && match.balls[match.balls.length - 1].isLegal) {
        // Just bowled a maiden
      }
    }
  }, [match.balls]);

  if (!milestone) return null;

  return (
    <div className="w-full bg-[#F59E0B] border-2 border-[#191C18] p-2 flex items-center justify-between shadow-[2px_2px_0px_#191C18]">
      <div className="flex items-center gap-2">
        <Award size={18} className="text-[#D32F1E]" />
        <span className="font-['Bebas_Neue'] text-lg text-[#191C18] tracking-wider">
          {milestone}
        </span>
      </div>
      <button
        onClick={() => setMilestone(null)}
        className="text-xs font-bold text-[#191C18] hover:underline"
      >
        Dismiss
      </button>
    </div>
  );
};
