/**
 * Scorecall — Share Match Story & Fact Checker Modal
 *
 * Requirements (Stage 3, Item 19):
 * - Replace "FACT CHECKED (100% MATCH)" with
 *   "Checked: names and numbers match the scorecard" or "Needs review".
 * - Use storyVerifier.ts to verify team names as whole strings and match stats.
 * - Accept story styles: telugu_commentator, tweet_thread, dramatic_report, roast_mode.
 */

import React, { useState } from 'react';
import { X, Share2, Sparkles, CheckCircle, AlertTriangle, Copy, Check } from 'lucide-react';
import { MatchState, StoryStyle } from '../types/cricket';
import { deriveMatchStats } from '../utils/scoringEngine';
import { verifyStoryAgainstMatch, VerificationResult } from '../utils/storyVerifier';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: MatchState;
}

export const ShareMatchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  match,
}) => {
  const [style, setStyle] = useState<StoryStyle>('telugu_commentator');
  const [story, setStory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) {
    return null;
  }

  const derived = deriveMatchStats(match.balls, match);

  const generateStory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match,
          style,
        }),
      });

      if (!response.ok) {
        throw new Error('Server request failed');
      }

      const data = await response.json();
      const generatedText = data.story || '';
      setStory(generatedText);

      // Verify facts
      const verified = verifyStoryAgainstMatch(generatedText, match);
      setVerification(verified);
    } catch (err) {
      // Local fallback template if server offline or no API key
      const fallback = `Gully clash between ${match.teamBatting} and ${match.teamBowling}! ${match.teamBatting} put up ${derived.totalRuns}/${derived.wickets} in ${derived.overs}.${derived.ballsInOver} overs. ${derived.striker} stood strong. Street cricket at its peak!`;
      setStory(fallback);
      const verified = verifyStoryAgainstMatch(fallback, match);
      setVerification(verified);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && story) {
      navigator.clipboard.writeText(story);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const STYLES: { id: StoryStyle; label: string; desc: string }[] = [
    {
      id: 'telugu_commentator',
      label: 'Telugu Commentator',
      desc: 'High-energy regional slang and enthusiasm',
    },
    {
      id: 'tweet_thread',
      label: 'Tweet Thread',
      desc: 'Bite-sized punchy play-by-play',
    },
    {
      id: 'dramatic_report',
      label: 'Dramatic Match Report',
      desc: 'Cinematic prose as if an ICC World Cup final',
    },
    {
      id: 'roast_mode',
      label: 'Roast Mode',
      desc: 'Humorous street cricket banter and fielding roasts',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-4 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <Sparkles size={22} className="text-[#F59E0B]" />
            <h2 className="font-['Bebas_Neue'] text-3xl tracking-wide text-white">
              AI Match Story & Share
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

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {/* Style Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Select Narrative Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-2.5 text-left border-2 transition-all ${
                    style === s.id
                      ? 'border-[#191C18] bg-[#F59E0B] shadow-[2px_2px_0px_#191C18]'
                      : 'border-[#191C18]/40 bg-white hover:border-[#191C18]'
                  }`}
                >
                  <div className="font-bold text-xs text-[#191C18]">{s.label}</div>
                  <div className="text-[10px] text-stone-600 line-clamp-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateStory}
            disabled={isLoading}
            className="w-full py-3 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-xl tracking-wider border-2 border-[#191C18] shadow-[3px_3px_0px_#191C18] hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {isLoading ? 'Generating Story...' : 'Generate Match Story'}
          </button>

          {/* Generated Story Display */}
          {story && (
            <div className="space-y-3">
              <div className="p-4 bg-white border-2 border-[#191C18] shadow-[3px_3px_0px_#191C18] relative">
                <div className="font-sans text-sm font-semibold text-[#191C18] leading-relaxed whitespace-pre-wrap">
                  {story}
                </div>
              </div>

              {/* Requirement 19: Replace 'FACT CHECKED (100% MATCH)' with
                  'Checked: names and numbers match the scorecard' or 'Needs review' */}
              {verification && (
                <div
                  className={`p-2.5 border-2 flex items-center gap-2 text-xs font-bold ${
                    verification.verified
                      ? 'border-[#191C18] bg-green-100 text-green-950'
                      : 'border-[#D32F1E] bg-red-100 text-[#D32F1E]'
                  }`}
                >
                  {verification.verified ? (
                    <CheckCircle size={16} className="text-green-700 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className="text-[#D32F1E] shrink-0" />
                  )}
                  <span>{verification.badgeText}</span>
                </div>
              )}

              {/* Copy / Share Button */}
              <button
                onClick={handleCopy}
                className="w-full py-2.5 bg-[#191C18] text-white font-['Bebas_Neue'] text-lg tracking-wider hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 border-2 border-[#191C18]"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copied to Clipboard' : 'Copy Story'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
