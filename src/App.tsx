import React, { useState, useEffect, useRef } from 'react';
import { MatchState, BallRecord, ParseResult, ParsedEvent, GullyRules, UILanguage, RulePreset } from './types/cricket';
import { parseGullySpeechWithLLM, transcribeAudioBlob } from './utils/parserEngine';
import { saveActiveMatch, getActiveMatch, saveMatchToHistory } from './utils/db';
import { speakBallResult, formatResultSpeech } from './utils/speechTts';
import { TRANSLATIONS } from './utils/translations';
import {
  BatIcon,
  StumpsIcon,
  TapeBallIcon,
  MicIcon,
  UndoIcon,
  SwapIcon,
  SpeakerIcon,
  SunIcon,
} from './components/CricketIcons';
import { VoiceConfirmationSheet } from './components/VoiceConfirmationSheet';
import { MatchSetupSheet } from './components/MatchSetupSheet';
import { FullScorecardDrawer } from './components/FullScorecardDrawer';
import { MatchSummaryShareCard } from './components/MatchSummaryShareCard';
import { EvaluationDrawer } from './components/EvaluationDrawer';
import { DisputeModal } from './components/DisputeModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { SpectatorQRModal } from './components/SpectatorQRModal';
import { QuickPlayerActionsModal, ActionModalType } from './components/QuickPlayerActionsModal';
import { SettingsModal } from './components/SettingsModal';
import { LandingPage } from './components/LandingPage';

const DEFAULT_RULES: GullyRules = {
  maxOvers: 4,
  onePitchCatch: true,
  tipAndRun: false,
  noLbw: true,
  lastManBats: true,
  wallTouchTwoRuns: true,
  runsForWide: 1,
  runsForNoBall: 1,
  preset: 'street',
};

