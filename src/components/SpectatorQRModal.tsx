import React, { useState } from 'react';
import { CloseThickIcon } from './CricketIcons';

interface SpectatorQRModalProps {
  isOpen: boolean;
  matchName: string;
  onClose: () => void;
}

export const SpectatorQRModal: React.FC<SpectatorQRModalProps> = ({
  isOpen,
  matchName,
  onClose,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const liveUrl = typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000';

  const handleCopy = () => {
    navigator.clipboard?.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-[#FAF7F0] border-4 border-[#191C18] rounded-xl overflow-hidden shadow-2xl flex flex-col text-center"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18]">
          <h2 className="font-display text-xl tracking-wide uppercase">Spectator Live Link</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white press-action">
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs font-bold text-[#554F42]">
            Friends sitting on the boundary or terrace can scan this QR to follow <span className="text-[#D32F1E] font-black">{matchName}</span> live:
          </p>

          {/* SVG QR Code Pattern */}
          <div className="p-3 bg-white border-3 border-[#191C18] rounded-xl inline-block mx-auto shadow-md">
            <svg className="w-44 h-44" viewBox="0 0 100 100" fill="currentColor">
              {/* Corner 1 */}
              <rect x="10" y="10" width="24" height="24" rx="2" fill="#191C18" />
              <rect x="14" y="14" width="16" height="16" fill="white" />
              <rect x="18" y="18" width="8" height="8" fill="#D32F1E" />
              {/* Corner 2 */}
              <rect x="66" y="10" width="24" height="24" rx="2" fill="#191C18" />
              <rect x="70" y="14" width="16" height="16" fill="white" />
              <rect x="74" y="18" width="8" height="8" fill="#D32F1E" />
              {/* Corner 3 */}
              <rect x="10" y="66" width="24" height="24" rx="2" fill="#191C18" />
              <rect x="14" y="70" width="16" height="16" fill="white" />
              <rect x="18" y="74" width="8" height="8" fill="#D32F1E" />
              {/* Timing & Data Grid */}
              <rect x="38" y="12" width="6" height="6" fill="#191C18" />
              <rect x="48" y="12" width="6" height="6" fill="#191C18" />
              <rect x="40" y="24" width="6" height="6" fill="#191C18" />
              <rect x="52" y="24" width="6" height="6" fill="#191C18" />
              <rect x="12" y="38" width="6" height="6" fill="#191C18" />
              <rect x="24" y="44" width="6" height="6" fill="#191C18" />
              <rect x="38" y="38" width="8" height="8" fill="#191C18" />
              <rect x="50" y="38" width="6" height="6" fill="#191C18" />
              <rect x="68" y="38" width="6" height="6" fill="#191C18" />
              <rect x="80" y="38" width="6" height="6" fill="#191C18" />
              <rect x="38" y="52" width="6" height="6" fill="#191C18" />
              <rect x="54" y="52" width="8" height="8" fill="#191C18" />
              <rect x="66" y="52" width="6" height="6" fill="#191C18" />
              <rect x="40" y="68" width="8" height="8" fill="#191C18" />
              <rect x="52" y="68" width="6" height="6" fill="#191C18" />
              <rect x="68" y="68" width="6" height="6" fill="#191C18" />
              <rect x="82" y="68" width="6" height="6" fill="#191C18" />
              <rect x="38" y="82" width="6" height="6" fill="#191C18" />
              <rect x="50" y="82" width="8" height="8" fill="#191C18" />
              <rect x="66" y="82" width="8" height="8" fill="#191C18" />
              <rect x="80" y="82" width="6" height="6" fill="#191C18" />
            </svg>
          </div>

          <div className="bg-[#EBE5D8] p-2 rounded border border-[#CFC7B6] font-mono text-xs break-all text-[#191C18]">
            {liveUrl}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 bg-[#D32F1E] text-white rounded-lg font-display text-lg tracking-wide uppercase press-action"
            >
              {copied ? 'Copied Link!' : 'Copy Live Link'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white border-2 border-[#191C18] rounded-lg text-xs font-bold press-action"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
