# Budget Tracker

A small, installable-style expense tracker in plain HTML, CSS and JavaScript (no build step, no libraries).
Open `index.html` in a browser to run it. Your data is saved on your device (localStorage).

## Features
- **Log:** 11 categories, typed amount (decimals like 34.50 work) with +20 / +50 / +100 chips, daily goal line, streak, week dots, "Nothing spent today", and Today / Yesterday / pick-a-date for expenses you forgot to log.
- **Stats:** Week / Month / Term, remaining budget, spent, per day, days logged, trend vs budget pace, category variance.
- **Daily spending:** tap "Per day" on Stats. Month calendar with the amount for each day, month switcher (arrows or swipe), tap a day for details, then edit (amount, category, date) or remove an entry.
- **Wrapped:** weekly review with top category, biggest splurge, cheapest day, streak and a share button.
- **Cat:** wanders on the Log screen, naps until you log, hops when you log, shows a heart when tapped.

- **Settings:** gear icon on Stats. Currency, daily goal, add / rename / hide categories, monthly budgets, fixed costs.
- **Backup:** export a JSON backup or a CSV, and import a backup (also moves your data to a new phone).

## Sync across your devices (optional, free)
The app is local-first: it always works from the data on your device, and works offline. To also keep your phone and laptop in step, connect your own free Supabase project (no code to write):
1. Create a project at supabase.com (free plan). Pick a region near you.
2. SQL Editor > New query > paste the contents of `supabase/setup.sql` > Run. This creates one private row per user and locks it so only its owner can read or change it.
3. Project Settings > API: copy the **Project URL** and the **anon / publishable key**, and paste them into `supabase: { url, anonKey }` in `js/core/config.js`. (Never use the service_role key in the app.)
4. Authentication settings: "Confirm email" is a switch (Authentication > Sign In / Providers > Email). Off = you can sign in straight away. On = new accounts must click a link in an email first; then set Authentication > URL Configuration > Site URL to your hosted address and add it under Redirect URLs. Supabase's built-in email sender allows only a few emails per hour, so use a custom SMTP provider if many people will sign up. After creating your own account you can also turn off new sign-ups, so only you can use your project.
5. Re-upload the site (and bump `VERSION` in `sw.js`). Open Settings > Sync across devices > Create account, then sign in with the same email on every device.
How it merges: expenses added on any device are combined; deletions are remembered so they do not come back; settings use the most recent change. "Delete all" and "Import backup" replace the cloud copy. With the keys left empty, nothing is ever sent anywhere.
Free-plan note: Supabase pauses free projects after about a week with no activity (your data is kept; you resume it from the dashboard). Daily use keeps it active, and Export backup is your safety net.

## Data safety (read this)
- **Updating the app never deletes your data.** Your expenses live in each browser's storage and in your cloud account, not in the app files. What can wipe them is a replace action: Delete all, Import backup, Load sample data, or restoring a backup. Those replace the cloud copy too.
- **Safety copies:** before any replace action, or when a reset from another device reaches this one, the app keeps a copy on this device. Settings > Recover data lists the last 5, with a Restore button.
- **Cloud backups (optional):** run `supabase/backups.sql` once in Supabase. The app then saves a dated cloud backup once a day, and before a reset or import overwrites a cloud copy that has expenses. Settings > Recover data > Show cloud backups lists the newest 30.
- **Delete all** needs you to type DELETE. The Reset button on Stats was removed so it cannot be tapped by accident.
- **Habit:** after logging, check Settings > Sync shows "Last synced". Export a backup file now and then.

## Accessibility
- Text contrast meets WCAG AA (body text 6.7:1 or better; buttons 17:1). Nothing relies on colour alone: every bar, day and status also has a written label.
- Every control works with a keyboard and has a visible focus ring. Touch targets are 40 to 56px.
- Sheets and the Wrapped / setup screens behave as dialogs: the page behind is inert, focus moves in and returns to the button that opened it, Escape closes them.
- Screen readers get labelled calendar days ("Wednesday 14 October, spent 560"), a week summary, a chart summary and spoken confirmations when you log.
- Motion respects the "reduce motion" setting. Zooming and large text are not blocked.

## How data is stored
Each person's data lives only in their own browser (localStorage on their device). By default nothing is sent to a server: no account, no shared database, and nobody else can see it. The trade-off: it does not sync between devices, and clearing browser data deletes it, so Settings has Export backup and Import backup. If you turn on the optional sync (above), your data is also kept in your own private cloud account that only you can read.

## Structure
```
index.html            page shell (markup only)
manifest.json, sw.js, icons/   install + offline support
supabase/setup.sql             one-time database setup for cloud sync
css/
  tokens.css          colours, fonts (edit the palette here)
  base.css            reset, layout, typography
  components.css      tiles, chips, bars, tab bar
  screens.css         Log, Stats, sheet/calendar, Wrapped
  cat.css             cat layout and animations
js/
  core/               utils.js (dates, formatting), config.js (defaults), store.js (data), backup.js (export / import), sync.js (optional cloud sync), sample-data.js
  components/         charts.js, cat.js, tabs.js, pwa.js, a11y.js
  screens/            log.js, stats.js, daily-sheet.js, wrapped.js, settings.js, onboarding.js
  app.js              starts everything
```
Scripts are plain files loaded in order and share one `BT` namespace, so the app works by double-clicking `index.html` (no server needed).

## Publish it (free) and install it
1. **Host:** the folder is a static site. Easiest options: Netlify Drop (drag the unzipped folder onto app.netlify.com/drop), or GitHub Pages (upload the files to a repository, then Settings > Pages > deploy from the main branch), or Cloudflare Pages. You get an https link to share.
2. **Install:** open the link on a phone. iPhone (Safari): Share > Add to Home Screen. Android (Chrome): menu > Install app, or Settings > Install in the app. It then opens full screen and works offline.
3. **Releasing updates:** change `VERSION` in `sw.js` (for example `bt-v2`) each time you upload a new version, so installed copies refresh.
The service worker only runs from an https address (or localhost), not when you double-click the file.

## Customise
- Day to day: the Settings sheet in the app. Defaults for new users, term length and calendar shading: `js/core/config.js`.
- Colours: `css/tokens.css`.
- Try it with fake data: Stats screen, "Load sample data". Clear it with "Reset data".
