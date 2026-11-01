// Local (on-device) reminders: no server, no data leaves the phone.
// Scheduled when the app goes to the background, cancelled as soon as the player is back.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Language } from '../i18n/translations';
import { ui } from '../i18n/ui';

const ID_OFFLINE = 1001;
const ID_DAILY = 1002;
export const OFFLINE_CAP_MINUTES = 480; // keep in sync with checkOfflineEarnings

const native = () => Capacitor.isNativePlatform();

// Never ping at night: anything that would land between 22:00 and 09:00 moves to 09:00
export function politeTime(at: Date): Date {
  const d = new Date(at);
  const h = d.getHours();
  if (h >= 22) {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
  } else if (h < 9) {
    d.setHours(9, 0, 0, 0);
  }
  return d;
}

export async function notificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!native()) return 'denied';
  try {
    const p = await LocalNotifications.checkPermissions();
    return p.display === 'granted' ? 'granted' : p.display === 'denied' ? 'denied' : 'prompt';
  } catch {
    return 'denied';
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!native()) return false;
  try {
    const p = await LocalNotifications.requestPermissions();
    return p.display === 'granted';
  } catch {
    return false;
  }
}

export async function cancelReminders() {
  if (!native()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: ID_OFFLINE }, { id: ID_DAILY }] });
  } catch {
    // nothing scheduled
  }
}

export async function scheduleReminders(lang: Language) {
  if (!native()) return;
  if ((await notificationPermission()) !== 'granted') return;
  await cancelReminders();
  const now = Date.now();
  const vaultFull = politeTime(new Date(now + OFFLINE_CAP_MINUTES * 60000));
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);
  try {
    await LocalNotifications.schedule({
      notifications: [
        { id: ID_OFFLINE, title: ui(lang, 'notif_offline_title'), body: ui(lang, 'notif_offline_body'), schedule: { at: vaultFull } },
        { id: ID_DAILY, title: ui(lang, 'notif_daily_title'), body: ui(lang, 'notif_daily_body'), schedule: { at: tomorrow } },
      ],
    });
  } catch {
    // scheduling is best effort
  }
}
