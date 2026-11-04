import React from 'react';
import { GameStateData, QuestId, gameManager, questCoins } from '../core/gameState';
import { ui } from '../i18n/ui';
import { Check, Coins, Gem, ListChecks } from 'lucide-react';

export const DailyQuestsCard: React.FC<{ state: GameStateData }> = ({ state }) => {
  // Claimable first, finished last: "Rewards to claim -> Go" lands on something tappable
  const rank = (q: { claimed: boolean; progress: number; target: number }) => (q.claimed ? 2 : q.progress >= q.target ? 0 : 1);
  const quests = [...(state.dailyQuests || [])].sort((a, b) => rank(a) - rank(b));
  const claimable = quests.filter((q) => !q.claimed && q.progress >= q.target).length;

  return (
    <div className="game-card rounded-3xl p-4 shadow-2xl border border-emerald-500/30 space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-2">
          <ListChecks className="w-4 h-4" />
          {ui(state.lang, 'quests_title')}
        </h3>
        {claimable > 0 && (
          <span className="text-[10px] font-black text-black bg-emerald-400 rounded-full px-2 py-0.5 animate-pulse">
            {claimable}
          </span>
        )}
      </div>

      {quests.map((q) => {
        const done = q.progress >= q.target;
        const pct = Math.round((q.progress / q.target) * 100);
        return (
          <div key={q.id} className="flex items-center gap-3 rounded-2xl bg-black/40 border border-white/5 p-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] font-black text-zinc-100">
                <span className="truncate">{ui(state.lang, 'q_' + q.id)}</span>
                <span className="font-mono text-zinc-400 ml-2">{q.progress}/{q.target}</span>
              </div>
              <div className="h-1.5 mt-1.5 rounded-full bg-black/80 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center gap-2.5 mt-1 text-[10px] font-mono font-bold">
                <span className="flex items-center gap-1 text-cyan-300"><Gem className="w-3 h-3" />{q.gems}</span>
                <span className="flex items-center gap-1 text-amber-300"><Coins className="w-3 h-3" />{questCoins(q.coins, (state.highestWorld - 1) * 10 + state.highestSubStage).toLocaleString()}</span>
              </div>
            </div>
            {q.claimed ? (
              <div className="w-16 flex justify-center text-emerald-400"><Check className="w-5 h-5" /></div>
            ) : (
              <button
                onClick={() => gameManager.claimQuest(q.id)}
                disabled={!done}
                className={`min-h-10 w-16 rounded-xl text-[10px] font-black active:scale-95 ${
                  done ? 'game-btn-emerald text-black shine-effect' : 'bg-neutral-900 text-zinc-600 border border-zinc-800'
                }`}
              >
                {ui(state.lang, 'claim')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
