export interface LeaderboardEntry {
  rank: number;
  name: string;
  title: string;
  country: string;
  flag: string;
  powerScore: number;
  tier: 'Apex' | 'Grandmaster' | 'Master' | 'Diamond' | 'Platinum';
  tierColor: string;
  avatarColor: string;
  hairColor: string;
  auraEffect?: 'lightning' | 'flame' | 'neon' | 'divine';
  stageProgress: string;
  winStreak: number;
}

export const TOP_TIER_PLAYERS: LeaderboardEntry[] = [
  {
    rank: 1,
    name: 'Valerius Apex',
    title: 'Undisputed World God',
    country: 'Global',
    flag: '👑',
    powerScore: 14850,
    tier: 'Apex',
    tierColor: 'text-amber-400 bg-amber-950/80 border-amber-400',
    avatarColor: '#831843',
    hairColor: '#fbbf24',
    auraEffect: 'divine',
    stageProgress: 'Stage 5-10',
    winStreak: 48,
  },
  {
    rank: 2,
    name: 'Klaus "Iron Titan"',
    title: 'Colosseum Champion',
    country: 'Germany',
    flag: '🇩🇪',
    powerScore: 12420,
    tier: 'Apex',
    tierColor: 'text-amber-400 bg-amber-950/80 border-amber-400',
    avatarColor: '#1e3a8a',
    hairColor: '#38bdf8',
    auraEffect: 'lightning',
    stageProgress: 'Stage 5-8',
    winStreak: 32,
  },
  {
    rank: 3,
    name: 'Kenji "Shadow" Sato',
    title: 'Neon Underground King',
    country: 'Japan',
    flag: '🇯🇵',
    powerScore: 11180,
    tier: 'Grandmaster',
    tierColor: 'text-purple-400 bg-purple-950/80 border-purple-400',
    avatarColor: '#18181b',
    hairColor: '#a855f7',
    auraEffect: 'neon',
    stageProgress: 'Stage 5-5',
    winStreak: 27,
  },
  {
    rank: 4,
    name: 'Carlos "El Fuego"',
    title: 'Bicycle Volley Master',
    country: 'Brazil',
    flag: '🇧🇷',
    powerScore: 9840,
    tier: 'Grandmaster',
    tierColor: 'text-purple-400 bg-purple-950/80 border-purple-400',
    avatarColor: '#dc2626',
    hairColor: '#ef4444',
    auraEffect: 'flame',
    stageProgress: 'Stage 4-10',
    winStreak: 19,
  },
  {
    rank: 5,
    name: 'Elena "Valkyrie"',
    title: 'Cage Fight Empress',
    country: 'Sweden',
    flag: '🇸🇪',
    powerScore: 8750,
    tier: 'Master',
    tierColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-400',
    avatarColor: '#0369a1',
    hairColor: '#fde047',
    stageProgress: 'Stage 4-6',
    winStreak: 14,
  },
  {
    rank: 6,
    name: 'Can "Bosphorus Bull"',
    title: 'Street Slugger Champion',
    country: 'Turkey',
    flag: '🇹🇷',
    powerScore: 7920,
    tier: 'Master',
    tierColor: 'text-cyan-400 bg-cyan-950/80 border-cyan-400',
    avatarColor: '#b91c1c',
    hairColor: '#1e293b',
    stageProgress: 'Stage 4-2',
    winStreak: 11,
  },
  {
    rank: 7,
    name: 'Marcus "Gunslinger"',
    title: 'Heavyweight Contender',
    country: 'USA',
    flag: '🇺🇸',
    powerScore: 6890,
    tier: 'Diamond',
    tierColor: 'text-sky-400 bg-sky-950/80 border-sky-400',
    avatarColor: '#334155',
    hairColor: '#d97706',
    stageProgress: 'Stage 3-9',
    winStreak: 8,
  },
];
