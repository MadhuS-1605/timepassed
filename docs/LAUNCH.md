# TimePassed — Launch & "Report It Everywhere" Playbook

Ready-to-post copy + channel strategy for announcing the new features
(**Goals**, **Compete**, **Memory Marker**) and growing footfall. Grounded in
2025–26 indie-launch research — see Sources at the bottom.

> **What's new this release**: Goal Tracker (set a target, log progress, watch a
> ring fill), Compete (invite friends to a challenge — focus/habits/pulse/manual —
> with a shareable leaderboard, no account needed), and Memory Marker (snap or
> upload a photo and stamp it with exactly how far through the year you were).
> Plus: every shared image now carries a scannable QR back to the app.

---

## Channel strategy (do these in order)

Research is blunt about where indies actually convert:

1. **Niche subreddits first** (highest-intent, real engagement). Big general subs
   punish self-promo; small subs that match your user are where it's real. Follow
   the **90/10 rule** (90% value, 10% subtle mention) and read each sub's rules —
   mods ban fast.
2. **Indie Hackers** — converts ~23% per engaged post vs Product Hunt ~3% per
   launch, but it's a *relationship* play (weeks of showing up), not a one-shot.
3. **Show HN** — viable because TimePassed is **open-source**. Expect blunt
   feedback. Account must be ≥7 days old; if auto-killed, email hn@ycombinator.com
   politely with the post id.
4. **Product Hunt** — still good for backlinks/credibility. Create the account
   ≥7 days before, line up a hunter, launch 12:01am PT Tue–Thu.
5. **X/Twitter + short video** (TikTok/Reels/Shorts) — the Memory Marker and Wrap
   cards are screenshot/clip-native; lead with the visual.

**Pre-launch checklist** (all already in place or quick): landing page with an
"X for people who Y" headline ✓ (og-image + meta shipped), 3–5 screenshots,
FAQ, mobile layout verified, accounts aged ≥7 days.

---

## Reddit posts (tailor per sub; never copy-paste identically)

**Target subs:** r/productivity, r/getdisciplined, r/selfimprovement,
r/SideProject, r/InternetIsBeautiful (web app), r/androidapps, r/iosapps,
r/webdev / r/reactjs (technical angle), r/dataisbeautiful (the visuals),
r/PERSoNALFINANCE-style goal subs, r/decidingtobebetter, r/Journaling (Memory Marker).

### r/SideProject / r/InternetIsBeautiful

> **Title:** I built a calm, private dashboard that shows your year ticking by to the second — now with goals, friend challenges, and photo "time-stamps"
>
> TimePassed visualizes how far through the year (and your life) you are, then helps you act on it — daily mood pulse, focus timer, habits. Everything is **100% on-device, no account, no tracking**.
>
> Just shipped three things:
> - **Goals** — set a target, log progress, watch a ring fill and celebrate milestones.
> - **Compete** — invite friends to a challenge (focus minutes, habit check-ins, pulse streaks, or a manual count) with a shareable leaderboard. No backend, no sign-up — invites are just links and progress codes.
> - **Memory Marker** — snap/upload a photo and it gets stamped with the exact % of the year + date/time + your note, as a downloadable card.
>
> Free, works in the browser (installable PWA) + Android/iOS. It's open source. Would love feedback on what to build next: timepassed.wtf

### r/getdisciplined / r/decidingtobebetter (value-first, softer mention)

