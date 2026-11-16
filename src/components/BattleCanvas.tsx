import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { FloatingText, OpponentProfile, Stage } from '../types/game';
import { GameStateData, gameManager } from '../core/gameState';
import { soundFx } from '../core/audio';
import { haptics } from '../core/haptics';
import { battleRig, CineKind, FighterCmd } from '../game/battleRig';
import { impactTime } from '../game/fighter3d/clips';
import { opponentAppearance, playerAppearance } from '../game/appearance';
import { t } from '../i18n/translations';
import { ui } from '../i18n/ui';
import { difficultyOf } from '../core/guidance';
import { opponentName, opponentTitle, skillName, stageLabel } from '../i18n/content-helpers';
import {
  DAMAGE_MULT, MECH, SKILL_RULES, chargedMult, damageMult, enraged, evadeActive, evadeChance, hitShell, isChargedSwing,
  isLeechBite, leechHeal, mechIntervalMult, opponentInterval, playerInterval, shellCapacity, stageOdds,
} from '../core/combat';
import { FarmChip } from './FarmChip';
import confetti from 'canvas-confetti';
import { Hand, Shield, Tv, Zap } from 'lucide-react';
import { StatBar } from './StatBar';
import { FitText } from './FitText';
import { BossIntroCard } from './BossIntroCard';

const BattleScene3D = lazy(() => import('./BattleScene3D').then((module) => ({ default: module.BattleScene3D })));

const SPECIAL_MS = 940;

// Dev builds record boss-mechanic events for the browser tests (scripts/e2e.cjs); they are drawn on the canvas only
const logMech = (event: string) => {
  if (!import.meta.env.DEV) return;
  const w = window as unknown as { __mechLog?: string[] };
  (w.__mechLog ||= []).push(event);
  if (w.__mechLog.length > 200) w.__mechLog.shift();
};


interface BattleCanvasProps {
  state: GameStateData;
  onVictory: (stage: Stage) => void;
  reviveToken: number;
  paused: boolean;
}

