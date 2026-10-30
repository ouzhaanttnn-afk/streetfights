import React from 'react';
import { GameStateData, gameManager } from '../core/gameState';

const STEPS: { tr: string; en: string }[] = [
  { tr: 'Dövüşçün otomatik savaşıyor. İstersen sağ üstteki AUTO düğmesiyle MANUEL moda geçip VUR ve KORUN ile kontrol et.', en: 'Your fighter battles automatically. Tap AUTO (top right) to switch to MANUAL and use HIT and GUARD yourself.' },
  { tr: 'Öfke barı dolunca altın SÜPER düğmesi çıkar: en güçlü vuruşun bu!', en: 'When the rage bar is full, the golden SUPER button appears: your strongest strike!' },
  { tr: 'Zaferlerde ekipman düşer. Daha iyisini KUŞAN, fazlasını SAT. Altınını SALON sekmesinde kalıcı güce çevir.', en: 'Wins drop gear. EQUIP better pieces and SELL the rest. Spend coins in the GYM tab for permanent power.' },
  { tr: 'ARENA sekmesinde günlük görevler ve bölüm seçimi var. Bossta zorlanırsan önceki bölümde güçlen!', en: 'The ARENA tab has daily quests and stage select. Stuck on a boss? Power up on earlier stages first!' },
];

export const TutorialHint: React.FC<{ state: GameStateData; blocked: boolean }> = ({ state, blocked }) => {
  const step = state.tutorialStep;
  if (step >= STEPS.length || blocked) return null;
  const isTr = state.lang === 'tr';
  return (
    <div className="absolute left-3 right-3 bottom-[88px] z-30 game-card rounded-2xl border border-amber-400/60 p-3 shadow-2xl animate-fadeIn">
      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 shrink-0 rounded-full game-btn-gold text-black text-[11px] font-black flex items-center justify-center">{step + 1}</div>
        <p className="text-[11px] leading-snug font-bold text-zinc-100">{isTr ? STEPS[step].tr : STEPS[step].en}</p>
      </div>
      <div className="flex justify-between items-center mt-2.5">
        <button onClick={() => gameManager.skipTutorial()} className="min-h-9 px-2 text-[10px] font-black text-zinc-500">
          {isTr ? 'Atla' : 'Skip'}
        </button>
        <button onClick={() => gameManager.advanceTutorial()} className="min-h-9 px-5 rounded-xl game-btn-gold text-black text-[11px] font-black active:scale-95">
          {step === STEPS.length - 1 ? (isTr ? 'Başla!' : 'Let\'s go!') : (isTr ? 'Tamam' : 'Next')}
        </button>
      </div>
    </div>
  );
};
