import React, { useState } from 'react';
import { ParseResult, ParsedEvent } from '../types/cricket';
import { CheckThickIcon, CloseThickIcon, BatIcon, StumpsIcon, TapeBallIcon } from './CricketIcons';

interface VoiceConfirmationSheetProps {
  isOpen: boolean;
  parseResult: ParseResult | null;
  striker: string;
  nonStriker: string;
  onConfirm: (events: ParsedEvent[]) => void;
  onCancel: () => void;
  onRetryVoice: () => void;
}

export const VoiceConfirmationSheet: React.FC<VoiceConfirmationSheetProps> = ({
  isOpen,
  parseResult,
  striker,
  nonStriker,
  onConfirm,
  onCancel,
  onRetryVoice,
}) => {
  if (!isOpen || !parseResult) return null;

  const [editableText, setEditableText] = useState(parseResult.rawText);
  const [isEditing, setIsEditing] = useState(false);
  const [activeEvents, setActiveEvents] = useState<ParsedEvent[]>(parseResult.events || []);
  const [clarificationSelected, setClarificationSelected] = useState<string | null>(null);

  const handleClarifyPick = (batter: string, dismissal: 'caught' | 'bowled' | 'one_pitch_caught' | 'run_out') => {
    setClarificationSelected(`${batter} - ${dismissal}`);
    setActiveEvents([
      {
        type: 'wicket',
        batter,
        dismissal,
        confidence: 0.95,
      },
    ]);
  };

  const handleRemoveEvent = (index: number) => {
    setActiveEvents(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmClick = () => {
    if (activeEvents.length > 0) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(40); } catch { /* ignore */ }
      }
      onConfirm(activeEvents);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#FAF7F0] border-t-4 sm:border-4 border-[#191C18] shadow-2xl rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[88vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-heading"
      >
        {/* Street Header Stripe */}
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D32F1E] animate-pulse" />
            <h2 id="sheet-heading" className="font-display text-xl tracking-wider uppercase">
              Confirm Voice Ball
            </h2>
            <span className={`text-[11px] px-2 py-0.5 font-mono rounded font-bold ${
              parseResult.engine === 'offline-rule-based'
                ? 'bg-[#E5A800] text-[#191C18]'
                : 'bg-[#323630] text-[#E0DACB]'
            }`}>
              {parseResult.engine === 'offline-rule-based' ? '⚡ Offline Mode' : 'Claude Haiku 5.5'}
            </span>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-[#C5BFAe] hover:text-white press-action rounded focus-visible:outline-2 focus-visible:outline-amber-400"
            aria-label="Cancel confirmation"
          >
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Transcript Box */}
          <div className="bg-[#ECE7DA] p-3 rounded-lg border-2 border-[#D8D0BE]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#635D50]">
                Spoken Words (Transcript)
              </span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-[#8F170C] underline press-action"
              >
                {isEditing ? 'Done editing' : 'Wrong words? Edit'}
              </button>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={editableText}
                onChange={e => setEditableText(e.target.value)}
                className="w-full bg-white border-2 border-[#191C18] rounded px-2.5 py-1.5 text-sm font-semibold text-[#191C18] focus:outline-none"
              />
            ) : (
              <p className="font-body text-base font-bold text-[#191C18] italic tracking-tight">
                "{parseResult.rawText}"
              </p>
            )}
          </div>

          {/* Ambiguity / Clarification State */}
          {parseResult.needs_clarification && activeEvents.length === 0 && (
            <div className="bg-[#FFF4D9] border-2 border-[#E5A800] p-3.5 rounded-lg space-y-2.5">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-[#E5A800] text-[#191C18] font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ?
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#503A00]">Ambiguity on the ground:</h4>
                  <p className="text-xs font-semibold text-[#664D00] mt-0.5">
                    {parseResult.question || "Who got out, and how?"}
                  </p>
                </div>
              </div>

              {/* Quick Ground Resolvers */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#735A12]">
                  Tap who got out:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleClarifyPick(striker, 'caught')}
                    className="p-2 text-left bg-white border-2 border-[#191C18] rounded press-action text-xs font-bold flex flex-col justify-between"
                  >
                    <span className="text-[#8F170C]">{striker} (Striker)</span>
                    <span className="text-[10px] text-gray-600 font-normal">Out: Catch</span>
                  </button>
                  <button
                    onClick={() => handleClarifyPick(nonStriker, 'run_out')}
                    className="p-2 text-left bg-white border-2 border-[#191C18] rounded press-action text-xs font-bold flex flex-col justify-between"
                  >
                    <span className="text-[#8F170C]">{nonStriker} (Runner)</span>
                    <span className="text-[10px] text-gray-600 font-normal">Out: Run Out</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleClarifyPick(striker, 'bowled')}
                    className="p-2 bg-white border border-[#503A00] rounded press-action text-xs font-semibold text-center"
                  >
                    {striker} Clean Bowled
                  </button>
                  <button
                    onClick={() => handleClarifyPick(striker, 'one_pitch_caught')}
                    className="p-2 bg-white border border-[#503A00] rounded press-action text-xs font-semibold text-center"
                  >
                    {striker} 1-Pitch Catch
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Parsed Events List */}
          {activeEvents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#635D50]">
                <span>Parsed Events ({activeEvents.length})</span>
                <span className="text-[11px] font-mono text-[#191C18]">
                  Confidence: {Math.round(activeEvents[0].confidence * 100)}%
                </span>
              </div>

              <div className="space-y-2">
                {activeEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-[#191C18] chalk-border p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {/* Event badge icon */}
                      {evt.type === 'wicket' && (
                        <div className="w-10 h-10 bg-[#D32F1E] text-white rounded flex items-center justify-center font-display text-2xl font-bold shrink-0">
                          W
                        </div>
                      )}
                      {evt.type === 'runs' && (
                        <div className={`w-10 h-10 ${evt.boundary ? 'bg-[#FFB800] text-[#191C18]' : 'bg-[#1E4620] text-white'} rounded flex items-center justify-center font-display text-2xl font-bold shrink-0`}>
                          {evt.runs}
                        </div>
                      )}
                      {evt.type === 'wide' && (
                        <div className="w-10 h-10 bg-[#5A2C82] text-white rounded flex items-center justify-center font-display text-lg font-bold shrink-0">
                          WD+{evt.runs ?? 1}
                        </div>
                      )}
                      {evt.type === 'no_ball' && (
                        <div className="w-10 h-10 bg-[#B84014] text-white rounded flex items-center justify-center font-display text-lg font-bold shrink-0">
                          NB
                        </div>
                      )}
                      {evt.type === 'dot' && (
                        <div className="w-10 h-10 bg-[#635D50] text-white rounded flex items-center justify-center font-display text-2xl font-bold shrink-0">
                          •
                        </div>
                      )}
                      {evt.type === 'undo' && (
                        <div className="w-10 h-10 bg-[#8F170C] text-white rounded flex items-center justify-center font-display text-lg font-bold shrink-0">
                          ⤺
                        </div>
                      )}

                      {/* Event details */}
                      <div>
                        <div className="font-bold text-sm text-[#191C18] flex items-center gap-1.5">
                          {evt.type === 'wicket' && (
                            <span>
                              OUT! {evt.batter || striker} ({evt.dismissal?.replace('_', ' ')})
                            </span>
                          )}
                          {evt.type === 'runs' && (
                            <span>
                              {evt.runs} {evt.runs === 1 ? 'Run' : 'Runs'} {evt.boundary ? (evt.runs === 6 ? '— SIXER!' : '— FOUR!') : ''}
                            </span>
                          )}
                          {evt.type === 'wide' && <span>Wide Ball (+{evt.runs || 1} run)</span>}
                          {evt.type === 'no_ball' && <span>No Ball (Free Hit / Extra)</span>}
                          {evt.type === 'dot' && <span>Dot Ball (0 runs)</span>}
                          {evt.type === 'undo' && <span>Undo Last Ball</span>}
                        </div>
                        <div className="text-xs text-[#504A3C]">
                          {evt.batter ? `Batter: ${evt.batter}` : `Striker on pitch`}
                          {evt.bowler ? ` · Bowler: ${evt.bowler}` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveEvent(idx)}
                      className="text-xs text-red-600 hover:text-red-800 p-1 font-bold press-action"
                      title="Remove this event"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clarificationSelected && (
            <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 p-2 rounded">
              Selected: {clarificationSelected}
            </p>
          )}
        </div>

        {/* Action Buttons in Bottom Thumb Zone */}
        <div className="p-3 bg-[#EDE7DA] border-t-2 border-[#191C18] grid grid-cols-2 gap-3 shrink-0">
          <button
            onClick={onRetryVoice}
            className="h-13 bg-[#FAF7F0] border-2 border-[#191C18] text-[#191C18] font-bold text-sm rounded-lg flex items-center justify-center gap-2 press-action chalk-border"
          >
            <span>Malla Cheppu</span>
            <span className="text-xs font-normal text-gray-500">(Retry)</span>
          </button>

          <button
            onClick={handleConfirmClick}
            disabled={activeEvents.length === 0}
            className={`h-13 font-display text-2xl tracking-wide rounded-lg flex items-center justify-center gap-2 text-white border-2 border-[#191C18] press-action chalk-border ${
              activeEvents.length > 0
                ? 'bg-[#D32F1E] cursor-pointer hover:bg-[#B72212]'
                : 'bg-gray-400 opacity-60 cursor-not-allowed'
            }`}
          >
            <CheckThickIcon className="w-6 h-6" />
            <span>PAKKA (CONFIRM)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
