import React from 'react';
import {
  Activity, CircleDot, Crosshair, Droplet, Eye, Flame, Footprints, Gauge, Hammer, HeartPulse, LifeBuoy, Shield,
  ShieldAlert, Skull, Sparkles, Wind, Zap,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Flame, Shield, ShieldAlert, Wind, HeartPulse, Crosshair, CircleDot, Skull, Activity, Footprints, Sparkles,
  Hammer, LifeBuoy, Eye, Droplet, Gauge,
};

const COLORS: Record<string, string> = {
  Zap: 'text-yellow-400', Flame: 'text-orange-400', Shield: 'text-sky-400', ShieldAlert: 'text-sky-300', Wind: 'text-cyan-400',
  HeartPulse: 'text-pink-400', Crosshair: 'text-purple-400', CircleDot: 'text-amber-300', Skull: 'text-rose-400',
  Activity: 'text-pink-300', Footprints: 'text-cyan-300', Hammer: 'text-orange-300', LifeBuoy: 'text-sky-300',
  Eye: 'text-violet-300', Droplet: 'text-rose-400', Gauge: 'text-red-400',
};

export const SkillIcon: React.FC<{ name: string; className?: string }> = ({ name, className = 'w-6 h-6' }) => {
  const Icon = ICONS[name] || Sparkles;
  return <Icon className={`${className} ${COLORS[name] || 'text-amber-400'}`} />;
};

export const skillIconComponent = (name: string) => ICONS[name] || Sparkles;
