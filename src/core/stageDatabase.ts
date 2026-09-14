import { ArenaEnvironment, Stage } from '../types/game';

interface WorldConfig {
  world: number;
  worldName: string;
  environment: ArenaEnvironment;
  opponents: { name: string; title: string; dialogue: string; skinTone: string; hairColor: string; hairStyle: 'short' | 'dreads' | 'spiky' | 'bald' | 'cap'; bodyColor: string; gloveColor: string; shoeColor: string; }[];
  boss: { name: string; title: string; dialogue: string; skinTone: string; hairColor: string; hairStyle: 'short' | 'dreads' | 'spiky' | 'bald' | 'cap'; bodyColor: string; gloveColor: string; shoeColor: string; };
}

const WORLDS: WorldConfig[] = [
  {
    world: 1,
    worldName: 'The Back Alley (Sokak Köşesi)',
    environment: 'alley',
    opponents: [
      { name: 'Rookie Sid', title: 'Street Rascal', dialogue: 'Hey! Empty your pockets!', skinTone: '#e0ac69', hairColor: '#333333', hairStyle: 'cap', bodyColor: '#475569', gloveColor: '#94a3b8', shoeColor: '#334155' },
      { name: 'Nate "Brawler"', title: 'Alley Scrapper', dialogue: 'Let\'s see what you got, kid!', skinTone: '#d89b52', hairColor: '#854d0e', hairStyle: 'short', bodyColor: '#64748b', gloveColor: '#ef4444', shoeColor: '#1e293b' },
      { name: 'Spike Spike', title: 'Punk Striker', dialogue: 'My kicks never miss!', skinTone: '#fcd34d', hairColor: '#ec4899', hairStyle: 'spiky', bodyColor: '#3b82f6', gloveColor: '#10b981', shoeColor: '#0f172a' },
      { name: 'Big Mike', title: 'Corner Heavy', dialogue: 'You\'re entering my turf!', skinTone: '#8d5524', hairColor: '#1e1e1e', hairStyle: 'bald', bodyColor: '#1e293b', gloveColor: '#f59e0b', shoeColor: '#475569' },
    ],
    boss: { name: 'Brick "Alley King"', title: 'Back Alley Boss', dialogue: 'Nobody passes through my street without paying!', skinTone: '#c68642', hairColor: '#78350f', hairStyle: 'short', bodyColor: '#b91c1c', gloveColor: '#dc2626', shoeColor: '#991b1b' },
  },
  {
    world: 2,
    worldName: 'The Concrete Cage (Yer Altı Kafesi)',
    environment: 'cage',
    opponents: [
      { name: 'Iron Jaw Leo', title: 'Cage Dog', dialogue: 'The cage has no mercy!', skinTone: '#e0ac69', hairColor: '#18181b', hairStyle: 'short', bodyColor: '#374151', gloveColor: '#dc2626', shoeColor: '#111827' },
      { name: 'Ghost Rider Dan', title: 'Subway Bandit', dialogue: 'Fast hands, empty pockets!', skinTone: '#fcd34d', hairColor: '#e11d48', hairStyle: 'dreads', bodyColor: '#4b5563', gloveColor: '#3b82f6', shoeColor: '#1f2937' },
      { name: 'Kip "Volley"', title: 'Street Striker', dialogue: 'Watch this bicycle kick!', skinTone: '#8d5524', hairColor: '#eab308', hairStyle: 'spiky', bodyColor: '#15803d', gloveColor: '#eab308', shoeColor: '#14532d' },
      { name: 'Hammer Vlad', title: 'Underground Enforcer', dialogue: 'Break your bones!', skinTone: '#f8fafc', hairColor: '#64748b', hairStyle: 'bald', bodyColor: '#1e1b4b', gloveColor: '#9333ea', shoeColor: '#0f172a' },
    ],
    boss: { name: 'Razor "The Beast"', title: 'Cage Champion', dialogue: 'You will leave this cage on a stretcher!', skinTone: '#a26230', hairColor: '#991b1b', hairStyle: 'dreads', bodyColor: '#7f1d1d', gloveColor: '#f43f5e', shoeColor: '#881337' },
  },
  {
    world: 3,
    worldName: 'Neon Rooftop Club (Neon Gece Kulübü)',
    environment: 'neon_club',
    opponents: [
      { name: 'Flash Victor', title: 'Neon Bouncer', dialogue: 'VIPs only, get lost!', skinTone: '#e0ac69', hairColor: '#06b6d4', hairStyle: 'spiky', bodyColor: '#083344', gloveColor: '#06b6d4', shoeColor: '#0e7490' },
      { name: 'Shadow Shin', title: 'Rooftop Ninja', dialogue: 'Can you strike what you cannot see?', skinTone: '#fcd34d', hairColor: '#a855f7', hairStyle: 'short', bodyColor: '#18181b', gloveColor: '#c084fc', shoeColor: '#09090b' },
      { name: 'Blaze Marco', title: 'Fire Striker', dialogue: 'My shots burn the net and the keeper!', skinTone: '#c68642', hairColor: '#f97316', hairStyle: 'dreads', bodyColor: '#431407', gloveColor: '#ea580c', shoeColor: '#7c2d12' },
      { name: 'Jax Titanium', title: 'Cyber Enforcer', dialogue: 'Upgraded for total destruction.', skinTone: '#cbd5e1', hairColor: '#38bdf8', hairStyle: 'bald', bodyColor: '#0369a1', gloveColor: '#38bdf8', shoeColor: '#0c4a6e' },
    ],
    boss: { name: 'Viper "Neon Queen"', title: 'Underworld Striker', dialogue: 'Welcome to the penthouse ring, darling!', skinTone: '#fcd34d', hairColor: '#d946ef', hairStyle: 'dreads', bodyColor: '#4a044e', gloveColor: '#f43f5e', shoeColor: '#701a75' },
  },
  {
    world: 4,
    worldName: 'Pro Boxing & Striker Ring (Profesyonel Ring)',
    environment: 'pro_ring',
    opponents: [
      { name: 'Golden Jab Lucas', title: 'National Contender', dialogue: 'Keep your chin tucked, rookie!', skinTone: '#e0ac69', hairColor: '#eab308', hairStyle: 'short', bodyColor: '#1e3a8a', gloveColor: '#fbbf24', shoeColor: '#172554' },
      { name: 'Crusher Joe', title: 'Slugger Heavyweight', dialogue: 'One round is all I need!', skinTone: '#8d5524', hairColor: '#18181b', hairStyle: 'bald', bodyColor: '#1f2937', gloveColor: '#ef4444', shoeColor: '#111827' },
      { name: 'Aero Diego', title: 'Acrobatic Striker', dialogue: 'Fly high, strike lethal!', skinTone: '#d89b52', hairColor: '#0d9488', hairStyle: 'spiky', bodyColor: '#042f2e', gloveColor: '#14b8a6', shoeColor: '#134e4a' },
      { name: 'Steel Boris', title: 'Iron Defense Guard', dialogue: 'You will break your wrists on my guard.', skinTone: '#f1f5f9', hairColor: '#475569', hairStyle: 'short', bodyColor: '#334155', gloveColor: '#64748b', shoeColor: '#1e293b' },
    ],
    boss: { name: 'Titan "Iron Fist" Cruz', title: 'World Title Holder', dialogue: 'I have never been knocked down. Not today!', skinTone: '#a26230', hairColor: '#f59e0b', hairStyle: 'cap', bodyColor: '#78350f', gloveColor: '#f59e0b', shoeColor: '#451a03' },
  },
  {
    world: 5,
    worldName: 'Grand World Mega Stadium (Dünya Dev Arenası)',
    environment: 'mega_stadium',
    opponents: [
      { name: 'Zeus Striker', title: 'Grand Master', dialogue: 'Feel the electricity of a true champion!', skinTone: '#fcd34d', hairColor: '#fbbf24', hairStyle: 'spiky', bodyColor: '#422006', gloveColor: '#eab308', shoeColor: '#713f12' },
      { name: 'Cosmo Apex', title: 'Solar Phenom', dialogue: 'Speed of light, impact of stars.', skinTone: '#c68642', hairColor: '#ec4899', hairStyle: 'dreads', bodyColor: '#500724', gloveColor: '#f43f5e', shoeColor: '#831843' },
      { name: 'Vanguard Lord', title: 'Colosseum Gladiator', dialogue: 'Are you not entertained?!', skinTone: '#8d5524', hairColor: '#f8fafc', hairStyle: 'bald', bodyColor: '#172554', gloveColor: '#60a5fa', shoeColor: '#1e3a8a' },
    ],
    boss: { name: 'Apex "The Immortal" Valerius', title: 'Undisputed World God', dialogue: 'You have climbed to the pinnacle. Show me human limits!', skinTone: '#e0ac69', hairColor: '#fbbf24', hairStyle: 'spiky', bodyColor: '#831843', gloveColor: '#fbbf24', shoeColor: '#4a044e' },
  },
];

