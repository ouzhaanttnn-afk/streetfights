// Google AdMob bridge: native rewarded ads on iOS/Android (Capacitor), web simulation elsewhere.
// The next ad is always loaded in the background, so tapping a reward button shows it instantly.
import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus, MaxAdContentRating, RewardAdPluginEvents } from '@capacitor-community/admob';

export interface AdMobConfig {
  appId: string;
  rewardedAdUnitId: string;
  isTesting: boolean;
}

// Google's official iOS test rewarded unit, used in dev builds so live units are never tested on.
const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/1712485313';
// Production rewarded unit; VITE_ADMOB_REWARDED_ID overrides it at build time.
const LIVE_REWARDED_ID = (import.meta.env.VITE_ADMOB_REWARDED_ID as string | undefined) || 'ca-app-pub-4229088811556918/6548005088';
const useLiveAds = !import.meta.env.DEV;

export const DEFAULT_ADMOB_CONFIG: AdMobConfig = {
  appId: 'ca-app-pub-4229088811556918~1842473318',
  rewardedAdUnitId: useLiveAds ? LIVE_REWARDED_ID : TEST_REWARDED_ID,
  isTesting: !useLiveAds,
};

export type AdStatus = 'idle' | 'loading' | 'ready' | 'failed';
export type AdResult = 'rewarded' | 'dismissed' | 'unavailable';

const RETRY_DELAYS_MS = [2000, 5000, 15000, 30000, 60000];

class AdMobManager {
  private config: AdMobConfig = { ...DEFAULT_ADMOB_CONFIG };
  private initialized = false;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<(status: AdStatus) => void>();
  private _status: AdStatus = 'idle';
  private showing = false;
  private earned = false;
  private onDismiss: (() => void) | null = null;
  // EEA/UK/CH players must be able to change their ad consent later (Settings > Privacy choices)
  public privacyOptionsRequired = false;

  public readonly isNative = Capacitor.isNativePlatform();

  constructor() {
    void this.init();
  }

  public get status(): AdStatus {
    return this._status;
  }

  public subscribe(fn: (status: AdStatus) => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private setStatus(next: AdStatus) {
    this._status = next;
    this.listeners.forEach((fn) => fn(next));
  }

  private async init() {
    if (!this.isNative) {
      this.setStatus('ready'); // web: the in-app simulation is always available
      return;
    }
    try {
      // 1. Google consent (UMP): the form only appears where the law requires it (EEA, UK, Switzerland)
      try {
        const info = await AdMob.requestConsentInfo();
        let latest = info;
        if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
          latest = await AdMob.showConsentForm();
        }
        this.privacyOptionsRequired = String(latest.privacyOptionsRequirementStatus) === 'REQUIRED';
      } catch {
        // no consent message configured or offline: ads still load (non-personalised where required)
      }
      // 2. Apple tracking prompt
      try {
        await AdMob.requestTrackingAuthorization();
      } catch {
        // ATT unavailable or already answered
      }
      // 3. Ads SDK
      await AdMob.initialize({ initializeForTesting: this.config.isTesting, maxAdContentRating: MaxAdContentRating.ParentalGuidance });
      this.initialized = true;
      await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        this.retryCount = 0;
        this.setStatus('ready');
      });
      await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => this.scheduleRetry());
      await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        this.earned = true;
      });
      await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => this.finishShow(false, true));
      await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => this.finishShow(this.earned));
      this.preload();
    } catch (err) {
      console.warn('[AdMob] init failed', err);
      this.setStatus('failed');
    }
  }

  public async showPrivacyOptions() {
    if (!this.isNative) return;
    try {
      await AdMob.showPrivacyOptionsForm();
    } catch {
      // form not available
    }
  }

  // Start loading the next rewarded ad in the background (no-op if one is loading/ready).
  public preload() {
    if (!this.isNative || !this.initialized || this.showing) return;
    if (this._status === 'loading' || this._status === 'ready') return;
    // A manual preload replaces a pending retry (the old timer must not reset a freshly loaded ad later)
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.setStatus('loading');
    AdMob.prepareRewardVideoAd({ adId: this.config.rewardedAdUnitId, isTesting: this.config.isTesting })
      .catch(() => this.scheduleRetry());
  }

  private scheduleRetry() {
    // FailedToLoad and the rejected prepare call both report the same failure: count it once
    if (this.retryTimer || this._status === 'failed') return;
    this.setStatus('failed');
    const delay = RETRY_DELAYS_MS[Math.min(this.retryCount, RETRY_DELAYS_MS.length - 1)];
    this.retryCount += 1;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this._status !== 'failed') return;
      this.setStatus('idle');
      this.preload();
    }, delay);
  }

  // Resolves true as soon as an ad is ready, false if it is not ready within the timeout.
  public whenReady(timeoutMs: number): Promise<boolean> {
    if (!this.isNative || this._status === 'ready') return Promise.resolve(true);
    this.preload();
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        off();
        resolve(false);
      }, timeoutMs);
      const off = this.subscribe((s) => {
        if (s === 'ready') {
          clearTimeout(timer);
          off();
          resolve(true);
        }
      });
    });
  }

  private finishShow(rewarded: boolean, failedToShow = false) {
    const cb = this.onDismiss;
    this.onDismiss = null;
    this.showing = false;
    this.earned = false;
    this.setStatus('idle');
    this.preload(); // next ad starts loading immediately
    cb?.();
    this.lastResult = rewarded ? 'rewarded' : failedToShow ? 'unavailable' : 'dismissed';
    this.resolveShow?.(this.lastResult);
  }

  private lastResult: AdResult = 'dismissed';
  private resolveShow: ((r: AdResult) => void) | null = null;

  // Shows the preloaded ad. Rewards must only be granted when this resolves 'rewarded'.
  public showRewarded(): Promise<AdResult> {
    if (!this.isNative || this._status !== 'ready' || this.showing) return Promise.resolve('unavailable');
    this.showing = true;
    this.earned = false;
    return new Promise<AdResult>((resolve) => {
      this.resolveShow = resolve;
      AdMob.showRewardVideoAd().catch((err) => {
        console.warn('[AdMob] show failed', err);
        this.showing = false;
        this.setStatus('idle');
        this.preload();
        resolve('unavailable');
      });
    });
  }
}

export const adMobManager = new AdMobManager();
