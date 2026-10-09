import { UILanguage } from '../types/cricket';

export interface UIStrings {
  appName: string;
  voiceBadge: string;
  setup: string;
  card: string;
  share: string;
  history: string;
  dispute: string;
  leaderboard: string;
  liveLink: string;
  landingPage: string;
  liveApp: string;
  
  // Scoreboard
  battingInnings: string;
  overs: string;
  ballsLeft: string;
  finalOver: string;
  thisOver: string;
  target: string;
  needRuns: string;
  crr: string;
  rrr: string;
  partnership: string;

  // Voice bar
  tapToSpeak: string;
  listening: string;
  aiParsing: string;
  offlineMode: string;
  samplePhrases: string;
  textInput: string;

  // Keypad
  wide: string;
  noBall: string;
  wicketOut: string;
  undo: string;

  // Actions
  retire: string;
  newBatter: string;
  changeBowler: string;
  swapStrike: string;

  // Players
  striker: string;
  runner: string;
  bowler: string;

  // Feed
  ballFeedTitle: string;
  disputeButton: string;
}

export const TRANSLATIONS: Record<UILanguage, UIStrings> = {
  en: {
    appName: "SCORECALL",
    voiceBadge: "VOICE",
    setup: "Setup",
    card: "Card",
    share: "Share",
    history: "History",
    dispute: "Dispute",
    leaderboard: "Board",
    liveLink: "Live QR",
    landingPage: "Landing",
    liveApp: "Live Scorer",

    battingInnings: "Batting",
    overs: "ov",
    ballsLeft: "balls left",
    finalOver: "Final Over",
    thisOver: "This Over:",
    target: "Target:",
    needRuns: "Need",
    crr: "CRR:",
    rrr: "RRR:",
    partnership: "Partnership:",

    tapToSpeak: "TAP TO SPEAK (VOICE SCORE)",
    listening: "LISTENING... (SPEAK NOW)",
    aiParsing: "AI PARSING...",
    offlineMode: "Offline mode",
    samplePhrases: "Sample Voice Speech (Demo Mode):",
    textInput: "Text",

    wide: "WIDE",
    noBall: "NO BALL",
    wicketOut: "OUT (WKT)",
    undo: "UNDO",

    retire: "Retire",
    newBatter: "+ Batter",
    changeBowler: "Bowler",
    swapStrike: "Swap Strike",

    striker: "STRIKE",
    runner: "RUNNER",
    bowler: "Bowler",

    ballFeedTitle: "Recent Ball Spoken Transcripts",
    disputeButton: "Dispute (Replay 6)",
  },
  te: {
    appName: "SCORECALL",
    voiceBadge: "వాయిస్",
    setup: "సెటప్",
    card: "కార్డ్",
    share: "షేర్",
    history: "చరిత్ర",
    dispute: "పంచాయతీ",
    leaderboard: "బోర్డు",
    liveLink: "QR కోడ్",
    landingPage: "పేజీ",
    liveApp: "లైవ్ స్కోరర్",

    battingInnings: "బ్యాటింగ్",
    overs: "ఓవర్లు",
    ballsLeft: "బంతులు మిగిలాయి",
    finalOver: "ఆఖరి ఓవర్",
    thisOver: "ఈ ఓవర్:",
    target: "లక్ష్యం:",
    needRuns: "కావాలి",
    crr: "CRR:",
    rrr: "RRR:",
    partnership: "భాగస్వామ్యం:",

    tapToSpeak: "మాట్లాడి స్కోర్ చేయండి (వాయిస్)",
    listening: "వింటున్నా... (చెప్పండి)",
    aiParsing: "AI లెక్కిస్తోంది...",
    offlineMode: "ఆఫ్‌లైన్ మోడ్",
    samplePhrases: "డెమో వాయిస్ వాక్యాలు:",
    textInput: "టైప్",

    wide: "వైడ్",
    noBall: "నో బాల్",
    wicketOut: "అవుట్ (వికెట్)",
    undo: "వెనక్కి",

    retire: "రిటైర్",
    newBatter: "+ బ్యాటర్",
    changeBowler: "బౌలర్",
    swapStrike: "స్ట్రైక్ మార్చు",

    striker: "స్ట్రైక్",
    runner: "రన్నర్",
    bowler: "బౌలర్",

    ballFeedTitle: "బంతి వారీ రికార్డు & మాట్లాడిన మాటలు",
    disputeButton: "పంచాయతీ (చివరి 6 బంతులు)",
  },
  hi: {
    appName: "SCORECALL",
    voiceBadge: "वॉइस",
    setup: "सेटअप",
    card: "कार्ड",
    share: "शेयर",
    history: "इतिहास",
    dispute: "विवाद",
    leaderboard: "बोर्ड",
    liveLink: "QR कोड",
    landingPage: "पेज",
    liveApp: "लाइव स्कोरर",

    battingInnings: "बल्लेबाजी",
    overs: "ओवर",
    ballsLeft: "गेंदें बाकी",
    finalOver: "अंतिम ओवर",
    thisOver: "यह ओवर:",
    target: "लक्ष्य:",
    needRuns: "चाहिए",
    crr: "CRR:",
    rrr: "RRR:",
    partnership: "साझेदारी:",

    tapToSpeak: "बोलकर स्कोर करें (वॉइस)",
    listening: "सुन रहे हैं... (बोलिए)",
    aiParsing: "AI समझ रहा है...",
    offlineMode: "ऑफलाइन मोड",
    samplePhrases: "डेमो वॉइस वाक्य:",
    textInput: "टाइप",

    wide: "वाइड",
    noBall: "नो बॉल",
    wicketOut: "आउट (विकेट)",
    undo: "वापस",

    retire: "रिटायर",
    newBatter: "+ बल्लेबाज",
    changeBowler: "गेंदबाज",
    swapStrike: "स्ट्राइक बदलें",

    striker: "स्ट्राइक",
    runner: "रनर",
    bowler: "गेंदबाज",

    ballFeedTitle: "गेंद-दर-गेंद रिकॉर्ड और बोला गया ट्रांसक्रिप्ट",
    disputeButton: "विवाद (पिछली 6 गेंदें)",
  },
};
