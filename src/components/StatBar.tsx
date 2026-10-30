import React, { useEffect, useRef, useState } from 'react';
import { ui } from '../i18n/ui';
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
  // Show "+N POWER" whenever an upgrade (gear, gym, level, skill) raises the power score
  const prevPower = useRef(stats.powerScore);
  const [gain, setGain] = useState<{ value: number; key: number } | null>(null);
  useEffect(() => {
    const diff = stats.powerScore - prevPower.current;
    prevPower.current = stats.powerScore;
    if (diff > 0) {
      setGain({ value: diff, key: Date.now() });
      const timer = setTimeout(() => setGain(null), 1800);
      return () => clearTimeout(timer);
    }
  }, [stats.powerScore]);

  const statItems = [
    { label: t('stat_hp', lang), value: stats.hp, icon: Heart, color: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
    { label: t('stat_atk', lang), value: stats.atk, icon: Flame, color: 'text-rose-400', glow: 'shadow-rose-500/10' },
    { label: t('stat_def', lang), value: stats.def, icon: Shield, color: 'text-sky-400', glow: 'shadow-sky-500/10' },
    { label: t('stat_spd', lang), value: stats.spd, icon: Footprints, color: 'text-amber-400', glow: 'shadow-amber-500/10' },
    { label: t('stat_crit', lang), value: `${stats.critRate}%`, icon: Crosshair, color: 'text-purple-400', glow: 'shadow-purple-500/10' },
    { label: t('stat_cmb', lang), value: `${stats.comboRate}%`, icon: Zap, color: 'text-yellow-400', glow: 'shadow-yellow-500/10' },
    { label: t('stat_dge', lang), value: `${stats.dodgeRate}%`, icon: Wind, color: 'text-cyan-400', glow: 'shadow-cyan-500/10' },
    { label: t('stat_vamp', lang), value: `${stats.lifesteal}%`, icon: HeartPulse, color: 'text-pink-400', glow: 'shadow-pink-500/10' },
  ];

  return (
    <div className="bg-[#0b0c13]/90 backdrop-blur-md border-b border-white/10 px-3 py-2.5 select-none shadow-md">
      {/* Top row: Power Score Rating Bar */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-2 text-xs font-black text-zinc-300">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-wider uppercase text-zinc-200">{t('powerScore', lang)}</span>
        </div>
        
        <div className="relative flex items-center gap-1.5 text-xs font-black font-mono tracking-wider text-amber-300 bg-gradient-to-r from-amber-950/80 via-black to-amber-950/80 px-3 py-1 rounded-xl border border-amber-500/40 shadow-inner">
          {gain && (
            <span key={gain.key} className="power-gain absolute right-0 -top-4 whitespace-nowrap text-[11px] font-black text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              +{gain.value.toLocaleString()} {ui(lang, 'power_word')}
            </span>
          )}
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[13px]">{stats.powerScore.toLocaleString()}</span>
        </div>
      </div>

      {/* Grid of 8 Polished Stat Chips */}
      <div className="grid grid-cols-4 gap-1.5">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`min-w-0 flex flex-col gap-0.5 px-2 py-1 rounded-xl bg-black/40 border border-white/5 shadow-sm ${item.glow}`}
            >
              <div className="min-w-0 flex items-center gap-1 text-[9px] font-bold text-zinc-400 leading-none">
                <Icon className={`w-3 h-3 shrink-0 ${item.color}`} />
                <span className="tracking-tight truncate">{item.label}</span>
              </div>
              <span className={`text-[11px] leading-tight font-black font-mono ${item.color}`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
