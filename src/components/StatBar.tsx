import React from 'react';
import { FighterStats } from '../types/game';
import { Language, t } from '../i18n/translations';
import { 
  Heart, 
  Flame, 
  Shield, 
  Footprints, 
  Crosshair, 
  Zap, 
  Wind, 
  HeartPulse, 
  Trophy,
  Sparkles
} from 'lucide-react';

interface StatBarProps {
  stats: FighterStats;
  lang: Language;
}

export const StatBar: React.FC<StatBarProps> = ({ stats, lang }) => {
  const statItems = [
    { label: t('stat_hp', lang), value: stats.hp, icon: Heart, color: 'text-emerald-400', bg: 'bg-gradient-to-b from-emerald-950/40 to-neutral-900 border-emerald-500/20' },
    { label: t('stat_atk', lang), value: stats.atk, icon: Flame, color: 'text-rose-400', bg: 'bg-gradient-to-b from-rose-950/40 to-neutral-900 border-rose-500/20' },
    { label: t('stat_def', lang), value: stats.def, icon: Shield, color: 'text-sky-400', bg: 'bg-gradient-to-b from-sky-950/40 to-neutral-900 border-sky-500/20' },
    { label: t('stat_spd', lang), value: stats.spd, icon: Footprints, color: 'text-amber-400', bg: 'bg-gradient-to-b from-amber-950/40 to-neutral-900 border-amber-500/20' },
    { label: t('stat_crit', lang), value: `${stats.critRate}%`, icon: Crosshair, color: 'text-purple-400', bg: 'bg-gradient-to-b from-purple-950/40 to-neutral-900 border-purple-500/20' },
    { label: t('stat_cmb', lang), value: `${stats.comboRate}%`, icon: Zap, color: 'text-yellow-400', bg: 'bg-gradient-to-b from-yellow-950/40 to-neutral-900 border-yellow-500/20' },
    { label: t('stat_dge', lang), value: `${stats.dodgeRate}%`, icon: Wind, color: 'text-cyan-400', bg: 'bg-gradient-to-b from-cyan-950/40 to-neutral-900 border-cyan-500/20' },
    { label: t('stat_vamp', lang), value: `${stats.lifesteal}%`, icon: HeartPulse, color: 'text-pink-400', bg: 'bg-gradient-to-b from-pink-950/40 to-neutral-900 border-pink-500/20' },
  ];

  return (
    <div className="bg-neutral-900/90 backdrop-blur border-b border-zinc-800/80 px-3 py-2 select-none shadow-md">
      {/* Top row: Power Score Rating Bar */}
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wide uppercase font-extrabold">{t('powerScore', lang)}</span>
        </div>
        <div className="flex items-center gap-1 text-xs font-black font-mono tracking-wider text-amber-300 bg-gradient-to-r from-amber-950/90 to-neutral-900 px-2.5 py-0.5 rounded-lg border border-amber-500/40 shadow-inner">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{stats.powerScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Grid of 8 Polished Stat Chips */}
      <div className="grid grid-cols-4 gap-1.5">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`flex items-center justify-between px-2 py-1 rounded-xl border ${item.bg} shadow-sm transition-all hover:border-zinc-600`}
            >
              <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-400">
                <Icon className={`w-3 h-3 ${item.color}`} />
                <span>{item.label}</span>
              </div>
              <span className={`text-[10px] font-extrabold font-mono ${item.color}`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
