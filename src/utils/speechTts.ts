/**
 * Scorecall — Multilingual Text-to-Speech Engine
 * Automatically detects Telugu, Hindi, or English scripts.
 * Supports Web Audio API chime tone for instant acoustic feedback
 * and robust Chrome speech synthesis with voice fallback.
 */

// Keep global reference to utterance to prevent Chrome garbage-collection bug
let activeUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices() || [];
    window.speechSynthesis.onvoiceschanged = () => {
      try {
        cachedVoices = window.speechSynthesis.getVoices() || [];
      } catch (e) {}
    };
  } catch (e) {}
}

export function detectScriptLanguage(text: string): 'te' | 'hi' | 'en' {
  // Telugu Unicode block: U+0C00 - U+0C7F
  if (/[\u0C00-\u0C7F]/.test(text)) {
    return 'te';
  }
  // Devanagari / Hindi Unicode block: U+0900 - U+097F
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hi';
  }
  return 'en';
}

/**
 * Plays a clean acoustic tone using Web Audio API for instant feedback
 */
export function playCricketTone(type: 'wicket' | 'boundary' | 'extra' | 'dot' | 'run'): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'wicket') {
      // Dramatic two-tone descending chime for wicket
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'boundary') {
      // Cheerful high-pitch double chime for 4/6
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'dot') {
      // Subtle wooden thud for dot ball
      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else {
      // Standard gentle blip for runs / extras
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    // AudioContext blocked or not allowed by browser policy
  }
}

function toSpeakableTextForNonIndicVoice(text: string): string {
  const hasTelugu = /[\u0C00-\u0C7F]/.test(text);
  const hasDevanagari = /[\u0900-\u097F]/.test(text);

  if (!hasTelugu && !hasDevanagari) {
    return text;
  }

  // Telugu phonetics for English speech synthesis voices
  if (hasTelugu) {
    let t = text;
    t = t.replace(/నాలుగు పరుగులు! బౌండరీ! స్కోరు (\d+) కి (\d+)\./g, 'Naalugu parugulu! Boundary! Score is $1 for $2.');
    t = t.replace(/ఆరు పరుగులు! భారీ సిక్సర్! స్కోరు (\d+) కి (\d+)\./g, 'Aaru parugulu! Huge sixer! Score is $1 for $2.');
    t = t.replace(/వికెట్! (.*?)ఔట్! స్కోరు (\d+) కి (\d+) వికెట్లు\./g, 'Wicket! $1out! Score is $2 for $3.');
    t = t.replace(/డాట్ బాల్\. స్కోరు (\d+) కి (\d+)\./g, 'Dot ball. Score is $1 for $2.');
    t = t.replace(/వైడ్ బాల్\. స్కోరు (\d+) కి (\d+)\./g, 'Wide ball. Score is $1 for $2.');
    t = t.replace(/నో బాల్! ఫ్రీ హిట్! స్కోరు (\d+) కి (\d+)\./g, 'No ball! Free hit! Score is $1 for $2.');
    t = t.replace(/(\d+) పరుగులు\. స్కోరు (\d+) కి (\d+)\./g, '$1 runs. Score is $2 for $3.');
    return t.replace(/[\u0C00-\u0C7F]/g, '');
  }

  // Devanagari phonetics for English speech synthesis voices
  if (hasDevanagari) {
    let t = text;
    t = t.replace(/चार रन! शानदार चौका! स्कोर (\d+) पर (\d+)।/g, 'Chaar run! Shaandaar chauka! Score is $1 for $2.');
    t = t.replace(/छक्का! बड़ा शॉट! स्कोर (\d+) पर (\d+)।/g, 'Chakka! Badaa shot! Score is $1 for $2.');
    t = t.replace(/विकेट! (.*?)आउट! स्कोर (\d+) पर (\d+) विकेट।/g, 'Wicket! $1out! Score is $2 for $3.');
    t = t.replace(/डॉट गेंद। स्कोर (\d+) पर (\d+)।/g, 'Dot ball. Score is $1 for $2.');
    t = t.replace(/वाइड गेंद। स्कोर (\d+) पर (\d+)।/g, 'Wide ball. Score is $1 for $2.');
    t = t.replace(/नो बॉल! फ्री हिट! स्कोर (\d+) पर (\d+)।/g, 'No ball! Free hit! Score is $1 for $2.');
    t = t.replace(/(\d+) रन। स्कोर (\d+) पर (\d+)।/g, '$1 runs. Score is $2 for $3.');
    return t.replace(/[\u0900-\u097F]/g, '');
  }

  return text;
}

/**
 * Robust multilingual speech synthesis with universal browser fallback
 */
