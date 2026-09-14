import React, { useEffect, useRef, useState } from 'react';
import { ArenaEnvironment, FloatingText, Stage } from '../types/game';
import { GameStateData, gameManager } from '../core/gameState';
import { soundFx } from '../core/audio';
import { t } from '../i18n/translations';
import { BattleScene3D } from './BattleScene3D';
import confetti from 'canvas-confetti';
import { Tv, Zap } from 'lucide-react';

interface BattleCanvasProps {
  state: GameStateData;
  onVictory: (stage: Stage) => void;
}

export const BattleCanvas: React.FC<BattleCanvasProps> = ({ state, onVictory }) => {
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
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [screenShakeVal, setScreenShakeVal] = useState<number>(0);

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
  const isMatchOverRef = useRef<boolean>(false);

  useEffect(() => {
    const current = gameManager.getCurrentStage();
    stageRef.current = current;
    setCurrentStageData(current);
    resetBattle(current);
  }, [state.currentWorld, state.currentSubStage, state.playerFighter.stats.maxHp]);

  const resetBattle = (stage: Stage) => {
    playerHpRef.current = state.playerFighter.stats.maxHp;
    opponentHpRef.current = stage.opponent.stats.maxHp;
    playerRageRef.current = 0;
    isMatchOverRef.current = false;
    hitStopTimerRef.current = 0;
    setMatchStatus('fighting');
    setShowReviveAd(false);
    setComboStreak(0);
    setPlayerHpDisplay(playerHpRef.current);
    setOpponentHpDisplay(opponentHpRef.current);
    setPlayerRageDisplay(0);
    playerCooldownRef.current = 300;
    opponentCooldownRef.current = 400;
  };

  const addFloatingText = (text: string, x: number, y: number, color: string, type: FloatingText['type'] = 'damage') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x: x + (Math.random() * 20 - 10),
      y: y + (Math.random() * 10 - 5),
      color,
      type,
      createdAt: Date.now(),
      duration: 800,
    });
  };

  const addCallout = (text: string, x: number, y: number, color: string = '#fef08a') => {
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
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(15);
        else if (type === 'medium') navigator.vibrate(40);
        else if (type === 'heavy') navigator.vibrate([40, 30, 40]);
        else if (type === 'super') navigator.vibrate([60, 30, 80]);
      } catch {
        // Haptics not allowed or unsupported
      }
    }
  };

  const performPlayerAttack = (isSpecialRage: boolean = false) => {
    if (isMatchOverRef.current) return;
    const pStats = state.playerFighter.stats;
    const oppStats = stageRef.current.opponent.stats;

    playerPoseRef.current = {
      xOffset: 48,
      animState: 'attacking',
      stateTimer: 180,
      attackType: isSpecialRage ? 'special' : Math.random() > 0.4 ? 'punch' : 'kick',
    };

    const dodgeRoll = Math.random() * 100;
    if (!isSpecialRage && dodgeRoll < oppStats.dodgeRate) {
      soundFx.playDodge();
      setComboStreak(0);
      addFloatingText(t('missDodge', state.lang), 240, 95, '#38bdf8', 'dodge');
      return;
    }

    const isCrit = Math.random() * 100 < pStats.critRate;
    let baseDmg = pStats.atk * (0.85 + Math.random() * 0.3);
    
    // Asymptotic Defense Formula (eliminates 1 DMG wall)
    const defMultiplier = 100 / (100 + oppStats.def * 0.45);
    let finalDmg = Math.max(1, Math.round(baseDmg * defMultiplier));

    if (isCrit) {
      finalDmg = Math.round(finalDmg * (pStats.critDmg || 1.5));
    }
    if (isSpecialRage) {
      finalDmg = Math.round(finalDmg * 2.2);
    }

    setComboStreak((prev) => prev + 1);

    // Skill procs
    let skillProcText = '';
    state.playerFighter.equippedSkills.forEach((skill) => {
      if (skill.specialProc) {
        if (Math.random() * 100 < skill.specialProc.chance) {
          finalDmg = Math.round(finalDmg * skill.specialProc.multiplier);
          skillProcText = skill.name;
        }
      }
    });

    opponentHpRef.current = Math.max(0, opponentHpRef.current - finalDmg);
    setOpponentHpDisplay(opponentHpRef.current);

    playerRageRef.current = Math.min(100, playerRageRef.current + 20);
    setPlayerRageDisplay(playerRageRef.current);

    if (pStats.lifesteal > 0) {
      const healAmount = Math.max(1, Math.round(finalDmg * (pStats.lifesteal / 100)));
      playerHpRef.current = Math.min(pStats.maxHp, playerHpRef.current + healAmount);
      setPlayerHpDisplay(playerHpRef.current);
      addFloatingText(`+${healAmount} HP`, 85, 90, '#10b981', 'heal');
    }

    if (isSpecialRage) {
      soundFx.playCritHit();
      triggerHaptic('super');
      screenShakeRef.current = 12;
      setScreenShakeVal(12);
      hitStopTimerRef.current = 70; // 70ms AAA Hit-Stop Freeze
      spawnHitParticles(235, 110, '#fbbf24', 24);
      addCallout('SUPER VOLE!', 210, 60, '#fde047');
      addFloatingText(`${t('superCrit', state.lang)} ${finalDmg}`, 235, 78, '#fbbf24', 'crit');
    } else if (isCrit) {
      soundFx.playCritHit();
      triggerHaptic('medium');
      screenShakeRef.current = 8;
      setScreenShakeVal(8);
      hitStopTimerRef.current = 45; // 45ms Hit-Stop Freeze
      spawnHitParticles(235, 110, '#fbbf24', 16);
      const critCallouts = ['CRUNCH!', 'POW!', 'SMASH!', 'BOOM!'];
      addCallout(critCallouts[Math.floor(Math.random() * critCallouts.length)], 225, 65, '#f59e0b');
      addFloatingText(`${t('crit', state.lang)} -${finalDmg}`, 235, 78, '#fbbf24', 'crit');
    } else {
      soundFx.playPunch();
      triggerHaptic('light');
      screenShakeRef.current = 3;
      setScreenShakeVal(3);
      spawnHitParticles(235, 110, '#ef4444', 8);
      addFloatingText(`-${finalDmg}`, 235, 82, '#ffffff', 'damage');
    }

    if (skillProcText) {
      addFloatingText(`★ ${skillProcText}!`, 160, 65, '#c084fc', 'skill');
    }

    if (opponentHpRef.current <= 0) {
      handleVictory();
    }
  };

  const performOpponentAttack = () => {
    if (isMatchOverRef.current) return;
    const pStats = state.playerFighter.stats;
    const oppStats = stageRef.current.opponent.stats;

    opponentPoseRef.current = {
      xOffset: -48,
      animState: 'attacking',
      stateTimer: 180,
      attackType: Math.random() > 0.4 ? 'punch' : 'kick',
    };

    const dodgeRoll = Math.random() * 100;
    if (dodgeRoll < pStats.dodgeRate) {
      soundFx.playDodge();
      // Clutch evasion generates +15 rage
      playerRageRef.current = Math.min(100, playerRageRef.current + 15);
      setPlayerRageDisplay(playerRageRef.current);
      addFloatingText(t('dodge', state.lang), 85, 95, '#38bdf8', 'dodge');
      return;
    }

    const isCrit = Math.random() * 100 < oppStats.critRate;
    let baseDmg = oppStats.atk * (0.85 + Math.random() * 0.3);
    
    // Asymptotic Defense Formula for Player
    const defMultiplier = 100 / (100 + pStats.def * 0.45);
    let finalDmg = Math.max(1, Math.round(baseDmg * defMultiplier));

    if (isCrit) {
      finalDmg = Math.round(finalDmg * (oppStats.critDmg || 1.5));
    }

    playerHpRef.current = Math.max(0, playerHpRef.current - finalDmg);
    setPlayerHpDisplay(playerHpRef.current);

    // Taking damage builds +8 rage (comeback mechanics)
    playerRageRef.current = Math.min(100, playerRageRef.current + 8);
    setPlayerRageDisplay(playerRageRef.current);

    if (isCrit) {
      soundFx.playCritHit();
      triggerHaptic('medium');
      screenShakeRef.current = 7;
      setScreenShakeVal(7);
      hitStopTimerRef.current = 40;
      spawnHitParticles(85, 110, '#f97316', 12);
      addCallout('OUCH!', 95, 65, '#ef4444');
      addFloatingText(`${t('crit', state.lang)} -${finalDmg}`, 85, 78, '#ef4444', 'crit');
    } else {
      soundFx.playPunch();
      triggerHaptic('light');
      screenShakeRef.current = 2;
      setScreenShakeVal(2);
      spawnHitParticles(85, 110, '#fca5a5', 6);
      addFloatingText(`-${finalDmg}`, 85, 82, '#f87171', 'damage');
    }

    if (playerHpRef.current <= 0) {
      handleDefeat();
    }
  };

  const handleVictory = () => {
    isMatchOverRef.current = true;
    setMatchStatus('victory');
    soundFx.playVictoryFanfare();
    addCallout('PERFECT KO!', 160, 75, '#fbbf24');

    if (stageRef.current.isBoss) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.4 },
      });
    }

    setTimeout(() => {
      onVictory(stageRef.current);
    }, 700 / state.battleSpeed);
  };

  const handleDefeat = () => {
    isMatchOverRef.current = true;
    setMatchStatus('defeat');
    addFloatingText(t('knockout', state.lang), 160, 90, '#ef4444', 'crit');

    if (stageRef.current.isBoss) {
      setShowReviveAd(true);
    } else {
      setTimeout(() => {
        resetBattle(stageRef.current);
      }, 1500 / state.battleSpeed);
    }
  };

  const handleReviveWithAd = () => {
    gameManager.openRewardedAd({
      type: 'free_gems',
      title: t('adRevive', state.lang),
      rewardDesc: 'Full HP Revive + Super Rage Surge!',
    });
    playerHpRef.current = state.playerFighter.stats.maxHp;
    playerRageRef.current = 100;
    setPlayerHpDisplay(playerHpRef.current);
    setPlayerRageDisplay(100);
    isMatchOverRef.current = false;
    setMatchStatus('fighting');
    setShowReviveAd(false);
  };

  const handleManualRage = () => {
    if (playerRageRef.current >= 100 && !isMatchOverRef.current) {
      playerRageRef.current = 0;
      setPlayerRageDisplay(0);
      performPlayerAttack(true);
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(50, currentTime - lastTime);
      lastTime = currentTime;

      // Handle Hit-Stop Freeze Frame
      let isHitStopActive = false;
      if (hitStopTimerRef.current > 0) {
        hitStopTimerRef.current -= dt;
        isHitStopActive = true;
      }

      const simDt = isHitStopActive ? 0 : dt * state.battleSpeed;

      if (!isMatchOverRef.current && state.autoBattle && !isHitStopActive) {
        playerCooldownRef.current -= simDt;
        opponentCooldownRef.current -= simDt;

        const pSpd = Math.max(10, state.playerFighter.stats.spd);
        const oppSpd = Math.max(10, stageRef.current.opponent.stats.spd);

        const pInterval = Math.max(450, 1500 - pSpd * 18);
        const oppInterval = Math.max(500, 1600 - oppSpd * 16);

        if (playerCooldownRef.current <= 0) {
          playerCooldownRef.current = pInterval;
          if (playerRageRef.current >= 100) {
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
        setScreenShakeVal(screenShakeRef.current);
      }

      drawScene(ctx, currentTime, isHitStopActive);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state.battleSpeed, state.autoBattle, state.playerFighter.stats]);

  const drawScene = (ctx: CanvasRenderingContext2D, time: number, isHitStop: boolean) => {
    const width = 360;
    const height = 215;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Dynamic Camera Zoom & Punch-in during Hit-Stop or Super Move
    const isSpecialVole = playerPoseRef.current.animState === 'attacking' && playerPoseRef.current.attackType === 'special';
    if (isHitStop || isSpecialVole) {
      ctx.translate(width * 0.5, height * 0.5);
      const zoomFactor = isSpecialVole ? 1.07 : 1.05;
      ctx.scale(zoomFactor, zoomFactor);
      ctx.translate(-width * 0.5, -height * 0.5);
    }

    if (screenShakeRef.current > 0) {
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

    // Special Ball FX (Orbiting / Shot)
    if (isSpecialVole) {
      const ballProgress = 1 - (playerPoseRef.current.stateTimer / 180);
      const ballX = 85 + ballProgress * 150;
      const ballY = 130 - Math.sin(ballProgress * Math.PI) * 45;
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
      p.life -= 0.04;

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
        continue;
      }

      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
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
      ctx.font = ft.type === 'crit' || ft.type === 'skill' ? '900 13px system-ui' : '800 11px system-ui';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 5;
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

  return (
    <div className="relative w-full bg-[#06070a] flex flex-col border-b border-white/10 select-none">
      {/* Top Combat HUD with Frosted Titanium Panel */}
      <div className="px-3 pt-3 pb-2.5 bg-gradient-to-b from-[#10121a]/95 to-[#08090e]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between text-xs z-20 shadow-lg">
        {/* Player Header Info */}
        <div className="flex-1 pr-2.5">
          <div className="flex items-center justify-between font-black text-zinc-100 truncate">
            <span className="truncate tracking-wide text-xs">{state.playerFighter.name}</span>
            <span className="text-[10px] text-amber-400 font-mono font-bold bg-black/50 px-1.5 py-0.2 rounded border border-amber-500/30">★ Lv.{state.playerLevel}</span>
          </div>
          
          {/* Angled Modern HP Gauge */}
          <div className="relative w-full h-4 bg-black/80 rounded-xl overflow-hidden mt-1 border border-emerald-500/40 shadow-inner p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-300 rounded-lg transition-all duration-150 ease-out shadow-sm shadow-emerald-400/50"
              style={{ width: `${playerHpPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {playerHpDisplay} / {pStats.maxHp}
            </span>
          </div>

          {/* Electric Rage Bar */}
          <div className="relative w-full h-1.5 bg-black/80 rounded-full overflow-hidden mt-1 border border-amber-500/30">
            <div
              className={`h-full transition-all duration-150 ${
                playerRageDisplay >= 100 
                  ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 animate-pulse shadow-sm shadow-amber-400' 
                  : 'bg-gradient-to-r from-amber-600 to-amber-500'
              }`}
              style={{ width: `${playerRageDisplay}%` }}
            />
          </div>
        </div>

        {/* Center Stage VS Badge */}
        <div className="flex flex-col items-center px-2">
          <span className="font-black text-[12px] bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 bg-clip-text text-transparent drop-shadow font-mono tracking-tight">
            {currentStageData.displayStage}
          </span>
          <div className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg ${
            currentStageData.isBoss 
              ? 'game-btn-crimson text-white animate-pulse border border-rose-400' 
              : 'bg-neutral-900 text-zinc-300 border border-white/15'
          }`}>
            {currentStageData.isBoss ? t('boss', state.lang) : t('vs', state.lang)}
          </div>
        </div>

        {/* Opponent Header Info */}
        <div className="flex-1 pl-2.5 text-right">
          <div className="flex items-center justify-between font-black text-zinc-100 truncate flex-row-reverse">
            <span className="truncate tracking-wide text-xs">{currentStageData.opponent.name}</span>
            <span className="text-[10px] text-rose-400 font-mono font-bold bg-black/50 px-1.5 py-0.2 rounded border border-rose-500/30 mr-1">★ Lv.{currentStageData.opponent.level}</span>
          </div>

          {/* Opponent HP Gauge */}
          <div className="relative w-full h-4 bg-black/80 rounded-xl overflow-hidden mt-1 border border-rose-500/40 shadow-inner p-0.5">
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-red-400 rounded-lg transition-all duration-150 ease-out float-right shadow-sm shadow-rose-500/50"
              style={{ width: `${oppHpPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {opponentHpDisplay} / {oppStats.maxHp}
            </span>
          </div>

          <div className="text-[9px] text-zinc-400 truncate mt-1 italic font-medium">
            "{currentStageData.opponent.dialogue}"
          </div>
        </div>
      </div>

      {/* 2.5D Hybrid WebGL Viewport */}
      <div className="relative w-full flex justify-center bg-black overflow-hidden h-[215px]">
        {/* 1. 3D WebGL Arena Backdrop */}
        <BattleScene3D environment={currentStageData.environment} screenShake={screenShakeVal} />

        {/* 2. 2D Animated Combat Sprite Layer */}
        <canvas
          ref={canvasRef}
          width={360}
          height={215}
          className="w-full max-w-[420px] h-[215px] block object-contain z-10"
        />

        {/* Combo Streak Multiplier Badge */}
        {comboStreak > 1 && (
          <div className="absolute top-2.5 left-3 px-2.5 py-1 rounded-xl bg-black/75 border border-amber-400 text-[11px] font-black font-mono text-amber-300 animate-bounce shadow-xl flex items-center gap-1.5 z-20 backdrop-blur-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>x{comboStreak} COMBO!</span>
          </div>
        )}

        {/* Super Move Trigger Button */}
        {playerRageDisplay >= 100 && (
          <button
            onClick={handleManualRage}
            className="absolute bottom-3 left-3 px-4 py-2 game-btn-gold text-black font-black text-xs rounded-2xl shadow-2xl animate-bounce active:scale-95 transition-transform flex items-center gap-1.5 shine-effect z-20 border border-amber-300/80"
          >
            <Zap className="w-4 h-4 text-black" />
            <span>{t('superMove', state.lang)}</span>
          </button>
        )}

        {/* Revive with Ad in Boss Fights */}
        {showReviveAd && (
          <button
            onClick={handleReviveWithAd}
            className="absolute bottom-3 right-3 px-4 py-2.5 game-btn-crimson text-white font-black text-xs rounded-2xl shadow-2xl border border-rose-300 flex items-center gap-1.5 animate-pulse active:scale-95 transition-transform z-30"
          >
            <Tv className="w-4 h-4" />
            <span>{t('adRevive', state.lang)}</span>
          </button>
        )}

        {/* Match Result Overlay */}
        {matchStatus !== 'fighting' && !showReviveAd && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center pointer-events-none z-20">
            <span className={`text-3xl font-black italic tracking-wider drop-shadow-2xl ${
              matchStatus === 'victory' 
                ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400 bg-clip-text text-transparent' 
                : 'text-rose-500'
            }`}>
              {matchStatus === 'victory' ? (currentStageData.isBoss ? t('bossDefeated', state.lang) : t('victory', state.lang)) : t('knockout', state.lang)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
