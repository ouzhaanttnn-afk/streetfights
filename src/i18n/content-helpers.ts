// Localised names for game content (skills, items, opponents, cosmetics...). Data files keep English ids/strings;
// translations live in content.ts. Every helper falls back to the English data string.
import type { Language } from './translations';
import type { EquipmentItem, Skill } from '../types/game';
import { ui } from './ui';
import { leagueId, leagueOfWorld, legendRank, roman, worldInLeague } from '../core/leagues';
import {
  AVATAR_TEXT, COSMETIC_TEXT, ITEM_TEXT, OPPONENT_TEXT, RARITY_NAME, SKILL_BONUS_TEMPLATE, SKILL_CATEGORY, SKILL_TEXT,
  STAGE_LABEL, SUB_BOSS_LABEL, SUB_BOSS_TITLE, TITLE_TEXT, WORLD_NAME, fill, tc,
} from './content';

export function skillName(id: string, fallback: string, lang: Language): string {
  return tc(lang, SKILL_TEXT[id]?.name, fallback);
}
export function skillDescription(skill: Skill, lang: Language): string {
  return tc(lang, SKILL_TEXT[skill.id]?.description, skill.description);
}
export function skillQuote(skill: Skill, lang: Language): string {
  return tc(lang, SKILL_TEXT[skill.id]?.quote, skill.quote || '');
}
export function skillCategory(category: string | undefined, lang: Language): string {
  return category ? tc(lang, SKILL_CATEGORY[category], category) : '';
}
// Bonus line from the skill's current (levelled) stats
export function skillBonus(skill: Skill, lang: Language): string {
  const tpl = SKILL_BONUS_TEMPLATE[skill.id];
  if (!tpl) return skill.bonusText || '';
  const vars: Record<string, string | number> = {};
  Object.entries(skill.statBonus || {}).forEach(([k, v]) => {
    if (typeof v !== 'number') return;
    vars[k] = k === 'critDmg' ? Math.round(v * 100) : Math.round(v * 10) / 10;
  });
  return fill(tc(lang, tpl), vars);
}

const RARITY_PREFIX = /^(UNCOMMON|RARE|EPIC|LEGENDARY|MYTHIC) /;
export function itemName(item: EquipmentItem, lang: Language): string {
  const base = item.name.replace(RARITY_PREFIX, '');
  return tc(lang, ITEM_TEXT[base]?.name, base);
}
export function itemFlavor(item: EquipmentItem, lang: Language): string {
  const base = item.name.replace(RARITY_PREFIX, '');
  return tc(lang, ITEM_TEXT[base]?.flavor, item.flavorText || '');
}
export function rarityName(rarity: string, fallback: string, lang: Language): string {
  return tc(lang, RARITY_NAME[rarity], fallback);
}

// World names are the same in every league; the league is shown next to them (src/core/leagues.ts)
export function worldName(world: number, fallback: string, lang: Language): string {
  return tc(lang, WORLD_NAME[worldInLeague(world)], fallback.replace(/\s*∞\d+$/, ''));
}
/** "Silver", "Legend", "Legend II" ... */
export function leagueName(league: number, lang: Language): string {
  const base = ui(lang, 'league_' + leagueId(league));
  const rank = legendRank(league);
  return rank > 1 ? `${base} ${roman(rank)}` : base;
}
/** "Silver League" */
export function leagueLabel(league: number, lang: Language): string {
  return ui(lang, 'league_name', { league: leagueName(league, lang) });
}
/** Bronze keeps "Stage 2-4"; later leagues read "Silver 2-4" (world inside the league) */
export function stageLabel(world: number, sub: number, lang: Language): string {
  const league = leagueOfWorld(world);
  if (league > 0) return `${leagueName(league, lang)} ${worldInLeague(world)}-${sub}`;
  return fill(tc(lang, STAGE_LABEL, 'Stage {w}-{s}'), { w: world, s: sub });
}
/** One-line description of a league modifier ("Opponents +8% dodge") */
export function leagueModText(mod: { id: string; value: number } | undefined, lang: Language): string {
  if (!mod) return '';
  const n = mod.id === 'armor' || mod.id === 'haste' ? Math.round(mod.value * 100) : mod.value;
  return ui(lang, 'lmod_' + mod.id, { n });
}

const SUB_BOSS_SUFFIX = ' (Sub-Boss)';
export function opponentName(name: string, lang: Language): string {
  return name.endsWith(SUB_BOSS_SUFFIX) ? `${name.slice(0, -SUB_BOSS_SUFFIX.length)} (${tc(lang, SUB_BOSS_LABEL)})` : name;
}
export function opponentTitle(name: string, title: string, lang: Language): string {
  if (name.endsWith(SUB_BOSS_SUFFIX)) return tc(lang, SUB_BOSS_TITLE, title);
  return tc(lang, OPPONENT_TEXT[name]?.title, title);
}
export function opponentDialogue(name: string, dialogue: string, lang: Language): string {
  const key = name.endsWith(SUB_BOSS_SUFFIX) ? name.slice(0, -SUB_BOSS_SUFFIX.length) : name;
  return tc(lang, OPPONENT_TEXT[key]?.dialogue, dialogue);
}

export function cosmeticName(id: string, fallback: string, lang: Language): string {
  return tc(lang, COSMETIC_TEXT[id]?.name, fallback);
}
export function cosmeticDescription(id: string, fallback: string, lang: Language): string {
  return tc(lang, COSMETIC_TEXT[id]?.description, fallback);
}
export function avatarName(id: string, fallback: string, lang: Language): string {
  return tc(lang, AVATAR_TEXT[id]?.name, fallback);
}
export function titleName(id: string, fallback: string, lang: Language): string {
  return tc(lang, TITLE_TEXT[id], fallback);
}
