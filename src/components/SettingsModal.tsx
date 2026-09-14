import React, { useState } from 'react';
import { GameStateData, gameManager } from '../core/gameState';
import { Language, t } from '../i18n/translations';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Globe, 
  Zap, 
  Upload, 
  RotateCcw, 
  X, 
  Copy,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface SettingsModalProps {
  state: GameStateData;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ state, onClose }) => {
  const [importText, setImportText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleExportSave = () => {
    try {
      const data = JSON.stringify(state);
      navigator.clipboard.writeText(data);
      showToast(t('saveCopied', state.lang));
    } catch {
      showToast('Kopyalama başarısız!');
    }
  };

  const handleImportSave = () => {
    try {
      if (!importText.trim()) return;
      const parsed = JSON.parse(importText);
      if (parsed && typeof parsed.playerLevel === 'number') {
        localStorage.setItem('street_striker_rpg_save_v2', JSON.stringify(parsed));
        window.location.reload();
      } else {
        showToast(t('invalidSave', state.lang));
      }
    } catch {
      showToast(t('invalidSave', state.lang));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-sm game-card rounded-3xl p-5 shadow-2xl flex flex-col text-white max-h-[90vh] overflow-y-auto border border-zinc-700/60">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider text-white uppercase">
                {t('settingsTitle', state.lang)}
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">Street Striker Pro v2.4</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all border border-zinc-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-emerald-950/90 border border-emerald-500 text-emerald-300 font-bold text-xs text-center shadow-lg">
            {toastMessage}
          </div>
        )}

        <div className="space-y-3.5">
          {/* 1. Language Selector */}
          <div className="bg-black/40 rounded-2xl p-3 border border-white/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>{t('lang', state.lang)}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {languages.map((l) => {
                const isSelected = state.lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => gameManager.setLanguage(l.code)}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-black flex flex-col items-center justify-center transition-all border ${
                      isSelected
                        ? 'game-btn-gold text-black border-amber-300 scale-105 shadow-md'
                        : 'bg-zinc-850 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-xs">{l.flag}</span>
                    <span className="mt-0.5">{l.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Audio & Performance */}
          <div className="bg-black/40 rounded-2xl p-3 border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                {state.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                <span>{t('soundEffects', state.lang)}</span>
              </div>
              <button
                onClick={() => gameManager.toggleSound()}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                  state.soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-md" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>{t('highPerformance', state.lang)}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-700/40">
                60 FPS
              </span>
            </div>
          </div>

          {/* 3. Cloud / Local Save Management */}
          <div className="bg-black/40 rounded-2xl p-3 border border-white/5 space-y-2">
            <span className="text-xs font-bold text-zinc-300 block">
              Cloud / Local Save Backup
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportSave}
                className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-700 active:scale-95 transition-all shadow-sm"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Save</span>
              </button>

              <button
                onClick={handleImportSave}
                className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-zinc-700 active:scale-95 transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Save</span>
              </button>
            </div>
            <input
              type="text"
              placeholder="Paste JSON save here to import..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full bg-neutral-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* 4. Reset Career Danger Button */}
          <button
            onClick={() => {
              if (window.confirm(t('resetWarning', state.lang))) {
                gameManager.resetGame();
                onClose();
              }
            }}
            className="w-full py-2.5 rounded-2xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('resetCareer', state.lang)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