export const BattleCanvas: React.FC<BattleCanvasProps> = ({ state, onVictory, reviveToken, paused }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Current battle state
  const stageRef = useRef<Stage>(gameManager.getCurrentStage());
  const playerHpRef = useRef<number>(state.playerFighter.stats.maxHp);
  const opponentHpRef = useRef<number>(stageRef.current.opponent.stats.maxHp);
  const playerRageRef = useRef<number>(0);

  const [playerHpDisplay, setPlayerHpDisplay] = useState(playerHpRef.current);
  const [opponentHpDisplay, setOpponentHpDisplay] = useState(opponentHpRef.current);
  const [playerRageDisplay, setPlayerRageDisplay] = useState(0);
  const [currentStageData, setCurrentStageData] = useState<Stage>(stageRef.current);
  const [matchStatus, setMatchStatus] = useState<'fighting' | 'victory' | 'defeat'>('fighting');
  const [showReviveAd, setShowReviveAd] = useState<boolean>(false);
  // Idle game: in auto mode a boss defeat starts farming by itself after a short countdown
  const [retryIn, setRetryIn] = useState<number | null>(null);
  const [comboStreak, setComboStreak] = useState<number>(0);
  // Running cinematic (boss intro VS card / SUPER / KO), mirrored from battleRig for the overlays
  const [cine, setCine] = useState<{ kind: CineKind; dur: number } | null>(null);
  useEffect(() => battleRig.onCine(() => setCine(battleRig.cine ? { kind: battleRig.cine.kind, dur: battleRig.cine.dur } : null)), []);
  // Height of the HUD overlay, so the 3D camera frames the fighters below it
  const hudRef = useRef<HTMLDivElement | null>(null);
  const [hudH, setHudH] = useState(56);
  useEffect(() => {
    const el = hudRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHudH(Math.round(el.offsetHeight)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [manualAttackReady, setManualAttackReady] = useState(false);
  const [guardReady, setGuardReady] = useState(true);
  const [isGuarding, setIsGuarding] = useState(false);
  const manualAttackReadyRef = useRef(false);
  const guardReadyRef = useRef(true);
  const isGuardingRef = useRef(false);
  const comboStreakRef = useRef(0);

  // Animation state
  const animFrameRef = useRef<number | null>(null);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }[]>([]);
  const calloutsRef = useRef<{ id: string; text: string; x: number; y: number; color: string; scale: number; rot: number; createdAt: number; duration: number }[]>([]);
  const screenShakeRef = useRef<number>(0);
  const hitStopTimerRef = useRef<number>(0);

  // Fighter poses
  const playerPoseRef = useRef({ xOffset: 0, animState: 'idle', stateTimer: 0, attackType: 'punch' });
  const opponentPoseRef = useRef({ xOffset: 0, animState: 'idle', stateTimer: 0, attackType: 'punch' });

  // Combat cooldown timers
  const playerCooldownRef = useRef<number>(0);
  const opponentCooldownRef = useRef<number>(0);
  const guardTimerRef = useRef(0);
  const guardCooldownRef = useRef(0);
  const isMatchOverRef = useRef<boolean>(false);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ t: number; fn: () => void }[]>([]);
  const oppAttackCountRef = useRef(0);
  // Boss mechanics and build-19 skill state for the current fight (rules: src/core/combat.ts)
  const fightTimeRef = useRef(0); // simulation ms since the fight started (evasion stance timing)
  const shellRef = useRef(0); // Iron Shell: damage the shell can still absorb
  const shellNextRef = useRef(0);
  const armorStacksRef = useRef(0); // Armor Breaker stacks on the opponent
  const secondWindUsedRef = useRef(false);
  const enrageShownRef = useRef(false);
  const evadeShownRef = useRef(false);

  // Scale particle counts with the quality setting
  const particleCount = (n: number) => (battleRig.quality === 'low' ? Math.ceil(n / 3) : battleRig.quality === 'medium' ? Math.ceil(n * 0.7) : n);

  useEffect(() => {
    const current = gameManager.getCurrentStage();
    stageRef.current = current;
    setCurrentStageData(current);
    resetBattle(current);
  }, [state.currentWorld, state.currentSubStage, state.battleNonce]);

  const retryRef = useRef<number | null>(null);
  useEffect(() => {
    if (!showReviveAd || !state.autoBattle) {
      retryRef.current = null;
      setRetryIn(null);
      return;
    }
    if (paused) return; // hold the countdown while a modal (e.g. the revive ad) is open
    if (retryRef.current === null) retryRef.current = 5;
    setRetryIn(retryRef.current);
    const timer = setInterval(() => {
      if (retryRef.current === null) return;
      retryRef.current -= 1;
      if (retryRef.current <= 0) {
        retryRef.current = null;
        setRetryIn(null);
        clearInterval(timer);
        // Farm until ready (B3): drop to a stage the fighter beats reliably; the "Boss ready" chip brings it back
        if (!gameManager.startFarming()) resetBattle(stageRef.current);
      } else {
        setRetryIn(retryRef.current);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [showReviveAd, state.autoBattle, paused]);

  // Max HP can change mid-fight (gym, gear, skills): keep the same HP percentage instead of restarting the fight
  const prevMaxHpRef = useRef(state.playerFighter.stats.maxHp);
  useEffect(() => {
    const prev = prevMaxHpRef.current;
    const next = state.playerFighter.stats.maxHp;
    prevMaxHpRef.current = next;
    if (prev > 0 && next !== prev && !isMatchOverRef.current) {
      playerHpRef.current = Math.max(1, Math.min(next, Math.round((playerHpRef.current / prev) * next)));
      setPlayerHpDisplay(playerHpRef.current);
    }
  }, [state.playerFighter.stats.maxHp]);

  useEffect(() => {
    if (reviveToken === 0 || !isMatchOverRef.current || !stageRef.current.isBoss) return;
    playerHpRef.current = state.playerFighter.stats.maxHp;
    playerRageRef.current = 100;
    setPlayerHpDisplay(playerHpRef.current);
    setPlayerRageDisplay(100);
    isMatchOverRef.current = false;
    setMatchStatus('fighting');
    setShowReviveAd(false);
    playerCooldownRef.current = 300;
    opponentCooldownRef.current = 400;
    manualAttackReadyRef.current = false;
    setManualAttackReady(false);
    battleRig.command('player', 'idle');
    battleRig.command('opp', 'idle');
  }, [reviveToken]);

  const resetBattle = (stage: Stage) => {
    if (resultTimerRef.current !== null) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
    playerHpRef.current = state.playerFighter.stats.maxHp;
    opponentHpRef.current = stage.opponent.stats.maxHp;
    playerRageRef.current = 0;
    isMatchOverRef.current = false;
    hitStopTimerRef.current = 0;
    setMatchStatus('fighting');
    setShowReviveAd(false);
    setComboStreak(0);
    comboStreakRef.current = 0;
    guardTimerRef.current = 0;
    guardCooldownRef.current = 0;
    setIsGuarding(false);
    setGuardReady(true);
    setManualAttackReady(false);
    isGuardingRef.current = false;
    guardReadyRef.current = true;
    manualAttackReadyRef.current = false;
    setPlayerHpDisplay(playerHpRef.current);
    setOpponentHpDisplay(opponentHpRef.current);
    setPlayerRageDisplay(0);
    playerCooldownRef.current = 300;
    opponentCooldownRef.current = 400;
    pendingRef.current = [];
    oppAttackCountRef.current = 0;
    fightTimeRef.current = 0;
    shellRef.current = shellCapacity(stage.bossMechanic, stage.opponent.stats.maxHp);
    shellNextRef.current = MECH.shell.period;
    armorStacksRef.current = 0;
    secondWindUsedRef.current = false;
    enrageShownRef.current = false;
    evadeShownRef.current = false;
    battleRig.command('player', 'idle', { instant: true });
    battleRig.command('opp', 'idle', { instant: true });

    // Boss fight: VS card first (the fight clock waits while it shows)
    if (stage.isBoss) soundFx.playWhistle();
    cueBossIntro(stage);
  };

  useEffect(() => () => {
    if (resultTimerRef.current !== null) clearTimeout(resultTimerRef.current);
    battleRig.skipCine();
  }, []);

  // --- Cinematic hooks (build 19) -------------------------------------------------------------
  // They only start a camera moment. The fight loop multiplies its clock by battleRig.tickCine(), so cooldowns,
  // scheduled impacts and animations slow down (or wait) together and the fight never desyncs.
  const cueBossIntro = (stage: Stage) => {
    if (stage.isBoss) battleRig.startCine('boss_intro', 'opp', state.battleSpeed);
    else battleRig.skipCine();
  };
  const cueSuper = () => battleRig.startCine('super', 'player', state.battleSpeed);
  const cueKo = (winner: 'player' | 'opp') => battleRig.startCine('ko', winner, state.battleSpeed);
  // Dev builds only: lets scripts (e2e, store screenshots) fill the SUPER gauge; auto mode fires it on its next swing
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as { __fight?: object }).__fight = {
      fillRage: () => {
        playerRageRef.current = 100;
        setPlayerRageDisplay(100);
      },
    };
  }, []);
  // Tap on the fight skips a SUPER / KO moment (the VS card has its own tap target)
  const skipMoment = () => {
    if (battleRig.cine && battleRig.cine.kind !== 'boss_intro') battleRig.skipCine();
  };

  const addFloatingText = (text: string, x: number, y: number, color: string, type: FloatingText['type'] = 'damage') => {
    // Stack numbers that spawn close together in time and place instead of drawing them on top of each other
    const now = Date.now();
    const crowd = floatingTextsRef.current.filter((f) => now - f.createdAt < 450 && Math.abs(f.x - x) < 45).length;
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x: x + (Math.random() * 12 - 6),
      y: y - crowd * 15,
      color,
      type,
      createdAt: Date.now(),
      duration: 800,
    });
  };

  // One headline callout at a time: a stronger moment (KO > super > crit > block) replaces a weaker one
  const calloutRankRef = useRef(0);
  const addCallout = (text: string, x: number, y: number, color: string = '#fef08a', rank = 1) => {
    const now = Date.now();
    const active = calloutsRef.current.filter((c) => now - c.createdAt < c.duration * 0.7);
    if (active.length && rank < calloutRankRef.current) return;
    calloutsRef.current = [];
    calloutRankRef.current = rank;
    calloutsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      scale: 0.2,
      rot: (Math.random() - 0.5) * 0.35,
      createdAt: Date.now(),
      duration: 650,
    });
  };

  const spawnHitParticles = (x: number, y: number, color: string, count: number = 8) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 5.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color,
        life: 1.0,
        size: 2.5 + Math.random() * 3.5,
      });
    }
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'super') => {
    haptics.trigger(type);
  };

  // --- Animation-synced combat ---------------------------------------------------------------
  // Damage is resolved on the animation's impact frame (not when the swing starts), using
  // simulation time so pause, hit-stop and battle speed all stay consistent.
  const schedule = (delayMs: number, fn: () => void) => {
    pendingRef.current.push({ t: delayMs, fn });
  };

  const chestOf = (side: 'player' | 'opp') => (battleRig.active ? battleRig.anchors[side].chest : side === 'opp' ? { x: 235, y: 110 } : { x: 85, y: 110 });
  const headOf = (side: 'player' | 'opp') => (battleRig.active ? battleRig.anchors[side].head : side === 'opp' ? { x: 235, y: 78 } : { x: 85, y: 78 });

  // Skill with this mechanic in the deck (no chance roll)
  const skillWith = (type: string) => state.playerFighter.equippedSkills.find((x) => x.specialProc?.type === type);
  // Rage gains go through here so Fury Engine can speed them up
  const addRage = (n: number) => {
    const fury = skillWith('rage_boost');
    playerRageRef.current = Math.min(100, playerRageRef.current + n * (fury?.specialProc?.multiplier || 1));
    setPlayerRageDisplay(playerRageRef.current);
  };
  // Opponent healing (league lifesteal, leech bites); Grievous Strikes halves it
  const healOpponent = (amount: number) => {
    const wound = skillWith('wound');
    const heal = Math.round(amount * (wound ? wound.specialProc?.multiplier ?? 0.5 : 1));
    if (heal <= 0) return 0;
    opponentHpRef.current = Math.min(stageRef.current.opponent.stats.maxHp, opponentHpRef.current + heal);
    setOpponentHpDisplay(opponentHpRef.current);
    return heal;
  };
  // Damage to the opponent passes the Iron Shell first (combo follow-ups break it faster). Returns damage dealt.
  const damageOpponent = (main: number, combo: number) => {
    const before = shellRef.current;
    const r = hitShell(before, main, combo);
    shellRef.current = r.shell;
    if (r.absorbed > 0) {
      logMech('shell_absorb');
      const oh = headOf('opp');
      addFloatingText(`🛡 ${r.absorbed}`, oh.x + 18, oh.y - 8, '#67e8f9', 'dodge');
      if (before > 0 && r.shell <= 0) {
        const oc = chestOf('opp');
        addCallout(ui(state.lang, 'c_shell_break'), oc.x, oh.y - 20, '#67e8f9', 3);
        logMech('shell_break');
        spawnHitParticles(oc.x, oc.y, '#67e8f9', particleCount(14));
      }
    }
    const dealt = r.main + r.combo;
    opponentHpRef.current = Math.max(0, opponentHpRef.current - dealt);
    setOpponentHpDisplay(opponentHpRef.current);
    return dealt;
  };

  const pickPlayerMove = (isSpecialRage: boolean, isCrit: boolean): FighterCmd => {
    if (isSpecialRage) return 'rage';
    const r = Math.random();
    if (isCrit) return r < 0.6 ? 'heavy' : 'kick';
    return r < 0.6 ? 'jab' : r < 0.85 ? 'kick' : 'heavy';
  };

  const performPlayerAttack = (isSpecialRage: boolean = false) => {
    if (isMatchOverRef.current) return;
    const pStats = state.playerFighter.stats;
    // Crit is rolled up front so a critical hit gets a heavy-looking animation (same odds as before).
    const isCrit = Math.random() * 100 < pStats.critRate;
    const move = pickPlayerMove(isSpecialRage, isCrit);

    playerPoseRef.current = {
      xOffset: 48,
      animState: 'attacking',
      stateTimer: isSpecialRage && battleRig.active ? SPECIAL_MS : 180,
      attackType: isSpecialRage ? 'special' : move === 'kick' ? 'kick' : 'punch',
    };
    battleRig.command('player', move);
    if (isSpecialRage) {
      soundFx.playSuperCharge();
      cueSuper();
    }
    schedule(impactTime(move), () => resolvePlayerAttack(isSpecialRage, isCrit, move));
  };

  const resolvePlayerAttack = (isSpecialRage: boolean, isCrit: boolean, move: FighterCmd) => {
    if (isMatchOverRef.current) return;
    const pStats = state.playerFighter.stats;
    const oppStats = stageRef.current.opponent.stats;
    const profile = stageRef.current.opponent.profile;
    const oppChest = chestOf('opp');
    const oppHead = headOf('opp');

    const dodgeRoll = Math.random() * 100;
    if (!isSpecialRage && dodgeRoll < oppStats.dodgeRate) {
      soundFx.playDodge();
      battleRig.command('opp', 'dodge');
      comboStreakRef.current = 0;
      setComboStreak(0);
      addFloatingText(t('missDodge', state.lang), oppHead.x, oppHead.y, '#38bdf8', 'dodge');
      return;
    }

    let baseDmg = pStats.atk * (0.85 + Math.random() * 0.3);

    // Asymptotic Defense Formula (eliminates 1 DMG wall). Armor Breaker stacks lower the target's DEF.
    const breaker = skillWith('armor_break');
    const oppDef = oppStats.def * (1 - armorStacksRef.current * (breaker?.specialProc?.multiplier || 0));
    const defMultiplier = damageMult(pStats.atk, oppDef);
    let finalDmg = Math.max(1, Math.round(baseDmg * defMultiplier));

    // Viper's evasion stance: normal hits slip past, but SUPER and combo follow-ups still land
    const mech = stageRef.current.bossMechanic;
    if (!isSpecialRage && evadeActive(mech, fightTimeRef.current) && Math.random() < evadeChance()) {
      logMech('evade_miss');
      soundFx.playDodge();
      battleRig.command('opp', 'dodge');
      addFloatingText(t('missDodge', state.lang), oppHead.x, oppHead.y, '#38bdf8', 'dodge');
      const comboChance = Math.min(75, pStats.comboRate + Math.min(15, comboStreakRef.current * 2));
      if (Math.random() * 100 < comboChance) {
        const dealt = damageOpponent(0, Math.max(1, Math.round(finalDmg * 0.35)));
        addFloatingText(`${ui(state.lang, 'c_combo')} -${dealt}`, oppChest.x - 12, oppHead.y - 22, '#fde047', 'skill');
        schedule(150, () => {
          if (isMatchOverRef.current) return;
          battleRig.command('player', 'jab');
          schedule(impactTime('jab'), () => !isMatchOverRef.current && battleRig.command('opp', 'hit'));
        });
        if (opponentHpRef.current <= 0) {
          battleRig.command('opp', 'knockdown');
          handleVictory();
        }
      }
      return;
    }

    if (isCrit) {
      finalDmg = Math.round(finalDmg * (pStats.critDmg || 1.5));
    }
    if (isSpecialRage) {
      finalDmg = Math.round(finalDmg * 2.2);
    }

    comboStreakRef.current += 1;
    setComboStreak(comboStreakRef.current);

    // Skill procs
    let skillProcText = '';
    let vampireProc = false;
    state.playerFighter.equippedSkills.forEach((skill) => {
      const proc = skill.specialProc;
      if (!proc || Math.random() * 100 >= proc.chance) return;
      if (proc.type === 'double_strike' || proc.type === 'bicycle_kick') {
        finalDmg = Math.round(finalDmg * proc.multiplier);
        skillProcText = skillName(skill.id, skill.name, state.lang);
      } else if (proc.type === 'execute' && opponentHpRef.current < stageRef.current.opponent.stats.maxHp * 0.35) {
        finalDmg = Math.round(finalDmg * proc.multiplier);
        skillProcText = skillName(skill.id, skill.name, state.lang);
      } else if (proc.type === 'vampire') {
        vampireProc = true;
        skillProcText = skillName(skill.id, skill.name, state.lang);
      }
      // iron_chin, shadow_dodge and counter_strike are defensive: handled when the opponent attacks
    });

    // Combo Rate grants a real follow-up strike, with a small streak bonus. Chain Lightning can chain it twice more.
    const comboChance = Math.min(75, pStats.comboRate + Math.min(15, comboStreakRef.current * 2));
    let comboTotal = 0;
    if (!isSpecialRage && Math.random() * 100 < comboChance) {
      const extraDamage = Math.max(1, Math.round(finalDmg * 0.35));
      comboTotal = extraDamage;
      const chain = skillWith('chain_combo');
      for (let c = 0; chain && c < SKILL_RULES.chainMax && Math.random() * 100 < (chain.specialProc?.chance || 0); c++) {
        comboTotal += Math.max(1, Math.round(finalDmg * (chain.specialProc?.multiplier || 0.35)));
        skillProcText = skillName(chain.id, chain.name, state.lang);
      }
      addFloatingText(`${ui(state.lang, 'c_combo')} +${comboTotal}`, oppChest.x - 12, oppHead.y - 22, '#fde047', 'skill');
      // The follow-up is shown as a quick second jab landing right after the main hit
      schedule(150, () => {
        if (isMatchOverRef.current) return;
        battleRig.command('player', 'jab');
        schedule(impactTime('jab'), () => {
          if (isMatchOverRef.current) return;
          const c = chestOf('opp');
          spawnHitParticles(c.x, c.y, '#fde047', 6);
          soundFx.playPunch();
          battleRig.command('opp', 'hit');
        });
      });
    }

    // Defensive fighters sometimes brace and soak part of the blow
    let blocked = false;
    if (!isSpecialRage && profile === 'defensive' && Math.random() < 0.15) {
      finalDmg = Math.max(1, Math.round(finalDmg * 0.4));
      blocked = true;
    }

    // Iron Shell soaks damage first; what is left hits HP
    finalDmg = damageOpponent(finalDmg, comboTotal);
    if (breaker) armorStacksRef.current = Math.min(SKILL_RULES.armorBreakMaxStacks, armorStacksRef.current + 1);

    addRage(20);

    if (finalDmg > 0 && (pStats.lifesteal > 0 || vampireProc)) {
      const healAmount = Math.max(1, Math.round(finalDmg * ((pStats.lifesteal + (vampireProc ? 30 : 0)) / 100)));
      playerHpRef.current = Math.min(pStats.maxHp, playerHpRef.current + healAmount);
      setPlayerHpDisplay(playerHpRef.current);
      const ph = headOf('player');
      addFloatingText(`+${healAmount} HP`, ph.x, ph.y + 14, '#10b981', 'heal');
    }

    const killed = opponentHpRef.current <= 0;
    const strong = isSpecialRage || isCrit;
    if (isSpecialRage) {
      soundFx.playSuperHit();
      triggerHaptic('super');
      screenShakeRef.current = battleRig.reducedMotion ? 3 : 12;
      hitStopTimerRef.current = 70; // 70ms Hit-Stop Freeze
      spawnHitParticles(oppChest.x, oppChest.y, '#fbbf24', particleCount(24));
      addCallout(ui(state.lang, 'c_super'), oppChest.x - 25, oppHead.y - 15, '#fde047', 4);
      addFloatingText(`${t('superCrit', state.lang)} ${finalDmg}`, oppHead.x, oppHead.y, '#fbbf24', 'crit');
      battleRig.kickCamera(1);
    } else if (isCrit) {
      soundFx.playCritHit();
      triggerHaptic('medium');
      screenShakeRef.current = battleRig.reducedMotion ? 2 : 8;
      hitStopTimerRef.current = 45; // 45ms Hit-Stop Freeze
      spawnHitParticles(oppChest.x, oppChest.y, '#fbbf24', particleCount(16));
      const critCallouts = ['CRUNCH!', 'POW!', 'SMASH!', 'BOOM!'];
      addCallout(critCallouts[Math.floor(Math.random() * critCallouts.length)], oppChest.x - 10, oppHead.y - 15, '#f59e0b', 3);
      addFloatingText(`${t('crit', state.lang)} -${finalDmg}`, oppHead.x, oppHead.y, '#fbbf24', 'crit');
      battleRig.kickCamera(0.6);
    } else {
      if (move === 'heavy') soundFx.playHeavyPunch();
      else if (move === 'kick') soundFx.playKickHit();
      else soundFx.playPunch();
      triggerHaptic(move === 'heavy' || move === 'kick' ? 'medium' : 'light');
      screenShakeRef.current = battleRig.reducedMotion ? 1 : move === 'jab' ? 3 : 5;
      if (move !== 'jab') hitStopTimerRef.current = 25;
      spawnHitParticles(oppChest.x, oppChest.y, '#ef4444', particleCount(8));
      addFloatingText(`-${finalDmg}`, oppHead.x, oppHead.y + 4, '#ffffff', 'damage');
    }
    if (blocked) {
      addCallout(ui(state.lang, 'c_block'), oppChest.x, oppHead.y - 15, '#67e8f9');
    }

    // Defender reaction on the same frame as the impact
    battleRig.flash('opp', strong ? 1 : 0.7);
    if (killed) {
      battleRig.command('opp', 'knockdown');
    } else {
      battleRig.command('opp', blocked ? 'guard' : strong ? 'crit_hit' : 'hit');
      if (blocked) schedule(280, () => battleRig.command('opp', 'idle'));
      // Counter fighters answer a hit by striking back sooner
      if (profile === 'counter' && Math.random() < 0.2) {
        opponentCooldownRef.current = Math.min(opponentCooldownRef.current, 220);
        addCallout(ui(state.lang, 'c_counter'), oppChest.x, oppHead.y - 30, '#fb923c');
      }
    }

    if (skillProcText) {
      const ph = headOf('player');
      addFloatingText(`★ ${skillProcText}!`, ph.x + 60, ph.y - 12, '#c084fc', 'skill');
    }

    if (killed) {
      handleVictory();
    }
  };


  const performOpponentAttack = () => {
    if (isMatchOverRef.current) return;
    const oppStats = stageRef.current.opponent.stats;
    const profile = stageRef.current.opponent.profile;
    oppAttackCountRef.current += 1;

    const isCrit = Math.random() * 100 < oppStats.critRate;
    const r = Math.random();
    const swing = oppAttackCountRef.current;
    const mech = stageRef.current.bossMechanic;
    // Apex's charged strike: every 5th swing, long wind-up, guard it (auto mode guards with a fixed chance)
    const charged = isChargedSwing(mech, swing);
    let move: FighterCmd;
    let dmgMult = DAMAGE_MULT[profile];
    if (charged) {
      move = 'heavy_slow';
      dmgMult *= chargedMult(mech!);
    } else if (profile === 'heavy') move = 'heavy_slow';
    else if (profile === 'fast') move = r < 0.8 ? 'jab' : 'kick';
    else if (isCrit) move = r < 0.6 ? 'heavy' : 'kick';
    else move = r < 0.55 ? 'jab' : r < 0.8 ? 'kick' : 'heavy';

    if (charged) {
      const windup = MECH.charged.windupMs;
      opponentCooldownRef.current += windup;
      const oc = chestOf('opp');
      const oh = headOf('opp');
      addCallout(ui(state.lang, 'c_charging'), oc.x, oh.y - 18, '#f97316', 3);
      logMech('charged');
      battleRig.flash('opp', 0.6);
      soundFx.playWindup();
      if (!state.autoBattle) {
        const ph = headOf('player');
        addFloatingText(ui(state.lang, 'c_guard_now'), ph.x, ph.y - 18, '#67e8f9', 'skill');
      } else if (Math.random() < MECH.charged.autoGuard) {
        // Auto guard reacts to the wind-up (fixed chance so idle players are not locked out)
        schedule(Math.max(0, windup - 150), () => {
          if (isMatchOverRef.current) return;
          guardTimerRef.current = impactTime('heavy_slow') + 400;
          isGuardingRef.current = true;
          setIsGuarding(true);
          battleRig.command('player', 'guard');
        });
      }
      schedule(windup, () => {
        if (isMatchOverRef.current) return;
        opponentPoseRef.current = { xOffset: -48, animState: 'attacking', stateTimer: 180, attackType: 'punch' };
        battleRig.command('opp', move);
        schedule(impactTime(move), () => resolveOpponentAttack(isCrit, move, dmgMult, swing, true));
      });
      return;
    }

    opponentPoseRef.current = {
      xOffset: -48,
      animState: 'attacking',
      stateTimer: 180,
      attackType: move === 'kick' ? 'kick' : 'punch',
    };
    battleRig.command('opp', move);
    if (move === 'heavy_slow') soundFx.playWindup();
    schedule(impactTime(move), () => resolveOpponentAttack(isCrit, move, dmgMult, swing, false));
  };

  const resolveOpponentAttack = (isCrit: boolean, move: FighterCmd, dmgMult: number, swing = 0, charged = false) => {
    if (isMatchOverRef.current) return;
    const pStats = state.playerFighter.stats;
    const oppStats = stageRef.current.opponent.stats;
    const profile = stageRef.current.opponent.profile;
    const playerChest = chestOf('player');
    const playerHead = headOf('player');

    const procOf = (type: string) => {
      const sk = state.playerFighter.equippedSkills.find((x) => x.specialProc?.type === type);
      return sk && Math.random() * 100 < (sk.specialProc?.chance || 0) ? sk : null;
    };
    const shadow = procOf('shadow_dodge');
    // Sixth Sense slips heavy, critical and charged strikes
    const sixth = (charged || isCrit || move === 'heavy' || move === 'heavy_slow') ? procOf('sixth_sense') : null;
    const slip = shadow || sixth;
    const dodgeRoll = Math.random() * 100;
    if (slip || dodgeRoll < pStats.dodgeRate) {
      soundFx.playDodge();
      battleRig.command('player', 'dodge');
      // Clutch evasion generates +15 rage
      addRage(15);
      addFloatingText(slip ? `★ ${skillName(slip.id, slip.name, state.lang)}!` : t('dodge', state.lang), playerHead.x, playerHead.y, '#38bdf8', 'dodge');
      // Counter skill: strike back right after a dodge
      const counter = procOf('counter_strike');
      if (counter) {
        schedule(160, () => {
          if (isMatchOverRef.current) return;
          const opp = stageRef.current.opponent.stats;
          const dmg = damageOpponent(Math.max(1, Math.round(pStats.atk * (counter.specialProc?.multiplier || 1.5) * damageMult(pStats.atk, opp.def))), 0);
          battleRig.command('player', 'jab');
          const oc = chestOf('opp');
          const oh = headOf('opp');
          spawnHitParticles(oc.x, oc.y, '#fb923c', particleCount(8));
          soundFx.playPunch();
          addFloatingText(`★ ${skillName(counter.id, counter.name, state.lang)} -${dmg}`, oh.x, oh.y, '#fb923c', 'skill');
          if (opponentHpRef.current <= 0) {
            battleRig.command('opp', 'knockdown');
            handleVictory();
          } else {
            battleRig.command('opp', 'hit');
          }
        });
      }
      return;
    }

    let baseDmg = oppStats.atk * (0.85 + Math.random() * 0.3) * dmgMult;

    // Asymptotic Defense Formula for Player
    const defMultiplier = damageMult(oppStats.atk, pStats.def);
    let finalDmg = Math.max(1, Math.round(baseDmg * defMultiplier));

    if (isCrit) {
      finalDmg = Math.round(finalDmg * (oppStats.critDmg || 1.5));
    }

    // Iron Chin: sometimes shrug off half of a hit
    const ironChin = procOf('iron_chin');
    if (ironChin) {
      finalDmg = Math.max(1, Math.round(finalDmg * (ironChin.specialProc?.multiplier || 0.5)));
      addFloatingText(`★ ${skillName(ironChin.id, ironChin.name, state.lang)}!`, playerHead.x - 20, playerHead.y - 14, '#c084fc', 'skill');
    }

    const guarded = guardTimerRef.current > 0;
    if (guarded) {
      // Heavy hitters push through a guard a little more than regular fighters; a guarded charged strike is stopped
      const guardPass = charged ? MECH.charged.guardPass : profile === 'heavy' || move === 'heavy_slow' ? 0.4 : 0.25;
      finalDmg = Math.max(1, Math.round(finalDmg * guardPass));
      if (charged) { gameManager.recordChargedBlock(); logMech('charged_guarded'); }
      guardTimerRef.current = 0;
      isGuardingRef.current = false;
      setIsGuarding(false);
      addRage(20);
      addCallout(ui(state.lang, 'c_block'), playerChest.x, playerHead.y - 15, '#67e8f9');
      spawnHitParticles(playerChest.x, playerChest.y, '#67e8f9', particleCount(8));
    } else {
      comboStreakRef.current = 0;
      setComboStreak(0);
    }

    playerHpRef.current = Math.max(0, playerHpRef.current - finalDmg);
    setPlayerHpDisplay(playerHpRef.current);

    // Taking damage builds +8 rage (comeback mechanics)
    addRage(8);

    // Opponent healing: league lifesteal on every hit, Razor's leech bite on every 3rd swing
    const mech = stageRef.current.bossMechanic;
    const oh = headOf('opp');
    if (oppStats.lifesteal > 0) {
      const heal = healOpponent((finalDmg * oppStats.lifesteal) / 100);
      if (heal > 0) addFloatingText(`+${heal}`, oh.x + 16, oh.y + 14, '#10b981', 'heal');
    }
    if (isLeechBite(mech, swing)) {
      const heal = healOpponent(leechHeal(mech!, finalDmg));
      addCallout(ui(state.lang, 'c_bite'), chestOf('opp').x, oh.y - 18, '#f43f5e', 2);
      logMech('bite');
      if (heal > 0) addFloatingText(`+${heal} HP`, oh.x, oh.y + 14, '#10b981', 'heal');
    }

    // Second Wind: once per fight below 25% HP
    const wind = skillWith('second_wind');
    if (wind && !secondWindUsedRef.current && playerHpRef.current > 0 && playerHpRef.current < pStats.maxHp * SKILL_RULES.secondWindBelow) {
      secondWindUsedRef.current = true;
      const heal = Math.round(pStats.maxHp * (wind.specialProc?.multiplier || 0.35));
      playerHpRef.current = Math.min(pStats.maxHp, playerHpRef.current + heal);
      setPlayerHpDisplay(playerHpRef.current);
      addFloatingText(`★ ${skillName(wind.id, wind.name, state.lang)} +${heal}`, playerHead.x, playerHead.y - 24, '#10b981', 'heal');
    }

    const killed = playerHpRef.current <= 0;
    if (guarded) {
      soundFx.playBlock();
      triggerHaptic('medium');
      screenShakeRef.current = battleRig.reducedMotion ? 0 : 2;
      addFloatingText(`-${finalDmg}`, playerHead.x, playerHead.y + 4, '#67e8f9', 'damage');
      battleRig.flash('player', 0.3);
      if (!killed) {
        battleRig.command('player', 'guard');
        schedule(250, () => !isMatchOverRef.current && battleRig.command('player', 'idle'));
      }
    } else if (isCrit) {
      soundFx.playCritHit();
      triggerHaptic('medium');
      screenShakeRef.current = battleRig.reducedMotion ? 2 : 7;
      hitStopTimerRef.current = 40;
      spawnHitParticles(playerChest.x, playerChest.y, '#f97316', particleCount(12));
      addCallout(ui(state.lang, 'c_ouch'), playerChest.x, playerHead.y - 15, '#ef4444', 2);
      addFloatingText(`${t('crit', state.lang)} -${finalDmg}`, playerHead.x, playerHead.y + 4, '#ef4444', 'crit');
      battleRig.flash('player', 1);
      battleRig.kickCamera(0.35);
      if (!killed) battleRig.command('player', 'crit_hit');
    } else {
      if (move === 'heavy' || move === 'heavy_slow') soundFx.playHeavyPunch();
      else if (move === 'kick') soundFx.playKickHit();
      else soundFx.playPunch();
      triggerHaptic(move === 'jab' ? 'light' : 'medium');
      screenShakeRef.current = battleRig.reducedMotion ? 0 : move === 'jab' ? 2 : 4;
      spawnHitParticles(playerChest.x, playerChest.y, '#fca5a5', particleCount(6));
      addFloatingText(`-${finalDmg}`, playerHead.x, playerHead.y + 4, '#f87171', 'damage');
      battleRig.flash('player', 0.7);
      if (!killed) battleRig.command('player', 'hit');
    }

    if (killed) {
      battleRig.command('player', 'knockdown');
      handleDefeat();
    }
  };

  const handleVictory = () => {
    isMatchOverRef.current = true;
    guardTimerRef.current = 0;
    isGuardingRef.current = false;
    setIsGuarding(false);
    setMatchStatus('victory');
    cueKo('player');
    battleRig.command('player', 'victory');
    soundFx.playVictoryFanfare();
    addCallout(ui(state.lang, 'c_ko'), 160, 75, '#fbbf24', 5);

    // Show what the win paid out
    const won = stageRef.current;
    const coinMult = Date.now() < state.doubleCoinsUntil ? 2 : 1;
    addFloatingText(`+${Math.round(won.coinReward * coinMult)} 🪙`, 140, 168, '#fbbf24', 'crit');
    addFloatingText(`+${won.xpReward} XP`, 205, 168, '#c4b5fd', 'skill');
    if (won.gemReward > 0) addFloatingText(`+${won.gemReward} 💎`, 172, 150, '#67e8f9', 'crit');

    if (stageRef.current.isBoss) {
      confetti({
        disableForReducedMotion: true,
        particleCount: 100,
        spread: 80,
        origin: { y: 0.4 },
      });
    }

    const completedStage = stageRef.current;
    resultTimerRef.current = setTimeout(() => {
      resultTimerRef.current = null;
      onVictory(completedStage);
    }, 700 / state.battleSpeed);
  };

  const handleDefeat = () => {
    isMatchOverRef.current = true;
    guardTimerRef.current = 0;
    isGuardingRef.current = false;
    setIsGuarding(false);
    setMatchStatus('defeat');
    cueKo('opp');
    battleRig.command('opp', 'victory');
    soundFx.playKnockdown();
    addFloatingText(t('knockout', state.lang), 160, 90, '#ef4444', 'crit');

    const retreated = gameManager.onStageDefeat(stageRef.current);
    if (retreated) {
      // The stage change triggers a fresh battle on the previous stage
      addFloatingText(ui(state.lang, 'fallback_msg'), 160, 120, '#fbbf24', 'skill');
    } else if (stageRef.current.isBoss) {
      setShowReviveAd(true);
    } else {
      resultTimerRef.current = setTimeout(() => {
        resultTimerRef.current = null;
        resetBattle(stageRef.current);
      }, 1500 / state.battleSpeed);
    }
  };

  const handleReviveWithAd = () => {
    gameManager.openRewardedAd({
      type: 'revive',
      title: t('adRevive', state.lang),
      rewardDesc: 'Full HP Revive + Super Rage Surge!',
    });
  };

  const handleManualRage = () => {
    if (playerRageRef.current >= 100 && !isMatchOverRef.current && !paused) {
      gameManager.recordQuest('use_super');
      playerRageRef.current = 0;
      setPlayerRageDisplay(0);
      performPlayerAttack(true);
    }
  };

  const handleManualAttack = () => {
    if (state.autoBattle || paused || isMatchOverRef.current || playerCooldownRef.current > 0) return;
    const speed = Math.max(10, state.playerFighter.stats.spd);
    playerCooldownRef.current = Math.max(450, 1500 - speed * 18);
    manualAttackReadyRef.current = false;
    setManualAttackReady(false);
    performPlayerAttack(false);
  };

  const handleGuard = () => {
    if (state.autoBattle || paused || isMatchOverRef.current || guardCooldownRef.current > 0) return;
    guardTimerRef.current = 800;
    guardCooldownRef.current = 2600;
    guardReadyRef.current = false;
    isGuardingRef.current = true;
    setGuardReady(false);
    setIsGuarding(true);
    battleRig.command('player', 'guard');
    addFloatingText(ui(state.lang, 'c_guard'), headOf('player').x, headOf('player').y, '#67e8f9', 'skill');
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fxScale = Math.min(3, Math.max(1, (canvas.clientWidth / 360) * (window.devicePixelRatio || 1)));
    if (canvas.width !== Math.round(360 * fxScale)) {
      canvas.width = Math.round(360 * fxScale);
      canvas.height = Math.round(215 * fxScale);
    }

    let lastTime = performance.now();
    let canvasInView = true;
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      canvasInView = entry.isIntersecting;
    });
    intersectionObserver.observe(canvas);

    const loop = (currentTime: number) => {
      const dt = Math.min(50, currentTime - lastTime);
      lastTime = currentTime;

      // Handle Hit-Stop Freeze Frame
      let isHitStopActive = false;
      if (hitStopTimerRef.current > 0) {
        hitStopTimerRef.current -= dt;
        isHitStopActive = true;
      }

      // Cinematics scale the fight clock (0 during the VS card, slower during SUPER / KO)
      const cineScale = battleRig.tickCine(paused ? 0 : dt);
      const frozen = isHitStopActive || paused;
      const simDt = frozen ? 0 : dt * state.battleSpeed * cineScale;
      // Idle animations keep breathing behind the VS card
      battleRig.timeScale = frozen ? 0 : state.battleSpeed * (battleRig.cine?.kind === 'boss_intro' ? 1 : cineScale);

      // Fire animation-synced impacts whose time has come
      if (isMatchOverRef.current) {
        pendingRef.current = [];
      } else if (simDt > 0 && pendingRef.current.length) {
        const queue = pendingRef.current;
        queue.forEach((e) => (e.t -= simDt));
        pendingRef.current = queue.filter((e) => e.t > 0);
        queue.filter((e) => e.t <= 0).forEach((e) => e.fn());
      }

      if (!isMatchOverRef.current && !paused && !isHitStopActive) {
        playerCooldownRef.current -= simDt;
        opponentCooldownRef.current -= simDt;
        guardTimerRef.current = Math.max(0, guardTimerRef.current - simDt);
        guardCooldownRef.current = Math.max(0, guardCooldownRef.current - simDt);
        if (guardTimerRef.current === 0 && isGuardingRef.current) {
          isGuardingRef.current = false;
          setIsGuarding(false);
          battleRig.command('player', 'idle');
        }
        if (guardCooldownRef.current === 0 && !guardReadyRef.current) {
          guardReadyRef.current = true;
          setGuardReady(true);
        }
        if (playerCooldownRef.current <= 0 && !manualAttackReadyRef.current) {
          manualAttackReadyRef.current = true;
          setManualAttackReady(true);
        }

        // Boss mechanics on the fight clock: evasion stance, shell refresh, enrage tempo (telegraphed with callouts)
        fightTimeRef.current += simDt;
        const stageNow = stageRef.current;
        const mech = stageNow.bossMechanic;
        if (mech) {
          const oc = chestOf('opp');
          const oh = headOf('opp');
          const stance = evadeActive(mech, fightTimeRef.current);
          if (stance && !evadeShownRef.current) { addCallout(ui(state.lang, 'c_evade'), oc.x, oh.y - 18, '#c084fc', 3); logMech('evade_stance'); }
          evadeShownRef.current = stance;
          if (mech.id === 'shell' && fightTimeRef.current >= shellNextRef.current) {
            shellNextRef.current += MECH.shell.period;
            shellRef.current = shellCapacity(mech, stageNow.opponent.stats.maxHp);
            addCallout(ui(state.lang, 'c_shell'), oc.x, oh.y - 18, '#67e8f9', 2);
            logMech('shell_up');
          }
          const hpFrac = opponentHpRef.current / Math.max(1, stageNow.opponent.stats.maxHp);
          if (!enrageShownRef.current && enraged(mech, hpFrac)) {
            enrageShownRef.current = true;
            addCallout(ui(state.lang, 'c_enrage'), oc.x, oh.y - 18, '#ef4444', 3);
            logMech('enrage');
            battleRig.flash('opp', 1);
          }
        }

        const pInterval = playerInterval(state.playerFighter.stats.spd, stageRef.current.opponent.stats.spd);
        const oppInterval = opponentInterval(stageRef.current.opponent.stats.spd, stageRef.current.opponent.profile, state.playerFighter.stats.spd)
          * mechIntervalMult(mech, opponentHpRef.current / Math.max(1, stageNow.opponent.stats.maxHp));

        if (state.autoBattle && playerCooldownRef.current <= 0) {
          playerCooldownRef.current = pInterval;
          manualAttackReadyRef.current = false;
          setManualAttackReady(false);
          if (playerRageRef.current >= 100) {
            gameManager.recordQuest('use_super');
            playerRageRef.current = 0;
            setPlayerRageDisplay(0);
            performPlayerAttack(true);
          } else {
            performPlayerAttack(false);
          }
        }

        if (opponentCooldownRef.current <= 0 && opponentHpRef.current > 0) {
          opponentCooldownRef.current = oppInterval;
          performOpponentAttack();
        }
      }

      if (playerPoseRef.current.stateTimer > 0) {
        playerPoseRef.current.stateTimer -= simDt;
        if (playerPoseRef.current.stateTimer <= 0) {
          playerPoseRef.current.xOffset = 0;
          playerPoseRef.current.animState = 'idle';
        }
      }
      if (opponentPoseRef.current.stateTimer > 0) {
        opponentPoseRef.current.stateTimer -= simDt;
        if (opponentPoseRef.current.stateTimer <= 0) {
          opponentPoseRef.current.xOffset = 0;
          opponentPoseRef.current.animState = 'idle';
        }
      }

      if (screenShakeRef.current > 0) {
        screenShakeRef.current = Math.max(0, screenShakeRef.current - dt * 0.03);
      }

      if (canvasInView) {
        ctx.setTransform(fxScale, 0, 0, fxScale, 0, 0);
        drawScene(ctx, currentTime, isHitStopActive);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      } else if (animFrameRef.current === null) {
        lastTime = performance.now();
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    onVisibilityChange();

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      intersectionObserver.disconnect();
      if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    };
  }, [state.battleSpeed, state.autoBattle, state.playerFighter.stats, paused]);

  const drawScene = (ctx: CanvasRenderingContext2D, time: number, isHitStop: boolean) => {
    const width = 360;
    const height = 215;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Dynamic Camera Zoom & Punch-in during Hit-Stop or Super Move
    const isSpecialVole = playerPoseRef.current.animState === 'attacking' && playerPoseRef.current.attackType === 'special';
    if (!battleRig.active && (isHitStop || isSpecialVole)) {
      ctx.translate(width * 0.5, height * 0.5);
      const zoomFactor = isSpecialVole ? 1.07 : 1.05;
      ctx.scale(zoomFactor, zoomFactor);
      ctx.translate(-width * 0.5, -height * 0.5);
    }

    if (!battleRig.active && screenShakeRef.current > 0) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 2;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 2;
      ctx.translate(shakeX, shakeY);
    }

    // Manga / Arcade Radial Speed Lines during Super Move or Heavy Hit-Stop
    if (isSpecialVole || (isHitStop && screenShakeRef.current > 6)) {
      ctx.save();
      const centerX = 210;
      const centerY = 130;
      ctx.strokeStyle = isSpecialVole ? 'rgba(251, 191, 36, 0.45)' : 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + (time * 0.005);
        const r1 = 65 + (i % 3) * 15;
        const r2 = 260;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * r1, centerY + Math.sin(angle) * r1);
        ctx.lineTo(centerX + Math.cos(angle) * r2, centerY + Math.sin(angle) * r2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2D sprites are only a fallback when WebGL is unavailable; the 3D scene draws the fighters.
    if (!battleRig.active) {
    // Shadows on 3D floor
      const pIdleBob = Math.sin(time * 0.006) * 3;
      const oppIdleBob = Math.sin((time + 500) * 0.006) * 3;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(85 + playerPoseRef.current.xOffset, 162, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(245 + opponentPoseRef.current.xOffset, 162, 24, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Player Aura FX
      drawPlayerAura(ctx, 85 + playerPoseRef.current.xOffset, 138 + pIdleBob, state.playerFighter.avatarStyle.auraEffect, time);

      // Player Fighter (with Full Live Paperdoll)
      drawFighter(
        ctx,
        85 + playerPoseRef.current.xOffset,
        138 + (playerPoseRef.current.animState === 'idle' ? pIdleBob : 0),
        1,
        state.playerFighter.avatarStyle,
        playerPoseRef.current.animState,
        playerPoseRef.current.attackType,
        state.playerFighter.equipped,
        time
      );

      // Opponent Fighter
      drawFighter(
        ctx,
        245 + opponentPoseRef.current.xOffset,
        138 + (opponentPoseRef.current.animState === 'idle' ? oppIdleBob : 0),
        -1,
        stageRef.current.opponent.avatarStyle,
        opponentPoseRef.current.animState,
        opponentPoseRef.current.attackType,
        null,
        time
      );

    }

    // Special Ball FX (Orbiting / Shot)
    if (isSpecialVole) {
      const span = battleRig.active ? SPECIAL_MS : 180;
      const ballProgress = Math.min(1, Math.max(0, 1 - playerPoseRef.current.stateTimer / span));
      const from = battleRig.active ? battleRig.anchors.player.chest : { x: 85, y: 130 };
      const to = battleRig.active ? battleRig.anchors.opp.chest : { x: 235, y: 130 };
      const arc = Math.max(0, (ballProgress - 0.35) / 0.65);
      const ballX = from.x + (to.x - from.x) * arc;
      const ballY = from.y - Math.sin(arc * Math.PI) * 30;
      const ballColor = state.playerFighter.avatarStyle.ballColor || '#f59e0b';

      const grad = ctx.createRadialGradient(ballX, ballY, 2, ballX, ballY, 24);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, ballColor);
      grad.addColorStop(0.7, '#f43f5e');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 24, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ballColor;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    // Hit Particles
    const now = Date.now();
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.055;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      // Additive light streaks with a hot core read as sparks instead of flat discs
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = p.color;
      ctx.lineCap = 'round';
      ctx.lineWidth = p.size * 0.9;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;

    // Manga Onomatopoeia Callouts
    for (let i = calloutsRef.current.length - 1; i >= 0; i--) {
      const c = calloutsRef.current[i];
      const age = now - c.createdAt;
      if (age > c.duration) {
        calloutsRef.current.splice(i, 1);
        continue;
      }

      const progress = age / c.duration;
      const alpha = progress < 0.7 ? 1 : (1 - (progress - 0.7) / 0.3);
      const scale = progress < 0.2 ? 0.3 + (progress / 0.2) * 0.9 : 1.2 - (progress - 0.2) * 0.2;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(c.x, c.y - progress * 15);
      ctx.rotate(c.rot);
      ctx.scale(scale, scale);

      ctx.font = '900 italic 16px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Thick black comic outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4.5;
      ctx.lineJoin = 'miter';
      ctx.strokeText(c.text, 0, 0);

      // Bright fill
      ctx.fillStyle = c.color;
      ctx.fillText(c.text, 0, 0);
      ctx.restore();
    }

    // Floating Numbers
    for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
      const ft = floatingTextsRef.current[i];
      const age = now - ft.createdAt;
      if (age > ft.duration) {
        floatingTextsRef.current.splice(i, 1);
        continue;
      }

      const progress = age / ft.duration;
      const alpha = 1 - Math.pow(progress, 2);
      const offsetY = progress * 35;

      ctx.save();
      ctx.globalAlpha = alpha;
      const big = ft.type === 'crit';
      const pop = big && progress < 0.15 ? 1 + (0.15 - progress) * 2.5 : 1;
      const size = (big ? 17 : ft.type === 'skill' ? 13 : 14) * pop;
      ctx.font = `900 ${size.toFixed(1)}px "Plus Jakarta Sans", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.lineWidth = big ? 4 : 3;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      ctx.strokeText(ft.text, ft.x, ft.y - offsetY);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y - offsetY);
      ctx.restore();
    }

    ctx.restore();
  };

  const drawPlayerAura = (ctx: CanvasRenderingContext2D, x: number, y: number, aura: string | undefined, time: number) => {
    if (!aura || aura === 'none') return;

    ctx.save();
    if (aura === 'lightning') {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const angle = time * 0.008 + i * 1.6;
        const ox = x + Math.cos(angle) * 20;
        const oy = y - 25 + Math.sin(angle) * 24;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + (Math.random() * 10 - 5), oy + (Math.random() * 10 - 5));
        ctx.stroke();
      }
    } else if (aura === 'flame') {
      const flameGrad = ctx.createRadialGradient(x, y - 25, 4, x, y - 25, 30);
      flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
      flameGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.25)');
      flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(x, y - 25, 30, 0, Math.PI * 2);
      ctx.fill();
    } else if (aura === 'neon') {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      const pulse = 18 + Math.sin(time * 0.006) * 5;
      ctx.beginPath();
      ctx.ellipse(x, y - 25, pulse, pulse * 0.6, time * 0.002, 0, Math.PI * 2);
      ctx.stroke();
    } else if (aura === 'divine') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(x, y - 56, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawFighter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: 1 | -1,
    avatar: GameStateData['playerFighter']['avatarStyle'],
    animState: string,
    attackType: string,
    equipped: GameStateData['playerFighter']['equipped'] | null,
    time: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);

    const isStriking = animState === 'attacking';

    // 0. Orbiting Striker Ball Companion (if equipped weapon or high tier)
    if (equipped?.weapon) {
      const orbAngle = time * 0.004;
      const orbX = Math.cos(orbAngle) * 26;
      const orbY = -30 + Math.sin(orbAngle) * 12;
      
      // Orb flame trail
      ctx.save();
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 1, orbX, orbY, 10);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.5, '#f59e0b');
      orbGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 0.5 Companion Drone Mascot (if equipped partner)
    if (equipped?.partner) {
      const droneBob = Math.sin(time * 0.005) * 4;
      const droneX = -24;
      const droneY = -55 + droneBob;

      ctx.save();
      // Mini drone body
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(droneX, droneY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Eye lens
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(droneX + 2, droneY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Drone wings
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(droneX - 9, droneY - 2, 4, 3);
      ctx.fillRect(droneX + 5, droneY - 2, 4, 3);
      ctx.restore();
    }

    // 1. Legs & Shorts
    ctx.fillStyle = avatar.bodyColor;
    ctx.fillRect(-8, -12, 6, 14);
    if (isStriking && attackType === 'kick') {
      ctx.save();
      ctx.translate(4, -10);
      ctx.rotate(0.9);
      ctx.fillRect(0, 0, 6, 16);
      
      // Shorts athletic gold trim
      if (equipped?.shorts) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, 0, 6, 3);
      }

      // Cleat sparks on kick
      if (equipped?.boots) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(4, 14, 4, 4);
      }
      ctx.restore();
    } else {
      ctx.fillRect(2, -12, 6, 14);

      // Shorts athletic gold trim
      if (equipped?.shorts) {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-8, -12, 6, 3);
        ctx.fillRect(2, -12, 6, 3);
      }
    }

    // Shoes / Golden Striker Cleats
    if (equipped?.boots) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-9, 0, 9, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-6, 2, 4, 2);
      if (!isStriking || attackType !== 'kick') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(1, 0, 9, 4);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(4, 2, 4, 2);
      }
    } else {
      ctx.fillStyle = avatar.shoeColor;
      ctx.fillRect(-9, 0, 8, 4);
      if (!isStriking || attackType !== 'kick') {
        ctx.fillRect(1, 0, 8, 4);
      }
    }

    // 2. Torso (Jersey / Karate Gi / Robe)
    ctx.fillStyle = avatar.bodyColor;
    ctx.beginPath();
    ctx.roundRect(-10, -32, 20, 22, 4);
    ctx.fill();

    // Robe Gold Embroidery Trim
    if (equipped?.robe) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-9, -31, 18, 20);
      // Chest badge
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -22, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavyweight Champion Gold Belt
    if (equipped?.belt) {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-10, -14, 20, 5);
      // Gold Buckle Plate
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-5, -15, 10, 7);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-2, -13, 4, 3);
    }

    // 3. Head & Skin
    ctx.fillStyle = avatar.skinTone;
    ctx.beginPath();
    ctx.arc(0, -42, 10, 0, Math.PI * 2);
    ctx.fill();

    // Mouthguard / Face Armor
    if (equipped?.mouth) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-2, -38, 7, 3);
    }

    // Hair
    ctx.fillStyle = avatar.hairColor;
    if (avatar.hairStyle === 'spiky') {
      ctx.beginPath();
      ctx.moveTo(-8, -46);
      ctx.lineTo(-4, -55);
      ctx.lineTo(0, -48);
      ctx.lineTo(4, -55);
      ctx.lineTo(8, -46);
      ctx.fill();
    } else if (avatar.hairStyle === 'dreads') {
      ctx.fillRect(-9, -49, 18, 5);
      ctx.fillRect(-8, -45, 4, 12);
      ctx.fillRect(4, -45, 4, 12);
    } else {
      ctx.beginPath();
      ctx.arc(0, -46, 9, Math.PI, 0);
      ctx.fill();
    }

    // Head Equipment: Golden Crown / Champion Headband
    if (equipped?.head) {
      ctx.save();
      // Gold 3-Point Crown
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-9, -49);
      ctx.lineTo(-9, -58);
      ctx.lineTo(-4, -52);
      ctx.lineTo(0, -60);
      ctx.lineTo(4, -52);
      ctx.lineTo(9, -58);
      ctx.lineTo(9, -49);
      ctx.closePath();
      ctx.fill();

      // Ruby Centerpiece Gem
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -52, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -43, 3, 3);

    // 4. Arms & Glowing Power Gloves
    ctx.fillStyle = avatar.skinTone;
    if (isStriking && (attackType === 'punch' || attackType === 'special')) {
      ctx.fillRect(2, -28, 18, 5.5);

      if (equipped?.gloves) {
        // Glowing Elemental Energy Fist
        const fistGrad = ctx.createRadialGradient(23, -26, 2, 23, -26, 12);
        fistGrad.addColorStop(0, '#ffffff');
        fistGrad.addColorStop(0.4, '#ef4444');
        fistGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = fistGrad;
        ctx.beginPath();
        ctx.arc(23, -26, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(23, -26, 7.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = avatar.gloveColor;
        ctx.beginPath();
        ctx.arc(22, -26, 7.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = avatar.skinTone;
      ctx.fillRect(-6, -26, 6, 10);
    } else {
      ctx.fillRect(-4, -28, 6, 12);
      ctx.fillRect(4, -30, 6, 12);

      if (equipped?.gloves) {
        // Glowing gloves resting
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -28, 6.5, 0, Math.PI * 2);
        ctx.arc(8, -30, 6.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, -28, 2.5, 0, Math.PI * 2);
        ctx.arc(8, -30, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = avatar.gloveColor;
        ctx.beginPath();
        ctx.arc(0, -28, 5.5, 0, Math.PI * 2);
        ctx.arc(8, -30, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  const pStats = state.playerFighter.stats;
  const oppStats = currentStageData.opponent.stats;
  const playerHpPct = Math.max(0, Math.min(100, (playerHpDisplay / pStats.maxHp) * 100));
  const oppHpPct = Math.max(0, Math.min(100, (opponentHpDisplay / oppStats.maxHp) * 100));
  const lang = state.lang;
  const oppDisplayName = opponentName(currentStageData.opponent.name, lang);
  // How the fight should go (expected time-to-kill on both sides): tells the player when to upgrade first
  const difficulty = difficultyOf(stageOdds(state.playerFighter.stats, currentStageData, state.playerFighter.equippedSkills));
  // The boss's signature move for the VS card (the name comes from the boss mechanic data, when the stage has one)
  const mechId = currentStageData.bossMechanic?.id;
  const mechName = mechId && ui(lang, 'boss_mech_' + mechId) !== 'boss_mech_' + mechId ? ui(lang, 'boss_mech_' + mechId) : null;
  const pLook = state.playerFighter.avatarStyle;
  const oLook = currentStageData.opponent.avatarStyle;

  return (
    <div className="relative w-full bg-[#06070a] flex flex-col border-b border-white/10 select-none">
      {/* Fight view: the 3D scene with the HUD (names, HP, power) as an overlay on top */}
      <div
        className="battle-viewport arena-backdrop relative w-full flex justify-center overflow-hidden"
        data-environment={currentStageData.environment}
        onPointerDown={skipMoment}
      >
        <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/45 via-transparent to-sky-950/20" />
        {/* 1. 3D WebGL Arena Backdrop */}
        <Suspense fallback={null}>
          <BattleScene3D
            key={state.quality}
            environment={currentStageData.environment}
            screenShakeRef={screenShakeRef}
            player={playerAppearance(state.playerFighter)}
            opponent={opponentAppearance(currentStageData)}
            hudTop={hudH}
          />
        </Suspense>

        {/* 2. 2D Animated Combat Sprite Layer */}
        <canvas
          ref={canvasRef}
          width={360}
          height={215}
          className="w-full h-full block object-contain z-10"
        />

        {/* 3. HUD overlay: player left, stage + fight controls centre, opponent right. One grid, so both HP bars
            stay on the same line when a long name wraps. */}
        <div ref={hudRef} className="battle-hud absolute inset-x-0 top-0 z-30 px-2 pt-1.5 pb-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-1.5 gap-y-[3px] pointer-events-none">
          {/* Row 1: names + levels, stage */}
          <div className="min-w-0 flex items-end gap-1" data-hud-player>
            <span className="shrink-0 mb-[1px] px-1 rounded bg-black/60 border border-amber-500/40 text-[9px] leading-[12px] font-black text-amber-300 tabular-nums">{state.playerLevel}</span>
            <FitText text={state.playerFighter.name} max={12} oneLineMin={10} min={9} className="min-w-0 flex-1 font-black text-zinc-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]" />
          </div>
          <span className="justify-self-center text-[11px] leading-none font-black text-amber-300 tabular-nums whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
            {stageLabel(currentStageData.world, currentStageData.subStage, lang)}
          </span>
          <div className="min-w-0 flex items-end justify-end gap-1 text-right" data-hud-opponent>
            <FitText text={oppDisplayName} max={12} oneLineMin={10} min={8.5} className="min-w-0 flex-1 font-black text-zinc-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]" />
            <span className="shrink-0 mb-[1px] px-1 rounded bg-black/60 border border-rose-500/40 text-[9px] leading-[12px] font-black text-rose-300 tabular-nums">{currentStageData.opponent.level}</span>
          </div>

          {/* Row 2: HP bars (+ the player's SUPER gauge), boss badge */}
          <div className="min-w-0 self-start flex flex-col gap-[3px]">
            <div className="relative w-full h-[15px] bg-black/80 rounded-md overflow-hidden border border-emerald-400/50 p-[2px]">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 rounded-[3px] transition-all duration-150 ease-out"
                style={{ width: `${playerHpPct}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {playerHpDisplay} / {pStats.maxHp}
              </span>
            </div>
            <div className="relative w-full h-[5px] bg-black/80 rounded-full overflow-hidden border border-amber-500/30">
              <div
                className={`h-full transition-all duration-150 ${
                  playerRageDisplay >= 100
                    ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 animate-pulse'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500'
                }`}
                style={{ width: `${playerRageDisplay}%` }}
              />
            </div>
          </div>
          <div className="self-start justify-self-center">
            {currentStageData.isBoss && (
              <span className="block px-2 rounded-md text-[9px] leading-[14px] font-black uppercase tracking-wider game-btn-crimson text-white border border-rose-400">
                {t('boss', lang)}
              </span>
            )}
          </div>
          <div className="min-w-0 self-start">
            <div className="relative w-full h-[15px] bg-black/80 rounded-md overflow-hidden border border-rose-500/50 p-[2px]">
              <div
                className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 rounded-[3px] transition-all duration-150 ease-out float-right"
                style={{ width: `${oppHpPct}%` }}
              />
              <span data-hp="opp" className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                {opponentHpDisplay} / {oppStats.maxHp}
              </span>
            </div>
          </div>

          {/* Row 3: power / stats, battle speed + auto/manual, rival difficulty + style */}
          <div className="min-w-0 self-start">
            <StatBar stats={state.playerFighter.stats} lang={lang} />
          </div>
          <div className="self-start flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              data-speed
              onClick={() => gameManager.cycleBattleSpeed()}
              className="h-6 px-1.5 rounded-full bg-black/75 border border-amber-400/40 text-[10px] font-black font-mono text-amber-300 shadow-lg active:scale-95 flex items-center justify-center gap-0.5"
              aria-label={ui(lang, 'aria_speed')}
            >
              <Zap className="w-3 h-3" />
              {state.battleSpeed}X
            </button>
            <button
              type="button"
              data-auto-toggle
              onClick={() => gameManager.toggleAutoBattle()}
              className="h-6 px-1.5 rounded-full bg-black/75 border border-white/20 text-[10px] font-black tracking-wide text-white shadow-lg active:scale-95 whitespace-nowrap"
              aria-label={ui(lang, state.autoBattle ? 'aria_to_manual' : 'aria_to_auto')}
            >
              {ui(lang, state.autoBattle ? 'auto_btn' : 'manual_btn')}
            </button>
          </div>
          <div className="min-w-0 self-start flex flex-wrap items-center justify-end gap-1">
            <span className={`shrink-0 px-1 rounded-md bg-black/70 border text-[9px] leading-[16px] font-black tracking-wide ${difficulty[1]}`}>
              {ui(lang, difficulty[0])}
            </span>
            <span className="shrink-0 px-1 rounded-md bg-black/70 border border-white/15 text-[9px] leading-[16px] font-black tracking-wide text-zinc-300 uppercase">
              {ui(lang, 'p_' + currentStageData.opponent.profile)}
            </span>
          </div>
        </div>

        {/* Farm until ready: progress chip, then "Boss ready" (tap to go back) */}
        {state.farm && matchStatus === 'fighting' && (
          <div className="absolute right-2 z-30" style={{ top: hudH + 2 }}>
            <FarmChip state={state} />
          </div>
        )}

        {isGuarding && !state.autoBattle && (
          <div className="pointer-events-none absolute inset-0 z-20 border-2 border-cyan-300/70 bg-cyan-300/5 shadow-[inset_0_0_35px_rgba(34,211,238,0.22)]" />
        )}

        {!state.autoBattle && matchStatus === 'fighting' && (
          <div className="absolute bottom-2 right-2 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={handleGuard}
              disabled={!guardReady || paused}
              className="min-h-11 px-3 rounded-xl border border-cyan-300/60 bg-cyan-950/90 text-cyan-100 shadow-lg flex items-center gap-1.5 text-xs font-black disabled:opacity-45 active:scale-95"
            >
              <Shield className="w-4 h-4" /> {ui(lang, 'guard_btn')}
            </button>
            <button
              type="button"
              onClick={handleManualAttack}
              disabled={!manualAttackReady || paused}
              className="min-h-11 px-4 rounded-xl game-btn-crimson border border-rose-300/70 text-white shadow-lg flex items-center gap-1.5 text-xs font-black disabled:opacity-45 active:scale-95"
            >
              <Hand className="w-4 h-4" /> {ui(lang, 'hit_btn')}
            </button>
          </div>
        )}

        {/* Boss intro: VS card (tap to skip) */}
        {cine?.kind === 'boss_intro' && currentStageData.isBoss && (
          <BossIntroCard
            lang={lang}
            durationMs={cine.dur}
            reducedMotion={battleRig.reducedMotion}
            stage={stageLabel(currentStageData.world, currentStageData.subStage, lang)}
            player={{ name: state.playerFighter.name, level: state.playerLevel, look: pLook }}
            boss={{
              name: oppDisplayName,
              level: currentStageData.opponent.level,
              title: opponentTitle(currentStageData.opponent.name, currentStageData.opponent.title, lang),
              look: oLook,
            }}
            mechanic={mechName}
            onSkip={() => battleRig.skipCine()}
          />
        )}

        {/* Combo Streak Multiplier Badge (under the player's HUD) */}
        {comboStreak > 1 && (
          <div className="absolute left-2 px-2 py-0.5 rounded-lg bg-black/75 border border-amber-400 text-[11px] font-black text-amber-300 shadow-xl flex items-center gap-1 z-20" style={{ top: hudH + 2 }}>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums">x{comboStreak} {ui(lang, 'c_combo')}</span>
          </div>
        )}

        {/* Super Move Trigger Button */}
        {playerRageDisplay >= 100 && matchStatus === 'fighting' && !showReviveAd && (
          <button
            onClick={handleManualRage}
            className={`absolute left-2 bottom-2 px-3.5 min-h-11 game-btn-gold text-black font-black text-xs rounded-xl shadow-2xl active:scale-95 transition-transform flex items-center gap-1.5 shine-effect z-30 border border-amber-300/80`}
          >
            <Zap className="w-4 h-4 text-black" />
            <span>{t('superMove', lang)}</span>
          </button>
        )}

        {/* Boss defeat: why it happened (the boss's signature move and its counter), what to do, and an optional ad
            revive. Auto mode starts farming until ready by itself after the countdown. */}
        {showReviveAd && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-1 bg-black/75 px-4 text-center" style={{ paddingTop: hudH }} data-boss-defeat>
            <span className="text-xl font-black italic leading-none text-rose-500 drop-shadow-2xl">{t('knockout', state.lang)}</span>
            {currentStageData.bossMechanic ? (
              <span className="max-w-[340px] text-[11px] font-bold leading-snug text-zinc-100" data-mech-hint={currentStageData.bossMechanic.id}>
                <span className="text-rose-300 font-black">{ui(state.lang, 'boss_mech_' + currentStageData.bossMechanic.id)}:</span>{' '}
                {ui(state.lang, 'boss_mech_' + currentStageData.bossMechanic.id + '_hint')}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-zinc-100">{ui(state.lang, 'defeat_hint')}</span>
            )}
            <div className="mt-1 grid w-full max-w-[340px] grid-cols-2 gap-1.5 text-[11px] font-black leading-tight">
              <button
                data-farm
                onClick={() => { if (!gameManager.startFarming()) resetBattle(stageRef.current); }}
                className="min-h-10 px-2 rounded-xl bg-emerald-950/90 text-emerald-100 border border-emerald-400/60 active:scale-95"
              >
                {ui(state.lang, 'farm_btn')}{retryIn !== null ? ` (${retryIn})` : ''}
              </button>
              <button
                data-retry
                onClick={() => resetBattle(stageRef.current)}
                className="min-h-10 px-2 rounded-xl game-btn-gold text-black active:scale-95"
              >
                {ui(state.lang, 'retry')}
              </button>
              <button
                onClick={() => gameManager.setActiveTab('gym')}
                className="min-h-10 px-2 rounded-xl bg-black/80 text-zinc-100 border border-white/25 active:scale-95"
              >
                {ui(lang, 'go_gym')}
              </button>
              <button
                onClick={handleReviveWithAd}
                className="min-h-10 px-2 rounded-xl bg-rose-950/85 text-rose-100 border border-rose-400/60 flex items-center justify-center gap-1 active:scale-95"
              >
                <Tv className="w-3.5 h-3.5 shrink-0" />
                <span>{t('adRevive', state.lang)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Match Result Overlay (light, so the winner pose stays visible) */}
        {matchStatus !== 'fighting' && !showReviveAd && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-6 text-center" style={{ paddingTop: hudH, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 100%)' }}>
            <span className={`result-slam text-3xl font-black italic tracking-wider drop-shadow-2xl ${
              matchStatus === 'victory'
                ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 bg-clip-text text-transparent'
                : 'text-rose-500'
            }`}>
              {matchStatus === 'victory' ? (currentStageData.isBoss ? t('bossDefeated', lang) : t('victory', lang)) : t('knockout', lang)}
            </span>
            {matchStatus === 'defeat' && (
              <>
                <span className="mt-1.5 text-[11px] font-bold text-zinc-200">{ui(lang, 'defeat_hint')}</span>
                <button
                  onClick={() => gameManager.setActiveTab('gym')}
                  className="pointer-events-auto mt-2 min-h-9 px-4 rounded-xl game-btn-gold text-black text-[11px] font-black active:scale-95"
                >
                  {ui(lang, 'go_gym')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
