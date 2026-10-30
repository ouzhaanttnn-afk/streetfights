import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticKind = 'light' | 'medium' | 'heavy' | 'super' | 'success';

class HapticsManager {
  public enabled = true;

  // Native taptic engine on iOS (navigator.vibrate is not supported in WKWebView);
  // the Capacitor web fallback uses navigator.vibrate on Android browsers.
  public trigger(kind: HapticKind) {
    if (!this.enabled) return;
    try {
      let job: Promise<void>;
      if (kind === 'light') job = Haptics.impact({ style: ImpactStyle.Light });
      else if (kind === 'medium') job = Haptics.impact({ style: ImpactStyle.Medium });
      else if (kind === 'heavy') job = Haptics.impact({ style: ImpactStyle.Heavy });
      else if (kind === 'success') job = Haptics.notification({ type: NotificationType.Success });
      else job = Haptics.vibrate({ duration: 120 });
      job.catch(() => {});
    } catch {
      // Haptics unavailable
    }
  }
}

export const haptics = new HapticsManager();
