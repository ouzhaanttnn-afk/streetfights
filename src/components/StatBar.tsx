import React, { useEffect, useRef, useState } from 'react';
import { ui } from '../i18n/ui';
import { difficultyOf } from '../core/guidance';
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
  ChevronDown
} from 'lucide-react';

interface StatBarProps {
  stats: FighterStats;
  lang: Language;
  odds: number;
}

// One compact row (your power vs. the rival's, plus difficulty); the full stat sheet opens on tap
export const StatBar: React.FC<StatBarProps> = ({ stats, lang, odds }) => {
  const [open, setOpen] = useState(false);
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
    { label: t('stat_hp', lang), value: stats.hp, icon: Heart, color: 'text-emerald-400' },
    { label: t('stat_atk', lang), value: stats.atk, icon: Flame, color: 'text-rose-400' },
    { label: t('stat_def', lang), value: stats.def, icon: Shield, color: 'text-sky-400' },
    { label: t('stat_spd', lang), value: stats.spd, icon: Footprints, color: 'text-amber-400' },
    { label: t('stat_crit', lang), value: `${stats.critRate}%`, icon: Crosshair, color: 'text-purple-400' },
    { label: t('stat_cmb', lang), value: `${stats.comboRate}%`, icon: Zap, color: 'text-yellow-400' },
    { label: t('stat_dge', lang), value: `${stats.dodgeRate}%`, icon: Wind, color: 'text-cyan-400' },
    { label: t('stat_vamp', lang), value: `${stats.lifesteal}%`, icon: HeartPulse, color: 'text-pink-400' },
    { label: ui(lang, 'stat_critdmg'), value: `x${(stats.critDmg || 1.5).toFixed(2)}`, icon: Crosshair, color: 'text-orange-300' },
  ];
  const [diffKey, diffClass] = difficultyOf(odds);

  return (
    <div className="stat-bar bg-[#0b0c13]/90 backdrop-blur-md border-b border-white/10 px-3 py-1.5 select-none shadow-md">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={ui(lang, 'all_stats')}
        className="w-full min-h-9 flex items-center gap-2 active:opacity-80"
      >
        <div className="relative flex items-center gap-1.5 text-amber-300 bg-gradient-to-r from-amber-950/80 via-black to-amber-950/40 pl-2 pr-2.5 py-1 rounded-xl border border-amber-500/40 shadow-inner">
          {gain && (
            <span key={gain.key} className="power-gain absolute left-1 -top-4 whitespace-nowrap text-[11px] font-black text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              +{gain.value.toLocaleString()} {ui(lang, 'power_word')}
            </span>
          )}
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">{ui(lang, 'power_word')}</span>
          <span className="text-[13px] font-black font-mono">{stats.powerScore.toLocaleString()}</span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-bold text-zinc-400 truncate">{ui(lang, 'rival')}:</span>
          <span className={`shrink-0 px-1.5 py-0.5 rounded-md bg-black/60 border text-[10px] font-black tracking-wider ${diffClass}`}>{ui(lang, diffKey)}</span>
        </div>
        <ChevronDown className={`ml-auto w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="grid grid-cols-3 gap-1.5 mt-1.5 animate-fadeIn">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="min-w-0 flex flex-col gap-0.5 px-2 py-1 rounded-xl bg-black/40 border border-white/5 shadow-sm">
                <div className="min-w-0 flex items-center gap-1 text-[10px] font-bold text-zinc-400 leading-none">
                  <Icon className={`w-3 h-3 shrink-0 ${item.color}`} />
                  <span className="tracking-tight truncate">{item.label}</span>
                </div>
                <span className={`text-[11px] leading-tight font-black font-mono ${item.color}`}>{item.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
