import React, { useState, useEffect } from 'react';
import { getMatchHistory } from '../utils/db';
import { MatchState } from '../types/cricket';
import { CloseThickIcon } from './CricketIcons';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadMatch: (match: MatchState) => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadMatch,
}) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getMatchHistory();
    setHistory(data);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-[#FAF7F0] border-4 border-[#191C18] rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
          <h2 className="font-display text-2xl tracking-wide uppercase">Finished Match History</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white press-action">
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {loading ? (
            <p className="text-gray-500 italic text-center py-6">Loading match logs from IndexedDB...</p>
          ) : history.length === 0 ? (
            <div className="p-6 text-center text-gray-500 bg-white border border-[#D5CEBC] rounded-lg">
              <p className="font-bold">No saved matches in history yet.</p>
              <p className="text-[11px] mt-1">Matches are automatically archived when completed or setup is updated.</p>
            </div>
          ) : (
            history.map((m) => (
              <div
                key={m.id}
                className="bg-white border-2 border-[#191C18] rounded-lg p-3 space-y-2 chalk-border shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#191C18]">{m.matchName}</span>
                  <span className="text-[10px] font-mono text-gray-500">{m.date}</span>
                </div>

                <div className="flex items-baseline justify-between pt-1 border-t border-[#F0EBE0]">
                  <div>
                    <span className="font-bold text-xs text-[#554F42]">{m.battingTeam}</span>
                    <div className="font-display text-2xl font-black text-[#D32F1E] leading-none">
                      {m.score}/{m.wickets} <span className="text-sm font-sans text-gray-600 font-normal">({m.overs} ov)</span>
                    </div>
                  </div>

                  {m.fullState && (
                    <button
                      onClick={() => {
                        onLoadMatch(m.fullState);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-[#191C18] text-white rounded text-xs font-bold press-action"
                    >
                      Load Match
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-[#EAE3D4] border-t-2 border-[#191C18] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-white border-2 border-[#191C18] rounded-lg text-xs font-bold press-action"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
