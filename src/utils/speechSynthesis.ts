/**
 * Voice Audio Read-Back for Scorecall.
 * Uses native Web Speech API SpeechSynthesis to announce each scored ball.
 * Supported in all modern mobile and desktop browsers with zero latency.
 */

export function speakResult(text: string, lang: 'en' | 'te' | 'hi' = 'en') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    // Cancel any ongoing utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05; // Quick, snappy ground cadence
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
    console.warn('SpeechSynthesis error:', err);
  }
}
