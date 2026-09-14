export interface PremiumAvatar {
  id: string;
  name: string;
  tagline: string;
  avatarChar: string;
  gradient: string;
  borderColor: string;
  glowColor: string;
  rarity: "starter" | "rare" | "epic" | "legendary" | "mythic";
  free: boolean;
  costGems?: number;
}

export interface FighterTitle {
  id: string;
  nameTr: string;
  nameEn: string;
  badge: string;
  color: string;
  unlockLevel: number;
}

export const PREMIUM_AVATARS: PremiumAvatar[] = [
  {
    id: "avatar_cyber_striker",
    name: "Cyber Striker",
    tagline: "Neon-Powered Street King",
    avatarChar: "?",
    gradient: "from-cyan-500 via-blue-600 to-indigo-900",
    borderColor: "border-cyan-400",
    glowColor: "shadow-cyan-500/50",
    rarity: "starter",
    free: true
  },
  {
    id: "avatar_dragon_king",
    name: "Golden Dragon",
    tagline: "Heavyweight Golden Champion",
    avatarChar: "??",
    gradient: "from-amber-400 via-yellow-500 to-orange-700",
    borderColor: "border-amber-400",
    glowColor: "shadow-amber-500/50",
    rarity: "legendary",
    free: true
  },
  {
    id: "avatar_flame_brawler",
    name: "Flame Brawler",
    tagline: "Inferno Volley Master",
    avatarChar: "??",
    gradient: "from-rose-500 via-red-600 to-orange-800",
    borderColor: "border-rose-400",
    glowColor: "shadow-rose-500/50",
    rarity: "rare",
    free: true
  },
  {
    id: "avatar_shaolin_monk",
    name: "Shaolin Zen",
    tagline: "Iron Body Discipline",
    avatarChar: "??",
    gradient: "from-emerald-500 via-teal-600 to-emerald-900",
    borderColor: "border-emerald-400",
    glowColor: "shadow-emerald-500/50",
    rarity: "epic",
    free: true
  },
  {
    id: "avatar_shadow_ninja",
    name: "Shadow Shinobi",
    tagline: "Silent Evasion Specialist",
    avatarChar: "??",
    gradient: "from-purple-600 via-slate-800 to-black",
    borderColor: "border-purple-400",
    glowColor: "shadow-purple-500/50",
    rarity: "epic",
    free: true
  },
  {
    id: "avatar_valkyrie_ace",
    name: "Valkyrie Ace",
    tagline: "Sky Striker Prodigy",
    avatarChar: "??",
    gradient: "from-fuchsia-500 via-pink-600 to-rose-900",
    borderColor: "border-fuchsia-400",
    glowColor: "shadow-fuchsia-500/50",
    rarity: "legendary",
    free: true
  },
  {
    id: "avatar_mecha_boxer",
    name: "Titan Mech",
    tagline: "Titanium Cybernetic Fist",
    avatarChar: "??",
    gradient: "from-blue-500 via-slate-700 to-zinc-900",
    borderColor: "border-blue-400",
    glowColor: "shadow-blue-500/50",
    rarity: "mythic",
    free: true
  },
  {
    id: "avatar_street_phantom",
    name: "Street Phantom",
    tagline: "Undefeated Alley Demon",
    avatarChar: "??",
    gradient: "from-violet-600 via-indigo-900 to-black",
    borderColor: "border-violet-400",
    glowColor: "shadow-violet-500/50",
    rarity: "mythic",
    free: true
  },
  {
    id: "avatar_golden_god",
    name: "God of Vole",
    tagline: "Ascended Martial Legend",
    avatarChar: "?",
    gradient: "from-yellow-300 via-amber-500 to-yellow-900",
    borderColor: "border-yellow-300",
    glowColor: "shadow-yellow-400/70",
    rarity: "mythic",
    free: true
  },
  {
    id: "avatar_neon_tiger",
    name: "Neon Tiger",
    tagline: "Fierce Apex Predator",
    avatarChar: "??",
    gradient: "from-orange-500 via-amber-600 to-zinc-900",
    borderColor: "border-orange-400",
    glowColor: "shadow-orange-500/50",
    rarity: "rare",
    free: true
  },
  {
    id: "avatar_ice_striker",
    name: "Frost Striker",
    tagline: "Absolute Zero Precision",
    avatarChar: "??",
    gradient: "from-sky-300 via-cyan-600 to-blue-900",
    borderColor: "border-sky-300",
    glowColor: "shadow-sky-400/50",
    rarity: "rare",
    free: true
  },
  {
    id: "avatar_iron_champion",
    name: "Iron Champion",
    tagline: "Heavyweight Belt Holder",
    avatarChar: "??",
    gradient: "from-red-600 via-zinc-800 to-neutral-950",
    borderColor: "border-red-500",
    glowColor: "shadow-red-500/50",
    rarity: "starter",
    free: true
  }
];

export const FIGHTER_TITLES: FighterTitle[] = [
  {
    id: "title_rookie",
    nameTr: "Sokak Çaylaðý",
    nameEn: "Street Rookie",
    badge: "??",
    color: "text-zinc-400",
    unlockLevel: 1
  },
  {
    id: "title_undefeated",
    nameTr: "Yenilmez Dövüþçü",
    nameEn: "The Undefeated",
    badge: "?",
    color: "text-cyan-400",
    unlockLevel: 3
  },
  {
    id: "title_volley_king",
    nameTr: "Altýn Vole Kralý",
    nameEn: "Golden Volley King",
    badge: "??",
    color: "text-amber-400",
    unlockLevel: 5
  },
  {
    id: "title_iron_chin",
    nameTr: "Demir Çene Þampiyonu",
    nameEn: "Iron Chin Legend",
    badge: "???",
    color: "text-emerald-400",
    unlockLevel: 8
  },
  {
    id: "title_street_legend",
    nameTr: "Sokak Efsanesi",
    nameEn: "Street Legend",
    badge: "??",
    color: "text-rose-400",
    unlockLevel: 12
  },
  {
    id: "title_god_of_war",
    nameTr: "Dövüþ Tanrýsý",
    nameEn: "God of Martial Arts",
    badge: "?",
    color: "text-yellow-300",
    unlockLevel: 20
  }
];

