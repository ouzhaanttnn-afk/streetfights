import React from 'react';
import { Language } from '../i18n/translations';
import { LEAGUE_COLORS, leagueId } from '../core/leagues';
import { leagueName } from '../i18n/content-helpers';

// Small league badge shown next to the player's name (docs/PLAN_BUILD_19.md C1). `compact` shows only the medal.
export const LeagueBadge: React.FC<{ league: number; lang: Language; compact?: boolean; className?: string }> = ({ league, lang, compact, className = '' }) => {
  const color = LEAGUE_COLORS[leagueId(league)];
  const name = leagueName(league, lang);
  return (
    <span
      data-league-badge={leagueId(league)}
      title={name}
      aria-label={name}
      className={`inline-flex items-center gap-1 shrink-0 rounded-md border px-1.5 py-px text-[10px] font-black uppercase leading-tight bg-black/60 ${className}`}
      style={{ borderColor: color, color }}
    >
      <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" aria-hidden="true">
        <path d="M6 0.6 L11 3.3 V8.7 L6 11.4 L1 8.7 V3.3 Z" fill={color} stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" />
      </svg>
      {!compact && <span>{name}</span>}
    </span>
  );
};
