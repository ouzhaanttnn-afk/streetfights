import React, { useEffect, useState } from 'react';
import { EquipmentSlot, Rarity } from '../types/game';
import { getItemIcon, subscribeItemIcons } from '../game/itemIcons';

interface ItemIconProps {
  slot: EquipmentSlot;
  rarity: Rarity;
  size: number;
  fallback: React.ReactNode;
}

// Picture of the actual item (rendered once from its 3D model); shows the fallback until it is ready.
export const ItemIcon: React.FC<ItemIconProps> = ({ slot, rarity, size, fallback }) => {
  const [url, setUrl] = useState<string | null>(() => getItemIcon(slot, rarity));
  useEffect(() => {
    setUrl(getItemIcon(slot, rarity));
    return subscribeItemIcons(() => setUrl(getItemIcon(slot, rarity)));
  }, [slot, rarity]);
  if (!url) return <>{fallback}</>;
  return <img src={url} width={size} height={size} alt="" draggable={false} className="pointer-events-none select-none drop-shadow-[0_3px_6px_rgba(0,0,0,0.7)]" style={{ width: size, height: size }} />;
};
