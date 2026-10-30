# 3-week plan: App Review + Featuring nomination (Fri 2026-10-30 → Sun 2026-11-22)

Apple's own form is the source of truth for nomination lead times and required assets; check the lead-time text shown in
App Store Connect > Featuring Nominations when you open it. This plan only schedules the work.

## Week 0 – Fri Oct 30 → Sun Nov 1: lock the build
- [x] Build 7 on TestFlight (real Xcode 26.6, no SDK patching).
- [ ] Build 8 (device-language default; review fix) on TestFlight.
- [ ] You: play build 8 on a real iPhone for 15 minutes: tutorial, first fight, boss, loot/equip, shop ad, quit/reopen, update-from-6 save.
- [ ] Submit version 1.0 for App Review with MANUAL release (so you choose the launch day).

## Week 1 – Mon Nov 2 → Sun Nov 8: review + assets
- Apple review usually answers within ~1-2 days; if rejected, fix and resubmit the same day (keep a reply template ready).
- Capture real-device screenshots (and a 15-30 s gameplay clip): boss intro, super move, loot reveal, arenas.
- Draft the nomination text (use docs/APP_STORE_SUBMISSION.md section 6): what is new, what is special, why now.
- Decide launch day (suggest a Tuesday-Thursday); keep release MANUAL until then.

## Week 2 – Mon Nov 9 → Sun Nov 15: launch + nomination
- Release 1.0 on the chosen day. Watch crashes (Xcode Organizer / App Store Connect > Analytics) and reviews hourly on day 1.
- Submit the Featuring nomination in App Store Connect once the app is live (or approved), with the clip and key art.
- Optional: add an In-App Event (e.g. "Weekend Boss Rush") — needs new game content; only if time allows.

## Week 3 – Mon Nov 16 → Sun Nov 22: first update
- Ship 1.0.1 from player feedback: balance tweaks (see docs/BALANCE.md), bug fixes, any localisation corrections.
- Reply to every review in the first weeks; prompt for ratings only after a boss win (not on first launch).
- Review retention: day-1/day-7 return, tutorial completion; adjust the daily reward and quests accordingly.
- If the nomination was not picked up, re-nominate with the 1.0.1 notes and fresh numbers.

## Risks to watch
- Rejection for ATT/ads or metadata mismatch → answer with the review notes already filled in.
- Rewarded ad shows "not ready" on brand-new ad units for a few hours: expected, no free reward is granted.
- 12+ age rating (prize wheel counted as simulated gambling) is a deliberate conservative choice.
