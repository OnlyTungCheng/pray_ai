# pray_ai — Đền Cầu Nguyện Dev

A playful interactive web altar where developers can "burn incense" and offer prayers to three AI coding deities — **Claude Code**, **Codex**, and **Kiro** — before a production deploy or client demo. Light incense sticks by dragging them into the censer, watch physics-based smoke rise, and submit a prayer wish for a bug-free release.

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** with `@vitejs/plugin-react`
- **React Router 8** (routing scaffold, currently a single `/` route)
- **Tailwind CSS** for styling
- **lucide-react** for icons
- Canvas-based custom smoke/particle engines (no animation library)

## Getting Started

```bash
npm install
npm run dev       # start dev server on http://localhost:3000
npm run build     # type-check + production build to dist/
npm run preview   # preview the production build locally
```

## Project Structure

```
src/
  main.tsx                # entry point, wraps App in BrowserRouter
  App.tsx                  # pure route definitions
  index.css                # global styles / Tailwind entry
  vite-env.d.ts             # Vite client type reference
  pages/
    AltarPage.tsx            # main altar route: composes shrine + censer + prayer modal
  features/
    censer/
      CenserSection.tsx       # incense censer, drag-and-drop stick lighting, joss boxes
      RealSmokeEngine.tsx      # canvas particle engine for rising incense smoke
      SmokeCanvas.tsx           # alternate/simpler smoke particle canvas (unused)
    prayer/
      PrayerModal.tsx          # popup modal for submitting a prayer wish
      PrayerBoard.tsx           # inline prayer board with wish wall / quick tags (unused)
    shrine/
      TechDeities.tsx          # the 3 AI deity statues + shrine display
      AltarScenes.tsx           # alternate deity statue scenes (unused)
    effects/
      SakuraRain.tsx           # falling peach blossom petal animation (on wish submit)
      Talisman.tsx              # expandable Taoist talisman (fu) image (unused)
  components/                # shared/layout components used across features
    Header.tsx / Footer.tsx    # page header/footer with counters and legal tabs (unused)
    Toolbar.tsx                # dev offerings (coffee, pizza, etc.), fullscreen toggle (unused)
    BgmPlayer.tsx               # background music player with autoplay-on-interaction
    Instructions.tsx            # ritual manual / how-to-use section (unused)
  hooks/
    useLocalStorageState.ts    # generic useState that auto-persists to localStorage
  types/
    index.ts                  # shared types (IncenseStick, Wish, Deity)
  utils/
    sound.ts                  # wooden fish (木魚) knock sound via Web Audio API
```

Path alias `@/*` → `src/*` is configured in `tsconfig.json` and `vite.config.ts` for new code; existing files keep their working relative imports.

## Notes

- Incense sticks and prayer wishes persist to `localStorage` and auto-expire after 1 hour.
- Several components (`Toolbar`, `Header`, `Footer`, `Instructions`, `AltarScenes`, `PrayerBoard`, `SmokeCanvas`) exist in the codebase but are not currently wired into `App.tsx` — they represent an earlier/alternate layout and can be reintroduced via the router.
- All dependencies are pinned to exact versions in `package.json`.
