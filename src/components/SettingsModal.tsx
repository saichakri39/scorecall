import React from 'react';
import { UILanguage, RulePreset, GullyRules } from '../types/cricket';
import { CloseThickIcon, SunIcon, SpeakerIcon } from './CricketIcons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  uiLanguage: UILanguage;
  onSelectLanguage: (lang: UILanguage) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  isVoiceReadBack: boolean;
  onToggleVoiceReadBack: () => void;
  isSunlightMode: boolean;
  onToggleSunlightMode: () => void;
  activePreset: RulePreset;
  onApplyPreset: (preset: RulePreset) => void;
  onOpenMicHelp: () => void;
  onOpenEvaluation: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  uiLanguage,
  onSelectLanguage,
  isDemoMode,
  onToggleDemoMode,
  isVoiceReadBack,
  onToggleVoiceReadBack,
  isSunlightMode,
  onToggleSunlightMode,
  activePreset,
  onApplyPreset,
  onOpenMicHelp,
  onOpenEvaluation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-[#FAF7F0] border-4 border-[#191C18] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#FFB800] rounded-xs" />
            <h2 className="font-display text-xl tracking-wide uppercase">Scorecall Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white press-action">
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* 1. UI Language Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-[#615A4B]">
              UI Language / ఇంటర్‌ఫేస్ భాష / भाषा
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onSelectLanguage('en')}
                className={`py-2 px-1 rounded border-2 font-bold press-action text-center ${
                  uiLanguage === 'en'
                    ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onSelectLanguage('te')}
                className={`py-2 px-1 rounded border-2 font-bold press-action text-center ${
                  uiLanguage === 'te'
                    ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => onSelectLanguage('hi')}
                className={`py-2 px-1 rounded border-2 font-bold press-action text-center ${
                  uiLanguage === 'hi'
                    ? 'border-[#D32F1E] bg-[#FAF0ED] text-[#D32F1E]'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* 2. Voice Read-Back (TTS) */}
          <div className="p-3 bg-white border-2 border-[#191C18] rounded-lg chalk-border flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5 font-bold text-[#191C18]">
                <SpeakerIcon className="w-4 h-4 text-[#D32F1E]" isMuted={!isVoiceReadBack} />
                <span>Voice Audio Read-Back</span>
              </div>
              <p className="text-[10px] text-gray-600">
                Speaks out each ball result aloud via phone speaker so ground hears the score.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleVoiceReadBack}
              className={`w-12 h-6 rounded-full transition-colors relative press-action ${
                isVoiceReadBack ? 'bg-[#1E4620]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                  isVoiceReadBack ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* 3. Sunlight High-Contrast Mode */}
          <div className="p-3 bg-white border-2 border-[#191C18] rounded-lg chalk-border flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <div className="flex items-center gap-1.5 font-bold text-[#191C18]">
                <SunIcon className="w-4 h-4 text-[#FFB800]" />
                <span>Sunlight High-Contrast Mode</span>
              </div>
              <p className="text-[10px] text-gray-600">
                Pure pitch-black and electric-yellow theme for 40°C direct midday glare.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleSunlightMode}
              className={`w-12 h-6 rounded-full transition-colors relative press-action ${
                isSunlightMode ? 'bg-[#FFB800]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                  isSunlightMode ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* 4. Demo Mode Toggle (Shows sample phrases) */}
          <div className="p-3 bg-white border-2 border-[#191C18] rounded-lg chalk-border flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <span className="font-bold text-[#191C18] block">Demo Mode (Sample Phrases)</span>
              <p className="text-[10px] text-gray-600">
                Displays 1-tap sample spoken lines and backend model diagnostics on main screen.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleDemoMode}
              className={`w-12 h-6 rounded-full transition-colors relative press-action ${
                isDemoMode ? 'bg-[#D32F1E]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                  isDemoMode ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* 5. Rule Presets Quick Switch */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase text-[#615A4B]">
              Quick Gully Rule Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onApplyPreset('street')}
                className={`p-2 rounded border-2 font-bold press-action text-center ${
                  activePreset === 'street'
                    ? 'border-[#191C18] bg-[#191C18] text-white'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                <span className="block">Street</span>
                <span className="text-[9px] opacity-75">1-Pitch + 2R Wall</span>
              </button>
              <button
                type="button"
                onClick={() => onApplyPreset('terrace')}
                className={`p-2 rounded border-2 font-bold press-action text-center ${
                  activePreset === 'terrace'
                    ? 'border-[#191C18] bg-[#191C18] text-white'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                <span className="block">Terrace</span>
                <span className="text-[9px] opacity-75">Tip & Run + Short</span>
              </button>
              <button
                type="button"
                onClick={() => onApplyPreset('box')}
                className={`p-2 rounded border-2 font-bold press-action text-center ${
                  activePreset === 'box'
                    ? 'border-[#191C18] bg-[#191C18] text-white'
                    : 'border-[#CCC4B2] bg-white text-[#191C18]'
                }`}
              >
                <span className="block">Box Turf</span>
                <span className="text-[9px] opacity-75">Direct Catch + 6ov</span>
              </button>
            </div>
          </div>

          {/* 6. Diagnostic & Lab Links */}
          <div className="pt-2 border-t border-[#DDD7C9] flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMicHelp();
              }}
              className="flex-1 py-2 bg-white border border-[#B3A996] rounded font-bold text-[#191C18] hover:bg-gray-50 press-action text-[11px]"
            >
              🎤 Mic Diagnostics
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEvaluation();
              }}
              className="flex-1 py-2 bg-white border border-[#B3A996] rounded font-bold text-[#191C18] hover:bg-gray-50 press-action text-[11px]"
            >
              📊 Accuracy Lab / CSV
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
