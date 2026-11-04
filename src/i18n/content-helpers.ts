// Localised names for game content (skills, items, opponents, cosmetics...). Data files keep English ids/strings;
// translations live in content.ts. Every helper falls back to the English data string.
import type { Language } from './translations';
import type { EquipmentItem, Skill } from '../types/game';
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

export function worldName(world: number, fallback: string, lang: Language): string {
  const base = ((Math.max(world, 1) - 1) % 5) + 1;
  const loop = Math.floor((Math.max(world, 1) - 1) / 5);
  const name = tc(lang, WORLD_NAME[base], fallback.replace(/\s*∞\d+$/, ''));
  return loop > 0 ? `${name} ∞${loop}` : name;
}
export function stageLabel(world: number, sub: number, lang: Language): string {
  return fill(tc(lang, STAGE_LABEL, 'Stage {w}-{s}'), { w: world, s: sub });
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
