export type CosmeticCategory = 'outfit' | 'hair' | 'aura' | 'ball';

export interface CosmeticItem {
  id: string;
  category: CosmeticCategory;
  name: string;
  description: string;
  priceCoins: number;
  priceGems: number;
  unlockedByDefault?: boolean;
  visualData: {
    color?: string;
    style?: string;
    auraEffect?: 'lightning' | 'flame' | 'neon' | 'divine';
    ballColor?: string;
  };
}

export const COSMETICS_LIST: CosmeticItem[] = [
  // OUTFITS
  {
    id: 'outfit_street',
    category: 'outfit',
    name: 'Street Brawler Blue',
    description: 'Classic durable street fighting attire.',
    priceCoins: 0,
    priceGems: 0,
    unlockedByDefault: true,
    visualData: { color: '#2563eb' },
  },
  {
    id: 'outfit_golden_striker',
    category: 'outfit',
    name: 'Golden Apex Striker',
    description: 'Gold-woven championship track uniform.',
    priceCoins: 2000,
    priceGems: 50,
    visualData: { color: '#eab308' },
  },
  {
    id: 'outfit_shadow_ninja',
    category: 'outfit',
    name: 'Shadow Stealth Gi',
    description: 'Matte-black stealth suit that blends with shadows.',
    priceCoins: 1500,
    priceGems: 40,
    visualData: { color: '#18181b' },
  },
  {
    id: 'outfit_flame_dragon',
    category: 'outfit',
    name: 'Crimson Dragon Robe',
    description: 'Embroidered with fire silk from underground dojos.',
    priceCoins: 3500,
    priceGems: 80,
    visualData: { color: '#dc2626' },
  },
  {
    id: 'outfit_cyber_matrix',
    category: 'outfit',
    name: 'Cyberpunk Neon Suit',
    description: 'Bioluminescent synth-fibers with pulsing circuit lights.',
    priceCoins: 5000,
    priceGems: 120,
    visualData: { color: '#06b6d4' },
  },

  // HAIRSTYLES
  {
    id: 'hair_spiky_yellow',
    category: 'hair',
    name: 'Classic Blonde Spikes',
    description: 'Edgy anime fighter spikes.',
    priceCoins: 0,
    priceGems: 0,
    unlockedByDefault: true,
    visualData: { color: '#eab308', style: 'spiky' },
  },
  {
    id: 'hair_crimson_dreads',
    category: 'hair',
    name: 'Crimson Fire Dreads',
    description: 'Woven with street fighter beads.',
    priceCoins: 800,
    priceGems: 25,
    visualData: { color: '#ef4444', style: 'dreads' },
  },
  {
    id: 'hair_cyber_cyan',
    category: 'hair',
    name: 'Cyber Mohawk',
    description: 'Glowing neon blue mohawk cut.',
    priceCoins: 1200,
    priceGems: 35,
    visualData: { color: '#38bdf8', style: 'spiky' },
  },
  {
    id: 'hair_super_saiyan',
    category: 'hair',
    name: 'Super Golden Aura Hair',
    description: 'Surging with raw ki energy.',
    priceCoins: 4000,
    priceGems: 90,
    visualData: { color: '#fde047', style: 'spiky' },
  },

  // AURAS
  {
    id: 'aura_none',
    category: 'aura',
    name: 'No Aura',
    description: 'Standard appearance without particle aura.',
    priceCoins: 0,
    priceGems: 0,
    unlockedByDefault: true,
    visualData: {},
  },
  {
    id: 'aura_lightning',
    category: 'aura',
    name: 'Electric Lightning Aura',
    description: 'High voltage sparks crackle continuously around your fighter.',
    priceCoins: 2500,
    priceGems: 60,
    visualData: { auraEffect: 'lightning' },
  },
  {
    id: 'aura_flame',
    category: 'aura',
    name: 'Inferno Flame Aura',
    description: 'Fierce red and orange embers erupt from your body.',
    priceCoins: 3000,
    priceGems: 75,
    visualData: { auraEffect: 'flame' },
  },
  {
    id: 'aura_neon',
    category: 'aura',
    name: 'Cyber Matrix Grid Aura',
    description: 'Pulsing cyan and magenta geometric holo-rings.',
    priceCoins: 4500,
    priceGems: 100,
    visualData: { auraEffect: 'neon' },
  },
  {
    id: 'aura_divine',
    category: 'aura',
    name: 'Divine Golden Radiance',
    description: 'Celestial halo and golden starbursts of the World Apex.',
    priceCoins: 8000,
    priceGems: 200,
    visualData: { auraEffect: 'divine' },
  },

  // SPECIAL BALLS
  {
    id: 'ball_street',
    category: 'ball',
    name: 'Classic Street Ball',
    description: 'Standard rubber street ball.',
    priceCoins: 0,
    priceGems: 0,
    unlockedByDefault: true,
    visualData: { ballColor: '#ffffff' },
  },
  {
    id: 'ball_fireball',
    category: 'ball',
    name: 'Meteor Fireball',
    description: 'Blazing sphere that leaves a trail of scorching fire.',
    priceCoins: 1800,
    priceGems: 45,
    visualData: { ballColor: '#f97316' },
  },
  {
    id: 'ball_plasma',
    category: 'ball',
    name: 'Cyber Plasma Orb',
    description: 'High-tech anti-gravity ball emitting cyan energy.',
    priceCoins: 3000,
    priceGems: 70,
    visualData: { ballColor: '#06b6d4' },
  },
  {
    id: 'ball_golden',
    category: 'ball',
    name: '24K Golden World Trophy Ball',
    description: 'Solid gold striker sphere forged for ultimate glory.',
    priceCoins: 6000,
    priceGems: 150,
    visualData: { ballColor: '#eab308' },
  },
];
