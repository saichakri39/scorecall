/**
 * Scorecall — Spectator QR Modal
 *
 * Requirements:
 * 1. Move every hook above early return (Stage 1).
 * 2. Generate a real QR code of the page URL (small inline QR generator, no external requests)
 *    and label it "Demo link: opens the app, no live sync" (Stage 3).
 */

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import { generateQRCodeSVG } from '../utils/qrCode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matchId: string;
}

export const SpectatorQRModal: React.FC<Props> = ({
  isOpen,
  onClose,
  matchId,
}) => {
  // Requirement 1: Hooks above early return
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?match=${matchId}`;
      setCurrentUrl(url);
    }
  }, [matchId]);

  // Early return strictly AFTER hooks
  if (!isOpen) {
    return null;
  }

  const handleCopy = () => {
    if (navigator.clipboard && currentUrl) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrSvg = generateQRCodeSVG(currentUrl || 'https://scorecall.cricket', 200);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm bg-[#F3EFE6] text-[#191C18] border-4 border-[#191C18] shadow-[6px_6px_0px_#191C18] overflow-hidden">
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] p-3 flex items-center justify-between border-b-4 border-[#D32F1E]">
          <div className="flex items-center gap-2">
            <QrCode size={20} className="text-[#F59E0B]" />
            <span className="font-['Bebas_Neue'] text-2xl tracking-wide text-white">
              Spectator Link
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-[#D32F1E] text-white hover:bg-red-700 transition-colors border border-[#191C18]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col items-center text-center space-y-4">
          {/* Real QR Code Generated Inline */}
          <div className="p-3 bg-white border-2 border-[#191C18] shadow-[3px_3px_0px_#191C18]">
            <div
              dangerouslySetInnerHTML={{ __html: qrSvg }}
              className="w-48 h-48 flex items-center justify-center"
            />
          </div>

          {/* Exact Required Label per Requirement 20 */}
          <div className="bg-[#F59E0B] text-[#191C18] border-2 border-[#191C18] px-3 py-1 font-bold text-xs uppercase tracking-wide">
            Demo link: opens the app, no live sync
          </div>

          <p className="text-xs text-stone-700 font-medium">
            Scan with your phone to open Scorecall directly on street corners or share the match link.
          </p>

          {/* Copy input bar */}
          <div className="w-full flex items-center border-2 border-[#191C18] bg-white">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 px-2 py-2 text-xs font-mono text-stone-800 bg-transparent outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-[#191C18] text-white hover:bg-stone-800 flex items-center gap-1 text-xs font-bold transition-colors"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
