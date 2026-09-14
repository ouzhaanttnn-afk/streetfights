// Google AdMob Integration Bridge for Web & Native Mobile (Capacitor / Cordova / React Native / TWA)

export interface AdMobConfig {
  appId: string;
  bannerAdUnitId?: string;
  interstitialAdUnitId?: string;
  rewardedAdUnitId?: string;
  isTesting: boolean;
}

// User's provided AdMob App ID
export const DEFAULT_ADMOB_CONFIG: AdMobConfig = {
  appId: 'ca-app-pub-4229088811556918~1842473318',
  // Official Google AdMob Test Rewarded Ad Unit ID for Android / iOS testing:
  rewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917',
  interstitialAdUnitId: 'ca-app-pub-3940256099942544/1033173712',
  bannerAdUnitId: 'ca-app-pub-3940256099942544/6300978111',
  isTesting: true,
};

class AdMobManager {
  private config: AdMobConfig = { ...DEFAULT_ADMOB_CONFIG };
  private isInitialized: boolean = false;
  private isRewardedLoaded: boolean = false;

  constructor() {
    this.init();
  }

  public init(customConfig?: Partial<AdMobConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }

    // Check if running inside Capacitor / Cordova AdMob Native Plugin
    const win = window as any;
    if (win?.Capacitor?.Plugins?.AdMob) {
      try {
        win.Capacitor.Plugins.AdMob.initialize({
          requestTrackingAuthorization: true,
          testingDevices: ['EMULATOR'],
          initializeForTesting: this.config.isTesting,
        });
        this.isInitialized = true;
        console.log('[AdMob] Native SDK Initialized with App ID:', this.config.appId);
        this.prepareRewardedNative();
      } catch (err) {
        console.warn('[AdMob] Native initialization failed, falling back to Web Simulation:', err);
      }
    } else {
      // Running in Web / Mobile Browser
      this.isInitialized = true;
      this.isRewardedLoaded = true;
      console.log('[AdMob] Web Bridge Ready with App ID:', this.config.appId);
    }
  }

  public async prepareRewardedNative() {
    const win = window as any;
    if (win?.Capacitor?.Plugins?.AdMob) {
      try {
        await win.Capacitor.Plugins.AdMob.prepareRewardVideoAd({
          adId: this.config.rewardedAdUnitId || 'ca-app-pub-3940256099942544/5224354917',
          isTesting: this.config.isTesting,
        });
        this.isRewardedLoaded = true;
      } catch (e) {
        console.warn('[AdMob] Prepare Rewarded error:', e);
      }
    }
  }

  public async showRewardedAd(
    onRewardEarned: (rewardAmount?: number) => void,
    onAdDismissed?: () => void,
    onFallbackRequired?: () => void
  ) {
    const win = window as any;
    
    // If native Capacitor AdMob plugin is available
    if (win?.Capacitor?.Plugins?.AdMob && this.isRewardedLoaded) {
      try {
        const rewardItem = await win.Capacitor.Plugins.AdMob.showRewardVideoAd();
        if (rewardItem) {
          onRewardEarned(rewardItem.amount || 1);
        }
        this.prepareRewardedNative();
        return;
      } catch (err) {
        console.warn('[AdMob] Show native rewarded error, triggering simulation:', err);
      }
    }

    // Web / Simulator Fallback
    if (onFallbackRequired) {
      onFallbackRequired();
    } else {
      // Direct reward grant if no modal passed
      onRewardEarned(1);
    }
  }

  public getConfig(): AdMobConfig {
    return this.config;
  }

  public updateAdUnitIds(rewardedId?: string, bannerId?: string, interstitialId?: string) {
    if (rewardedId) this.config.rewardedAdUnitId = rewardedId;
    if (bannerId) this.config.bannerAdUnitId = bannerId;
    if (interstitialId) this.config.interstitialAdUnitId = interstitialId;
    console.log('[AdMob] Updated Ad Units:', this.config);
  }
}

export const adMobManager = new AdMobManager();
