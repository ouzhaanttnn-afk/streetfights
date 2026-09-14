import React from "react";
import { Skill } from "../types/game";
import { GameStateData, gameManager } from "../core/gameState";
import { t } from "../i18n/translations";
import { 
  Zap, 
  ArrowRight, 
  X, 
  Trash2, 
  Sparkles, 
  ShieldAlert 
} from "lucide-react";

interface SkillReplaceModalProps {
  state: GameStateData;
  newSkill: Skill;
  onClose: () => void;
}

export const SkillReplaceModal: React.FC<SkillReplaceModalProps> = ({ 
  state, 
  newSkill, 
  onClose 
}) => {
  const handleReplace = (oldSkillId: string) => {
    gameManager.replaceSkillInDeck(oldSkillId, newSkill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm game-card border-2 border-amber-400/60 rounded-3xl p-5 shadow-2xl flex flex-col text-white overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white uppercase">
                SKILL DECK FULL (6/6)
              </h2>
              <p className="text-[9px] text-zinc-400">
                Select a skill to replace with your new discovery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-neutral-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Incoming Skill Banner */}
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 mb-3 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono font-black text-amber-400 uppercase tracking-wider">
              NEW SKILL:
            </span>
            <div className="text-xs font-black text-white flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{newSkill.name} (Lv.{newSkill.level})</span>
            </div>
            <div className="text-[10px] text-zinc-300 font-medium mt-0.5">
              {newSkill.bonusText}
            </div>
          </div>
        </div>

        <div className="text-[10px] font-black text-zinc-400 mb-2 uppercase tracking-wide">
          CHOOSE A SKILL TO DISCARD:
        </div>

        {/* Equipped Skills Selection List */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {state.playerFighter.equippedSkills.map((equipped) => (
            <button
              key={equipped.id}
              onClick={() => handleReplace(equipped.id)}
              className="w-full p-2.5 rounded-2xl bg-black/60 border border-white/10 hover:border-rose-500/50 active:scale-[0.98] transition-all flex items-center justify-between text-left group"
            >
              <div className="min-w-0 pr-2">
                <div className="text-xs font-black text-zinc-200 group-hover:text-rose-400 transition-colors truncate">
                  {equipped.name} <span className="text-[9px] text-amber-400 font-mono">Lv.{equipped.level}</span>
                </div>
                <div className="text-[9px] text-zinc-400 truncate">
                  {equipped.bonusText}
                </div>
              </div>

              <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-all shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-zinc-300 font-bold text-xs border border-zinc-700 active:scale-95"
        >
          CANCEL / KEEP CURRENT DECK
        </button>
      </div>
    </div>
  );
};