export function speakText(
  text: string,
  preferredLang?: 'te' | 'hi' | 'en'
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  try {
    const synth = window.speechSynthesis;

    // Resume immediately if suspended or paused
    if (synth.paused) {
      synth.resume();
    }

    // Only cancel if actively speaking
    if (synth.speaking) {
      synth.cancel();
    }

    const voices = cachedVoices.length > 0 ? cachedVoices : (synth.getVoices() || []);
    const langCode = preferredLang || detectScriptLanguage(text);

    // Pick best matching voice
    let selectedVoice: SpeechSynthesisVoice | null = null;
    if (voices && voices.length > 0) {
      if (langCode === 'te') {
        selectedVoice =
          voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('te')) || null;
      } else if (langCode === 'hi') {
        selectedVoice =
          voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('hi')) || null;
      }

      if (!selectedVoice) {
        // Fallback to Indian English, then any English, then default voice
        selectedVoice =
          voices.find((v) => v.lang.toLowerCase().replace('_', '-') === 'en-in') ||
          voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
          voices.find((v) => v.default) ||
          voices[0] ||
          null;
      }
    }

    const isIndicVoice =
      selectedVoice &&
      (selectedVoice.lang.toLowerCase().startsWith('te') ||
        selectedVoice.lang.toLowerCase().startsWith('hi'));

    const textToSpeak = isIndicVoice ? text : toSpeakableTextForNonIndicVoice(text);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = isIndicVoice ? selectedVoice.lang : 'en-US';
    } else {
      const fallbackLangMap: Record<string, string> = {
        te: 'te-IN',
        hi: 'hi-IN',
        en: 'en-IN',
      };
      utterance.lang = fallbackLangMap[langCode] || 'en-US';
    }

    // Keep global reference to avoid GC cutoff in Chrome
    activeUtterance = utterance;
    (window as any).__scorecallSpeechUtterance = utterance;

    utterance.onend = () => {
      activeUtterance = null;
      (window as any).__scorecallSpeechUtterance = null;
    };
    utterance.onerror = (e) => {
      activeUtterance = null;
      (window as any).__scorecallSpeechUtterance = null;
    };

    // Unpause & trigger speak immediately
    if (synth.paused) {
      synth.resume();
    }
    synth.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Speaks authentic gully cricket commentary based on ball event
 * and returns the commentary text for visible UI ticker
 */
export function speakCricketBall(
  eventType: string,
  runs: number,
  totalRuns: number,
  wickets: number,
  dismissalType?: string,
  batterName?: string,
  lang: 'te' | 'hi' | 'en' = 'en'
): string {
  // 1. Play tone immediately
  if (eventType === 'wicket') {
    playCricketTone('wicket');
  } else if (runs === 4 || runs === 6) {
    playCricketTone('boundary');
  } else if (eventType === 'dot') {
    playCricketTone('dot');
  } else if (eventType === 'wide' || eventType === 'no_ball') {
    playCricketTone('extra');
  } else {
    playCricketTone('run');
  }

  // 2. Build spoken commentary
  let commentary = '';

  if (lang === 'te') {
    if (eventType === 'wicket') {
      const who = batterName ? `${batterName} ` : '';
      commentary = `వికెట్! ${who}ఔట్! స్కోరు ${totalRuns} కి ${wickets} వికెట్లు.`;
    } else if (runs === 4) {
      commentary = `నాలుగు పరుగులు! బౌండరీ! స్కోరు ${totalRuns} కి ${wickets}.`;
    } else if (runs === 6) {
      commentary = `ఆరు పరుగులు! భారీ సిక్సర్! స్కోరు ${totalRuns} కి ${wickets}.`;
    } else if (eventType === 'dot') {
      commentary = `డాట్ బాల్. స్కోరు ${totalRuns} కి ${wickets}.`;
    } else if (eventType === 'wide') {
      commentary = `వైడ్ బాల్. స్కోరు ${totalRuns} కి ${wickets}.`;
    } else if (eventType === 'no_ball') {
      commentary = `నో బాల్! ఫ్రీ హిట్! స్కోరు ${totalRuns} కి ${wickets}.`;
    } else {
      commentary = `${runs} పరుగులు. స్కోరు ${totalRuns} కి ${wickets}.`;
    }
  } else if (lang === 'hi') {
    if (eventType === 'wicket') {
      const who = batterName ? `${batterName} ` : '';
      commentary = `विकेट! ${who}आउट! स्कोर ${totalRuns} पर ${wickets} विकेट।`;
    } else if (runs === 4) {
      commentary = `चार रन! शानदार चौका! स्कोर ${totalRuns} पर ${wickets}।`;
    } else if (runs === 6) {
      commentary = `छक्का! बड़ा शॉट! स्कोर ${totalRuns} पर ${wickets}।`;
    } else if (eventType === 'dot') {
      commentary = `डॉट गेंद। स्कोर ${totalRuns} पर ${wickets}।`;
    } else if (eventType === 'wide') {
      commentary = `वाइड गेंद। स्कोर ${totalRuns} पर ${wickets}।`;
    } else if (eventType === 'no_ball') {
      commentary = `नो बॉल! फ्री हिट! स्कोर ${totalRuns} पर ${wickets}।`;
    } else {
      commentary = `${runs} रन। स्कोर ${totalRuns} पर ${wickets}।`;
    }
  } else {
    // English (default)
    if (eventType === 'wicket') {
      const who = batterName ? `${batterName} ` : '';
      const method = dismissalType ? `${dismissalType.replace('_', ' ')}! ` : '';
      commentary = `Out! ${method}${who}is dismissed! Score is ${totalRuns} for ${wickets}.`;
    } else if (runs === 4) {
      commentary = `Four runs! Smashed to the fence! Score is ${totalRuns} for ${wickets}.`;
    } else if (runs === 6) {
      commentary = `Huge six! Cleared the boundary! Score is ${totalRuns} for ${wickets}.`;
    } else if (eventType === 'dot') {
      commentary = `Dot ball. Score is ${totalRuns} for ${wickets}.`;
    } else if (eventType === 'wide') {
      commentary = `Wide ball. Score is ${totalRuns} for ${wickets}.`;
    } else if (eventType === 'no_ball') {
      commentary = `No ball! Free hit coming up! Score is ${totalRuns} for ${wickets}.`;
    } else {
      commentary = `${runs} ${runs === 1 ? 'run' : 'runs'}. Score is ${totalRuns} for ${wickets}.`;
    }
  }

  speakText(commentary, lang);
  return commentary;
}
