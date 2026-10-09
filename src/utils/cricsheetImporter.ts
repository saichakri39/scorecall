import { MatchState, BallRecord, BatterScore, BowlerStats, GullyRules } from '../types/cricket';

/**
 * Cricsheet JSON format importer.
 * Converts Cricsheet match format (deliveries, info, overs) into Tappa's MatchState.
 * Supports standard Cricsheet T20/IPL/T10 JSON structures.
 */
export function importCricsheetMatch(cricsheetData: any): MatchState {
  if (!cricsheetData || !cricsheetData.info) {
    throw new Error('Invalid Cricsheet file: missing "info" object');
  }

  const info = cricsheetData.info;
  const teams = info.teams || ['Team A', 'Team B'];
  const battingTeam = teams[0] || 'Team A';
  const bowlingTeam = teams[1] || 'Team B';
  const matchName = `${battingTeam} vs ${bowlingTeam} (${info.event?.name || info.match_type || 'Match'})`;

  const maxOvers = info.overs || 20;

  const rules: GullyRules = {
    maxOvers: Math.min(maxOvers, 20),
    onePitchCatch: false,
    tipAndRun: false,
    noLbw: false,
    lastManBats: false,
    wallTouchTwoRuns: false,
    runsForWide: 1,
    runsForNoBall: 1,
  };

  const batters: Record<string, BatterScore> = {};
  const bowlers: Record<string, BowlerStats> = {};
  const allBalls: BallRecord[] = [];
  const currentOverBalls: BallRecord[] = [];

  let score = 0;
  let wickets = 0;
  let oversCompleted = 0;
  let ballsInCurrentOver = 0;

  let currentStriker = '';
  let currentNonStriker = '';
  let currentBowler = '';

  const battingOrder: string[] = [];

  // Parse 1st innings deliveries
  const firstInnings = cricsheetData.innings && cricsheetData.innings[0];
  if (firstInnings && firstInnings.overs) {
    for (const overObj of firstInnings.overs) {
      const overIndex = overObj.over;
      const deliveries = overObj.deliveries || [];

      for (let i = 0; i < deliveries.length; i++) {
        const del = deliveries[i];
        const batter = del.batter || 'Batter';
        const bowler = del.bowler || 'Bowler';
        const nonStriker = del.non_striker || 'Runner';

        currentStriker = batter;
        currentNonStriker = nonStriker;
        currentBowler = bowler;

        if (!battingOrder.includes(batter)) battingOrder.push(batter);
        if (!battingOrder.includes(nonStriker)) battingOrder.push(nonStriker);

        if (!batters[batter]) {
          batters[batter] = { name: batter, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
        }
        if (!batters[nonStriker]) {
          batters[nonStriker] = { name: nonStriker, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false };
        }
        if (!bowlers[bowler]) {
          bowlers[bowler] = { name: bowler, overs: 0, balls: 0, runsConceded: 0, wickets: 0, maidens: 0, dots: 0 };
        }

        const runsBatter = del.runs?.batter || 0;
        const runsExtras = del.runs?.extras || 0;
        const runsTotal = del.runs?.total || 0;

        const isWide = !!del.extras?.wides;
        const isNoBall = !!del.extras?.noballs;
        const isLegal = !isWide && !isNoBall;

        score += runsTotal;

        if (isLegal) {
          batters[batter].balls += 1;
          bowlers[bowler].balls += 1;
        }

        batters[batter].runs += runsBatter;
        if (runsBatter === 4) batters[batter].fours += 1;
        if (runsBatter === 6) batters[batter].sixes += 1;

        bowlers[bowler].runsConceded += runsTotal;
        if (runsTotal === 0 && isLegal) bowlers[bowler].dots += 1;

        // Wicket check
        let wicketDetails: any = undefined;
        if (del.wickets && del.wickets.length > 0) {
          const w = del.wickets[0];
          wickets += 1;
          const outPlayer = w.player_out || batter;
          if (batters[outPlayer]) {
            batters[outPlayer].isOut = true;
            batters[outPlayer].dismissalInfo = `${w.kind} b ${bowler}`;
          }
          if (w.kind !== 'run out') {
            bowlers[bowler].wickets += 1;
          }
          wicketDetails = {
            dismissal: w.kind === 'caught' ? 'caught' : w.kind === 'run out' ? 'run_out' : 'bowled',
            outBatter: outPlayer,
            fielder: w.fielders && w.fielders[0] ? w.fielders[0].name : null,
          };
        }

        const ballRecord: BallRecord = {
          id: `cric_${overIndex}_${i}_${Date.now()}`,
          overIndex,
          ballInOver: i + 1,
          isLegal,
          type: isWide ? 'wide' : isNoBall ? 'no_ball' : wicketDetails ? 'wicket' : runsBatter === 0 ? 'dot' : 'run',
          runs: runsBatter,
          extras: runsExtras,
          isBoundary: runsBatter === 4 || runsBatter === 6,
          striker: batter,
          nonStriker,
          bowler,
          wicket: wicketDetails,
          timestamp: Date.now() - (1000 * (100 - allBalls.length)),
        };

        allBalls.push(ballRecord);
      }
    }
  }

  // Calculate final overs completed
  const totalLegalBalls = allBalls.filter(b => b.isLegal).length;
  oversCompleted = Math.floor(totalLegalBalls / 6);
  ballsInCurrentOver = totalLegalBalls % 6;

  // Calculate bowler overs
  Object.values(bowlers).forEach(b => {
    b.overs = parseFloat(`${Math.floor(b.balls / 6)}.${b.balls % 6}`);
  });

  return {
    matchName,
    innings: 1,
    battingTeam,
    bowlingTeam,
    rules,
    score,
    wickets,
    oversCompleted,
    ballsInCurrentOver,
    striker: currentStriker || battingOrder[0] || 'Batter 1',
    nonStriker: currentNonStriker || battingOrder[1] || 'Batter 2',
    bowler: currentBowler || Object.keys(bowlers)[0] || 'Bowler 1',
    batters,
    bowlers,
    battingOrder,
    battingPlayers: battingOrder,
    bowlingPlayers: Object.keys(bowlers),
    currentOverBalls: allBalls.slice(-6),
    allBalls,
  };
}
