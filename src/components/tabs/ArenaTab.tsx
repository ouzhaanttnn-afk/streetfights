import React, { useState } from 'react';
import { GameStateData, gameManager } from '../../core/gameState';
import { getStageData } from '../../core/stageDatabase';
import { t } from '../../i18n/translations';
import { 
  Trophy, 
  Swords, 
  Skull, 
  Coins, 
  Gem, 
  Lock 
} from 'lucide-react';

interface ArenaTabProps {
  state: GameStateData;
}

export const ArenaTab: React.FC<ArenaTabProps> = ({ state }) => {
  const [selectedWorld, setSelectedWorld] = useState<number>(state.currentWorld);

  const worlds = [
    { num: 1, name: 'The Back Alley', desc: 'Street fighters & reckless brawlers' },
    { num: 2, name: 'The Concrete Cage', desc: 'Underground cage duels & subway bandits' },
    { num: 3, name: 'Neon Rooftop Club', desc: 'Cyberpunk fighters & acrobatic strikers' },
    { num: 4, name: 'Pro Boxing & Striker Ring', desc: 'National champions & heavyweight sluggers' },
    { num: 5, name: 'Grand World Mega Stadium', desc: 'Apex legends & world gods' },
  ];

  const highestTotal = (state.highestWorld - 1) * 10 + state.highestSubStage;

  return (
    <div className="w-full flex flex-col p-3 bg-[#06070a] space-y-3.5 pb-16">
      
      {/* World Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {worlds.map((w) => {
          const isWorldUnlocked = state.highestWorld >= w.num;
          const isSelected = selectedWorld === w.num;

          return (
            <button
              key={w.num}
              onClick={() => setSelectedWorld(w.num)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 flex items-center gap-1.5 border transition-all active:scale-95 shadow-lg ${
                isSelected
                  ? 'game-btn-gold text-black border-amber-300'
                  : isWorldUnlocked
                    ? 'game-card text-zinc-300 border-white/10 hover:border-zinc-600'
                    : 'bg-neutral-950/80 text-zinc-600 border-zinc-900'
              }`}
            >
              {!isWorldUnlocked ? (
                <Lock className="w-3.5 h-3.5 text-zinc-600" />
              ) : (
                <Trophy className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-amber-400'}`} />
              )}
              <span>{t('world', state.lang)} {w.num}</span>
            </button>
          );
        })}
      </div>

      {/* World Banner Info */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10">
        <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{t('world', state.lang)} {selectedWorld}: {worlds[selectedWorld - 1].name}</span>
        </h3>
        <p className="text-[11px] text-zinc-400 mt-1 font-medium">
          {worlds[selectedWorld - 1].desc}
        </p>
      </div>

      {/* 10 Sub-stages List */}
      <div className="space-y-2.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((subNum) => {
          const stageData = getStageData(selectedWorld, subNum);
          const stageTotal = (selectedWorld - 1) * 10 + subNum;
          const isUnlocked = stageTotal <= highestTotal;
          const isCurrent = state.currentWorld === selectedWorld && state.currentSubStage === subNum;

          return (
            <div
              key={subNum}
              className={`rounded-3xl border p-3.5 flex items-center justify-between transition-all shadow-md ${
                isCurrent
                  ? 'game-card-gold border-amber-500 shadow-amber-500/20'
                  : isUnlocked
                    ? 'game-card border-white/10 hover:border-white/20'
                    : 'bg-neutral-950/60 border-zinc-900 opacity-60'
              }`}
            >
              {/* Left Stage Details */}
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs border shadow-inner ${
                  stageData.isBoss
                    ? 'game-btn-crimson text-white border-rose-400 animate-pulse'
                    : isCurrent
                      ? 'game-btn-gold text-black border-amber-300'
                      : 'bg-neutral-900 border-white/15 text-zinc-300'
                }`}>
                  {stageData.isBoss ? <Skull className="w-6 h-6 text-white drop-shadow" /> : `${selectedWorld}-${subNum}`}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-zinc-100 tracking-tight">
                      {stageData.opponent.name}
                    </h4>
                    {stageData.isBoss && (
                      <span className="px-2 py-0.5 bg-rose-600 text-white font-black text-[9px] rounded-md uppercase shadow-sm">
                        {t('boss', state.lang)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-1">
                    <span className="flex items-center gap-1 font-mono font-bold text-amber-300">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      +{stageData.coinReward}
                    </span>
                    <span className="flex items-center gap-1 font-mono font-bold text-cyan-300">
                      <Gem className="w-3.5 h-3.5 text-cyan-400" />
                      +{stageData.gemReward}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Enter Stage Button */}
              {isUnlocked ? (
                <button
                  onClick={() => {
                    gameManager.selectStage(selectedWorld, subNum);
                    gameManager.setActiveTab('gear');
                  }}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
                    isCurrent
                      ? 'game-btn-gold text-black border-amber-300 animate-pulse shadow-lg shine-effect'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-zinc-200 border border-white/10'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>{isCurrent ? t('fighting', state.lang) : t('battle', state.lang)}</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-neutral-900 border border-zinc-800 text-zinc-600">
                  <Lock className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
