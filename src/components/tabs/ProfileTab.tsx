import React, { useState } from "react";
import { GameStateData, gameManager } from "../../core/gameState";
import { PREMIUM_AVATARS, FIGHTER_TITLES } from "../../core/avatarsData";
import { t } from "../../i18n/translations";
import { 
  User, 
  Edit3, 
  Check, 
  X, 
  Trophy, 
  Crown, 
  Sparkles, 
  Flame, 
  Swords, 
  Coins, 
  Gem, 
  Zap, 
  ShieldCheck, 
  Terminal 
} from "lucide-react";

interface ProfileTabProps {
  state: GameStateData;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ state }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(state.playerFighter.name);
  const [devTapCount, setDevTapCount] = useState(0);
  const [showDevTools, setShowDevTools] = useState(false);

  const currentAvatar = PREMIUM_AVATARS.find(
    (a) => a.id === (state.playerFighter.avatarId || "avatar_cyber_striker")
  ) || PREMIUM_AVATARS[0];

  const currentTitle = FIGHTER_TITLES.find(
    (t) => t.id === state.playerFighter.titleId
  ) || FIGHTER_TITLES[0];

  const handleSaveName = () => {
    if (nameInput.trim().length > 0) {
      gameManager.updateFighterName(nameInput);
      setIsEditingName(false);
    }
  };

  const handleSelectAvatar = (avatarId: string) => {
    gameManager.setFighterAvatar(avatarId);
  };

  const handleSelectTitle = (title: typeof FIGHTER_TITLES[0]) => {
    if (state.playerLevel >= title.unlockLevel) {
      const titleName = state.lang === "tr" ? title.nameTr : title.nameEn;
      gameManager.setFighterTitle(title.id, titleName);
    }
  };

  const handleVersionTap = () => {
    const newCount = devTapCount + 1;
    setDevTapCount(newCount);
    if (newCount >= 7) {
      setShowDevTools(!showDevTools);
      setDevTapCount(0);
    }
  };

  const pStats = state.playerFighter.stats;

  return (
    <div className="w-full flex flex-col p-3 bg-[#06070a] space-y-4 pb-16 select-none">
      {/* 1. Main Fighter Passport / Profile Card */}
      <div className="relative rounded-3xl game-card-gold p-5 border-2 border-amber-400/40 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-4">
          {/* Active Avatar Portrait with Glowing Frame */}
          <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${currentAvatar.gradient} border-2 ${currentAvatar.borderColor} shadow-xl ${currentAvatar.glowColor} flex items-center justify-center text-4xl shrink-0`}>
            <span>{currentAvatar.avatarChar}</span>
            <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-black/80 border border-amber-400/50 shadow">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>

          {/* Name, Title & Level Info */}
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 mb-1.5">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={24}
                  className="w-full bg-black/80 border border-amber-400 text-white font-black text-base px-2.5 py-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold shadow"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setNameInput(state.playerFighter.name);
                    setIsEditingName(false);
                  }}
                  className="p-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl shadow"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-lg font-black text-white truncate tracking-tight">
                  {state.playerFighter.name}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-zinc-400 hover:text-amber-400 active:scale-95 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Fighter Title Badge */}
            <div className="flex items-center gap-1 text-[11px] font-black text-amber-300 mb-2">
              <span>{currentTitle.badge}</span>
              <span className="truncate">{state.playerFighter.title || (state.lang === "tr" ? currentTitle.nameTr : currentTitle.nameEn)}</span>
            </div>

            {/* Level & Power Rating */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-black/60 px-2 py-0.5 rounded-lg border border-white/10 text-zinc-300">
                ? Lv.{state.playerLevel}
              </span>
              <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                ? {pStats.powerScore} POW
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Premium Avatars Selection Grid */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-zinc-100 tracking-wider uppercase">
              {t("changeAvatar", state.lang)}
            </h3>
          </div>
          <span className="text-[10px] text-zinc-400 font-bold bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
            {PREMIUM_AVATARS.length} AVATARS
          </span>
        </div>

        <p className="text-[10px] text-zinc-400 mb-3 px-1">
          {t("avatarSelectDesc", state.lang)}
        </p>

        <div className="grid grid-cols-4 gap-2.5">
          {PREMIUM_AVATARS.map((avatar) => {
            const isSelected = (state.playerFighter.avatarId || "avatar_cyber_striker") === avatar.id;

            return (
              <button
                key={avatar.id}
                onClick={() => handleSelectAvatar(avatar.id)}
                className={`relative aspect-square rounded-2xl bg-gradient-to-br ${avatar.gradient} border-2 flex flex-col items-center justify-center transition-all active:scale-95 shadow-md ${
                  isSelected
                    ? "border-amber-400 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/30 scale-105"
                    : "border-white/15 hover:border-white/40 opacity-85"
                }`}
              >
                <span className="text-2xl drop-shadow">{avatar.avatarChar}</span>
                <span className="text-[8px] font-black text-white uppercase truncate max-w-[58px] mt-1 drop-shadow-md">
                  {avatar.name.split(" ")[0]}
                </span>
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-amber-400 text-black shadow">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Fighter Titles Selection */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-black text-zinc-100 tracking-wider uppercase">
            {t("selectTitle", state.lang)}
          </h3>
        </div>

        <div className="space-y-2">
          {FIGHTER_TITLES.map((title) => {
            const isUnlocked = state.playerLevel >= title.unlockLevel;
            const isSelected = state.playerFighter.titleId === title.id;
            const titleName = state.lang === "tr" ? title.nameTr : title.nameEn;

            return (
              <button
                key={title.id}
                onClick={() => handleSelectTitle(title)}
                disabled={!isUnlocked}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-400/60 shadow-lg shadow-amber-500/10"
                    : isUnlocked
                    ? "bg-black/50 border-white/10 hover:border-white/20 active:scale-[0.98]"
                    : "bg-black/30 border-white/5 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{title.badge}</span>
                  <div>
                    <div className={`text-xs font-black ${isUnlocked ? title.color : "text-zinc-500"}`}>
                      {titleName}
                    </div>
                    <div className="text-[9px] text-zinc-400 font-mono">
                      {isUnlocked ? "UNLOCKED" : `REQ LVL ${title.unlockLevel}`}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="px-2 py-0.5 rounded-lg bg-amber-400 text-black text-[9px] font-black uppercase">
                    ACTIVE
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Career Lifetime Statistics */}
      <div className="game-card rounded-3xl p-4 shadow-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-3 px-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-black text-zinc-100 tracking-wider uppercase">
            {t("careerStats", state.lang)}
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-black/60 rounded-2xl p-3 border border-white/5 flex flex-col">
            <span className="text-zinc-400 text-[10px] font-medium flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-rose-400" />
              {t("fightsWon", state.lang)}
            </span>
            <span className="font-mono font-black text-sm text-white mt-1">
              {state.totalFightsWon.toLocaleString()}
            </span>
          </div>

          <div className="bg-black/60 rounded-2xl p-3 border border-white/5 flex flex-col">
            <span className="text-zinc-400 text-[10px] font-medium flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              {t("bossesDefeated", state.lang)}
            </span>
            <span className="font-mono font-black text-sm text-amber-300 mt-1">
              {state.bossDefeatedCount.toLocaleString()}
            </span>
          </div>

          <div className="bg-black/60 rounded-2xl p-3 border border-white/5 flex flex-col">
            <span className="text-zinc-400 text-[10px] font-medium flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-cyan-400" />
              {t("highestStage", state.lang)}
            </span>
            <span className="font-mono font-black text-sm text-cyan-300 mt-1">
              W{state.highestWorld} - S{state.highestSubStage}
            </span>
          </div>

          <div className="bg-black/60 rounded-2xl p-3 border border-white/5 flex flex-col">
            <span className="text-zinc-400 text-[10px] font-medium flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              {t("totalGold", state.lang)}
            </span>
            <span className="font-mono font-black text-sm text-yellow-300 mt-1">
              {state.coins.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Secret Developer Debug Trigger for Testing */}
      <div className="text-center pt-2">
        <button
          onClick={handleVersionTap}
          className="text-[10px] text-zinc-500 font-mono tracking-wider hover:text-zinc-400 transition-colors"
        >
          Street Striker v1.0.0 (Apple Ready)
        </button>

        {showDevTools && (
          <div className="mt-4 p-4 rounded-3xl bg-neutral-900 border border-amber-500/40 text-left space-y-3 shadow-2xl">
            <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                SECRET TEST PANEL (HIDDEN)
              </span>
              <button onClick={() => setShowDevTools(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => gameManager.cheatAddCoins(10000)}
                className="py-2 px-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold"
              >
                +10,000 Coins
              </button>
              <button
                onClick={() => gameManager.cheatAddGems(500)}
                className="py-2 px-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold"
              >
                +500 Gems
              </button>
              <button
                onClick={() => gameManager.cheatDropRandomGear("legendary")}
                className="py-2 px-2.5 rounded-xl bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-bold"
              >
                Drop Legendary
              </button>
              <button
                onClick={() => gameManager.cheatUnlockAllStages()}
                className="py-2 px-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold"
              >
                Unlock All Stages
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

