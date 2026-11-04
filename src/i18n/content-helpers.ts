// Localised names for game content (skills, items, opponents...). Falls back to the English data string.
import type { Language } from './translations';

export function skillName(_id: string, fallback: string, _lang: Language): string {
  return fallback;
}
