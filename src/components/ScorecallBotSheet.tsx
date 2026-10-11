/**
 * Scorecall — Voice Assistant Bot Sheet
 *
 * Requirements (Stage 3, Item 18):
 * - Read each answer aloud in the language of the answer
 *   (detect Telugu or Hindi script, else the question language), not the UI language.
 * - Add quick chips: Partnership and Run Rate (along with Score, Bowling, Batting, Wickets).
 */

import React, { useState } from 'react';
import { X, Send, Bot, Volume2, Mic } from 'lucide-react';
import { MatchState } from '../types/cricket';
import { answerMatchQuestion, BotAnswer } from '../utils/botEngine';
import { speakText, detectScriptLanguage } from '../utils/speechTts';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  lang?: 'en' | 'te' | 'hi';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  match: MatchState;
}

export const ScorecallBotSheet: React.FC<Props> = ({
  isOpen,
  onClose,
  match,
}) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Ask any match question in English, Telugu (తెలుగు), or Hindi (हिंदी)!',
      lang: 'en',
    },
  ]);

  if (!isOpen) {
    return null;
  }

  const handleAsk = (textToAsk: string) => {
    const q = textToAsk.trim();
    if (!q) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: q,
    };

    const answer: BotAnswer = answerMatchQuestion(q, match);

    const botMsg: Message = {
      id: `bot_${Date.now()}`,
      sender: 'bot',
      text: answer.text,
      lang: answer.lang,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setQuery('');

    // Requirement 18: Read answer aloud in language of the answer (detect Telugu or Hindi script, else question language)
    const detectedLang = detectScriptLanguage(answer.text) || answer.lang;
    speakText(answer.text, detectedLang);
  };

  const QUICK_CHIPS = [
    { label: 'Score', query: 'What is the score?' },
    { label: 'Who is bowling', query: 'Who is bowling?' },
    { label: 'Who is batting', query: 'Who is batting?' },
    { label: 'How many wickets', query: 'How many wickets fallen?' },
    // Requirement 18: Add quick chips Partnership and Run Rate
    { label: 'Partnership', query: 'Current partnership?' },
    { label: 'Run Rate', query: 'What is the current run rate?' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full max-w-md bg-[#F3EFE6] text-[#191C18] border-t-4 sm:border-4 border-[#191C18] shadow-[0px_-4px_0px_#191C18] sm:shadow-[6px_6px_0px_#191C18] h-[80vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <Bot size={22} className="text-[#F59E0B]" />
            <div>
              <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white leading-none">
                Scorecall Bot
              </h3>
              <p className="text-[10px] text-[#F59E0B] font-bold uppercase tracking-wider">
                Instant Gully Cricket Q&A
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Chips */}
        <div className="p-2.5 bg-[#E8E2D2] border-b-2 border-[#191C18] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleAsk(chip.query)}
              className="px-2.5 py-1 bg-white border border-[#191C18] text-xs font-bold text-[#191C18] whitespace-nowrap hover:bg-[#F59E0B] transition-colors shadow-[1px_1px_0px_#191C18]"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Chat message history */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3 border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] ${
                  m.sender === 'user'
                    ? 'bg-[#D32F1E] text-white'
                    : 'bg-white text-[#191C18]'
                }`}
              >
                <div className="text-sm font-semibold">{m.text}</div>
                {m.sender === 'bot' && (
                  <button
                    onClick={() => speakText(m.text, m.lang)}
                    className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#D32F1E] uppercase hover:underline"
                  >
                    <Volume2 size={12} />
                    Listen again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input bar */}
        <div className="p-3 bg-white border-t-2 border-[#191C18]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(query);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask score, bowling, wickets..."
              className="flex-1 p-2 border-2 border-[#191C18] bg-[#F3EFE6] text-sm font-bold outline-none focus:border-[#D32F1E]"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="p-2.5 bg-[#191C18] text-white hover:bg-stone-800 disabled:opacity-50 transition-colors border-2 border-[#191C18]"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
