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
  ChevronDown
} from 'lucide-react';

interface StatBarProps {
  stats: FighterStats;
  lang: Language;
}

// POWER chip inside the fight HUD overlay; the full stat sheet drops down over the scene on tap.
// The opponent's difficulty chip sits under the opponent's HP bar, so this no longer repeats it.
export const StatBar: React.FC<StatBarProps> = ({ stats, lang }) => {
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

  return (
    <div className="stat-bar pointer-events-auto select-none">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${ui(lang, 'power_word')} ${stats.powerScore.toLocaleString()} – ${ui(lang, 'all_stats')}`}
        className="relative h-[18px] max-w-full flex items-center gap-1 text-amber-300 bg-black/70 pl-1.5 pr-1 rounded-md border border-amber-500/45 active:opacity-80"
      >
        {gain && (
          <span key={gain.key} className="power-gain absolute left-0 top-full mt-0.5 whitespace-nowrap text-[11px] font-black text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            +{gain.value.toLocaleString()} {ui(lang, 'power_word')}
          </span>
        )}
        <Trophy className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="text-[11px] leading-none font-black font-mono">{stats.powerScore.toLocaleString()}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full mt-1 z-40 p-1.5 rounded-2xl bg-[#0b0c13]/95 border border-white/10 shadow-2xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center gap-1.5 px-1 pb-1 text-[10px] font-black uppercase tracking-wider text-zinc-300">
            <Trophy className="w-3 h-3 text-amber-400" />
            {ui(lang, 'power_word')} <span className="font-mono text-amber-300">{stats.powerScore.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
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
        </div>
      )}
    </div>
  );
};
