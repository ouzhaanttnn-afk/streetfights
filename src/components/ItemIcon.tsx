import React, { useEffect, useState } from 'react';
import { EquipmentSlot, Rarity } from '../types/game';
import { getItemIcon, subscribeItemIcons } from '../game/itemIcons';
import { itemIconUrl } from '../game/itemAssets';

interface ItemIconProps {
  slot: EquipmentSlot;
  rarity: Rarity;
  size: number;
  fallback: React.ReactNode;
}

const imgClass = 'pointer-events-none select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]';

// Pre-rendered Blender icon; if that image is missing, render the procedural model once, then a plain icon.
export const ItemIcon: React.FC<ItemIconProps> = ({ slot, rarity, size, fallback }) => {
  const [pngFailed, setPngFailed] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  useEffect(() => {
    setPngFailed(false);
  }, [slot, rarity]);

  useEffect(() => {
    if (!pngFailed) return;
    setGenerated(getItemIcon(slot, rarity));
    return subscribeItemIcons(() => setGenerated(getItemIcon(slot, rarity)));
  }, [pngFailed, slot, rarity]);

  if (!pngFailed) {
    return (
      <img src={itemIconUrl(slot, rarity)} width={size} height={size} alt="" draggable={false} onError={() => setPngFailed(true)} className={imgClass} style={{ width: size, height: size }} />
    );
  }
  if (!generated) return <>{fallback}</>;
  return <img src={generated} width={size} height={size} alt="" draggable={false} className={imgClass} style={{ width: size, height: size }} />;
};
