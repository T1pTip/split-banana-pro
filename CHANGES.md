# Palette AI — Design Graft (S9)

Source: Claude Design handoff bundle `p-handoff.zip` (Palette AI - Current.html + palette-current.jsx).
Applied: 2026-04-20.

## Files changed
- `index.html` — CSS additions, theme toggle button, textarea placeholder, result label, format row visuals, static cat-grid replaced with empty container
- `app.js` — GROUPS constant, accordion `buildCatGrid()`, `updateBadges()` extended, `filterTags()` extended, `setTheme()`/`toggleTheme()` added, `startApp()` theme init, `T.he/en` strings updated

Untouched: `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `.github/workflows/deploy.yml`

## Changes applied (per user scope: "all except #2, keep PayBox")

| # | Change | Where |
|---|---|---|
| 1 | 6-group accordion replaces flat 33-pill grid | `buildCatGrid()` + CSS `.grp-*` |
| 3 | Light/Dark theme toggle (☀️/🌙), persisted to localStorage | `setTheme()`, `[data-theme="light"]` CSS overrides, header button |
| 4 | Textarea placeholder: `...או שפשוט תלחצ/י על כפתור ההפתעה :)` | `T.he.placeholder`, `T.en.placeholder`, HTML attr |
| 5 | Result label: `פרומפט מוכן` → `פרומפט מוכן להעתקה` | `T.he.resultLabel`, `T.en.resultLabel`, HTML initial |
| 6 | Format row: visual border rectangles replace 📱⬜🖼️ | `.fmt-shape*` CSS + HTML spans |
| 7 | Two-level badges: group-level count + per-category count | `updateBadges()` + `.grp-badge` CSS |
| 8 | PayBox button KEPT (not removed per design) | no change |

## Changes NOT applied (per user scope)

| # | Change | Reason |
|---|---|---|
| 2 | Kids mode = 3 custom groups (k-style/k-world/k-chars) | User excluded. Kids mode still filters via `KIDS_TITLES` (21 cats), shown inside the same 6 groups — groups with no kid cats hide automatically. |

## Preserved (no regressions expected)

All core functions unchanged in behavior — they target `.cat-pill` and `badge-N` IDs which still exist inside groups:
- `openPanel(ci)` / `closePanel()` — tag panel flow
- `toggleTag()` / `updateChips()` / `updateBadges()` (extended, backwards-compatible)
- `filterTags()` (extended — now auto-expands containing group before opening panel)
- `setKidsMode()` — calls `buildCatGrid()` as before
- `setLang('he'|'en')` — calls `buildCatGrid()` with new labels
- `randomize()` / `randomizeKids()` — untouched
- History, Share, Copy, Clear modal, Install banner, Settings, Conflict modal, PayBox — all untouched

## Category → Group mapping (ci index → group key)

| Group | Categories (ci) |
|---|---|
| medium 📸 סגנון ומדיום | 0 📸 · 1 🎨 · 4 ⚙️ · 21 🧱 · 16 📷 · 17 🃏 |
| mood 🎬 אווירה ואסתטיקה | 2 🎬 · 3 💡 · 11 🔮 · 19 ✨ · 20 🎞️ · 24 🌊 |
| people 👤 אנשים ודמויות | 5 🎭 · 8 🌍 · 9 💇 · 7 👗 · 12 😊 · 13 🧍 |
| place 🌆 מקום וסביבה | 10 🌆 · 22 🏙️ · 23 🌿 · 31 🍃 |
| framing 🎨 מסגור וצבע | 6 📐 · 14 🖌️ |
| ideas 🌈 רעיונות ועולמות | 25 📱 · 28 🤗 · 29 🌱 · 30 🏆 · 32 🌈 · 26 🎮 · 27 🖼️ · 15 🧸 · 18 🐾 |

**Coverage: 33/33 ci indices, zero duplicates** (verified).

## Known follow-ups to consider (not implemented)

- Tag panel appears outside/below the expanded group. Design shows it nested inside the group body. Nesting would require refactoring `openPanel` to render inside `grp-body-{key}`. Deferred — current behavior is identical to the pre-graft flat-grid flow and works fine.
- Light theme was not in the original scope of user's protocols. Test on real device before shipping if light theme must look polished on iOS PWA. Dark theme is unchanged.
- Theme toggle button is emoji (☀️/🌙). If you want an SVG icon, swap in `themeToggle` HTML.

## Deploy

Replace the same files in `C:\palette-ai\` root:
- `index.html`
- `app.js`

Then git add / commit / push — GitHub Pages will redeploy automatically.

## Rollback

Unzip `BACKUP-before-design-graft.zip` over the project folder to revert.
