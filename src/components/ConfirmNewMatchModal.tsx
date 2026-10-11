/**
 * Scorecall — Confirm New Match Modal
 * In-app confirmation dialog for saving current match and starting a new one.
 * Replaces window.confirm to comply with iframe environment.
 */

import React from 'react';
import { AlertCircle, X, Save, PlusCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onConfirmSaveAndNew: () => void;
  onConfirmWithoutSave: () => void;
  onCancel: () => void;
}

export const ConfirmNewMatchModal: React.FC<Props> = ({
  isOpen,
  onConfirmSaveAndNew,
  onConfirmWithoutSave,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] overflow-hidden">
        {/* Header */}
        <div className="bg-[#191C18] text-white p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <AlertCircle size={20} className="text-[#F59E0B]" />
            <h3 className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
              Start New Match?
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-xs font-semibold text-stone-700">
            A match is currently active. Would you like to archive and save the current match to history before setting up a new one?
          </p>

          <div className="space-y-2 pt-2">
            <button
              onClick={onConfirmSaveAndNew}
              className="w-full py-2.5 bg-[#D32F1E] text-white font-['Bebas_Neue'] text-lg tracking-wider border-2 border-[#191C18] shadow-[2px_2px_0px_#191C18] hover:bg-red-700 flex items-center justify-center gap-1.5 active:translate-y-0.5"
            >
              <Save size={16} />
              Save to History & Start New
            </button>

            <button
              onClick={onConfirmWithoutSave}
              className="w-full py-2 bg-white text-[#191C18] font-['Bebas_Neue'] text-base tracking-wider border-2 border-[#191C18] hover:bg-stone-100 flex items-center justify-center gap-1.5"
            >
              <PlusCircle size={16} />
              Start New Without Saving
            </button>

            <button
              onClick={onCancel}
              className="w-full py-1.5 text-xs font-bold text-stone-600 hover:text-black uppercase"
            >
              Cancel & Continue Current Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
