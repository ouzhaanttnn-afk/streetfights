import React, { useState } from "react";
import { GameStateData, gameManager } from "../core/gameState";
import { t } from "../i18n/translations";
import confetti from "canvas-confetti";
import { soundFx } from "../core/audio";
import { 
  Sparkles, 
  Coins, 
  Gem, 
  Flame, 
  Crown, 
  Tv, 
  X, 
  RotateCw 
} from "lucide-react";

interface LuckyWheelModalProps {
  state: GameStateData;
  onClose: () => void;
}

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ state, onClose }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<string | null>(null);

  const segments = [
    { label: "500 Coins", type: "coins", amount: 500, color: "#f59e0b", icon: Coins },
    { label: "50 Gems", type: "gems", amount: 50, color: "#06b6d4", icon: Gem },
    { label: "1,500 Coins", type: "coins", amount: 1500, color: "#eab308", icon: Coins },
    { label: "2x Damage (10m)", type: "buff", amount: 1, color: "#ef4444", icon: Flame },
    { label: "100 Gems", type: "gems", amount: 100, color: "#3b82f6", icon: Gem },
    { label: "3,000 Coins", type: "coins", amount: 3000, color: "#f97316", icon: Coins },
    { label: "Legendary Drop", type: "gear", amount: 1, color: "#a855f7", icon: Crown },
    { label: "JACKPOT 500 GEMS", type: "gems", amount: 500, color: "#ec4899", icon: Sparkles }
  ];

  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonPrize(null);
    soundFx.playCoin();

    const winningIndex = Math.floor(Math.random() * segments.length);
    const segmentAngle = 360 / segments.length;
    const extraRotations = 5 * 360; // 5 full loops
    const targetAngle = extraRotations + (360 - winningIndex * segmentAngle - segmentAngle / 2);

    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = segments[winningIndex];
      setWonPrize(prize.label);
      gameManager.claimLuckyWheelPrize(prize.type, prize.amount);
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
      soundFx.playVictoryFanfare();
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm game-card border-2 border-cyan-400/50 rounded-3xl p-5 shadow-2xl flex flex-col items-center text-center text-white overflow-hidden">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black tracking-wide text-white uppercase">
              LUCKY FORTUNE WHEEL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-neutral-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wheel Canvas / SVG */}
        <div className="relative my-2 w-[240px] h-[240px] flex items-center justify-center">
          {/* Wheel Pointer Arrow */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 drop-shadow-lg" />

          {/* Rotating Wheel Disc */}
          <div
            className="w-full h-full rounded-full border-4 border-white/20 shadow-2xl overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.15, 0.9, 0.25, 1.0)"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {segments.map((seg, i) => {
                const angle = 360 / segments.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;
                const x1 = 100 + 100 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 100 + 100 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 100 + 100 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 100 + 100 * Math.sin((Math.PI * endAngle) / 180);

                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                      fill={seg.color}
                      opacity={0.85}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    <text
                      x="100"
                      y="32"
                      fill="#ffffff"
                      fontSize="7.5"
                      fontWeight="900"
                      textAnchor="middle"
                      transform={`rotate(${startAngle + angle / 2} 100 100)`}
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Hub Button */}
          <div className="absolute w-12 h-12 rounded-full bg-neutral-950 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-black text-xs shadow-xl z-10">
            ?
          </div>
        </div>

        {/* Won Prize Banner */}
        {wonPrize && (
          <div className="w-full py-2 bg-emerald-500/20 border border-emerald-400/50 rounded-2xl mb-3 text-xs font-black text-emerald-300 animate-bounce">
            ?? YOU WON: {wonPrize}!
          </div>
        )}

        {/* Spin Buttons */}
        <div className="w-full mt-2">
          <button
            onClick={handleSpin}
            disabled={isSpinning}
            className="w-full py-3 rounded-2xl game-btn-gold text-black font-black text-sm uppercase shadow-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isSpinning ? "animate-spin" : ""}`} />
            <span>{isSpinning ? "SPINNING..." : "FREE SPIN!"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