export function getStageData(worldNum: number, subNum: number): Stage {
  const worldIdx = Math.min(Math.max(worldNum - 1, 0), WORLDS.length - 1);
  const w = WORLDS[worldIdx];
  const isBoss = subNum === 10 || subNum === 5;
  const isFinalBoss = subNum === 10;

  const totalStageIndex = (worldNum - 1) * 10 + subNum;
  const opponentTemplate = isFinalBoss 
    ? w.boss 
    : isBoss 
      ? { ...w.boss, name: `${w.boss.name} (Sub-Boss)`, title: 'Regional Champion' }
      : w.opponents[(subNum - 1) % w.opponents.length];

  // Scale opponent stats dynamically with stage index
  const scale = 1 + (totalStageIndex - 1) * 0.22;
  const bossScale = isBoss ? 1.5 : 1.0;

  const maxHp = Math.round((140 + totalStageIndex * 45) * scale * bossScale);
  const atk = Math.round((14 + totalStageIndex * 4.2) * scale * bossScale);
  const def = Math.round((8 + totalStageIndex * 2.8) * scale * bossScale);
  const spd = Math.round((10 + totalStageIndex * 1.5) * scale);
  const critRate = Math.min(Math.round((5 + totalStageIndex * 0.8) * 10) / 10, 45);
  const critDmg = Math.round((1.5 + (totalStageIndex * 0.02)) * 100) / 100;
  const comboRate = Math.min(Math.round((5 + totalStageIndex * 0.9) * 10) / 10, 50);
  const dodgeRate = Math.min(Math.round((4 + totalStageIndex * 0.6) * 10) / 10, 40);
  const lifesteal = isBoss ? 4.0 : 0.0;
  const stamina = 100 + totalStageIndex * 10;

  const powerScore = Math.round(
    maxHp * 0.4 + atk * 3.5 + def * 2.8 + spd * 2.5 + critRate * 8 + comboRate * 7 + dodgeRate * 7
  );

  return {
    id: `stage_${worldNum}_${subNum}`,
    world: worldNum,
    subStage: subNum,
    displayStage: `Stage ${worldNum}-${subNum}`,
    name: isBoss ? `BOSS: ${w.worldName}` : `${w.worldName}`,
    environment: w.environment,
    isBoss,
    opponent: {
      name: opponentTemplate.name,
      title: opponentTemplate.title,
      level: totalStageIndex,
      dialogue: opponentTemplate.dialogue,
      avatarStyle: {
        skinTone: opponentTemplate.skinTone,
        hairColor: opponentTemplate.hairColor,
        hairStyle: opponentTemplate.hairStyle,
        bodyColor: opponentTemplate.bodyColor,
        gloveColor: opponentTemplate.gloveColor,
        shoeColor: opponentTemplate.shoeColor,
      },
      stats: {
        hp: maxHp,
        maxHp: maxHp,
        atk,
        def,
        spd,
        critRate,
        critDmg,
        comboRate,
        dodgeRate,
        lifesteal,
        stamina,
        powerScore,
      },
    },
    coinReward: Math.round((40 + totalStageIndex * 25) * (isBoss ? 2.5 : 1.0)),
    gemReward: isBoss ? 15 : 2,
    xpReward: Math.round((25 + totalStageIndex * 15) * (isBoss ? 2.0 : 1.0)),
  };
}
