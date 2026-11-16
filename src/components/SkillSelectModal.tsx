import React, { useEffect, useRef, useState } from 'react';
import { RARITY_CONFIG } from '../core/lootGenerator';
import { GameStateData, SkillDraft, gameManager } from '../core/gameState';
import { DECK_SIZE } from '../core/skillDatabase';
import { ui } from '../i18n/ui';
import { rarityName, skillBonus, skillCategory, skillDescription, skillName } from '../i18n/content-helpers';
import { SkillIcon } from './SkillIcon';
import { Sparkles, Star } from 'lucide-react';

// Skill draft (docs/PLAN_BUILD_19.md B1): three different skills side by side, free, no reroll.
// Auto mode picks the highlighted option after AUTO_PICK_MS unless the player touches the card or turned
// "Always let me choose" on in Settings.
export const AUTO_PICK_MS = 8000;

interface SkillDraftModalProps {
  draft: SkillDraft;
  state: GameStateData;
}

export const SkillDraftModal: React.FC<SkillDraftModalProps> = ({ draft, state }) => {
  const lang = state.lang;
  const deck = state.playerFighter.equippedSkills;
  const countdownOn = state.autoBattle && !state.draftAlwaysChoose;
  const [left, setLeft] = useState(countdownOn ? AUTO_PICK_MS : -1);
  const doneRef = useRef(false);

  useEffect(() => {
    if (left < 0) return;
    const started = performance.now();
    const startLeft = left;
    const timer = setInterval(() => {
      const rest = Math.max(0, startLeft - (performance.now() - started));
      setLeft(rest);
      if (rest <= 0 && !doneRef.current) {
        doneRef.current = true;
        clearInterval(timer);
        gameManager.pickSkillDraft(draft.recommended);
      }
    }, 100);
    return () => clearInterval(timer);
    // the countdown restarts only when it is switched off/on, not on every tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left < 0, draft]);

  const stopCountdown = () => { if (left >= 0) setLeft(-1); };
  const pick = (i: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    gameManager.pickSkillDraft(i);
  };

  return (
    <div
      className="modal-shell fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onPointerDown={stopCountdown}
      data-skill-draft
    >
      <div className="relative w-full max-w-sm rounded-3xl border-2 border-amber-400/50 game-card p-4 shadow-2xl flex flex-col text-white overflow-hidden" role="dialog" aria-label={ui(lang, 'draft_title')}>
        <div className="flex flex-col items-center text-center mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/70 border border-white/10 text-[11px] font-black tracking-widest uppercase text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{ui(lang, 'draft_title')}</span>
          </div>
          <span className="mt-1 text-[11px] font-bold text-zinc-400">{ui(lang, 'draft_sub')}</span>
        </div>

        <div className="flex flex-col gap-2">
          {draft.options.map((skill, i) => {
            const rarity = RARITY_CONFIG[skill.rarity];
            const owned = deck.find((s) => s.id === skill.id);
            const levelUp = draft.levelUp[i] && !!owned;
            const recommended = i === draft.recommended;
            const swap = !levelUp && deck.length >= DECK_SIZE;
            return (
              <button
                key={skill.id}
                type="button"
                data-draft-option={skill.id}
                data-levelup={levelUp ? '1' : undefined}
                data-recommended={recommended ? '1' : undefined}
                onClick={() => pick(i)}
                className={`relative w-full text-left rounded-2xl border-2 p-3 flex gap-3 items-start active:scale-[0.98] transition-transform ${rarity.bgColor} ${
                  recommended ? 'border-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.35)]' : 'border-white/10'
                }`}
              >
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center">
                  <SkillIcon name={skill.iconName} className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[13px] font-black leading-tight text-white">{skillName(skill.id, skill.name, lang)}</span>
                    <span className={`px-1.5 py-px rounded-md text-[10px] font-black uppercase ${levelUp ? 'bg-emerald-500 text-black' : 'bg-sky-500 text-black'}`}>
                      {levelUp ? ui(lang, 'draft_levelup', { n: Math.min(owned!.maxLevel, owned!.level + 1) }) : ui(lang, 'draft_new')}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase">
                    <span className={rarity.color}>{rarityName(skill.rarity, rarity.name, lang)}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-300">{skillCategory(skill.category, lang)}</span>
                  </div>
                  <div className="mt-1 text-[11px] font-black text-amber-300 tabular-nums">{skillBonus(levelUp ? owned! : skill, lang)}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-zinc-300">{skillDescription(skill, lang)}</div>
                  {swap && <div className="mt-1 text-[10px] font-black text-rose-300">{ui(lang, 'draft_swap')}</div>}
                </div>
                {recommended && (
                  <span className="absolute -top-2 right-3 px-2 py-px rounded-full game-btn-gold text-black text-[10px] font-black flex items-center gap-1 shadow">
                    <Star className="w-3 h-3" /> {ui(lang, 'draft_recommended')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {left >= 0 && (
          <div className="mt-3" data-draft-countdown>
            <div className="flex items-center justify-between text-[11px] font-black">
              <span className="text-amber-300 tabular-nums">{ui(lang, 'draft_auto', { n: Math.ceil(left / 1000) })}</span>
              <span className="text-zinc-400">{ui(lang, 'draft_auto_stop')}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-black/70 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-300" style={{ width: `${(left / AUTO_PICK_MS) * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
