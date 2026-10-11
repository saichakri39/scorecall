/**
 * Scorecall — Gully Cricket Street Keypad & Quick-Action Row
 *
 * Requirements (User Item 4):
 * Quick-action row with:
 * 1. Strike Marchu / Swap Strike
 * 2. Retire
 * 3. + Batter
 * 4. Change Bowler
 * 5. Dispute (replay 6)
 * 6. Undo
 */

import React, { useState } from 'react';
import { BallInput, DismissalType } from '../types/cricket';
import {
  RotateCcw,
  ArrowLeftRight,
  UserMinus,
  UserPlus,
  Shield,
  History,
  Plus,
} from 'lucide-react';
import { SupportedLanguage, t } from '../utils/i18n';

interface Props {
  onRecordBall: (input: BallInput) => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled: boolean;
  uiLang?: SupportedLanguage;
  onAddNewBatter?: () => void;
  onChangeBowler?: () => void;
  onOpenDispute?: () => void;
}

export const KeypadScorer: React.FC<Props> = ({
  onRecordBall,
  onUndo,
  canUndo,
  disabled,
  uiLang = 'en',
  onAddNewBatter,
  onChangeBowler,
  onOpenDispute,
}) => {
  const [showWicketOptions, setShowWicketOptions] = useState(false);
  const [showExtraOptions, setShowExtraOptions] = useState(false);

  const handleSimpleBall = (runs: number) => {
    if (disabled) return;
    if (runs === 0) {
      onRecordBall({ eventType: 'dot', runs: 0, runsOffBat: 0 });
    } else if (runs === 4 || runs === 6) {
      onRecordBall({
        eventType: 'boundary',
        runsOffBat: runs,
        runs,
      });
    } else {
      onRecordBall({
        eventType: 'run',
        runsOffBat: runs,
        runs,
      });
    }
  };

  const handleWicket = (dismissalType: DismissalType = 'caught') => {
    if (disabled) return;
    onRecordBall({
      eventType: 'wicket',
      dismissalType,
    });
    setShowWicketOptions(false);
  };

  const handleWide = (runsRun = 0) => {
    if (disabled) return;
    onRecordBall({
      eventType: 'wide',
      runsRun,
    });
    setShowExtraOptions(false);
  };

  const handleNoBall = (runsOffBat = 0) => {
    if (disabled) return;
    onRecordBall({
      eventType: 'no_ball',
      runsOffBat,
    });
    setShowExtraOptions(false);
  };

  const strikeMarchuLabel =
    uiLang === 'te'
      ? 'స్ట్రైక్ మార్చు (SWAP)'
      : uiLang === 'hi'
      ? 'स्ट्राइक बदलो (SWAP)'
      : 'Strike Marchu / Swap Strike';

  return (
    <div className="w-full space-y-2 select-none">
      {/* Wicket options sub-row */}
      {showWicketOptions && (
        <div className="p-2 border-2 border-[#191C18] bg-[#D32F1E] text-white shadow-[2px_2px_0px_#191C18] space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-200">
            <span>Select Dismissal (or tap OUT again for Caught)</span>
            <button
              onClick={() => setShowWicketOptions(false)}
              className="text-white hover:underline text-[9px] font-bold"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {(['bowled', 'caught', 'run_out', 'stumped'] as DismissalType[]).map((d) => (
              <button
                key={d}
                onClick={() => handleWicket(d)}
                className="py-1.5 bg-white text-[#191C18] font-['Bebas_Neue'] text-sm tracking-wide border border-[#191C18] hover:bg-stone-100 active:translate-y-0.5"
              >
                {d.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Extras options sub-row */}
      {showExtraOptions && (
        <div className="p-2 border-2 border-[#191C18] bg-[#F59E0B] text-[#191C18] shadow-[2px_2px_0px_#191C18] space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#191C18]">
            Extras Options
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => handleWide(0)}
              className="py-1.5 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm hover:bg-stone-100"
            >
              WD (1)
            </button>
            <button
              onClick={() => handleWide(1)}
              className="py-1.5 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm hover:bg-stone-100"
            >
              WD+1 (2)
            </button>
            <button
              onClick={() => handleNoBall(0)}
              className="py-1.5 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm hover:bg-stone-100"
            >
              NB (1)
            </button>
            <button
              onClick={() => handleNoBall(4)}
              className="py-1.5 bg-white border border-[#191C18] font-['Bebas_Neue'] text-sm hover:bg-stone-100"
            >
              NB+4 (5)
            </button>
          </div>
        </div>
      )}

      {/* Primary Keypad Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1: Dot, 1, 2, 3 */}
        <button
          onClick={() => handleSimpleBall(0)}
          disabled={disabled}
          className="h-14 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-3xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40"
        >
          0
        </button>
        <button
          onClick={() => handleSimpleBall(1)}
          disabled={disabled}
          className="h-14 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-3xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40"
        >
          1
        </button>
        <button
          onClick={() => handleSimpleBall(2)}
          disabled={disabled}
          className="h-14 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-3xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40"
        >
          2
        </button>
        <button
          onClick={() => handleSimpleBall(3)}
          disabled={disabled}
          className="h-14 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-3xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40"
        >
          3
        </button>

        {/* Row 2: 4, 6, OUT, WD */}
        <button
          onClick={() => handleSimpleBall(4)}
          disabled={disabled}
          className="h-14 bg-[#F59E0B] border-2 border-[#191C18] font-['Bebas_Neue'] text-3xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-amber-400 disabled:opacity-40"
        >
          4
        </button>
        <button
          onClick={() => handleSimpleBall(6)}
          disabled={disabled}
          className="h-14 bg-[#F59E0B] border-2 border-[#191C18] font-['Bebas_Neue'] text-3xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-amber-400 disabled:opacity-40"
        >
          6
        </button>
        <button
          onClick={() => {
            if (showWicketOptions) {
              handleWicket('caught');
            } else {
              setShowWicketOptions(true);
            }
          }}
          disabled={disabled}
          className="h-14 bg-[#D32F1E] border-2 border-[#191C18] font-['Bebas_Neue'] text-2xl text-white active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-red-700 disabled:opacity-40"
        >
          {t('wicket', uiLang)}
        </button>
        <button
          onClick={() => handleWide(0)}
          disabled={disabled}
          className="h-14 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-2xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40"
        >
          WD
        </button>

        {/* Row 3: NB, B, LB, EXTRAS */}
        <button
          onClick={() => handleNoBall(0)}
          disabled={disabled}
          className="h-12 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40"
        >
          NB
        </button>
        <button
          onClick={() => onRecordBall({ eventType: 'bye', runsRun: 1 })}
          disabled={disabled}
          className="h-12 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40"
        >
          {t('bye', uiLang)}
        </button>
        <button
          onClick={() => onRecordBall({ eventType: 'leg_bye', runsRun: 1 })}
          disabled={disabled}
          className="h-12 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-xl text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40"
        >
          {t('legBye', uiLang)}
        </button>
        <button
          onClick={() => setShowExtraOptions(!showExtraOptions)}
          disabled={disabled}
          className="h-12 bg-[#E8E2D2] border-2 border-[#191C18] font-['Bebas_Neue'] text-base text-[#191C18] active:translate-y-0.5 shadow-[2px_2px_0px_#191C18] hover:bg-[#DDD5C0] flex items-center justify-center gap-1 disabled:opacity-40"
        >
          <Plus size={14} />
          EXTRAS
        </button>
      </div>

      {/* Requirement 4: The quick-action row:
          Strike Marchu / Swap Strike, Retire, + Batter, Change Bowler, Dispute (replay 6), Undo */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {/* 1. Strike Marchu / Swap Strike */}
        <button
          onClick={() => onRecordBall({ eventType: 'strike_swap' })}
          disabled={disabled}
          className="py-2.5 px-1 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-sm sm:text-base text-[#191C18] flex items-center justify-center gap-1 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40 active:translate-y-0.5 text-center leading-tight truncate"
          title="Strike Marchu / Swap Strike"
        >
          <ArrowLeftRight size={14} className="shrink-0" />
          <span className="truncate">{strikeMarchuLabel}</span>
        </button>

        {/* 2. Retire */}
        <button
          onClick={() => onRecordBall({ eventType: 'retire' })}
          disabled={disabled}
          className="py-2.5 px-1 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-sm sm:text-base text-[#191C18] flex items-center justify-center gap-1 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40 active:translate-y-0.5 text-center truncate"
          title="Retire Striker"
        >
          <UserMinus size={14} className="shrink-0" />
          <span>{t('retire', uiLang)}</span>
        </button>

        {/* 3. + Batter */}
        <button
          onClick={() => {
            if (onAddNewBatter) {
              onAddNewBatter();
            } else {
              const name = prompt('Enter new batter name:');
              if (name) onRecordBall({ eventType: 'new_batter', newBatter: name });
            }
          }}
          disabled={disabled}
          className="py-2.5 px-1 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-sm sm:text-base text-[#191C18] flex items-center justify-center gap-1 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40 active:translate-y-0.5 text-center truncate"
          title="+ Batter (New Batter)"
        >
          <UserPlus size={14} className="shrink-0" />
          <span>{t('addBatter', uiLang)}</span>
        </button>

        {/* 4. Change Bowler */}
        <button
          onClick={() => {
            if (onChangeBowler) {
              onChangeBowler();
            } else {
              const bName = prompt('Enter new bowler name:');
              if (bName) onRecordBall({ eventType: 'change_bowler', bowler: bName });
            }
          }}
          disabled={disabled}
          className="py-2.5 px-1 bg-white border-2 border-[#191C18] font-['Bebas_Neue'] text-sm sm:text-base text-[#191C18] flex items-center justify-center gap-1 shadow-[2px_2px_0px_#191C18] hover:bg-stone-50 disabled:opacity-40 active:translate-y-0.5 text-center truncate"
          title="Change Bowler"
        >
          <Shield size={14} className="shrink-0" />
          <span>{t('changeBowler', uiLang)}</span>
        </button>

        {/* 5. Dispute (replay 6) */}
        <button
          onClick={onOpenDispute}
          className="py-2.5 px-1 bg-[#F59E0B] border-2 border-[#191C18] font-['Bebas_Neue'] text-sm sm:text-base text-[#191C18] flex items-center justify-center gap-1 shadow-[2px_2px_0px_#191C18] hover:bg-amber-400 active:translate-y-0.5 text-center truncate"
          title="Dispute (replay 6)"
        >
          <History size={14} className="shrink-0" />
          <span>{t('disputeReplay6', uiLang)}</span>
        </button>

        {/* 6. Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="py-2.5 px-1 bg-[#191C18] border-2 border-[#191C18] font-['Bebas_Neue'] text-sm sm:text-base text-white flex items-center justify-center gap-1 shadow-[2px_2px_0px_#191C18] hover:bg-stone-800 disabled:opacity-40 active:translate-y-0.5 text-center truncate"
          title="Undo Last Ball"
        >
          <RotateCcw size={14} className="shrink-0" />
          <span>{t('undo', uiLang)}</span>
        </button>
      </div>
    </div>
  );
};
