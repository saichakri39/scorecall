/**
 * Scorecall — Quick Player Modal
 * In-app interactive selection for "+ Batter" and "Change Bowler"
 * Replaces window.prompt to avoid iframe permission blocks.
 */

import React, { useState } from 'react';
import { X, UserPlus, Shield, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  mode: 'batter' | 'bowler';
  title: string;
  suggestedName?: string;
  squad: string[];
  activePlayers: string[];
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export const QuickPlayerModal: React.FC<Props> = ({
  isOpen,
  mode,
  title,
  suggestedName,
  squad,
  activePlayers,
  onConfirm,
  onClose,
}) => {
  const [customName, setCustomName] = useState(suggestedName || '');

  if (!isOpen) return null;

  const availableSquad = squad.filter(
    (p) => !activePlayers.map((a) => a.toLowerCase()).includes(p.toLowerCase())
  );

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (customName.trim()) {
      onConfirm(customName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] overflow-hidden">
        {/* Header */}
        <div className="bg-[#191C18] text-white p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            {mode === 'batter' ? (
              <UserPlus size={20} className="text-[#F59E0B]" />
            ) : (
              <Shield size={20} className="text-[#F59E0B]" />
            )}
            <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Quick Squad Chips */}
          {availableSquad.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-1">
                Select from Squad:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableSquad.map((player) => (
                  <button
                    key={player}
                    type="button"
                    onClick={() => {
                      onConfirm(player);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm text-[#191C18] shadow-[1px_1px_0px_#191C18] hover:bg-amber-100 transition-colors active:translate-y-0.5"
                  >
                    {player}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Name Form */}
          <form onSubmit={handleSubmit} className="space-y-2 pt-1 border-t border-[#191C18]/20">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-600">
              Or Enter Custom Name:
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={mode === 'batter' ? 'e.g. Bunty' : 'e.g. Prasad'}
              className="w-full p-2 border-2 border-[#191C18] bg-white text-sm font-bold outline-none focus:border-[#D32F1E]"
              autoFocus
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-white text-[#191C18] font-['Bebas_Neue'] text-base tracking-wider border-2 border-[#191C18] hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="flex-1 py-2 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-base tracking-wider border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
