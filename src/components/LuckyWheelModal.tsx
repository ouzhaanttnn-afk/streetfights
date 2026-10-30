import React, { useEffect, useRef, useState } from "react";
import { GameStateData, gameManager } from "../core/gameState";
import { ui } from "../i18n/ui";
import confetti from "canvas-confetti";
import { soundFx } from "../core/audio";
import { haptics } from "../core/haptics";
import { RotateCw, Tv, X } from "lucide-react";

interface LuckyWheelModalProps {
  state: GameStateData;
  onClose: () => void;
}

// Language-neutral prize faces: an emoji plus a short amount, readable at phone size.
const SEGMENTS = [
  { type: "coins", amount: 500, glyph: "🪙", short: "500", color: "#f59e0b" },
  { type: "gems", amount: 50, glyph: "💎", short: "50", color: "#0891b2" },
  { type: "coins", amount: 1500, glyph: "🪙", short: "1.5K", color: "#ca8a04" },
  { type: "buff", amount: 1, glyph: "⚔️", short: "2x", color: "#dc2626" },
  { type: "gems", amount: 100, glyph: "💎", short: "100", color: "#2563eb" },
  { type: "coins", amount: 3000, glyph: "🪙", short: "3K", color: "#ea580c" },
  { type: "gear", amount: 1, glyph: "👑", short: "LEG", color: "#9333ea" },
  { type: "gems", amount: 500, glyph: "💎", short: "500", color: "#db2777" },
] as const;

const SEG_ANGLE = 360 / SEGMENTS.length;
const SPIN_MS = 4200;

const prizeText = (i: number) => {
  const s = SEGMENTS[i];
  if (s.type === "buff") return "⚔️ 2x DMG · 10 min";
  if (s.type === "gear") return "👑 LEGENDARY GEAR";
  return `${s.glyph} +${s.amount.toLocaleString()}`;
};

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ state, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonIndex, setWonIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const freeSpin = gameManager.hasFreeWheelSpin();
  const bonus = state.bonusWheelSpins || 0;
  const canSpin = freeSpin || bonus > 0;

  const handleSpin = () => {
    if (isSpinning || !gameManager.consumeWheelSpin()) return;
    setIsSpinning(true);
    setWonIndex(null);
    soundFx.playWindup();
    haptics.trigger("light");

    const winningIndex = Math.floor(Math.random() * SEGMENTS.length);
    // Land the centre of the winning slice under the pointer at 12 o'clock (270° in SVG space).
    const centre = (winningIndex + 0.5) * SEG_ANGLE;
    const current = ((rotation % 360) + 360) % 360;
    const delta = (((270 - centre - current) % 360) + 360) % 360;
    setRotation(rotation + 5 * 360 + delta);

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const prize = SEGMENTS[winningIndex];
      gameManager.claimLuckyWheelPrize(prize.type, prize.amount);
      setIsSpinning(false);
      setWonIndex(winningIndex);
      haptics.trigger("success");
      soundFx.playVictoryFanfare();
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });
    }, SPIN_MS);
  };

  const watchAdForSpin = () => {
    gameManager.openRewardedAd({
      type: "wheel_spin",
      title: ui(state.lang, "wheel_ad_title"),
      rewardDesc: "+1 🎡",
    });
  };

  return (
    <div className="modal-shell fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm game-card border-2 border-cyan-400/50 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden">
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
          <h2 className="text-sm font-black tracking-wide text-white uppercase">🎡 {ui(state.lang, "wheel_title")}</h2>
          <button
            onClick={onClose}
            disabled={isSpinning}
            aria-label="Close"
            className="min-w-9 min-h-9 flex items-center justify-center rounded-full bg-neutral-800 text-zinc-400 disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative my-1 w-[264px] h-[264px] max-w-full">
          {/* Pointer */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[13px] border-l-transparent border-r-[13px] border-r-transparent border-t-[24px] border-t-amber-300 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]" />

          <div
            className="w-full h-full rounded-full border-[6px] border-amber-300/80 shadow-[0_0_30px_rgba(251,191,36,0.35)] overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.85, 0.2, 1)` : "none",
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SEGMENTS.map((seg, i) => {
                const start = (i * SEG_ANGLE * Math.PI) / 180;
                const end = ((i + 1) * SEG_ANGLE * Math.PI) / 180;
                const mid = (i + 0.5) * SEG_ANGLE;
                const x1 = 100 + 100 * Math.cos(start);
                const y1 = 100 + 100 * Math.sin(start);
                const x2 = 100 + 100 * Math.cos(end);
                const y2 = 100 + 100 * Math.sin(end);
                const highlight = wonIndex === i;
                return (
                  <g key={i}>
                    <path d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="#0b0b12" strokeWidth="1.5" />
                    {highlight && <path d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`} fill="#ffffff" opacity="0.28" />}
                    {/* Text runs along the radius, reading from the rim toward the hub */}
                    <g transform={`rotate(${mid} 100 100)`}>
                      <text x="168" y="100" fontSize="18" textAnchor="middle" dominantBaseline="central" transform="rotate(90 168 100)">
                        {seg.glyph}
                      </text>
                      <text
                        x="138"
                        y="100"
                        fontSize="13"
                        fontWeight="900"
                        fill="#ffffff"
                        stroke="#000000"
                        strokeWidth="0.6"
                        paintOrder="stroke"
                        textAnchor="middle"
                        dominantBaseline="central"
                        transform="rotate(90 138 100)"
                      >
                        {seg.short}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Hub */}
          <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-neutral-950 border-[3px] border-amber-300 flex items-center justify-center text-2xl shadow-xl z-10">
            🎡
          </div>
        </div>

        <div className="min-h-[52px] w-full flex items-center justify-center my-2">
          {wonIndex !== null && !isSpinning && (
            <div className="w-full py-2.5 bg-emerald-500/15 border border-emerald-400/60 rounded-2xl animate-fadeIn">
              <div className="text-[10px] font-black tracking-widest text-emerald-300 uppercase">{ui(state.lang, "wheel_won")}</div>
              <div className="text-base font-black text-white">{prizeText(wonIndex)}</div>
            </div>
          )}
        </div>

        {canSpin || isSpinning ? (
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full min-h-12 rounded-2xl game-btn-gold text-black font-black text-sm uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
          >
            <RotateCw className="w-4 h-4" />
            <span>
              {isSpinning
                ? ui(state.lang, "wheel_spinning")
                : freeSpin
                  ? ui(state.lang, "wheel_free")
                  : ui(state.lang, "wheel_bonus", { n: bonus })}
            </span>
          </button>
        ) : (
          <>
            <button
              onClick={watchAdForSpin}
              className="w-full min-h-12 rounded-2xl game-btn-emerald text-black font-black text-sm uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95"
            >
              <Tv className="w-4 h-4" />
              <span>{ui(state.lang, "wheel_ad")}</span>
            </button>
            <p className="mt-2 text-[11px] text-zinc-400">{ui(state.lang, "wheel_tomorrow")}</p>
          </>
        )}
      </div>
    </div>
  );
};
