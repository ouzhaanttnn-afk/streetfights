import React, { useEffect, useRef, useState } from 'react';
import { ArenaEnvironment, FloatingText, Stage } from '../types/game';
import { GameStateData, gameManager } from '../core/gameState';
import { soundFx } from '../core/audio';
import { t } from '../i18n/translations';
import confetti from 'canvas-confetti';
import { Tv, Flame, Zap, Shield, Sparkles } from 'lucide-react';

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

  // Animation state
  const animFrameRef = useRef<number | null>(null);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number; size: number }[]>([]);
  const screenShakeRef = useRef<number>(0);

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
    const defReduction = Math.max(1, oppStats.def * 0.4);
    let finalDmg = Math.max(1, Math.round(baseDmg - defReduction));

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

    if (isSpecialRage || isCrit) {
      soundFx.playCritHit();
      screenShakeRef.current = 8;
      spawnHitParticles(235, 110, '#fbbf24', 16);
      addFloatingText(isSpecialRage ? `${t('superCrit', state.lang)} ${finalDmg}` : `${t('crit', state.lang)} -${finalDmg}`, 235, 78, '#fbbf24', 'crit');
    } else {
      soundFx.playPunch();
      screenShakeRef.current = 3;
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
      addFloatingText(t('dodge', state.lang), 85, 95, '#38bdf8', 'dodge');
      return;
    }

    const isCrit = Math.random() * 100 < oppStats.critRate;
    let baseDmg = oppStats.atk * (0.85 + Math.random() * 0.3);
    const defReduction = Math.max(1, pStats.def * 0.4);
    let finalDmg = Math.max(1, Math.round(baseDmg - defReduction));

    if (isCrit) {
      finalDmg = Math.round(finalDmg * (oppStats.critDmg || 1.5));
    }

    playerHpRef.current = Math.max(0, playerHpRef.current - finalDmg);
    setPlayerHpDisplay(playerHpRef.current);

    if (isCrit) {
      soundFx.playCritHit();
      screenShakeRef.current = 6;
      spawnHitParticles(85, 110, '#f97316', 10);
      addFloatingText(`${t('crit', state.lang)} -${finalDmg}`, 85, 78, '#ef4444', 'crit');
    } else {
      soundFx.playPunch();
      screenShakeRef.current = 2;
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

      const simDt = dt * state.battleSpeed;

      if (!isMatchOverRef.current && state.autoBattle) {
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
      }

      drawScene(ctx, currentTime);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state.battleSpeed, state.autoBattle, state.playerFighter.stats]);

  const drawScene = (ctx: CanvasRenderingContext2D, time: number) => {
    const width = 360;
    const height = 210;

    ctx.save();

    if (screenShakeRef.current > 0) {
      const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 2;
      const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 2;
      ctx.translate(shakeX, shakeY);
    }

    drawEnvironment(ctx, width, height, stageRef.current.environment, time);

    // Floor & Reflections
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 160, width, 50);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 160);
    ctx.lineTo(width, 160);
    ctx.stroke();

    // Shadows
    const pIdleBob = Math.sin(time * 0.006) * 3;
    const oppIdleBob = Math.sin((time + 500) * 0.006) * 3;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.beginPath();
    ctx.ellipse(85 + playerPoseRef.current.xOffset, 162, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(245 + opponentPoseRef.current.xOffset, 162, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Player Aura FX
    drawPlayerAura(ctx, 85 + playerPoseRef.current.xOffset, 138 + pIdleBob, state.playerFighter.avatarStyle.auraEffect, time);

    // Player Fighter
    drawFighter(
      ctx,
      85 + playerPoseRef.current.xOffset,
      138 + (playerPoseRef.current.animState === 'idle' ? pIdleBob : 0),
      1,
      state.playerFighter.avatarStyle,
      playerPoseRef.current.animState,
      playerPoseRef.current.attackType,
      state.playerFighter.equipped
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
      null
    );

    // Special Ball FX
    if (playerPoseRef.current.animState === 'attacking' && playerPoseRef.current.attackType === 'special') {
      const ballProgress = 1 - (playerPoseRef.current.stateTimer / 180);
      const ballX = 85 + ballProgress * 150;
      const ballY = 130 - Math.sin(ballProgress * Math.PI) * 45;
      const ballColor = state.playerFighter.avatarStyle.ballColor || '#f59e0b';

      const grad = ctx.createRadialGradient(ballX, ballY, 2, ballX, ballY, 22);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, ballColor);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = ballColor;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
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

  const drawEnvironment = (ctx: CanvasRenderingContext2D, w: number, h: number, env: ArenaEnvironment, time: number) => {
    if (env === 'alley') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let y = 20; y < 150; y += 16) {
        ctx.fillRect(0, y, w, 1);
      }
      const lampGlow = ctx.createRadialGradient(40, 20, 5, 40, 20, 85);
      lampGlow.addColorStop(0, 'rgba(251, 191, 36, 0.3)');
      lampGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = lampGlow;
      ctx.fillRect(0, 0, 125, 125);

    } else if (env === 'cage') {
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(161, 161, 170, 0.14)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 40, 160);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 40, 160);
        ctx.stroke();
      }
      const redLight = ctx.createRadialGradient(w / 2, 20, 5, w / 2, 20, 120);
      redLight.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
      redLight.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = redLight;
      ctx.fillRect(0, 0, w, 160);

    } else if (env === 'neon_club') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#13112c');
      grad.addColorStop(1, '#2e1065');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(30, 40, 60, 120);
      ctx.fillRect(110, 20, 80, 140);
      ctx.fillRect(210, 50, 70, 110);
      ctx.fillRect(300, 30, 50, 130);

      const pulse = Math.sin(time * 0.004);
      ctx.strokeStyle = pulse > 0 ? '#d946ef' : '#06b6d4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 155);
      ctx.lineTo(w, 155);
      ctx.stroke();

    } else if (env === 'pro_ring') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#101014');
      grad.addColorStop(1, '#27272a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ['#ef4444', '#ffffff', '#3b82f6'].forEach((col, idx) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, 90 + idx * 22);
        ctx.lineTo(w, 90 + idx * 22);
        ctx.stroke();
      });

      if (Math.random() < 0.05) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(0, 0, w, h);
      }

    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#022119');
      grad.addColorStop(1, '#064e3b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      [60, 180, 300].forEach((lx) => {
        const spot = ctx.createRadialGradient(lx, 10, 2, lx, 10, 130);
        spot.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        spot.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = spot;
        ctx.fillRect(lx - 70, 0, 140, 160);
      });

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, 180, 50, Math.PI, 0);
      ctx.stroke();
    }
  };

  const drawFighter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: 1 | -1,
    avatar: GameStateData['playerFighter']['avatarStyle'],
    animState: string,
    attackType: string,
    equipped: GameStateData['playerFighter']['equipped'] | null
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);

    const isStriking = animState === 'attacking';

    // 1. Legs
    ctx.fillStyle = avatar.bodyColor;
    ctx.fillRect(-8, -12, 6, 14);
    if (isStriking && attackType === 'kick') {
      ctx.save();
      ctx.translate(4, -10);
      ctx.rotate(0.9);
      ctx.fillRect(0, 0, 6, 16);
      ctx.restore();
    } else {
      ctx.fillRect(2, -12, 6, 14);
    }

    // Shoes
    ctx.fillStyle = equipped?.boots ? '#f59e0b' : avatar.shoeColor;
    ctx.fillRect(-9, 0, 8, 4);
    if (!isStriking || attackType !== 'kick') {
      ctx.fillRect(1, 0, 8, 4);
    }

    // 2. Torso with Athletic Bevel
    ctx.fillStyle = avatar.bodyColor;
    ctx.beginPath();
    ctx.roundRect(-10, -32, 20, 22, 4);
    ctx.fill();

    // Belt
    if (equipped?.belt) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-10, -13, 20, 4);
    }

    // 3. Head & Skin
    ctx.fillStyle = avatar.skinTone;
    ctx.beginPath();
    ctx.arc(0, -42, 10, 0, Math.PI * 2);
    ctx.fill();

    // Mouthguard
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

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, -43, 3, 3);

    // 4. Arms & Gloves with Metallic Edge
    ctx.fillStyle = avatar.skinTone;
    if (isStriking && (attackType === 'punch' || attackType === 'special')) {
      ctx.fillRect(2, -28, 18, 5.5);
      ctx.fillStyle = equipped?.gloves ? '#ef4444' : avatar.gloveColor;
      ctx.beginPath();
      ctx.arc(22, -26, 7.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = avatar.skinTone;
      ctx.fillRect(-6, -26, 6, 10);
    } else {
      ctx.fillRect(-4, -28, 6, 12);
      ctx.fillRect(4, -30, 6, 12);

      ctx.fillStyle = equipped?.gloves ? '#ef4444' : avatar.gloveColor;
      ctx.beginPath();
      ctx.arc(0, -28, 5.5, 0, Math.PI * 2);
      ctx.arc(8, -30, 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const pStats = state.playerFighter.stats;
  const oppStats = currentStageData.opponent.stats;
  const playerHpPct = Math.max(0, Math.min(100, (playerHpDisplay / pStats.maxHp) * 100));
  const oppHpPct = Math.max(0, Math.min(100, (opponentHpDisplay / oppStats.maxHp) * 100));

  return (
    <div className="relative w-full bg-neutral-950 flex flex-col border-b border-zinc-800/80 select-none">
      {/* Top Combat HUD (AAA Segmented Bars) */}
      <div className="px-3 pt-2.5 pb-2 bg-gradient-to-b from-neutral-900 to-neutral-950 backdrop-blur border-b border-white/5 flex items-center justify-between text-xs">
        {/* Player Header Info */}
        <div className="flex-1 pr-2">
          <div className="flex items-center justify-between font-bold text-zinc-100 truncate">
            <span className="truncate">{state.playerFighter.name}</span>
            <span className="text-[10px] text-amber-400 font-mono ml-1 font-black">★ Lv.{state.playerLevel}</span>
          </div>
          <div className="relative w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden mt-1 border border-emerald-500/30 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 transition-all duration-100 ease-out"
              style={{ width: `${playerHpPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black font-mono text-white drop-shadow">
              {playerHpDisplay} / {pStats.maxHp}
            </span>
          </div>
          <div className="relative w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden mt-0.5 border border-amber-500/20">
            <div
              className={`h-full transition-all duration-150 ${
                playerRageDisplay >= 100 ? 'bg-gradient-to-r from-amber-400 to-yellow-300 animate-pulse' : 'bg-amber-600'
              }`}
              style={{ width: `${playerRageDisplay}%` }}
            />
          </div>
        </div>

        {/* Center Stage VS Badge */}
        <div className="flex flex-col items-center px-1.5">
          <span className="font-black text-[11px] bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent drop-shadow">
            {currentStageData.displayStage}
          </span>
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shadow-md ${
            currentStageData.isBoss ? 'game-btn-crimson text-white animate-pulse' : 'bg-neutral-800 text-zinc-300 border border-white/10'
          }`}>
            {currentStageData.isBoss ? t('boss', state.lang) : t('vs', state.lang)}
          </div>
        </div>

        {/* Opponent Header Info */}
        <div className="flex-1 pl-2 text-right">
          <div className="flex items-center justify-between font-bold text-zinc-100 truncate flex-row-reverse">
            <span className="truncate">{currentStageData.opponent.name}</span>
            <span className="text-[10px] text-rose-400 font-mono mr-1 font-black">★ Lv.{currentStageData.opponent.level}</span>
          </div>
          <div className="relative w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden mt-1 border border-rose-500/30 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all duration-100 ease-out float-right"
              style={{ width: `${oppHpPct}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black font-mono text-white drop-shadow">
              {opponentHpDisplay} / {oppStats.maxHp}
            </span>
          </div>
          <div className="text-[9px] text-zinc-400 truncate mt-0.5 italic">
            "{currentStageData.opponent.dialogue}"
          </div>
        </div>
      </div>

      {/* 2D Canvas Viewport */}
      <div className="relative w-full flex justify-center bg-black">
        <canvas
          ref={canvasRef}
          width={360}
          height={205}
          className="w-full max-w-[420px] h-[205px] block object-contain"
        />

        {/* Combo Streak Multiplier Badge */}
        {comboStreak > 1 && (
          <div className="absolute top-2 left-3 px-2 py-0.5 rounded-lg bg-black/60 border border-amber-500/40 text-[10px] font-black font-mono text-amber-400 animate-bounce shadow-md flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>x{comboStreak} COMBO!</span>
          </div>
        )}

        {/* Super Move Trigger Button */}
        {playerRageDisplay >= 100 && (
          <button
            onClick={handleManualRage}
            className="absolute bottom-3 left-3 px-3.5 py-1.5 game-btn-gold text-black font-black text-xs rounded-full shadow-xl animate-bounce active:scale-95 transition-transform flex items-center gap-1.5 shine-effect"
          >
            {t('superMove', state.lang)}
          </button>
        )}

        {/* Revive with Ad in Boss Fights */}
        {showReviveAd && (
          <button
            onClick={handleReviveWithAd}
            className="absolute bottom-3 right-3 px-3.5 py-2 game-btn-crimson text-white font-black text-xs rounded-2xl shadow-xl border border-rose-300 flex items-center gap-1.5 animate-pulse active:scale-95 transition-transform z-30"
          >
            <Tv className="w-4 h-4" />
            <span>{t('adRevive', state.lang)}</span>
          </button>
        )}

        {/* Match Result Overlay */}
        {matchStatus !== 'fighting' && !showReviveAd && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <span className={`text-2xl font-black italic tracking-wider drop-shadow-2xl ${
              matchStatus === 'victory' ? 'text-amber-400' : 'text-rose-500'
            }`}>
              {matchStatus === 'victory' ? (currentStageData.isBoss ? t('bossDefeated', state.lang) : t('victory', state.lang)) : t('knockout', state.lang)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
