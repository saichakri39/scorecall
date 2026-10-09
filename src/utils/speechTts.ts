import { UILanguage } from '../types/cricket';

/**
 * Speaks out the recorded ball outcome aloud using the browser's Web Speech API
 */
export function speakBallResult(
  text: string,
  lang: UILanguage = 'en',
  enabled: boolean = true
) {
  if (!enabled || typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    if (lang === 'te') {
      utterance.lang = 'te-IN';
    } else if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

export function formatResultSpeech(
  type: 'run' | 'dot' | 'wide' | 'no_ball' | 'wicket',
  runs: number,
  striker: string,
  totalScore: number,
  wickets: number,
  lang: UILanguage
): string {
  if (lang === 'te') {
    if (type === 'wicket') return `${striker} అవుట్ అయ్యాడు! స్కోరు ${totalScore} కు ${wickets}.`;
    if (type === 'wide') return `వైడ్ బాల్! ప్లస్ ${runs} రన్స్. స్కోరు ${totalScore}.`;
    if (type === 'no_ball') return `నో బాల్! ఫ్రీ హిట్. స్కోరు ${totalScore}.`;
    if (type === 'dot') return `డాట్ బాల్. స్కోరు ${totalScore}.`;
    if (runs === 4) return `${striker} ఫోర్ కొట్టాడు! స్కోరు ${totalScore}.`;
    if (runs === 6) return `${striker} సిక్సర్ కొట్టాడు! స్కోరు ${totalScore}.`;
    return `${striker} ${runs} రన్స్ తీశాడు. స్కోరు ${totalScore}.`;
  }

  if (lang === 'hi') {
    if (type === 'wicket') return `${striker} आउट हो गए! स्कोर ${totalScore} पर ${wickets}.`;
    if (type === 'wide') return `वाइड गेंद! प्लस ${runs} रन. स्कोर ${totalScore}.`;
    if (type === 'no_ball') return `नो बॉल! फ्री हिट. स्कोर ${totalScore}.`;
    if (type === 'dot') return `डॉट गेंद. स्कोर ${totalScore}.`;
    if (runs === 4) return `${striker} का चौका! स्कोर ${totalScore}.`;
    if (runs === 6) return `${striker} का छक्का! स्कोर ${totalScore}.`;
    return `${striker} ने ${runs} रन लिए. स्कोर ${totalScore}.`;
  }

  // English default
  if (type === 'wicket') return `Wicket! ${striker} is out. Score is ${totalScore} for ${wickets}.`;
  if (type === 'wide') return `Wide ball! Plus ${runs}. Score ${totalScore} for ${wickets}.`;
  if (type === 'no_ball') return `No ball! Score ${totalScore} for ${wickets}.`;
  if (type === 'dot') return `Dot ball. Score ${totalScore} for ${wickets}.`;
  if (runs === 4) return `Four runs! Boundary by ${striker}. Score ${totalScore} for ${wickets}.`;
  if (runs === 6) return `Sixer! Maximum by ${striker}. Score ${totalScore} for ${wickets}.`;
  return `${runs} ${runs === 1 ? 'run' : 'runs'} by ${striker}. Score ${totalScore} for ${wickets}.`;
}
