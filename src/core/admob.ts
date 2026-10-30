// Google AdMob bridge: native rewarded ads on iOS/Android (Capacitor), web simulation elsewhere.
import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

export interface AdMobConfig {
  appId: string;
  rewardedAdUnitId: string;
  isTesting: boolean;
}

// Google's official test rewarded unit. Set VITE_ADMOB_REWARDED_ID at build time to serve real ads.
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/1712485313';
const liveRewardedId = import.meta.env.VITE_ADMOB_REWARDED_ID as string | undefined;

export const DEFAULT_ADMOB_CONFIG: AdMobConfig = {
  appId: 'ca-app-pub-4229088811556918~1842473318',
  rewardedAdUnitId: liveRewardedId || TEST_REWARDED_ID,
  isTesting: !liveRewardedId,
};

class AdMobManager {
  private config: AdMobConfig = { ...DEFAULT_ADMOB_CONFIG };
  private initialized = false;
  private rewardedReady = false;

  public readonly isNative = Capacitor.isNativePlatform();

  constructor() {
    void this.init();
  }

  private async init() {
    if (!this.isNative) return;
    try {
      await AdMob.initialize({ initializeForTesting: this.config.isTesting });
      this.initialized = true;
      await this.prepareRewarded();
    } catch (err) {
      console.warn('[AdMob] init failed', err);
    }
  }

  private async prepareRewarded() {
    if (!this.isNative || !this.initialized) return;
    try {
      await AdMob.prepareRewardVideoAd({
        adId: this.config.rewardedAdUnitId,
        isTesting: this.config.isTesting,
      });
      this.rewardedReady = true;
    } catch (err) {
      this.rewardedReady = false;
      console.warn('[AdMob] prepare rewarded failed', err);
    }
  }

  // Resolves true only when the player actually earned the reward.
  // Resolves 'unavailable' when no native ad could be shown (caller may fall back).
  public async showRewarded(): Promise<boolean | 'unavailable'> {
    if (!this.isNative) return 'unavailable';
    if (!this.rewardedReady) await this.prepareRewarded();
    if (!this.rewardedReady) return 'unavailable';
    try {
      this.rewardedReady = false;
      const item = await AdMob.showRewardVideoAd();
      void this.prepareRewarded();
      return Boolean(item);
    } catch (err) {
      console.warn('[AdMob] show rewarded failed', err);
      void this.prepareRewarded();
      return 'unavailable';
    }
  }
}

export const adMobManager = new AdMobManager();
