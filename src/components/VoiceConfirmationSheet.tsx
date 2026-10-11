/**
 * Scorecall — Voice Confirmation Sheet
 *
 * Requirements:
 * 1. Move all hooks above early return (Stage 1).
 * 2. Reset editable text and events with a useEffect whenever parseResult changes (Stage 1).
 * 3. Pressing "Done editing" must re-run parseGullySpeech on the edited text and replace the events (Stage 3).
 * 4. Show the confidence of every event (Stage 3).
 */

import React, { useState, useEffect } from 'react';
import { Check, X, Edit3, AlertCircle, Volume2 } from 'lucide-react';
import { ParseResult, ParsedEvent } from '../types/cricket';
import { parseGullySpeech } from '../utils/fastSpeechMatcher';

interface Props {
  isOpen: boolean;
  parseResult: ParseResult | null;
  battingSquad: string[];
  bowlingSquad: string[];
  onConfirm: (events: ParsedEvent[]) => void;
  onCancel: () => void;
}

export const VoiceConfirmationSheet: React.FC<Props> = ({
  isOpen,
  parseResult,
  battingSquad,
  bowlingSquad,
  onConfirm,
  onCancel,
}) => {
  // Requirement 1: Hooks placed before early return
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState('');
  const [events, setEvents] = useState<ParsedEvent[]>([]);

  // Requirement 1: Reset editable text and events whenever parseResult changes
  useEffect(() => {
    if (parseResult) {
      setEditableText(parseResult.originalText || '');
      setEvents(parseResult.events || []);
      setIsEditing(false);
    }
  }, [parseResult]);

  // Early return strictly AFTER all hooks
  if (!isOpen || !parseResult) {
    return null;
  }

  // Requirement 17: "Done editing" must re-run parseGullySpeech and replace events
  const handleDoneEditing = () => {
    const reParsed = parseGullySpeech(editableText, {
      battingSquad,
      bowlingSquad,
    });
    setEvents(reParsed.events);
    setIsEditing(false);
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'boundary':
        return 'bg-[#F59E0B] text-[#191C18] border-[#191C18]';
      case 'wicket':
        return 'bg-[#D32F1E] text-white border-[#191C18]';
      case 'wide':
      case 'no_ball':
        return 'bg-amber-400 text-[#191C18] border-[#191C18]';
      default:
        return 'bg-[#191C18] text-white border-[#191C18]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#F3EFE6] text-[#191C18] border-t-4 sm:border-4 border-[#191C18] shadow-[0px_-4px_0px_#191C18] sm:shadow-[6px_6px_0px_#191C18] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <Volume2 size={20} className="text-[#F59E0B]" />
            <span className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
              Voice Confirmation
            </span>
          </div>
          <button
            onClick={onCancel}
            className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
            aria-label="Cancel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Spoken text / Transcript */}
        <div className="p-4 border-b-2 border-[#191C18] bg-white">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Spoken Transcript
            </span>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[#D32F1E] hover:underline flex items-center gap-1"
              >
                <Edit3 size={13} />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full p-2 border-2 border-[#191C18] bg-[#F3EFE6] text-sm font-semibold outline-none focus:border-[#D32F1E]"
                placeholder="e.g. four then out caught"
                autoFocus
              />
              <button
                onClick={handleDoneEditing}
                className="w-full py-1.5 bg-[#191C18] text-white font-['Bebas_Neue'] text-base tracking-wider hover:bg-stone-800 transition-colors"
              >
                Done editing
              </button>
            </div>
          ) : (
            <div className="p-2 bg-[#F3EFE6] border border-[#191C18] font-bold text-sm text-[#191C18]">
              "{editableText}"
            </div>
          )}
        </div>

        {/* Parsed Events List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-700">
            Detected Events ({events.length})
          </div>

          {events.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-[#D32F1E] bg-red-50 text-center text-xs text-[#D32F1E] font-bold">
              Could not detect scoring event. Try editing above or scoring with the keypad.
            </div>
          ) : (
            events.map((evt, idx) => (
              <div
                key={idx}
                className="p-3 border-2 border-[#191C18] bg-white shadow-[2px_2px_0px_#191C18] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-['Bebas_Neue'] text-xl text-stone-400">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase border ${getEventBadgeClass(
                          evt.type
                        )}`}
                      >
                        {evt.type.replace('_', ' ')}
                      </span>
                      {evt.runsOffBat !== undefined && evt.runsOffBat > 0 && (
                        <span className="font-['Bebas_Neue'] text-lg text-[#191C18]">
                          +{evt.runsOffBat} Bat Runs
                        </span>
                      )}
                      {evt.runsRun !== undefined && evt.runsRun > 0 && (
                        <span className="font-['Bebas_Neue'] text-lg text-[#191C18]">
                          +{evt.runsRun} Runs Run
                        </span>
                      )}
                    </div>
                    {evt.batter && (
                      <div className="text-xs text-stone-600 font-medium mt-0.5">
                        Batter: <span className="font-bold">{evt.batter}</span>
                      </div>
                    )}
                    {evt.dismissal && (
                      <div className="text-xs text-[#D32F1E] font-bold mt-0.5">
                        Dismissal: {evt.dismissal} ({evt.dismissedPlayer || 'striker'})
                      </div>
                    )}
                  </div>
                </div>

                {/* Requirement 17: Show confidence of every event */}
                <div className="text-right">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Confidence
                  </div>
                  <div className="font-['Bebas_Neue'] text-lg text-[#191C18]">
                    {Math.round((evt.confidence || 0.95) * 100)}%
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t-2 border-[#191C18] bg-[#E8E2D2] flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border-2 border-[#191C18] bg-white font-['Bebas_Neue'] text-lg tracking-wider text-[#191C18] hover:bg-stone-100 transition-colors shadow-[2px_2px_0px_#191C18]"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(events)}
            disabled={events.length === 0}
            className="flex-1 py-3 border-2 border-[#191C18] bg-[#D32F1E] font-['Bebas_Neue'] text-lg tracking-wider text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-[2px_2px_0px_#191C18]"
          >
            Confirm & Score
          </button>
        </div>
      </div>
    </div>
  );
};
