/**
 * Scorecall — Settings, Diagnostics & Rules Modal
 *
 * Requirements (User Item 3 & 5):
 * - Rule presets (Street, Terrace, Box)
 * - Rule chips
 * - Sunlight mode toggle
 * - Demo mode toggle
 * - Voice read-back toggle
 * - Accuracy lab and mic diagnostics
 * - Interface language switch
 */

import React, { useState } from 'react';
import {
  X,
  Settings,
  Sun,
  Volume2,
  PlayCircle,
  Activity,
  Mic,
  CheckCircle,
  ShieldAlert,
  Globe,
} from 'lucide-react';
import { MatchRules, MatchState } from '../types/cricket';
import { SupportedLanguage, t } from '../utils/i18n';
import { parseGullySpeech } from '../utils/fastSpeechMatcher';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: MatchState;
  onUpdateRules: (newRules: MatchRules) => void;
  uiLang: SupportedLanguage;
  onChangeUiLang: (lang: SupportedLanguage) => void;
  sunlightMode: boolean;
  onToggleSunlightMode: () => void;
  voiceReadBack: boolean;
  onToggleVoiceReadBack: () => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  match,
  onUpdateRules,
  uiLang,
  onChangeUiLang,
  sunlightMode,
  onToggleSunlightMode,
  voiceReadBack,
  onToggleVoiceReadBack,
  demoMode,
  onToggleDemoMode,
}) => {
  // Mic Diagnostics & Accuracy Lab state
  const [labInput, setLabInput] = useState('');
  const [labResult, setLabResult] = useState<any>(null);
  const [isTestingMic, setIsTestingMic] = useState(false);

  if (!isOpen) {
    return null;
  }

  // Preset Handlers
  const applyPreset = (preset: 'street' | 'terrace' | 'box') => {
    if (preset === 'street') {
      onUpdateRules({
        totalOvers: 5,
        ballsPerOver: 6,
        maxWickets: Math.max(1, match.battingSquad.length - 1),
        lastManBats: false,
        noBallRun: 1,
        wideRun: 1,
        freeHitOnNoBall: true,
      });
    } else if (preset === 'terrace') {
      onUpdateRules({
        totalOvers: 3,
        ballsPerOver: 4,
        maxWickets: 3,
        lastManBats: true,
        noBallRun: 1,
        wideRun: 1,
        freeHitOnNoBall: false,
      });
    } else if (preset === 'box') {
      onUpdateRules({
        totalOvers: 4,
        ballsPerOver: 6,
        maxWickets: 4,
        lastManBats: false,
        noBallRun: 1,
        wideRun: 1,
        freeHitOnNoBall: true,
        boxCricketBoundaryRuns: 4,
      });
    }
  };

  const handleTestLab = (textToTest: string) => {
    const start = performance.now();
    const parsed = parseGullySpeech(textToTest, {
      battingSquad: match.battingSquad,
      bowlingSquad: match.bowlingSquad,
    });
    const durationMs = Math.round(performance.now() - start);

    setLabResult({
      ...parsed,
      latencyMs: durationMs,
    });
  };

  const startMicDiagnostic = async () => {
    // Explicitly prompt for mic permission via getUserMedia
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      alert('Microphone permission was denied by the browser. Please allow microphone access in your browser address bar.');
      setIsTestingMic(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Web Speech API not supported in this browser. You can type in the lab input below.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN';

      rec.onstart = () => setIsTestingMic(true);
      rec.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setLabInput(text);
        handleTestLab(text);
        setIsTestingMic(false);
      };
      rec.onerror = () => setIsTestingMic(false);
      rec.onend = () => setIsTestingMic(false);

      rec.start();
    } catch (err) {
      setIsTestingMic(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <Settings size={22} className="text-[#F59E0B]" />
            <h2 className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">
              {t('settings', uiLang)} & Gully Lab
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-5">
          {/* 1. Interface Language Selector */}
          <div className="border-2 border-[#191C18] bg-white p-3 shadow-[2px_2px_0px_#191C18]">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1.5">
              <Globe size={15} className="text-[#D32F1E]" />
              Interface Language (Translates UI text)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en' as SupportedLanguage, label: 'English' },
                { code: 'te' as SupportedLanguage, label: 'తెలుగు' },
                { code: 'hi' as SupportedLanguage, label: 'हिंदी' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onChangeUiLang(lang.code)}
                  className={`py-2 px-3 border-2 font-bold text-sm transition-all ${
                    uiLang === lang.code
                      ? 'border-[#191C18] bg-[#D32F1E] text-white shadow-[2px_2px_0px_#191C18]'
                      : 'border-[#191C18]/40 bg-[#F3EFE6] text-[#191C18] hover:border-[#191C18]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Rule Presets (Street, Terrace, Box) */}
          <div className="border-2 border-[#191C18] bg-white p-3 shadow-[2px_2px_0px_#191C18]">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Rule Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyPreset('street')}
                className="p-2 border-2 border-[#191C18] bg-[#F59E0B] text-[#191C18] font-['Bebas_Neue'] text-lg hover:bg-amber-400 transition-colors text-center"
              >
                Street (5 Over)
              </button>
              <button
                onClick={() => applyPreset('terrace')}
                className="p-2 border-2 border-[#191C18] bg-white text-[#191C18] font-['Bebas_Neue'] text-lg hover:bg-stone-100 transition-colors text-center"
              >
                Terrace (3 Over)
              </button>
              <button
                onClick={() => applyPreset('box')}
                className="p-2 border-2 border-[#191C18] bg-white text-[#191C18] font-['Bebas_Neue'] text-lg hover:bg-stone-100 transition-colors text-center"
              >
                Box Cricket
              </button>
            </div>
          </div>

          {/* 3. Rule Chips */}
          <div className="border-2 border-[#191C18] bg-white p-3 shadow-[2px_2px_0px_#191C18]">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Active Match Rule Chips
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 bg-[#191C18] text-white font-['Bebas_Neue'] text-sm tracking-wider border border-[#191C18]">
                {match.rules.totalOvers} OVERS
              </span>
              <span className="px-2.5 py-1 bg-[#191C18] text-white font-['Bebas_Neue'] text-sm tracking-wider border border-[#191C18]">
                {match.rules.ballsPerOver} BALLS/OVER
              </span>
              <span className="px-2.5 py-1 bg-[#191C18] text-white font-['Bebas_Neue'] text-sm tracking-wider border border-[#191C18]">
                MAX {match.rules.maxWickets} WKTS
              </span>
              <span
                className={`px-2.5 py-1 font-['Bebas_Neue'] text-sm tracking-wider border border-[#191C18] ${
                  match.rules.freeHitOnNoBall
                    ? 'bg-[#F59E0B] text-[#191C18]'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                FREE HIT: {match.rules.freeHitOnNoBall ? 'ON' : 'OFF'}
              </span>
              <span
                className={`px-2.5 py-1 font-['Bebas_Neue'] text-sm tracking-wider border border-[#191C18] ${
                  match.rules.lastManBats
                    ? 'bg-[#D32F1E] text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                LAST MAN: {match.rules.lastManBats ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* 4. Display & Sound Toggles */}
          <div className="space-y-2">
            {/* Sunlight Mode */}
            <label className="flex items-center justify-between p-3 bg-white border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Sun size={20} className="text-[#D32F1E]" />
                <div>
                  <div className="font-bold text-xs uppercase text-[#191C18]">
                    Sunlight Mode
                  </div>
                  <div className="text-[11px] text-stone-600">
                    High-contrast street view for harsh sunlight outdoors
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={sunlightMode}
                onChange={onToggleSunlightMode}
                className="w-5 h-5 accent-[#D32F1E]"
              />
            </label>

            {/* Voice Read-Back Toggle */}
            <label className="flex items-center justify-between p-3 bg-white border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Volume2 size={20} className="text-[#F59E0B]" />
                <div>
                  <div className="font-bold text-xs uppercase text-[#191C18]">
                    Voice Read-Back
                  </div>
                  <div className="text-[11px] text-stone-600">
                    Speaks the score and confirmed deliveries automatically
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={voiceReadBack}
                onChange={onToggleVoiceReadBack}
                className="w-5 h-5 accent-[#D32F1E]"
              />
            </label>

            {/* Demo Mode Toggle */}
            <label className="flex items-center justify-between p-3 bg-white border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] cursor-pointer">
              <div className="flex items-center gap-2.5">
                <PlayCircle size={20} className="text-stone-700" />
                <div>
                  <div className="font-bold text-xs uppercase text-[#191C18]">
                    Demo Mode
                  </div>
                  <div className="text-[11px] text-stone-600">
                    Quick test deliveries and street simulator
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={demoMode}
                onChange={onToggleDemoMode}
                className="w-5 h-5 accent-[#D32F1E]"
              />
            </label>
          </div>

          {/* 5. Accuracy Lab & Mic Diagnostics */}
          <div className="border-2 border-[#191C18] bg-white p-3 shadow-[2px_2px_0px_#191C18] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Activity size={15} className="text-[#D32F1E]" />
                Accuracy Lab & Mic Diagnostics
              </span>
              <button
                onClick={startMicDiagnostic}
                disabled={isTestingMic}
                className="px-2 py-1 bg-[#191C18] text-white text-xs font-bold flex items-center gap-1 hover:bg-stone-800 disabled:opacity-50"
              >
                <Mic size={13} className={isTestingMic ? 'animate-pulse text-red-400' : ''} />
                {isTestingMic ? 'Listening...' : 'Test Mic'}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={labInput}
                onChange={(e) => setLabInput(e.target.value)}
                placeholder="Type or speak phrase (e.g. no ball four, out catch)..."
                className="flex-1 p-2 border border-[#191C18] bg-[#F3EFE6] text-xs font-semibold outline-none"
              />
              <button
                onClick={() => handleTestLab(labInput)}
                className="px-3 py-2 bg-[#F59E0B] border border-[#191C18] font-['Bebas_Neue'] text-sm tracking-wider"
              >
                Test Lab
              </button>
            </div>

            {labResult && (
              <div className="p-2.5 bg-[#F3EFE6] border border-[#191C18] text-xs space-y-1 font-mono">
                <div className="flex justify-between font-bold text-[#191C18]">
                  <span>Latency: {labResult.latencyMs}ms</span>
                  <span>Confidence: {Math.round(labResult.confidence * 100)}%</span>
                </div>
                <div>Events Detected: {labResult.events.length}</div>
                {labResult.events.map((e: any, idx: number) => (
                  <div key={idx} className="text-[#D32F1E] font-semibold">
                    #{idx + 1}: {e.type} (runs: {e.runs ?? e.runsOffBat ?? 0})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#E8E2D2] border-t-2 border-[#191C18] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#191C18] text-white font-['Bebas_Neue'] text-lg tracking-wider border-2 border-[#191C18] hover:bg-stone-800 transition-colors shadow-[2px_2px_0px_#191C18]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