> **Title:** Progress monitoring is one of the most evidence-backed ways to actually hit goals — here's how I made it frictionless for myself
>
> A 2016 meta-analysis found that simply *monitoring progress* measurably increases goal attainment, and the effect grows the more often you check in. The catch is friction — if logging takes effort, you stop.
>
> So I made check-ins a 5-second ritual and tied them to things I already see daily (a year-progress wallpaper, a mood heatmap). I recently added a goal ring + milestone celebrations and "progress photos" (a feature where you snap a moment and it's stamped with how far into the year you were).
>
> If useful, the tool is free and on-device (timepassed.wtf) — but mostly sharing the principle: **make the check-in smaller than the resistance.**

### r/Journaling (Memory Marker angle)

> **Title:** A lightweight way to "timestamp" memories — photo + the exact % of the year you were at
>
> I wanted something between a full journal and nothing: take/upload a photo, add a sentence, and it saves a card stamped with the date, time, and **how far through the year** the moment happened (e.g. "44.33% of 2026"). Over a year it becomes a visual timeline. It's private/on-device. Curious how others lightweight-journal moments.

---

## Indie Hackers post

> **Title:** Took my open-source "year progress" app from passive viewer to social + goals
>
> TimePassed started as a calm year/life-progress visualizer (no account, all on-device). Retention was fine but flat — people looked, felt something, left.
>
> This release adds the loops:
> - **Goals** with progress logging + milestone celebration (the evidence on progress-monitoring is strong).
> - **Compete** — friend challenges with a leaderboard, but built *without* a backend to keep the privacy promise: invites are encoded links, standings sync via copy-paste "progress codes." Curious if anyone's done leaderboards this way before.
> - **Memory Marker** — progress photos stamped with the % of the year.
> - Growth plumbing: every exported image now has a scannable QR; OG tags + sitemap for SEO.
>
> Open question for the IH crowd: is "no-backend social" a feature users *value*, or do they just want real-time leaderboards and not care about accounts? Repo + app: timepassed.wtf

---

## Show HN

> **Title:** Show HN: TimePassed – on-device year/life progress, now with no-backend friend challenges
>
> TimePassed is an open-source, account-free dashboard that visualizes how far through the year and your life you are, plus mood/focus/habits — everything in the browser or on-device.
>
> The interesting bit this release: I added friend **challenges with a leaderboard but no server**. Invites are URL-encoded challenge definitions; each person's standing is a short base64 "progress code" you paste to update the board. Auto-metrics (focus minutes, habit check-ins, pulse streaks) are computed locally from existing data. Trade-off: it's async and trust-based, not real-time — but it keeps the zero-account, zero-tracking model.
>
> Stack: React 19 + Vite + Capacitor (web/PWA/Android/iOS/macOS). Photos use IndexedDB; share cards are Canvas2D. Feedback welcome, especially on the no-backend-social approach. timepassed.wtf

---

## X / Twitter thread

1/ You're ~44% through 2026. Can you feel it?
TimePassed turns that into something you can *see* — and now, act on. Big update 🧵
2/ 🎯 Goals: set a target, log progress, watch the ring fill. Milestone celebrations included. (img: goal card)
3/ 🏆 Compete: challenge friends on focus, habits, or pulse streaks. Shareable leaderboard, invite by link — and zero accounts. (img: leaderboard card)
4/ 📸 Memory Marker: snap a photo, and it's stamped with the exact % of the year + date + your note. A visual timeline of your year. (img: memory card)
5/ Still 100% on-device. No account. No tracking. Free + open source.
Try it (installs as an app): timepassed.wtf

---

## Changelog / GitHub release notes

```
## v1.x — Goals, Compete & Memory Marker

### Added
- 🎯 Goal Tracker — count or % goals, progress logging with notes, progress
  ring, milestone celebrations, optional deadline countdown, shareable card.
- 🏆 Compete — friend challenges (focus / habits / pulse / manual) with a
  leaderboard. Invite via link, sync standings via progress codes. No account,
  no backend.
- 📸 Memory Marker — capture or upload a photo, auto-stamped with the % of the
  year, date, time and your description; downloadable card. Photos stored
  locally (IndexedDB).

### Growth / SEO
- Scannable QR + wordmark footer on every exported image and wallpaper.
- OpenGraph/Twitter meta, JSON-LD, og-image, sitemap.xml, robots.txt.
- Referral "Invite a friend" surfaces; event analytics across key actions.

Everything remains on-device and account-free.
```

## App Store / Play "What's New"

```
Big update! 🎯 Goals — set targets and watch your progress ring fill.
🏆 Compete — challenge friends on focus, habits or streaks with a shareable
leaderboard (no account needed). 📸 Memory Marker — stamp a photo with exactly
how far through the year you are. Still 100% private and on-device.
```

---

## Sources
- [Habit apps with friends / social accountability (Cohorty)](https://www.cohorty.app/blog/best-habit-tracking-apps-with-friends)
- [Goal tracker app features & effectiveness (Reclaim)](https://reclaim.ai/blog/goal-tracker-apps)
- [Indie Hackers vs Product Hunt launch data](https://awesome-directories.com/blog/indie-hackers-launch-strategy-guide-2025/)
- [Indie launch strategy: PH / HN / Reddit (DEV)](https://dev.to/kanta13jp1/indie-dev-launch-strategy-getting-traction-on-producthunt-hackernews-and-reddit-18g6)
