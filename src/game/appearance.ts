import { EquipmentItem, EquipmentSlot, Fighter, Stage } from '../types/game';
import { FighterAppearance, GearLook, RarityName } from './fighter3d/FighterRig';

const look = (item: EquipmentItem | null | undefined): GearLook | null =>
  item ? { rarity: item.rarity as RarityName, name: item.name } : null;

// Maps the saved avatar + equipped items onto the 3D figure (no save-format changes needed).
export function playerAppearance(fighter: Fighter): FighterAppearance {
  const eq = fighter.equipped as Record<EquipmentSlot, EquipmentItem | null>;
  const a = fighter.avatarStyle;
  return {
    skinTone: a.skinTone, hairColor: a.hairColor, hairStyle: a.hairStyle, bodyColor: a.bodyColor,
    gloveColor: a.gloveColor, shoeColor: a.shoeColor, auraEffect: a.auraEffect, ballColor: a.ballColor,
    gear: {
      head: look(eq.head), gloves: look(eq.gloves), robe: look(eq.robe), shorts: look(eq.shorts),
      boots: look(eq.boots), belt: look(eq.belt), weapon: look(eq.weapon), partner: look(eq.partner), mouth: look(eq.mouth),
    },
  };
}

const WORLD_RARITY: RarityName[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// Opponents wear gear whose rarity follows their world, so progress is visible on screen.
export function opponentAppearance(stage: Stage): FighterAppearance {
  const a = stage.opponent.avatarStyle;
  const rarity = WORLD_RARITY[(stage.world - 1) % WORLD_RARITY.length];
  const boss = stage.isBoss;
  return {
    skinTone: a.skinTone, hairColor: a.hairColor, hairStyle: a.hairStyle, bodyColor: a.bodyColor,
    gloveColor: a.gloveColor, shoeColor: a.shoeColor, isBoss: boss,
    gear: {
      gloves: { rarity, name: 'Gloves' },
      boots: { rarity, name: 'Boots' },
      belt: boss ? { rarity: 'legendary', name: 'Champion Belt' } : null,
      head: boss ? { rarity: 'epic', name: 'Golden Champion Crown' } : null,
      robe: boss ? { rarity: 'legendary', name: 'Champion Robe' } : null,
    },
  };
}
