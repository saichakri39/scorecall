/**
 * Scorecall — Voice Input Control Bar with Instant Offline Parser & Microphone Permission Re-ask Flow
 *
 * Micro-interaction for capturing street cricket voice calls.
 * 1. Prioritizes local fastSpeechMatcher for INSTANT (<10ms) response speed.
 * 2. Only calls Gemini when local rules cannot resolve.
 * 3. Gracefully re-asks microphone permissions using getUserMedia({ audio: true }).
 * 4. Provides 1-tap quick voice phrases for instant testing.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Globe,
  Loader2,
  AlertTriangle,
  RotateCw,
  Keyboard,
  X,
  Volume2,
  Zap,
} from 'lucide-react';
import { ParseResult } from '../types/cricket';
import { SupportedLanguage } from '../utils/i18n';
import { parseGullySpeech } from '../utils/fastSpeechMatcher';

interface Props {
  battingSquad: string[];
  bowlingSquad: string[];
  onParsedResult: (result: ParseResult) => void;
  disabled: boolean;
  uiLang?: SupportedLanguage;
}

export const VoiceInputBar: React.FC<Props> = ({
  battingSquad,
  bowlingSquad,
  onParsedResult,
  disabled,
  uiLang,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'te-IN' | 'hi-IN'>('en-IN');
  const [interimText, setInterimText] = useState('');

  // Sync speech language when UI language changes
  useEffect(() => {
    if (uiLang === 'hi') {
      setSpeechLang('hi-IN');
    } else if (uiLang === 'te') {
      setSpeechLang('te-IN');
    } else if (uiLang === 'en') {
      setSpeechLang('en-IN');
    }
  }, [uiLang]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMicPermissionModal, setShowMicPermissionModal] = useState(false);
  const [micStatus, setMicStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [manualCallText, setManualCallText] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const hasProcessedRef = useRef<boolean>(false);

  // Check initial permission if API is available
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((permissionStatus) => {
          setMicStatus(permissionStatus.state as any);
          permissionStatus.onchange = () => {
            setMicStatus(permissionStatus.state as any);
          };
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = speechLang;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
      latestTranscriptRef.current = '';
      hasProcessedRef.current = false;
      setMicStatus('granted');
    };

    recognition.onresult = (event: any) => {
      // SpeechRecognition can emit the same final result more than once in some browsers.
      // Once a transcript has been submitted for this listening session, ignore later events
      // so one spoken delivery can never be added twice.
      if (hasProcessedRef.current) return;

      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      const activeText = (finalTranscript || currentInterim).trim();
      setInterimText(activeText);
      latestTranscriptRef.current = activeText;

      if (finalTranscript) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        hasProcessedRef.current = true;
        processTranscript(finalTranscript);
      } else if (currentInterim.trim()) {
        // FAST INSTANT MATCH: Check if current interim text matches a cricket command
        const fastMatch = parseGullySpeech(currentInterim.trim(), {
          battingSquad,
          bowlingSquad,
        });

        if (fastMatch.events.length > 0) {
          // If a clean command is already recognized, finalize after a snappy 300ms pause
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (!hasProcessedRef.current) {
              hasProcessedRef.current = true;
              try {
                recognition.stop();
              } catch (e) {}
              processTranscript(currentInterim.trim());
            }
          }, 300);
        }
      }
    };

    recognition.onerror = (err: any) => {
      console.warn('Speech recognition error:', err);
      setIsListening(false);
      setIsProcessing(false);

      if (err.error === 'not-allowed' || err.error === 'service-not-allowed') {
        setMicStatus('denied');
        setShowMicPermissionModal(true);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // If recognition ended and had spoken text not yet processed, process now
      if (latestTranscriptRef.current && !hasProcessedRef.current) {
        hasProcessedRef.current = true;
        processTranscript(latestTranscriptRef.current);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognition.abort();
      } catch (e) {}
    };
  }, [speechLang, battingSquad, bowlingSquad]);

  /**
   * Fast Voice Processing:
   * 1. Runs offline fastSpeechMatcher FIRST for instant (<10ms) response.
   * 2. Only consults Gemini if local parser is uncertain.
   */
  const processTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    setIsProcessing(true);

    // 1. FAST LOCAL OFFLINE PARSER (<10ms)
    const offlineResult = parseGullySpeech(transcript, {
      battingSquad,
      bowlingSquad,
    });

    // If local parser matched confidently, return INSTANTLY!
    if (offlineResult.events.length > 0 && offlineResult.confidence >= 0.85) {
      onParsedResult(offlineResult);
      setIsProcessing(false);
      setInterimText('');
      return;
    }

    // 2. Fallback to Gemini Server parser only if local parser could not determine
    try {
      const response = await fetch('/api/parse-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          battingSquad,
          bowlingSquad,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.events && data.events.length > 0) {
          onParsedResult({
            events: data.events,
            originalText: transcript,
            confidence: data.confidence || 0.96,
            source: 'gemini',
            needsClarification: data.needsClarification,
          });
          setIsProcessing(false);
          setInterimText('');
          return;
        }
      }
    } catch (e) {
      // Offline fallback
    }

    // Fallback to offline result
    onParsedResult(offlineResult);
    setIsProcessing(false);
    setInterimText('');
  };

  /**
   * Explicitly re-requests mic permission from the browser via getUserMedia
   */
  const reaskMicPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return;
      }

      // Explicitly trigger the browser's permission prompt dialog
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If granted, immediately stop the tracks so mic is free for SpeechRecognition
      stream.getTracks().forEach((track) => track.stop());

      setMicStatus('granted');
      setShowMicPermissionModal(false);

      // Start listening directly
      try {
        recognitionRef.current?.start();
      } catch (e) {
        // Recognition already started or handling
      }
    } catch (err: any) {
      console.warn('Microphone permission request failed:', err);
      setMicStatus('denied');
    }
  };

  const toggleListening = async () => {
    if (disabled || isProcessing) return;

    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try {
        recognitionRef.current?.stop();
      } catch (e) {}
      setIsListening(false);
      if (latestTranscriptRef.current && !hasProcessedRef.current) {
        hasProcessedRef.current = true;
        processTranscript(latestTranscriptRef.current);
      }
      return;
    }

    // If permission was denied, trigger reask
    if (micStatus === 'denied') {
      setShowMicPermissionModal(true);
      return;
    }

    try {
      // Prompt mic permission if needed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && micStatus !== 'granted') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicStatus('granted');
      }

      recognitionRef.current?.start();
    } catch (err: any) {
      console.warn('Start listening error:', err);
      setMicStatus('denied');
      setShowMicPermissionModal(true);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCallText.trim()) {
      processTranscript(manualCallText.trim());
      setManualCallText('');
      setShowManualInput(false);
    }
  };

  const QUICK_VOICE_PHRASES = [
    { label: '4 Four', text: 'four' },
    { label: '4 चार (Hi)', text: 'चार' },
    { label: '4 फोर (Hi)', text: 'फोर' },
    { label: '4 నాలుగు (Te)', text: 'నాలుగు' },
    { label: '4 ఫోర్ (Te)', text: 'ఫోర్' },
    { label: '6 Sixer', text: 'sixer' },
    { label: '6 छक्का', text: 'छक्का' },
    { label: '6 సిక్సర్', text: 'సిక్సర్' },
    { label: '1 Single', text: 'one' },
    { label: 'Dot (0)', text: 'dot ball' },
    { label: 'Out Caught', text: 'out caught' },
    { label: 'Wide', text: 'wide' },
    { label: 'NB+4', text: 'no ball four' },
    { label: '4 then Out', text: 'four then out caught' },
  ];

  return (
    <div className="w-full space-y-2 select-none">
      {/* Primary Voice Input Control Bar */}
      <div className="w-full bg-[#191C18] text-white p-3 border-4 border-[#191C18] shadow-[4px_4px_0px_#191C18] flex items-center justify-between gap-3">
        {/* Mic Trigger Button */}
        <button
          onClick={toggleListening}
          disabled={disabled}
          className={`w-14 h-14 rounded-none border-2 border-white flex items-center justify-center transition-all ${
            isListening
              ? 'bg-[#D32F1E] text-white animate-pulse shadow-[0_0_12px_#D32F1E]'
              : micStatus === 'denied'
              ? 'bg-[#D32F1E] text-white hover:bg-red-700'
              : 'bg-[#F59E0B] text-[#191C18] hover:bg-amber-400'
          } disabled:opacity-40 shrink-0`}
          aria-label="Toggle Voice Input"
          title={
            micStatus === 'denied'
              ? 'Microphone blocked — Click to re-ask permission'
              : 'Tap to speak cricket call'
          }
        >
          {isProcessing ? (
            <Loader2 size={26} className="animate-spin text-[#191C18]" />
          ) : isListening ? (
            <MicOff size={26} />
          ) : (
            <Mic size={26} />
          )}
        </button>

        {/* Voice Status & Spoken Text Feedback */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-['Bebas_Neue'] text-base tracking-wider text-[#F59E0B]">
              {isListening
                ? 'LISTENING TO GULLY CALL...'
                : isProcessing
                ? 'FAST PARSING CRICKET CALL...'
                : micStatus === 'denied'
                ? 'MIC BLOCKED — TAP TO RE-ASK'
                : 'TAP MIC TO CALL BALL'}
            </span>
            {isListening && (
              <span className="w-2 h-2 rounded-full bg-[#D32F1E] animate-ping" />
            )}
          </div>
          <div className="text-xs text-stone-300 font-medium truncate">
            {interimText
              ? `"${interimText}"`
              : micStatus === 'denied'
              ? 'Click mic to re-ask permission'
              : 'Say "Four", "Out caught", "Wide", "Ravi four"...'}
          </div>
        </div>

        {/* Keyboard Input Trigger */}
        <button
          onClick={() => setShowManualInput(!showManualInput)}
          className="p-2 border border-stone-600 bg-stone-900 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors shrink-0"
          title="Type cricket call manually"
        >
          <Keyboard size={18} />
        </button>

        {/* Voice Language Selector */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
            Voice Lang
          </span>
          <div className="flex items-center border border-stone-600 bg-stone-900 px-1.5 py-1">
            <Globe size={13} className="text-[#F59E0B] mr-1" />
            <select
              value={speechLang}
              onChange={(e) => setSpeechLang(e.target.value as any)}
              className="bg-transparent text-[11px] font-bold text-stone-100 outline-none cursor-pointer"
              aria-label="Voice Language"
            >
              <option value="en-IN" className="bg-[#191C18]">English</option>
              <option value="te-IN" className="bg-[#191C18]">తెలుగు</option>
              <option value="hi-IN" className="bg-[#191C18]">हिंदी</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mic Blocked Quick Banner */}
      {micStatus === 'denied' && (
        <div className="p-2 bg-red-100 border-2 border-[#D32F1E] flex items-center justify-between text-xs font-bold text-[#191C18]">
          <div className="flex items-center gap-1.5 text-[#D32F1E]">
            <AlertTriangle size={15} />
            <span>Microphone is blocked by browser.</span>
          </div>
          <button
            onClick={reaskMicPermission}
            className="px-2.5 py-1 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-sm tracking-wider border border-[#191C18] flex items-center gap-1 hover:bg-red-700 active:translate-y-0.5"
          >
            <RotateCw size={13} />
            Re-ask Mic Permission
          </button>
        </div>
      )}

      {/* 1-Tap Quick Test Phrases Strip (Fast zero-latency voice test) */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        <span className="text-[10px] font-bold uppercase text-stone-500 shrink-0 mr-1 flex items-center gap-0.5">
          <Zap size={11} className="text-[#F59E0B]" />
          Quick Voice:
        </span>
        {QUICK_VOICE_PHRASES.map((item) => (
          <button
            key={item.text}
            onClick={() => processTranscript(item.text)}
            disabled={disabled}
            className="px-2 py-0.5 bg-white border border-[#191C18] text-[11px] font-bold text-[#191C18] hover:bg-amber-100 whitespace-nowrap shadow-[1px_1px_0px_#191C18] active:translate-y-0.5 disabled:opacity-40"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Manual Text Call Input Strip */}
      {showManualInput && (
        <form
          onSubmit={handleManualSubmit}
          className="p-2 bg-white border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] flex items-center gap-2"
        >
          <input
            type="text"
            value={manualCallText}
            onChange={(e) => setManualCallText(e.target.value)}
            placeholder='Type voice command (e.g. "Ravi hit a four, then got out caught", "wide two")...'
            className="flex-1 p-2 border border-[#191C18] bg-[#F3EFE6] text-xs font-bold outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!manualCallText.trim()}
            className="px-4 py-2 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-base tracking-wider border border-[#191C18] hover:bg-red-700 disabled:opacity-50"
          >
            Score
          </button>
        </form>
      )}

      {/* Mic Permission Blocked Banner / Re-ask Modal */}
      {showMicPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] overflow-hidden">
            {/* Header */}
            <div className="bg-[#191C18] text-white p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-[#F59E0B]" />
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
                  Microphone Permission
                </h3>
              </div>
              <button
                onClick={() => setShowMicPermissionModal(false)}
                className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3 text-center">
              <div className="p-3 bg-red-100 border-2 border-[#D32F1E] text-xs font-semibold text-[#191C18] text-left space-y-1">
                <div className="font-bold text-[#D32F1E] uppercase flex items-center gap-1">
                  <AlertTriangle size={14} />
                  Microphone Access Required
                </div>
                <p>
                  The browser currently blocked microphone access. To speak cricket calls:
                </p>
                <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-stone-700">
                  <li>Click <strong>Re-ask Permission</strong> below and select <strong>Allow</strong>.</li>
                  <li>If prompted by Chrome/browser address bar, click the camera/mic or padlock icon and set Microphone to <strong>Allow</strong>.</li>
                </ol>
              </div>

              {/* Main Action: Re-ask Permission */}
              <button
                onClick={reaskMicPermission}
                className="w-full py-3 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-xl tracking-wider border-2 border-[#191C18] shadow-[3px_3px_0px_#191C18] hover:bg-red-700 transition-colors flex items-center justify-center gap-2 active:translate-y-0.5"
              >
                <RotateCw size={18} />
                Re-ask Permission (Allow Mic)
              </button>

              {/* Alternative: Type commands */}
              <button
                onClick={() => {
                  setShowMicPermissionModal(false);
                  setShowManualInput(true);
                }}
                className="w-full py-2 bg-white text-[#191C18] font-['Bebas_Neue'] text-base tracking-wider border-2 border-[#191C18] hover:bg-stone-100 transition-colors"
              >
                Type Calls Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
