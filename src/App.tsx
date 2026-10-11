/**
 * Scorecall — Voice-First Gully Cricket Scorer
 *
 * Ground Rules:
 * - Painted-wall / flex-banner look, cream background, red and yellow accents.
 * - No emojis, no purple badges, no gradients/glassmorphism.
 * - Single setMatch & single undo snapshot for multi-event commands (Stage 1).
 * - All scoring goes through applyBall; all totals derived from ball log.
 * - All 6 requirements restored faithfully:
 *   1. Header with text buttons Setup, Card, Share and icon buttons with visible labels.
 *   2. Visible "New Match" button with save confirm.
 *   3. Interface language switch (en/te/hi) translating UI text + separate voice language control.
 *   4. Quick-action row: Strike Marchu / Swap Strike, Retire, + Batter, Change Bowler, Dispute (replay 6), Undo.
 *   5. Settings with rule presets, rule chips, sunlight mode, demo mode, voice read-back, accuracy lab.
 *   6. Ball-by-ball feed with spoken transcripts, partnership, target bar, over summary, free-hit alert.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MatchState,
  BallInput,
  ParsedEvent,
  ParseResult,
  SavedMatchSummary,
  MatchRules,
} from './types/cricket';
import {
  INITIAL_MATCH,
  applyBall,
  deriveMatchStats,
  startSecondInnings,
  getNextBatter,
} from './utils/scoringEngine';
import { LiveScoreDisplay } from './components/LiveScoreDisplay';
import { KeypadScorer } from './components/KeypadScorer';
import { VoiceInputBar } from './components/VoiceInputBar';
import { BallFeed } from './components/BallFeed';
import { FullScorecardDrawer } from './components/FullScorecardDrawer';
import { SpectatorQRModal } from './components/SpectatorQRModal';
import { VoiceConfirmationSheet } from './components/VoiceConfirmationSheet';
import { MatchSetupSheet } from './components/MatchSetupSheet';
import { DisputeModal } from './components/DisputeModal';
import { ScorecallBotSheet } from './components/ScorecallBotSheet';
import { ShareMatchModal } from './components/ShareMatchModal';
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { WormChart } from './components/WormChart';
import { MilestoneBanner } from './components/MilestoneBanner';
import { SupportedLanguage, t } from './utils/i18n';
import { speakText, speakCricketBall } from './utils/speechTts';
import { QuickPlayerModal } from './components/QuickPlayerModal';
import { ConfirmNewMatchModal } from './components/ConfirmNewMatchModal';
import {
  FileText,
  Share2,
  QrCode,
  History,
  Settings,
  Bot,
  PlusCircle,
  TrendingUp,
  Globe,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function App() {
  const [match, setMatch] = useState<MatchState>(() => {
    return { ...INITIAL_MATCH };
  });

  // Synchronous reference to the latest match, so rapid voice calls cannot use stale state.
  const matchRef = useRef<MatchState>(match);

  // Undo history stack
  const [undoStack, setUndoStack] = useState<MatchState[]>([]);

  // Saved match history
  const [savedMatches, setSavedMatches] = useState<SavedMatchSummary[]>([]);

  // UI Language state (Requirement 3)
  const [uiLang, setUiLang] = useState<SupportedLanguage>('en');

  // Sunlight Mode, Voice Read-Back (Live Score Announcement defaults to ON!), Demo Mode
  const [sunlightMode, setSunlightMode] = useState(false);
  const [voiceReadBack, setVoiceReadBack] = useState(true);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Modals & Drawers state
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isSpectatorQROpen, setIsSpectatorQROpen] = useState(false);
  const [isVoiceConfirmOpen, setIsVoiceConfirmOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showWormChart, setShowWormChart] = useState(false);

  // In-app modal states (replacing window.prompt and window.confirm)
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerModalMode, setPlayerModalMode] = useState<'batter' | 'bowler'>('batter');
  const [isConfirmNewMatchOpen, setIsConfirmNewMatchOpen] = useState(false);

  // Active voice result to confirm
  const [pendingVoiceResult, setPendingVoiceResult] = useState<ParseResult | null>(null);

  // Live match sync for spectator link
  useEffect(() => {
    if (match.id) {
      fetch(`/api/live/${match.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      }).catch(() => {
        // Ignore offline live sync errors
      });
    }
  }, [match]);

  /**
   * Helper to archive match to history (Stage 1, Item 5)
   * Must save old match to history ONCE only. Never save an empty match!
   */
  const archiveCurrentMatch = (m: MatchState) => {
    if (m.balls.length === 0 && m.totalRuns === 0) {
      return; // Never save empty match
    }

    const derived = deriveMatchStats(m.balls, m);
    const summary: SavedMatchSummary = {
      id: m.id,
      date: new Date(m.createdAt).toLocaleDateString(),
      teamA: m.firstInnings ? m.firstInnings.teamName : m.teamBatting,
      teamB: m.firstInnings ? m.teamBatting : m.teamBowling,
      firstInningsRuns: m.firstInnings ? m.firstInnings.totalRuns : derived.totalRuns,
      firstInningsWickets: m.firstInnings ? m.firstInnings.wickets : derived.wickets,
      firstInningsOvers: m.firstInnings
        ? `${m.firstInnings.oversCompleted}.${m.firstInnings.ballsInCurrentOver}`
        : `${derived.overs}.${derived.ballsInOver}`,
      secondInningsRuns: m.firstInnings ? derived.totalRuns : undefined,
      secondInningsWickets: m.firstInnings ? derived.wickets : undefined,
      secondInningsOvers: m.firstInnings ? `${derived.overs}.${derived.ballsInOver}` : undefined,
      result: m.resultText || (m.status === 'completed' ? 'Match completed' : 'In progress'),
      matchState: m,
    };

    setSavedMatches((prev) => {
      const filtered = prev.filter((item) => item.id !== summary.id);
      return [summary, ...filtered];
    });
  };

  /**
   * Record a single ball event (Keypad Scorer)
   */
  const recordBall = (input: BallInput) => {
    const currentMatch = matchRef.current;
    setUndoStack((prev) => [...prev, currentMatch]);

    const nextMatch = applyBall(currentMatch, input);
    matchRef.current = nextMatch;
    setMatch(nextMatch);

    if (voiceReadBack) {
      const text = speakCricketBall(
        input.eventType,
        input.runsOffBat ?? input.runs ?? 0,
        nextMatch.totalRuns,
        nextMatch.wickets,
        input.dismissalType,
        input.dismissedBatter || nextMatch.striker,
        uiLang
      );
      if (text) setLiveAnnouncement(text);
    }
  };

  /** Apply all events from one voice command to the latest state and save one undo snapshot. */
  const applyParsedEvents = (events: ParsedEvent[]) => {
    if (events.length === 0) return;

    const currentMatch = matchRef.current;
    setUndoStack((prev) => [...prev, currentMatch]);

    let localState = currentMatch;
    for (const evt of events) {
      const ballInput: BallInput = {
        eventType: evt.type,
        runs: evt.runs,
        runsOffBat: evt.runsOffBat,
        runsRun: evt.runsRun,
        dismissalType: evt.dismissal,
        dismissedBatter: evt.dismissedPlayer,
        batter: evt.batter,
        bowler: evt.bowler,
        newBatter: evt.newBatter,
        commentary: evt.rawText,
      };
      localState = applyBall(localState, ballInput);
    }

    matchRef.current = localState;
    setMatch(localState);
    setIsVoiceConfirmOpen(false);
    setPendingVoiceResult(null);

    if (voiceReadBack) {
      const primaryEvt = events[events.length - 1];
      const text = speakCricketBall(
        primaryEvt.type,
        primaryEvt.runsOffBat ?? primaryEvt.runs ?? 0,
        localState.totalRuns,
        localState.wickets,
        primaryEvt.dismissal,
        primaryEvt.dismissedPlayer || localState.striker,
        uiLang
      );
      if (text) setLiveAnnouncement(text);
    }
  };

  /**
   * Handle Voice recognition output
   */
  const handleVoiceParsed = (result: ParseResult) => {
    // Only require confirmation if the engine explicitly flagged needsClarification,
    // or confidence is low (< 0.85), or more than 2 compound actions are chained.
    const requiresConfirmation =
      result.needsClarification ||
      result.confidence < 0.85 ||
      result.events.length > 2;

    if (requiresConfirmation || result.events.length === 0) {
      setPendingVoiceResult(result);
      setIsVoiceConfirmOpen(true);
    } else {
      applyParsedEvents(result.events);
    }
  };

  /**
   * Undo Action (Reverts one entire command/snapshot)
   */
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousState = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    matchRef.current = previousState;
    setMatch(previousState);
  };

  /**
   * Stage 2, Item 12: Second Innings Handover
   */
  const handleStartSecondInnings = () => {
    setUndoStack((prev) => [...prev, match]);
    const secondInningsState = startSecondInnings(matchRef.current);
    matchRef.current = secondInningsState;
    setMatch(secondInningsState);
  };

  /**
   * Requirement 2: Visible "New Match" button on main screen
   * Opens MatchSetupSheet with "Save this match to history and start a new one?" confirm if in progress
   */
  const handleNewMatchClick = () => {
    const isInProgress = match.balls.length > 0 || match.totalRuns > 0;
    if (isInProgress) {
      setIsConfirmNewMatchOpen(true);
    } else {
      setIsSetupOpen(true);
    }
  };

  /**
   * Setup Sheet Start Handler
   */
  const handleStartConfiguredMatch = (newConfig: any) => {
    // If not already archived, archive
    archiveCurrentMatch(match);

    const freshMatch: MatchState = {
      ...INITIAL_MATCH,
      id: `match_${Date.now()}`,
      createdAt: Date.now(),
      teamBatting: newConfig.teamBatting,
      teamBowling: newConfig.teamBowling,
      battingSquad: newConfig.battingSquad,
      bowlingSquad: newConfig.bowlingSquad,
      striker: newConfig.striker,
      nonStriker: newConfig.nonStriker,
      currentBowler: newConfig.currentBowler,
      rules: newConfig.rules,
      totalRuns: 0,
      wickets: 0,
      overs: 0,
      ballsInOver: 0,
      balls: [],
      retiredBatters: [],
    };
    matchRef.current = freshMatch;
    setMatch(freshMatch);
    setUndoStack([]);
  };

  /**
   * Quick Action: + Batter
   */
  const handleAddNewBatterQuick = () => {
    setPlayerModalMode('batter');
    setIsPlayerModalOpen(true);
  };

  /**
   * Quick Action: Change Bowler
   */
  const handleChangeBowlerQuick = () => {
    setPlayerModalMode('bowler');
    setIsPlayerModalOpen(true);
  };

  const handlePlayerModalConfirm = (name: string) => {
    if (playerModalMode === 'batter') {
      recordBall({
        eventType: 'new_batter',
        newBatter: name.trim(),
      });
    } else {
      recordBall({
        eventType: 'change_bowler',
        bowler: name.trim(),
      });
    }
  };

  /**
   * Update match rules from settings
   */
  const handleUpdateRules = (newRules: MatchRules) => {
    const updatedMatch = { ...matchRef.current, rules: newRules };
    matchRef.current = updatedMatch;
    setMatch(updatedMatch);
  };

  return (
    <div
      className={`min-h-screen text-[#191C18] flex flex-col font-sans selection:bg-[#D32F1E] selection:text-white transition-colors ${
        sunlightMode
          ? 'bg-[#FFFFEE] text-black border-4 border-black'
          : 'bg-[#F3EFE6]'
      }`}
    >
      {/* 1. Header:
          Text buttons Setup, Card and Share,
          plus icon buttons for Bot, History, Live QR and Settings with visible labels */}
      <header className="bg-[#191C18] text-white border-b-4 border-[#D32F1E] px-2 sm:px-4 py-2 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Brand */}
          <div className="flex items-center gap-1.5 shrink-0">
            <h1 className="font-['Bebas_Neue'] text-2xl sm:text-3xl tracking-widest text-[#F59E0B] leading-none">
              {t('appTitle', uiLang)}
            </h1>
            <span className="text-[9px] uppercase font-bold tracking-wider px-1 py-0.5 bg-[#D32F1E] text-white border border-[#191C18] hidden sm:inline-block">
              GULLY
            </span>
          </div>

          {/* Action Navigation: Text buttons & Icon buttons with labels */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
            {/* Text Button: SETUP */}
            <button
              onClick={() => setIsSetupOpen(true)}
              className="px-2 py-1 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-xs sm:text-sm tracking-wider border border-[#191C18] hover:bg-red-700 transition-colors shadow-[1px_1px_0px_#191C18]"
              title="Match Setup"
            >
              {t('setup', uiLang)}
            </button>

            {/* Text Button: CARD */}
            <button
              onClick={() => setIsScorecardOpen(true)}
              className="px-2 py-1 bg-white text-[#191C18] font-['Bebas_Neue'] text-xs sm:text-sm tracking-wider border border-[#191C18] hover:bg-stone-100 transition-colors shadow-[1px_1px_0px_#191C18]"
              title="Full Scorecard"
            >
              {t('card', uiLang)}
            </button>

            {/* Text Button: SHARE */}
            <button
              onClick={() => setIsShareOpen(true)}
              className="px-2 py-1 bg-white text-[#191C18] font-['Bebas_Neue'] text-xs sm:text-sm tracking-wider border border-[#191C18] hover:bg-stone-100 transition-colors shadow-[1px_1px_0px_#191C18]"
              title="Share Match & AI Story"
            >
              {t('share', uiLang)}
            </button>

            {/* Icon Button: BOT */}
            <button
              onClick={() => setIsBotOpen(true)}
              className="px-1.5 py-1 bg-[#F59E0B] text-[#191C18] font-['Bebas_Neue'] text-xs tracking-wider border border-[#191C18] hover:bg-amber-400 transition-colors flex items-center gap-1 shadow-[1px_1px_0px_#191C18]"
              title="Scorecall Bot"
            >
              <Bot size={13} className="shrink-0" />
              <span className="hidden sm:inline">{t('bot', uiLang)}</span>
            </button>

            {/* Icon Button: HISTORY */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="px-1.5 py-1 bg-white text-[#191C18] font-['Bebas_Neue'] text-xs tracking-wider border border-[#191C18] hover:bg-stone-100 transition-colors flex items-center gap-1 shadow-[1px_1px_0px_#191C18]"
              title="Saved Match History"
            >
              <History size={13} className="shrink-0" />
              <span className="hidden sm:inline">{t('history', uiLang)}</span>
            </button>

            {/* Icon Button: LIVE QR */}
            <button
              onClick={() => setIsSpectatorQROpen(true)}
              className="px-1.5 py-1 bg-white text-[#191C18] font-['Bebas_Neue'] text-xs tracking-wider border border-[#191C18] hover:bg-stone-100 transition-colors flex items-center gap-1 shadow-[1px_1px_0px_#191C18]"
              title="Spectator QR Link"
            >
              <QrCode size={13} className="shrink-0" />
              <span className="hidden sm:inline">{t('liveQr', uiLang)}</span>
            </button>

            {/* Icon Button: SETTINGS */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-1.5 py-1 bg-white text-[#191C18] font-['Bebas_Neue'] text-xs tracking-wider border border-[#191C18] hover:bg-stone-100 transition-colors flex items-center gap-1 shadow-[1px_1px_0px_#191C18]"
              title="Settings & Diagnostics"
            >
              <Settings size={13} className="shrink-0" />
              <span className="hidden sm:inline">{t('settings', uiLang)}</span>
            </button>

            {/* Icon Button: LIVE SCORE ANNOUNCEMENT (TTS) */}
            <button
              onClick={() => {
                const nextState = !voiceReadBack;
                setVoiceReadBack(nextState);
                if (nextState) {
                  speakCricketBall('run', 0, match.totalRuns, match.wickets, undefined, match.striker, uiLang);
                }
              }}
              className={`px-1.5 py-1 font-['Bebas_Neue'] text-xs tracking-wider border border-[#191C18] flex items-center gap-1 shadow-[1px_1px_0px_#191C18] transition-colors ${
                voiceReadBack
                  ? 'bg-[#F59E0B] text-[#191C18] hover:bg-amber-400'
                  : 'bg-stone-300 text-stone-700 hover:bg-stone-200'
              }`}
              title="Toggle Live Score Commentary & Announcements"
            >
              {voiceReadBack ? (
                <Volume2 size={13} className="shrink-0 text-[#191C18]" />
              ) : (
                <VolumeX size={13} className="shrink-0 text-stone-600" />
              )}
              <span>{voiceReadBack ? 'TTS ON' : 'TTS OFF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Responsive layout (stacked on mobile, 2-column on desktop/tablets) */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Match Status, Scoreboard, Ball Feed, Stats */}
          <div className="lg:col-span-7 space-y-3">
            {/* Prominent visible "New Match" button on main screen */}
            <div className="flex items-center justify-between border-2 border-[#191C18] bg-white p-2 shadow-[2px_2px_0px_#191C18]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-['Bebas_Neue'] text-xl text-[#191C18] tracking-wide truncate">
                  {match.teamBatting} vs {match.teamBowling}
                </span>
                <span className="text-[10px] font-bold text-stone-600 uppercase bg-[#F3EFE6] px-1.5 py-0.5 border border-[#191C18] shrink-0">
                  {match.rules.totalOvers} Ov ({match.rules.ballsPerOver}b)
                </span>
              </div>

              <button
                onClick={handleNewMatchClick}
                className="px-3 py-1.5 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-base tracking-wider border-2 border-[#191C18] hover:bg-red-700 transition-colors shadow-[2px_2px_0px_#191C18] flex items-center gap-1.5 active:translate-y-0.5 shrink-0 ml-2"
              >
                <PlusCircle size={15} />
                <span>{t('newMatch', uiLang)}</span>
              </button>
            </div>

            {/* Milestone Notifications */}
            <MilestoneBanner match={match} />

            {/* Live Score Announcement Ticker (TTS visual banner & audio replay) */}
            {voiceReadBack && liveAnnouncement && (
              <div className="flex items-center justify-between bg-[#191C18] text-white px-3 py-2 border-2 border-[#191C18] shadow-[2px_2px_0px_#D32F1E]">
                <div className="flex items-center gap-2 min-w-0">
                  <Volume2 size={16} className="text-[#F59E0B] shrink-0" />
                  <span className="font-['Bebas_Neue'] text-sm tracking-wider text-[#F59E0B] shrink-0">
                    LIVE ANNOUNCEMENT:
                  </span>
                  <span className="text-xs font-semibold truncate text-white">
                    {liveAnnouncement}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => speakText(liveAnnouncement, uiLang)}
                    className="px-2 py-0.5 bg-[#F59E0B] text-[#191C18] font-['Bebas_Neue'] text-xs tracking-wider border border-[#191C18] hover:bg-amber-400"
                    title="Replay Audio Commentary"
                  >
                    Replay Audio
                  </button>
                  <button
                    onClick={() => setLiveAnnouncement(null)}
                    className="text-stone-400 hover:text-white text-xs px-1"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Live Scorecard Display */}
            <LiveScoreDisplay
              match={match}
              onStartSecondInnings={handleStartSecondInnings}
              onOpenScorecard={() => setIsScorecardOpen(true)}
              onOpenDispute={() => setIsDisputeOpen(true)}
            />

            {/* Ball-by-Ball Feed with Spoken Transcripts, Partnership, Target Bar */}
            <BallFeed
              match={match}
              onOpenDispute={() => setIsDisputeOpen(true)}
            />

            {/* Worm Chart Toggle Button */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setShowWormChart(!showWormChart)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#191C18] hover:text-[#D32F1E] transition-colors"
              >
                <TrendingUp size={14} />
                {showWormChart ? 'Hide Worm Chart' : 'Show Worm Chart & Progression'}
              </button>
            </div>

            {/* Worm Chart Panel */}
            {showWormChart && <WormChart match={match} />}
          </div>

          {/* Right Column: Voice Scorer, Tactile Keypad, Quick Actions (Sticky on desktop) */}
          <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-16">
            {/* Voice Input Section */}
            <div>
              <VoiceInputBar
                battingSquad={match.battingSquad}
                bowlingSquad={match.bowlingSquad}
                onParsedResult={handleVoiceParsed}
                disabled={match.status === 'completed'}
                uiLang={uiLang}
              />
            </div>

            {/* Tactile Keypad Scorer & Quick-Action Row */}
            <div>
              <KeypadScorer
                onRecordBall={recordBall}
                onUndo={handleUndo}
                canUndo={undoStack.length > 0}
                disabled={match.status === 'completed'}
                uiLang={uiLang}
                onAddNewBatter={handleAddNewBatterQuick}
                onChangeBowler={handleChangeBowlerQuick}
                onOpenDispute={() => setIsDisputeOpen(true)}
              />
            </div>

            {/* Demo Mode Quick Delivery Bar (if enabled in settings) */}
            {demoMode && (
              <div className="p-2 border-2 border-[#191C18] bg-[#F59E0B] shadow-[2px_2px_0px_#191C18] space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#191C18]">
                  Demo Mode Simulator: Quick Street Deliveries
                </div>
                <div className="grid grid-cols-4 gap-1">
                  <button
                    onClick={() => recordBall({ eventType: 'boundary', runsOffBat: 4, runs: 4 })}
                    className="py-1 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm"
                  >
                    +4 Four
                  </button>
                  <button
                    onClick={() => recordBall({ eventType: 'wicket', dismissalType: 'caught' })}
                    className="py-1 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm text-[#D32F1E]"
                  >
                    +W Catch
                  </button>
                  <button
                    onClick={() => recordBall({ eventType: 'no_ball', runsOffBat: 4 })}
                    className="py-1 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm"
                  >
                    NB + 4
                  </button>
                  <button
                    onClick={() => recordBall({ eventType: 'wide', runsRun: 1 })}
                    className="py-1 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm"
                  >
                    WD + 1
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals & Drawers */}
      <FullScorecardDrawer
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
        match={match}
      />

      <SpectatorQRModal
        isOpen={isSpectatorQROpen}
        onClose={() => setIsSpectatorQROpen(false)}
        matchId={match.id}
      />

      <VoiceConfirmationSheet
        isOpen={isVoiceConfirmOpen}
        parseResult={pendingVoiceResult}
        battingSquad={match.battingSquad}
        bowlingSquad={match.bowlingSquad}
        onConfirm={applyParsedEvents}
        onCancel={() => {
          setIsVoiceConfirmOpen(false);
          setPendingVoiceResult(null);
        }}
      />

      <MatchSetupSheet
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onStartMatch={handleStartConfiguredMatch}
        currentMatch={match}
      />

      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        balls={match.balls}
        onUndoLastBall={handleUndo}
      />

      <ScorecallBotSheet
        isOpen={isBotOpen}
        onClose={() => setIsBotOpen(false)}
        match={match}
      />

      <ShareMatchModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        match={match}
      />

      <MatchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedMatches={savedMatches}
      />

      {/* Requirement 5: Settings, Diagnostics & Rules Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        match={match}
        onUpdateRules={handleUpdateRules}
        uiLang={uiLang}
        onChangeUiLang={setUiLang}
        sunlightMode={sunlightMode}
        onToggleSunlightMode={() => setSunlightMode(!sunlightMode)}
        voiceReadBack={voiceReadBack}
        onToggleVoiceReadBack={() => setVoiceReadBack(!voiceReadBack)}
        demoMode={demoMode}
        onToggleDemoMode={() => setDemoMode(!demoMode)}
      />

      {/* Quick Player Modal for + Batter and Change Bowler */}
      <QuickPlayerModal
        isOpen={isPlayerModalOpen}
        mode={playerModalMode}
        title={playerModalMode === 'batter' ? 'Incoming Batter' : 'Change Bowler'}
        squad={playerModalMode === 'batter' ? match.battingSquad : match.bowlingSquad}
        activePlayers={
          playerModalMode === 'batter'
            ? [match.striker, match.nonStriker, ...match.retiredBatters]
            : [match.currentBowler]
        }
        suggestedName={
          playerModalMode === 'batter'
            ? getNextBatter(
                match.battingSquad,
                match.balls,
                match.striker,
                match.nonStriker,
                match.retiredBatters
              ) || ''
            : match.bowlingSquad.find((b) => b !== match.currentBowler) || ''
        }
        onConfirm={handlePlayerModalConfirm}
        onClose={() => setIsPlayerModalOpen(false)}
      />

      {/* In-app New Match Confirmation Modal */}
      <ConfirmNewMatchModal
        isOpen={isConfirmNewMatchOpen}
        onConfirmSaveAndNew={() => {
          archiveCurrentMatch(match);
          setIsConfirmNewMatchOpen(false);
          setIsSetupOpen(true);
        }}
        onConfirmWithoutSave={() => {
          setIsConfirmNewMatchOpen(false);
          setIsSetupOpen(true);
        }}
        onCancel={() => setIsConfirmNewMatchOpen(false)}
      />
    </div>
  );
}
