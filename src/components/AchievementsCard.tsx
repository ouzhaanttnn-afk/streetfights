import React, { useState } from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { ACHIEVEMENTS } from '../core/achievements';
import { ui } from '../i18n/ui';
import { Award, Check, Gem } from 'lucide-react';

export const AchievementsCard: React.FC<{ state: GameStateData }> = ({ state }) => {
  const claimed = state.claimedAchievements || [];
  const rows = ACHIEVEMENTS.map((a) => ({ a, value: a.value(state), done: claimed.includes(a.id) }));
  // claimable first, then in progress, then finished
  rows.sort((x, y) => Number(x.done) - Number(y.done) || Number(y.value >= y.a.target) - Number(x.value >= x.a.target));
  const ready = rows.filter((r) => !r.done && r.value >= r.a.target).length;
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? rows : rows.slice(0, Math.max(4, ready));

  return (
    <div className="game-card rounded-3xl p-4 border border-amber-500/25 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4" />
          {ui(state.lang, 'ach_title')}
        </h3>
        <span className="text-[10px] font-mono text-zinc-400">{claimed.length}/{ACHIEVEMENTS.length}{ready > 0 ? ` • ${ready}!` : ''}</span>
      </div>
      {visible.map(({ a, value, done }) => {
        const can = !done && value >= a.target;
        const pct = Math.min(100, Math.round((value / a.target) * 100));
        return (
          <div key={a.id} className={`flex items-center gap-3 rounded-2xl bg-black/40 border border-white/5 p-2.5 ${done ? 'opacity-55' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] font-black text-zinc-100">
                <span className="truncate">{ui(state.lang, a.key, { n: a.n ?? 0 })}</span>
                <span className="font-mono text-zinc-400 ml-2">{Math.min(value, a.target)}/{a.target}</span>
              </div>
              <div className="h-1.5 mt-1.5 rounded-full bg-black/80 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-600 to-yellow-300" style={{ width: `${pct}%` }} />
              </div>
            </div>
            {done ? (
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <button
                onClick={() => gameManager.claimAchievement(a.id)}
                disabled={!can}
                className={`min-h-10 px-3 rounded-xl text-[10px] font-black flex items-center gap-1 active:scale-95 shrink-0 ${
                  can ? 'game-btn-emerald text-black shine-effect' : 'bg-neutral-900 text-zinc-600 border border-zinc-800'
                }`}
              >
                <Gem className="w-3 h-3" />{a.gems}
              </button>
            )}
          </div>
        );
      })}
      {rows.length > visible.length || showAll ? (
        <button onClick={() => setShowAll((v) => !v)} className="w-full min-h-9 rounded-xl text-[10px] font-black text-zinc-400 bg-black/30 border border-white/5 active:scale-[0.98]">
          {showAll ? ui(state.lang, 'show_less') : `${ui(state.lang, 'show_all')} (${rows.length})`}
        </button>
      ) : null}
    </div>
  );
};
