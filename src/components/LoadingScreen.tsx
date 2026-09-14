import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, Flame, Shield, Trophy } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LOADING_TIPS = [
  'İpucu: Gym salonunda Agility Ladder çalışarak Kaçınma ve Kontra şansını artır!',
  'İpucu: Roguelite yeteneklerini sinerji oluşturacak şekilde seç (Örn: Kritik + Flurry Master)!',
  'İpucu: Boss bölümlerinde nakavt olursan Reklamla Canlanarak anında Süper Vole patlat!',
  'İpucu: Düşük kademe eşyaları otomatik satarak hızlıca altın biriktirebilirsin.',
  'İpucu: Mağazadan edindiğin auralar dövüş sahnesinde karakterini efsanevi gösterir!',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState<string>('Dövüş Motoru Başlatılıyor...');
  const [tipIndex, setTipIndex] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    // Cycle tips
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 1800);

    // Progress simulation
    const startTime = Date.now();
    const duration = 2200; // 2.2 seconds loading

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 30) {
        setStatusText('Arenalar ve Rakipler Yükleniyor...');
      } else if (pct < 65) {
        setStatusText('Google AdMob & Sunucu Bağlantısı Sağlanıyor...');
      } else if (pct < 90) {
        setStatusText('Karakter Teçhizatı Hazırlanıyor...');
      } else {
        setStatusText('Dövüşe Hazır!');
      }

      if (pct >= 100) {
        clearInterval(progressInterval);
        clearInterval(tipInterval);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 400);
        }, 300);
      }
    }, 40);

    return () => {
      clearInterval(progressInterval);
      clearInterval(tipInterval);
    };
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-between p-6 select-none transition-opacity duration-400 ${
      isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-amber-500/15 to-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Tag */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/90 border border-white/10 text-xs font-black tracking-widest text-amber-400 uppercase z-10 shadow-lg mt-4">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        <span>AAA HYBRID BRAWLER</span>
      </div>

      {/* Center Logo & Fighter Silhouette */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        {/* Animated Emblem */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 p-0.5 shadow-2xl shadow-amber-500/30 mb-4 animate-pulse">
          <div className="w-full h-full bg-neutral-950 rounded-[22px] flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
            <span className="drop-shadow-lg">🥊</span>
            <div className="absolute bottom-1 right-1 text-base">⚽</div>
          </div>
        </div>

        {/* Game Title */}
        <h1 className="text-3xl font-black tracking-tight text-white uppercase italic drop-shadow-2xl">
          STREET <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">STRIKER</span>
        </h1>
        <div className="text-xs font-black tracking-[0.25em] text-zinc-400 uppercase mt-1">
          ZERO TO LEGEND
        </div>
      </div>

      {/* Bottom Loading Bar & Tips */}
      <div className="w-full max-w-xs flex flex-col items-center z-10 mb-4">
        {/* Status Text & Percentage */}
        <div className="w-full flex justify-between items-center text-xs font-bold text-zinc-400 mb-2 px-1">
          <span className="truncate max-w-[200px] text-[11px]">{statusText}</span>
          <span className="font-mono text-amber-400 font-black">{progress}%</span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2.5 bg-neutral-900 rounded-full p-0.5 border border-white/10 shadow-inner overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-300 rounded-full transition-all duration-75 ease-out shadow-lg shadow-amber-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Tip Box */}
        <div className="mt-4 p-3 rounded-2xl bg-neutral-900/80 border border-white/5 text-center min-h-[50px] flex items-center justify-center shadow-md w-full">
          <p className="text-[11px] text-zinc-300 font-medium italic transition-all duration-300">
            "{LOADING_TIPS[tipIndex]}"
          </p>
        </div>
      </div>
    </div>
  );
};