const INITIAL_MATCH: MatchState = {
  matchName: "Street Premier League • Finals",
  innings: 1,
  battingTeam: "Gully Tigers",
  bowlingTeam: "Terrace Kings",
  rules: DEFAULT_RULES,
  score: 34,
  wickets: 2,
  oversCompleted: 2,
  ballsInCurrentOver: 3, // 2.3 overs
  striker: "Ravi",
  nonStriker: "Suresh",
  bowler: "Kiran",
  partnership: { runs: 16, balls: 9 },
  batters: {
    "Ravi": { name: "Ravi", runs: 18, balls: 8, fours: 2, sixes: 1, isOut: false },
    "Suresh": { name: "Suresh", runs: 9, balls: 4, fours: 1, sixes: 0, isOut: false },
    "Anil": { name: "Anil", runs: 4, balls: 3, fours: 0, sixes: 0, isOut: true, dismissalInfo: "b Kiran" },
    "Mahesh": { name: "Mahesh", runs: 1, balls: 2, fours: 0, sixes: 0, isOut: true, dismissalInfo: "c 1-Pitch" },
    "Chanti": { name: "Chanti", runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
  },
  bowlers: {
    "Kiran": { name: "Kiran", overs: 1.3, balls: 9, runsConceded: 14, wickets: 2, maidens: 0, dots: 3 },
    "Prasad": { name: "Prasad", overs: 1.0, balls: 6, runsConceded: 19, wickets: 0, maidens: 0, dots: 1 },
  },
  battingOrder: ["Anil", "Mahesh", "Ravi", "Suresh", "Chanti"],
  battingPlayers: ["Anil", "Mahesh", "Ravi", "Suresh", "Chanti"],
  bowlingPlayers: ["Kiran", "Prasad", "Naresh", "Balu", "Gopi"],
  currentOverBalls: [
    { id: 'b1', overIndex: 2, ballInOver: 1, isLegal: true, type: 'dot', runs: 0, extras: 0, striker: 'Ravi', nonStriker: 'Suresh', bowler: 'Kiran', spokenPrompt: "dot ball", timestamp: Date.now() - 60000 },
    { id: 'b2', overIndex: 2, ballInOver: 2, isLegal: true, type: 'run', runs: 4, extras: 0, isBoundary: true, striker: 'Ravi', nonStriker: 'Suresh', bowler: 'Kiran', spokenPrompt: "Ravi four kottadu", timestamp: Date.now() - 40000 },
    { id: 'b3', overIndex: 2, ballInOver: 3, isLegal: true, type: 'run', runs: 1, extras: 0, striker: 'Ravi', nonStriker: 'Suresh', bowler: 'Kiran', spokenPrompt: "single run", timestamp: Date.now() - 20000 },
  ],
  allBalls: [
    { id: 'b-init-1', overIndex: 0, ballInOver: 1, isLegal: true, type: 'wicket', runs: 0, extras: 0, striker: 'Anil', nonStriker: 'Mahesh', bowler: 'Kiran', spokenPrompt: "Anil out bowled", wicket: { dismissal: 'bowled', outBatter: 'Anil' }, timestamp: Date.now() - 180000 },
    { id: 'b-init-2', overIndex: 1, ballInOver: 4, isLegal: true, type: 'wicket', runs: 0, extras: 0, striker: 'Mahesh', nonStriker: 'Ravi', bowler: 'Kiran', spokenPrompt: "Mahesh caught 1-pitch", wicket: { dismissal: 'one_pitch_caught', outBatter: 'Mahesh' }, timestamp: Date.now() - 120000 },
    { id: 'b1', overIndex: 2, ballInOver: 1, isLegal: true, type: 'dot', runs: 0, extras: 0, striker: 'Ravi', nonStriker: 'Suresh', bowler: 'Kiran', spokenPrompt: "dot ball", timestamp: Date.now() - 60000 },
    { id: 'b2', overIndex: 2, ballInOver: 2, isLegal: true, type: 'run', runs: 4, extras: 0, isBoundary: true, striker: 'Ravi', nonStriker: 'Suresh', bowler: 'Kiran', spokenPrompt: "Ravi four kottadu", timestamp: Date.now() - 40000 },
    { id: 'b3', overIndex: 2, ballInOver: 3, isLegal: true, type: 'run', runs: 1, extras: 0, striker: 'Ravi', nonStriker: 'Suresh', bowler: 'Kiran', spokenPrompt: "single run", timestamp: Date.now() - 20000 },
  ],
};

export default function App() {
  const [currentView, setCurrentView] = useState<'app' | 'landing'>('app');
  const [match, setMatch] = useState<MatchState>(INITIAL_MATCH);
  const [history, setHistory] = useState<MatchState[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'error'>('idle');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'tanglish' | 'te' | 'hi' | 'en'>('tanglish');
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en');
  const [notification, setNotification] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [manualVoiceText, setManualVoiceText] = useState('');

  // Feature Toggles
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isVoiceReadBack, setIsVoiceReadBack] = useState(true);
  const [isSunlightMode, setIsSunlightMode] = useState(false);
  const [activePreset, setActivePreset] = useState<RulePreset>('street');

  // Sheet Drawers State
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isShareCardOpen, setIsShareCardOpen] = useState(false);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quickActionModal, setQuickActionModal] = useState<ActionModalType>(null);

  // Insecure origin warning state
  const [isNonLocalInsecure, setIsNonLocalInsecure] = useState(false);

  // Web Speech recognition ref
  const recognitionRef = useRef<any>(null);

  const t = TRANSLATIONS[uiLanguage];

  // Detect insecure HTTP origin (non-localhost) where browsers block mic
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isHttps = window.location.protocol === 'https:';
      if (!isLocal && !isHttps) {
        setIsNonLocalInsecure(true);
      }
    }
  }, []);

  // Load active match from IndexedDB on mount
  useEffect(() => {
    async function loadSaved() {
      try {
        const saved = await getActiveMatch();
        if (saved) {
          setMatch(saved);
        }
      } catch (err) {
        console.warn('IDB load error, using default', err);
      }
    }
    loadSaved();
  }, []);

  // Auto-save to IndexedDB after EVERY ball or state change
  useEffect(() => {
    saveActiveMatch(match);
  }, [match]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 2800);
  };

  const pushHistory = (currentState: MatchState) => {
    setHistory(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(currentState))]);
  };

  const handleUndo = () => {
    if (history.length === 0) {
      showNotification("Venakki velladaniki emi ledu (Nothing to undo)");
      return;
    }
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setMatch(previous);
    if ('vibrate' in navigator) {
      try { navigator.vibrate(30); } catch {}
    }
    showNotification("1 ball roll-back chesam (Undone last ball)");
  };

  const handleSwapStrike = () => {
    setMatch(prev => ({
      ...prev,
      striker: prev.nonStriker,
      nonStriker: prev.striker,
    }));
    if ('vibrate' in navigator) {
      try { navigator.vibrate(25); } catch {}
    }
    showNotification(`Strike swapped: ${match.nonStriker} is now on strike`);
  };

  const recordBall = (
    type: 'run' | 'dot' | 'wide' | 'no_ball' | 'wicket',
    runs: number = 0,
    boundary: boolean = false,
    wicketDetails?: { dismissal: any; outBatter: string },
    spokenTranscript?: string
  ) => {
    pushHistory(match);
    if ('vibrate' in navigator) {
      try { navigator.vibrate(40); } catch {}
    }

    setMatch(prev => {
      const isLegal = type !== 'wide' && type !== 'no_ball';
      const extrasScored = type === 'wide' ? prev.rules.runsForWide : type === 'no_ball' ? prev.rules.runsForNoBall : 0;
      const newScore = prev.score + runs + extrasScored;
      const newWickets = prev.wickets + (type === 'wicket' ? 1 : 0);
      let newBallsInOver = prev.ballsInCurrentOver + (isLegal ? 1 : 0);
      let newOversCompleted = prev.oversCompleted;
      let newCurrentOverBalls = [...prev.currentOverBalls];

      // Update Partnership
      let currentPartnership = prev.partnership || { runs: 0, balls: 0 };
      if (type === 'wicket') {
        currentPartnership = { runs: 0, balls: 0 };
      } else {
        currentPartnership = {
          runs: currentPartnership.runs + runs + extrasScored,
          balls: currentPartnership.balls + (isLegal ? 1 : 0),
        };
      }

      // Striker stats
      const currentStriker = prev.batters[prev.striker] || {
        name: prev.striker, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false
      };
      const updatedStriker = { ...currentStriker };

      if (isLegal) {
        updatedStriker.balls += 1;
      }
      if (type === 'run') {
        updatedStriker.runs += runs;
        if (runs === 4) updatedStriker.fours += 1;
        if (runs === 6) updatedStriker.sixes += 1;
      } else if (type === 'wicket') {
        updatedStriker.isOut = true;
        updatedStriker.dismissalInfo = wicketDetails?.dismissal ? `out (${wicketDetails.dismissal.replace('_', ' ')})` : 'out';
      }

      // Bowler stats
      const currentBowler = prev.bowlers[prev.bowler] || {
        name: prev.bowler, overs: 0, balls: 0, runsConceded: 0, wickets: 0, maidens: 0, dots: 0
      };
      const updatedBowler = { ...currentBowler };
      updatedBowler.runsConceded += runs + extrasScored;
      if (isLegal) updatedBowler.balls += 1;
      if (type === 'wicket') updatedBowler.wickets += 1;
      if (type === 'dot') updatedBowler.dots += 1;

      // Ball record
      const defaultSpoken = type === 'wicket'
        ? `${prev.striker} out`
        : type === 'wide'
        ? 'wide ball'
        : type === 'no_ball'
        ? 'no ball'
        : runs === 0
        ? 'dot ball'
        : `${prev.striker} ${runs} runs`;

      const ballRec: BallRecord = {
        id: `ball-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        overIndex: prev.oversCompleted,
        ballInOver: newBallsInOver,
        isLegal,
        type: type === 'wicket' ? 'wicket' : type,
        runs,
        extras: extrasScored,
        isBoundary: boundary,
        striker: prev.striker,
        nonStriker: prev.nonStriker,
        bowler: prev.bowler,
        wicket: wicketDetails ? { ...wicketDetails } : undefined,
        spokenPrompt: spokenTranscript || defaultSpoken,
        timestamp: Date.now(),
      };

      newCurrentOverBalls.push(ballRec);

      let nextStriker = prev.striker;
      let nextNonStriker = prev.nonStriker;

      // Rotate strike on odd runs
      if (type === 'run' && (runs % 2 !== 0)) {
        nextStriker = prev.nonStriker;
        nextNonStriker = prev.striker;
      }

      // Over completion (6 legal balls)
      if (isLegal && newBallsInOver >= 6) {
        newOversCompleted += 1;
        newBallsInOver = 0;
        newCurrentOverBalls = [];
        // Strike swaps at end of over
        const temp = nextStriker;
        nextStriker = nextNonStriker;
        nextNonStriker = temp;
        showNotification(`Over completed (${newOversCompleted}/${prev.rules.maxOvers})! Switch ends.`);
      }

      // Next batter if wicket fell
      if (type === 'wicket') {
        const remaining = (prev.battingPlayers || prev.battingOrder).filter(
          name => !prev.batters[name]?.isOut && name !== nextNonStriker && name !== nextStriker
        );
        if (remaining.length > 0) {
          nextStriker = remaining[0];
        } else if (prev.rules.lastManBats && nextNonStriker) {
          nextStriker = nextNonStriker;
          nextNonStriker = "(Solo / Last Man)";
        }
      }

      // Voice Read-Back (Audio TTS)
      if (isVoiceReadBack) {
        const ttsSpeech = formatResultSpeech(type, runs, prev.striker, newScore, newWickets, uiLanguage);
        speakBallResult(ttsSpeech, uiLanguage, true);
      }

      return {
        ...prev,
        score: newScore,
        wickets: newWickets,
        oversCompleted: newOversCompleted,
        ballsInCurrentOver: newBallsInOver,
        striker: nextStriker,
        nonStriker: nextNonStriker,
        partnership: currentPartnership,
        batters: {
          ...prev.batters,
          [prev.striker]: updatedStriker,
        },
        bowlers: {
          ...prev.bowlers,
          [prev.bowler]: updatedBowler,
        },
        currentOverBalls: newCurrentOverBalls,
        allBalls: [ballRec, ...prev.allBalls],
      };
    });
  };

  const handleConfirmEvents = (events: ParsedEvent[]) => {
    setIsConfirmationOpen(false);
    for (const evt of events) {
      if (evt.type === 'undo') {
        handleUndo();
        continue;
      }
      if (evt.type === 'runs') {
        recordBall('run', evt.runs || 0, !!evt.boundary, undefined, parseResult?.rawText);
      } else if (evt.type === 'wicket') {
        recordBall('wicket', 0, false, {
          dismissal: evt.dismissal || 'caught',
          outBatter: evt.batter || match.striker,
        }, parseResult?.rawText);
      } else if (evt.type === 'wide') {
        recordBall('wide', evt.runs || 1, false, undefined, parseResult?.rawText);
      } else if (evt.type === 'no_ball') {
        recordBall('no_ball', evt.runs || 1, false, undefined, parseResult?.rawText);
      } else if (evt.type === 'dot') {
        recordBall('dot', 0, false, undefined, parseResult?.rawText);
      }
    }
    showNotification("Ball recorded & saved to IndexedDB!");
  };

  // Process speech text through LLM / parser engine
  const handleProcessSpeechText = async (rawText: string) => {
    setVoiceStatus('processing');
    try {
      const result = await parseGullySpeechWithLLM(rawText, match);
      setParseResult(result);
      setVoiceStatus('idle');
      setIsConfirmationOpen(true);
    } catch {
      setVoiceStatus('error');
      setTimeout(() => setVoiceStatus('idle'), 2000);
    }
  };

  // Start Web Speech recognition
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showNotification("Web SpeechRecognition unavailable. Tap ⌨ to speak via keyboard!");
      setQuickActionModal('mic_help');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;

      if (selectedLanguage === 'te') recognition.lang = 'te-IN';
      else if (selectedLanguage === 'hi') recognition.lang = 'hi-IN';
      else recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setVoiceStatus('listening');
        showNotification("🎤 Mic is listening! Speak clearly...");
        if ('vibrate' in navigator) {
          try { navigator.vibrate(40); } catch {}
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceStatus('processing');
        handleProcessSpeechText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        setVoiceStatus('error');
        if (event.error === 'not-allowed') {
          showNotification("Mic permission blocked! Click 🔒 in address bar or tap Help.");
          setQuickActionModal('mic_help');
        } else if (event.error === 'network') {
          showNotification("Speech network error. Opening manual commentary...");
          setIsVoiceModalOpen(true);
        } else if (event.error === 'no-speech') {
          showNotification("No speech detected. Tap again or speak closer to mic.");
        } else {
          showNotification(`Mic note: ${event.error}. Use Text / Presets fallback.`);
          setIsVoiceModalOpen(true);
        }
        setTimeout(() => setVoiceStatus('idle'), 2500);
      };

      recognition.onend = () => {
        if (voiceStatus === 'listening') {
          setVoiceStatus('idle');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.warn('SpeechRecognition start failed:', err);
      setQuickActionModal('mic_help');
    }
  };

  // Apply Quick Preset
  const handleApplyPreset = (preset: RulePreset) => {
    setActivePreset(preset);
    if (preset === 'street') {
      setMatch(prev => ({
        ...prev,
        rules: { ...prev.rules, maxOvers: 4, onePitchCatch: true, tipAndRun: false, noLbw: true, lastManBats: true, wallTouchTwoRuns: true, preset: 'street' }
      }));
      showNotification("Street Rule Preset Applied (4 Overs, 1-Pitch Catch, 2R Wall)");
    } else if (preset === 'terrace') {
      setMatch(prev => ({
        ...prev,
        rules: { ...prev.rules, maxOvers: 3, onePitchCatch: true, tipAndRun: true, noLbw: true, lastManBats: false, wallTouchTwoRuns: false, preset: 'terrace' }
      }));
      showNotification("Terrace Rule Preset Applied (3 Overs, Tip & Run, Roof Out)");
    } else if (preset === 'box') {
      setMatch(prev => ({
        ...prev,
        rules: { ...prev.rules, maxOvers: 6, onePitchCatch: false, tipAndRun: false, noLbw: true, lastManBats: false, wallTouchTwoRuns: false, preset: 'box' }
      }));
      showNotification("Box Turf Rule Preset Applied (6 Overs, Direct Catches Only)");
    }
  };

  // Calculate Match figures
  const totalBallsBowled = match.oversCompleted * 6 + match.ballsInCurrentOver;
  const currentRunRate = totalBallsBowled > 0 ? ((match.score / totalBallsBowled) * 6).toFixed(1) : "0.0";
  const ballsRemaining = Math.max(0, match.rules.maxOvers * 6 - totalBallsBowled);

  // Second Innings Target calculations
  const isChasing = match.innings === 2 || (match.target !== undefined && match.target > 0);
  const targetScore = match.target || (match.innings === 2 ? 45 : 0);
  const runsNeeded = Math.max(0, targetScore - match.score);
  const requiredRunRate = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 6).toFixed(2) : "0.00";

  const strikerStats = match.batters[match.striker] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
  const nonStrikerStats = match.batters[match.nonStriker] || { runs: 0, balls: 0, fours: 0, sixes: 0 };
  const bowlerStats = match.bowlers[match.bowler] || { overs: 0, balls: 0, runsConceded: 0, wickets: 0 };
  const activePartnership = match.partnership || { runs: strikerStats.runs + nonStrikerStats.runs, balls: strikerStats.balls + nonStrikerStats.balls };

  // If user navigated to the Landing Page view
  if (currentView === 'landing') {
    return <LandingPage onLaunchScorer={() => setCurrentView('app')} />;
  }

  return (
    <div className={`min-h-screen ${isSunlightMode ? 'bg-black text-white' : 'painted-wall-bg text-[#191C18]'} flex justify-center pb-12 selection:bg-[#D32F1E] selection:text-white`}>
      {/* Mobile container - Max 480px width for true single-handed street play */}
      <div className={`w-full max-w-md flex flex-col justify-between min-h-screen border-x-3 ${isSunlightMode ? 'border-yellow-400 bg-black' : 'border-[#191C18] bg-[#F7F3E9]'} shadow-2xl relative`}>
        
        {/* INSECURE ORIGIN WARNING BANNER (Shows on non-localhost HTTP mobile connections) */}
        {isNonLocalInsecure && (
          <div 
            onClick={() => setQuickActionModal('mic_help')}
            className="bg-[#D32F1E] text-white text-[11px] font-bold px-3 py-1.5 flex items-center justify-between cursor-pointer border-b-2 border-black"
          >
            <div className="flex items-center gap-1.5">
              <span>⚠️</span>
              <span>LAN HTTP: Chrome blocks mic. Tap for localhost/mobile setup.</span>
            </div>
            <span className="underline ml-1">Fix</span>
          </div>
        )}

        {/* 1. TOURNAMENT HEADER STENCIL */}
        <header className={`${isSunlightMode ? 'bg-black border-yellow-400' : 'bg-[#191C18] border-[#191C18]'} text-[#F3EFE6] px-3 py-2 flex items-center justify-between border-b-3`}>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 bg-[#D32F1E] text-white flex items-center justify-center font-display text-xl rounded-xs font-bold border-2 border-white/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <h1 className="font-display text-lg tracking-wider uppercase text-white">SCORECALL</h1>
                <span className="text-[9px] bg-[#FFB800] text-[#191C18] px-1 py-0.2 rounded-xs font-black uppercase flex-badge">
                  {t.voiceBadge}
                </span>
              </div>
              <p className="text-[10px] text-[#A69E8D] uppercase font-bold tracking-tight">
                {match.battingTeam} vs {match.bowlingTeam}
              </p>
            </div>
          </div>

          {/* Quick Header Utilities */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSetupOpen(true)}
              className="px-1.5 py-1 bg-[#282C26] hover:bg-[#383E35] text-[#D8D2C2] border border-[#524E43] rounded text-[11px] font-bold press-action"
              title="Match Setup"
            >
              {t.setup}
            </button>
            <button
              onClick={() => setIsScorecardOpen(true)}
              className="px-1.5 py-1 bg-[#282C26] hover:bg-[#383E35] text-[#D8D2C2] border border-[#524E43] rounded text-[11px] font-bold press-action"
              title="Full Scorecard"
            >
              {t.card}
            </button>
            <button
              onClick={() => setIsShareCardOpen(true)}
              className="px-1.5 py-1 bg-[#D32F1E] text-white border border-[#FF6B5C] rounded text-[11px] font-bold press-action flex items-center gap-0.5"
              title="Share Flex Banner"
            >
              <span>{t.share}</span>
            </button>
            <button
              onClick={() => setCurrentView('landing')}
              className="px-1.5 py-1 bg-[#191C18] text-[#FFB800] border border-[#FFB800] rounded text-[11px] font-bold press-action"
              title="Landing Page"
            >
              {t.landingPage}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1 text-[#CFC8B6] hover:text-white press-action rounded text-xs"
              title="Scorecall Settings & Modes"
            >
              ⚙
            </button>
          </div>
        </header>

        {/* Floating toast notification */}
        {notification && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#191C18] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xl border border-amber-400 flex items-center gap-2 animate-in fade-in duration-100">
            <span className="w-2 h-2 rounded-full bg-[#FFB800]" />
            <span>{notification}</span>
          </div>
        )}

        {/* 2. SECOND-INNINGS TARGET BAR (Displays when in 2nd Innings or target is active) */}
        {isChasing && (
          <section className="bg-[#FFE500] text-[#191C18] px-3 py-1.5 border-b-2 border-black flex items-center justify-between font-bold text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base tracking-wide uppercase bg-black text-white px-1.5 py-0.5 rounded-xs">
                {t.target} {targetScore}
              </span>
              <span className="text-xs">
                {runsNeeded === 0 ? "TARGET REACHED! WIN!" : `${t.needRuns} ${runsNeeded} off ${ballsRemaining} ${t.ballsLeft}`}
              </span>
            </div>
            <div className="font-mono text-[11px] text-right">
              <span>{t.rrr} {requiredRunRate}</span>
            </div>
          </section>
        )}

        {/* MAIN SCORING VIEWPORT (Optimized for 390x800 - Mic fully visible without scrolling!) */}
        <main className="flex-1 flex flex-col justify-start p-2.5 gap-2">
          
          {/* THE CHALK SCOREBOARD PANEL */}
          <section 
            aria-label="Live Match Score"
            className={`${isSunlightMode ? 'bg-black text-white border-4 border-yellow-400' : 'bg-[#191C18] text-[#F3EFE6] chalk-border-thick'} rounded-xl p-3 relative overflow-hidden`}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-[#A8A190] uppercase tracking-wider mb-0.5">
              <span>{match.battingTeam} · {match.innings === 1 ? '1st Inn' : '2nd Inn (Chase)'}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#FFB800]">{t.crr} {currentRunRate}</span>
                <span className="text-[10px] bg-[#2E332B] px-1.5 py-0.5 rounded text-gray-300 font-mono">
                  {parseResult?.engine === 'claude-haiku-5-5' ? 'AI parsing' : 'Offline mode'}
                </span>
              </div>
            </div>

            {/* HERO SCORE & OVERS */}
            <div className="flex items-baseline justify-between mt-0.5">
              <div className="flex items-baseline">
                <span className={`font-display text-6xl font-black tracking-tight ${isSunlightMode ? 'text-yellow-400' : 'text-white'} leading-none`}>
                  {match.score}
                </span>
                <span className="font-display text-4xl font-bold text-[#D32F1E] ml-1 leading-none">
                  /{match.wickets}
                </span>
              </div>

              <div className="text-right">
                <div className="flex items-baseline justify-end leading-none">
                  <span className="font-display text-3xl text-[#E5DFCF]">
                    {match.oversCompleted}.{match.ballsInCurrentOver}
                  </span>
                  <span className="font-display text-xl text-[#8E8675] ml-1">
                    /{match.rules.maxOvers} {t.overs}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-[#A8A190] mt-0.5">
                  {ballsRemaining > 0 ? `${ballsRemaining} ${t.ballsLeft}` : t.finalOver}
                </p>
              </div>
            </div>

            {/* BALL-BY-BALL CHALK STRIP (THIS OVER) */}
            <div className="mt-2.5 pt-2 border-t border-[#383C35] flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8675]">
                {t.thisOver}
              </span>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4, 5].map((ballIndex) => {
                  const ball = match.currentOverBalls[ballIndex];
                  if (!ball) {
                    return (
                      <div
                        key={ballIndex}
                        className="w-7 h-7 rounded-xs border border-[#3E423B] bg-[#232721] flex items-center justify-center text-[#5C6157] text-xs font-mono font-bold"
                      >
                        -
                      </div>
                    );
                  }

                  let badgeColor = "bg-[#2E332B] text-white border-[#555C50]";
                  let text = `${ball.runs}`;
                  if (ball.type === 'wicket') {
                    badgeColor = "bg-[#D32F1E] text-white border-[#FF4D3B] font-bold";
                    text = "W";
                  } else if (ball.type === 'wide') {
                    badgeColor = "bg-[#65338E] text-white border-[#8D4BBE]";
                    text = `Wd`;
                  } else if (ball.type === 'no_ball') {
                    badgeColor = "bg-[#B84014] text-white border-[#E65620]";
                    text = `Nb`;
                  } else if (ball.isBoundary) {
                    badgeColor = "bg-[#FFB800] text-[#191C18] border-[#FFE082] font-black";
                  } else if (ball.runs === 0) {
                    text = "•";
                    badgeColor = "bg-[#252822] text-[#8C9483] border-[#3E423B]";
                  }

                  return (
                    <div
                      key={ballIndex}
                      className={`w-7 h-7 rounded-xs border flex items-center justify-center text-xs font-display tracking-tight ${badgeColor}`}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 3. VOICE BAR DIRECTLY UNDER OVER TILES (Requirement 1 - Visible without scrolling on 390x800!) */}
          <section className="space-y-1.5">
            <div className="flex gap-2">
              <button
                onClick={startListening}
                disabled={voiceStatus === 'processing'}
                className={`flex-1 h-14 rounded-xl border-3 ${isSunlightMode ? 'border-yellow-400 bg-yellow-400 text-black' : 'border-[#191C18] chalk-border-thick bg-[#D32F1E] text-white'} flex items-center justify-between px-3 press-action transition-all cursor-pointer ${
                  voiceStatus === 'listening'
                    ? 'bg-[#B72212] animate-pulse ring-4 ring-red-400'
                    : voiceStatus === 'processing'
                    ? 'bg-[#E5A800] text-[#191C18]'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full ${isSunlightMode ? 'bg-black text-white' : 'bg-white/20'} flex items-center justify-center`}>
                    <MicIcon className="w-5 h-5" isRecording={voiceStatus === 'listening'} />
                  </div>
                  <div className="text-left">
                    <div className="font-display text-xl tracking-wide uppercase leading-none">
                      {voiceStatus === 'listening'
                        ? t.listening
                        : voiceStatus === 'processing'
                        ? t.aiParsing
                        : t.tapToSpeak}
                    </div>
                    <div className="text-[10px] font-semibold opacity-90 leading-none mt-0.5">
                      "Ravi four kottadu" · "Out ayyadu" · "Wide Suresh 2"
                    </div>
                  </div>
                </div>

                {/* Right badges: Audio TTS indicator + Engine pill */}
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${isSunlightMode ? 'bg-black text-yellow-400' : 'bg-black/30 text-white'}`}>
                    {selectedLanguage.toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Text input button beside mic */}
              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className={`w-12 h-14 ${isSunlightMode ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-[#191C18] text-white border-[#191C18]'} rounded-xl border-3 chalk-border flex flex-col items-center justify-center press-action shrink-0`}
                title="Type or dictate commentary"
              >
                <span className="text-base">⌨</span>
                <span className="text-[9px] font-bold uppercase tracking-tight text-[#FFB800]">{t.textInput}</span>
              </button>
            </div>

            {/* 4. COMPACT BACKUP KEYPAD (Directly below Voice Bar) */}
            <div className="bg-[#EDE7DA] border-2 border-[#191C18] rounded-lg p-1.5 space-y-1">
              <div className="grid grid-cols-5 gap-1">
                <button
                  onClick={() => recordBall('dot', 0)}
                  className="h-9 bg-white border border-[#191C18] rounded font-display text-lg font-bold press-action text-[#191C18]"
                >
                  0
                </button>
                <button
                  onClick={() => recordBall('run', 1)}
                  className="h-9 bg-white border border-[#191C18] rounded font-display text-lg font-bold press-action text-[#191C18]"
                >
                  1
                </button>
                <button
                  onClick={() => recordBall('run', 2)}
                  className="h-9 bg-white border border-[#191C18] rounded font-display text-lg font-bold press-action text-[#191C18]"
                >
                  2
                </button>
                <button
                  onClick={() => recordBall('run', 4, true)}
                  className="h-9 bg-[#FFB800] border border-[#191C18] rounded font-display text-xl font-black press-action text-[#191C18]"
                >
                  4
                </button>
                <button
                  onClick={() => recordBall('run', 6, true)}
                  className="h-9 bg-[#FFB800] border border-[#191C18] rounded font-display text-xl font-black press-action text-[#191C18]"
                >
                  6
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1">
                <button
                  onClick={() => recordBall('wide', 1)}
                  className="h-8 bg-[#FAF7F0] border border-[#191C18] rounded text-[10px] font-bold press-action text-[#4D2373]"
                >
                  {t.wide}
                </button>
                <button
                  onClick={() => recordBall('no_ball', 1)}
                  className="h-8 bg-[#FAF7F0] border border-[#191C18] rounded text-[10px] font-bold press-action text-[#8A300E]"
                >
                  {t.noBall}
                </button>
                <button
                  onClick={() => recordBall('wicket', 0, false, { dismissal: 'caught', outBatter: match.striker })}
                  className="h-8 bg-[#D32F1E] border border-[#191C18] text-white rounded text-[10px] font-bold press-action"
                >
                  {t.wicketOut}
                </button>
                <button
                  onClick={handleUndo}
                  className="h-8 bg-[#FAF7F0] border border-[#191C18] rounded text-[10px] font-bold press-action text-[#615949]"
                >
                  {t.undo}
                </button>
                <button
                  onClick={handleSwapStrike}
                  className="h-8 bg-[#FAF7F0] border border-[#191C18] rounded text-[10px] font-bold press-action text-[#191C18]"
                  title="Swap Strike"
                >
                  ⇄
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS BAR: Retire / New Batter / Change Bowler / Dispute Button */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar text-xs">
              <button
                onClick={() => setQuickActionModal('new_batter')}
                className="px-2 py-1 bg-white border border-[#191C18] rounded font-bold text-[11px] text-[#191C18] press-action shrink-0"
              >
                {t.newBatter}
              </button>
              <button
                onClick={() => setQuickActionModal('change_bowler')}
                className="px-2 py-1 bg-white border border-[#191C18] rounded font-bold text-[11px] text-[#191C18] press-action shrink-0"
              >
                {t.changeBowler}
              </button>
              <button
                onClick={() => setQuickActionModal('retire')}
                className="px-2 py-1 bg-white border border-[#191C18] rounded font-bold text-[11px] text-[#8C2314] press-action shrink-0"
              >
                {t.retire}
              </button>
              <button
                onClick={() => setIsDisputeOpen(true)}
                className="px-2 py-1 bg-[#D32F1E] text-white border border-black rounded font-bold text-[11px] press-action shrink-0 flex items-center gap-1"
              >
                <span>⚡</span>
                <span>{t.disputeButton}</span>
              </button>
              <button
                onClick={() => setIsQROpen(true)}
                className="px-2 py-1 bg-[#282C26] text-[#FFB800] border border-black rounded font-bold text-[11px] press-action shrink-0"
              >
                {t.liveLink}
              </button>
              <button
                onClick={() => setIsLeaderboardOpen(true)}
                className="px-2 py-1 bg-[#282C26] text-white border border-black rounded font-bold text-[11px] press-action shrink-0"
              >
                {t.leaderboard}
              </button>
            </div>
          </section>

          {/* 5. PARTNERSHIP TRACKER BAR */}
          <div className="bg-[#FAF2E1] border-2 border-[#DEC99B] rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#6D4C00]">{t.partnership}</span>
              <span className="font-display text-lg text-[#191C18] leading-none">
                {activePartnership.runs} runs
              </span>
              <span className="text-[11px] text-gray-600 font-mono">
                ({activePartnership.balls} balls)
              </span>
            </div>
            <div className="text-[10px] text-[#6D4C00] font-semibold">
              {match.striker} & {match.nonStriker}
            </div>
          </div>

          {/* 6. ACTIVE PLAYERS ON THE PITCH */}
          <section className="bg-white rounded-xl p-2.5 border-2 border-[#191C18] chalk-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Striker */}
              <div className="p-2 rounded-lg bg-[#FAF0ED] border-2 border-[#D32F1E] relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <BatIcon className="w-3.5 h-3.5 text-[#D32F1E]" />
                    <span className="font-bold text-xs text-[#191C18] tracking-tight">
                      {match.striker} *
                    </span>
                  </div>
                  <span className="text-[9px] bg-[#D32F1E] text-white px-1 font-bold rounded-xs">
                    {t.striker}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-xl font-bold text-[#191C18] leading-none">
                    {strikerStats.runs}
                  </span>
                  <span className="text-[11px] text-[#524E43] font-mono">
                    ({strikerStats.balls}b · {strikerStats.fours}×4 {strikerStats.sixes}×6)
                  </span>
                </div>
              </div>

              {/* Non-Striker */}
              <div className="p-2 rounded-lg bg-[#F5F2EB] border-2 border-[#D8D2C2]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#504C42] tracking-tight">
                    {match.nonStriker}
                  </span>
                  <span className="text-[9px] text-[#7E786B] font-semibold">{t.runner}</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="font-display text-xl font-bold text-[#504C42] leading-none">
                    {nonStrikerStats.runs}
                  </span>
                  <span className="text-[11px] text-[#6A6456] font-mono">
                    ({nonStrikerStats.balls}b)
                  </span>
                </div>
              </div>
            </div>

            {/* Bowler Figures Row */}
            <div className="flex items-center justify-between pt-1 border-t border-[#EAE4D6]">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-[#6B6455]">{t.bowler}:</span>
                <span className="text-xs font-bold text-[#191C18]">{match.bowler}</span>
                <span className="text-[11px] font-mono text-[#6B6455]">
                  ({bowlerStats.wickets}/{bowlerStats.runsConceded} in {bowlerStats.balls}b)
                </span>
              </div>
              <button
                onClick={() => setQuickActionModal('change_bowler')}
                className="text-[11px] font-bold text-[#D32F1E] hover:underline"
              >
                Change
              </button>
            </div>
          </section>

          {/* 7. DEMO MODE SAMPLE PHRASES BOX (Hidden by default; toggled in Settings!) */}
          {isDemoMode && (
            <div className="bg-[#FAF0D9] border-2 border-[#E0BD62] rounded-lg p-2 space-y-1.5 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#6D4C00]">
                <span>{t.samplePhrases}</span>
                <button
                  onClick={() => setIsDemoMode(false)}
                  className="text-[10px] text-gray-500 hover:text-black font-normal"
                >
                  Hide
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <button
                  onClick={() => handleProcessSpeechText("Ravi hit a four, then got out caught")}
                  className="text-left p-1.5 bg-white border border-[#D0AA40] rounded press-action font-medium hover:bg-amber-50 text-[11px]"
                >
                  "Ravi hit a four, then got out caught"
                </button>
                <button
                  onClick={() => handleProcessSpeechText("wide, then Kiran bowled it, Suresh took two")}
                  className="text-left p-1.5 bg-white border border-[#D0AA40] rounded press-action font-medium hover:bg-amber-50 text-[11px]"
                >
                  "wide, then Suresh took two"
                </button>
                <button
                  onClick={() => handleProcessSpeechText("Anil sixer kottadu, next ball dot")}
                  className="text-left p-1.5 bg-white border border-[#D0AA40] rounded press-action font-medium hover:bg-amber-50 text-[11px]"
                >
                  "Anil sixer kottadu, next ball dot"
                </button>
                <button
                  onClick={() => handleProcessSpeechText("he got out")}
                  className="text-left p-1.5 bg-white border border-[#D0AA40] rounded press-action font-medium hover:bg-amber-50 text-[11px] text-[#8F170C]"
                >
                  "he got out" (Clarify check)
                </button>
              </div>
            </div>
          )}

          {/* 8. BALL-BY-BALL FEED WITH SPOKEN TRANSCRIPT PER BALL */}
          <section className="bg-white rounded-xl p-2.5 border-2 border-[#191C18] space-y-1.5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <span className="font-display text-sm tracking-wide uppercase text-[#191C18]">
                {t.ballFeedTitle}
              </span>
              <span className="text-[10px] text-gray-500 font-mono">
                {match.allBalls.length} balls bowled
              </span>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 divide-y divide-gray-100">
              {match.allBalls.length === 0 ? (
                <p className="text-gray-400 italic text-center py-2 text-xs">
                  No deliveries recorded yet. Tap Speak or 0-6 keypad!
                </p>
              ) : (
                match.allBalls.slice(0, 10).map((ball) => (
                  <div key={ball.id} className="pt-1.5 first:pt-0 flex items-start justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[10px] px-1 py-0.2 bg-[#191C18] text-white rounded-xs">
                          {ball.overIndex}.{ball.ballInOver}
                        </span>
                        <span className="font-bold text-[#191C18]">
                          {ball.striker}
                        </span>
                        <span className="text-gray-500 text-[10px]">
                          vs {ball.bowler}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 italic">
                        🎙️ "{ball.spokenPrompt || `${ball.runs} runs`}"
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block font-display text-sm px-1.5 py-0.5 rounded font-bold ${
                        ball.type === 'wicket'
                          ? 'bg-[#D32F1E] text-white'
                          : ball.isBoundary
                          ? 'bg-[#FFB800] text-[#191C18]'
                          : ball.type === 'wide' || ball.type === 'no_ball'
                          ? 'bg-purple-100 text-purple-900 border border-purple-300'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ball.type === 'wicket' ? 'W' : ball.type === 'wide' ? 'WD' : ball.type === 'no_ball' ? 'NB' : ball.runs === 0 ? '•' : `${ball.runs}`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </main>

        {/* BOTTOM UTILITY FOOTER */}
        <footer className="bg-[#EDE7DA] border-t-2 border-[#191C18] px-3 py-1.5 flex items-center justify-between text-[11px] font-bold text-[#635D50]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="text-[#191C18] hover:underline"
            >
              {t.history}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsVoiceReadBack(!isVoiceReadBack)}
              className="flex items-center gap-1 hover:text-black"
              title="Toggle Audio Voice Read-Back"
            >
              <SpeakerIcon className="w-3.5 h-3.5 text-[#D32F1E]" isMuted={!isVoiceReadBack} />
              <span>{isVoiceReadBack ? 'TTS On' : 'TTS Off'}</span>
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSunlightMode(!isSunlightMode)}
              className="flex items-center gap-1 hover:text-black"
              title="Toggle Sunlight High-Contrast Mode"
            >
              <SunIcon className="w-3.5 h-3.5 text-[#FFB800]" />
              <span>{isSunlightMode ? 'Sunlight' : 'Standard'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 bg-[#DDD7C9] p-0.5 rounded border border-[#C5BDAE]">
            {(['tanglish', 'te', 'hi', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => {
                  setSelectedLanguage(lang);
                  if (lang === 'te') setUiLanguage('te');
                  else if (lang === 'hi') setUiLanguage('hi');
                  else setUiLanguage('en');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  selectedLanguage === lang
                    ? 'bg-white text-[#191C18] shadow-xs'
                    : 'text-[#6B6454]'
                }`}
              >
                {lang === 'tanglish' ? 'Tanglish' : lang === 'te' ? 'తెలుగు' : lang === 'hi' ? 'हिंदी' : 'Eng'}
              </button>
            ))}
          </div>
        </footer>

        {/* 1. VOICE CONFIRMATION BOTTOM SHEET DRAWER */}
        <VoiceConfirmationSheet
          isOpen={isConfirmationOpen}
          parseResult={parseResult}
          striker={match.striker}
          nonStriker={match.nonStriker}
          onConfirm={handleConfirmEvents}
          onCancel={() => setIsConfirmationOpen(false)}
          onRetryVoice={() => {
            setIsConfirmationOpen(false);
            startListening();
          }}
        />

        {/* 2. MATCH SETUP SHEET */}
        <MatchSetupSheet
          isOpen={isSetupOpen}
          currentMatch={match}
          onClose={() => setIsSetupOpen(false)}
          onSaveMatch={(newMatch) => {
            setMatch(newMatch);
            setHistory([]);
            saveMatchToHistory(match);
            showNotification("Kotha match start chesam! (New match started)");
          }}
        />

        {/* 3. FULL SCORECARD DRAWER */}
        <FullScorecardDrawer
          isOpen={isScorecardOpen}
          match={match}
          onClose={() => setIsScorecardOpen(false)}
        />

        {/* 4. MATCH SUMMARY / SHARE CARD */}
        <MatchSummaryShareCard
          isOpen={isShareCardOpen}
          match={match}
          onClose={() => setIsShareCardOpen(false)}
        />

        {/* 5. EVALUATION MODE DRAWER */}
        <EvaluationDrawer
          isOpen={isEvalOpen}
          onClose={() => setIsEvalOpen(false)}
        />

        {/* 6. DISPUTE REPLAY MODAL (Replays last 6 balls) */}
        <DisputeModal
          isOpen={isDisputeOpen}
          recentBalls={match.allBalls}
          onClose={() => setIsDisputeOpen(false)}
          onUndoLast={() => {
            handleUndo();
            setIsDisputeOpen(false);
          }}
        />

        {/* 7. LEADERBOARD MODAL */}
        <LeaderboardModal
          isOpen={isLeaderboardOpen}
          match={match}
          onClose={() => setIsLeaderboardOpen(false)}
        />

        {/* 8. MATCH HISTORY MODAL */}
        <MatchHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onLoadMatch={(loadedMatch) => {
            setMatch(loadedMatch);
            setIsHistoryOpen(false);
            showNotification(`Loaded match: ${loadedMatch.matchName}`);
          }}
        />

        {/* 9. SPECTATOR QR MODAL */}
        <SpectatorQRModal
          isOpen={isQROpen}
          matchName={match.matchName}
          onClose={() => setIsQROpen(false)}
        />

        {/* 10. QUICK PLAYER ACTIONS MODAL (Retire / New Batter / Change Bowler / Mic Help) */}
        <QuickPlayerActionsModal
          type={quickActionModal}
          match={match}
          onClose={() => setQuickActionModal(null)}
          onRetireBatter={(retiringBatter, newBatter) => {
            pushHistory(match);
            setMatch(prev => ({
              ...prev,
              striker: prev.striker === retiringBatter ? newBatter : prev.striker,
              nonStriker: prev.nonStriker === retiringBatter ? newBatter : prev.nonStriker,
              batters: {
                ...prev.batters,
                [retiringBatter]: {
                  ...prev.batters[retiringBatter],
                  isOut: true,
                  dismissalInfo: 'retired hurt',
                },
                [newBatter]: prev.batters[newBatter] || { name: newBatter, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
              },
            }));
            showNotification(`${retiringBatter} retired. ${newBatter} is at crease.`);
          }}
          onSelectNewBatter={(batterName, isStriker) => {
            pushHistory(match);
            setMatch(prev => ({
              ...prev,
              striker: isStriker ? batterName : prev.striker,
              nonStriker: !isStriker ? batterName : prev.nonStriker,
              batters: {
                ...prev.batters,
                [batterName]: prev.batters[batterName] || { name: batterName, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
              },
            }));
            showNotification(`${batterName} added to batting.`);
          }}
          onChangeBowler={(newBowler) => {
            pushHistory(match);
            setMatch(prev => ({
              ...prev,
              bowler: newBowler,
              bowlers: {
                ...prev.bowlers,
                [newBowler]: prev.bowlers[newBowler] || { name: newBowler, overs: 0, balls: 0, runsConceded: 0, wickets: 0, maidens: 0, dots: 0 },
              },
            }));
            showNotification(`Bowler changed to ${newBowler}`);
          }}
        />

        {/* 11. SETTINGS MODAL */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          uiLanguage={uiLanguage}
          onSelectLanguage={(lang) => {
            setUiLanguage(lang);
            if (lang === 'te') setSelectedLanguage('te');
            else if (lang === 'hi') setSelectedLanguage('hi');
            else setSelectedLanguage('en');
          }}
          isDemoMode={isDemoMode}
          onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
          isVoiceReadBack={isVoiceReadBack}
          onToggleVoiceReadBack={() => setIsVoiceReadBack(!isVoiceReadBack)}
          isSunlightMode={isSunlightMode}
          onToggleSunlightMode={() => setIsSunlightMode(!isSunlightMode)}
          activePreset={activePreset}
          onApplyPreset={handleApplyPreset}
          onOpenMicHelp={() => setQuickActionModal('mic_help')}
          onOpenEvaluation={() => setIsEvalOpen(true)}
        />

        {/* 12. VOICE INPUT / DICTATION MODAL */}
        {isVoiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-[#FAF7F0] border-4 border-[#191C18] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#D32F1E] rounded-full animate-pulse" />
                  <h2 className="font-display text-2xl tracking-wide uppercase">Voice Commentary Input</h2>
                </div>
                <button
                  onClick={() => setIsVoiceModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-white press-action"
                >
                  <span className="font-bold text-lg">✕</span>
                </button>
              </div>

              <div className="p-4 space-y-3.5 overflow-y-auto text-xs">
                {/* Browser permission tip */}
                <div className="p-2.5 bg-[#FFF4D9] border border-[#E5A800] rounded-lg text-[11px] text-[#664D00] space-y-1">
                  <span className="font-bold block">💡 Browser Mic Permission Tip:</span>
                  <p>
                    On mobile Wi-Fi, browsers require HTTPS or localhost. If mic is blocked, click <b>🔒 lock icon</b> in address bar or tap your keyboard's built-in microphone key to dictate below!
                  </p>
                </div>

                {/* Spoken input box */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#615A4B] mb-1">
                    Say or type ball commentary:
                  </label>
                  <input
                    type="text"
                    value={manualVoiceText}
                    onChange={(e) => setManualVoiceText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && manualVoiceText.trim()) {
                        setIsVoiceModalOpen(false);
                        handleProcessSpeechText(manualVoiceText.trim());
                        setManualVoiceText('');
                      }
                    }}
                    placeholder="e.g. Ravi four kottadu, next ball out..."
                    className="w-full bg-white border-2 border-[#191C18] rounded-lg px-3 py-2.5 text-sm font-bold text-[#191C18] focus:outline-none focus:ring-2 focus:ring-[#D32F1E]"
                    autoFocus
                  />
                </div>

                {/* Quick 1-tap presets */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#615A4B] block mb-1">
                    Or tap realistic street commentary:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      "Ravi hit a four, then got out caught",
                      "Anil sixer kottadu, next ball dot",
                      "wide, then Suresh took two",
                      "Kiran bowled clean out",
                      "dot ball",
                      "undo that",
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setIsVoiceModalOpen(false);
                          handleProcessSpeechText(preset);
                        }}
                        className="p-2 text-left bg-white border border-[#D5CEBC] rounded-md font-semibold hover:bg-amber-50 press-action text-[11px] text-[#191C18]"
                      >
                        "{preset}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-3 bg-[#EAE3D4] border-t-2 border-[#191C18] flex items-center justify-between gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceModalOpen(false);
                    startListening();
                  }}
                  className="px-3.5 py-2.5 bg-white border-2 border-[#191C18] rounded-lg text-xs font-bold press-action"
                >
                  Start Chrome Mic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (manualVoiceText.trim()) {
                      setIsVoiceModalOpen(false);
                      handleProcessSpeechText(manualVoiceText.trim());
                      setManualVoiceText('');
                    }
                  }}
                  disabled={!manualVoiceText.trim()}
                  className="flex-1 py-2.5 bg-[#D32F1E] text-white rounded-lg font-display text-lg tracking-wide uppercase press-action disabled:opacity-50"
                >
                  Parse Commentary
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
