# Generated Image Assets

Only runtime assets are tracked in `public/`. Source generations, raw sprite sheets,
extracted frames, previews, and temporary QC outputs are intentionally excluded to keep
the repository and deployment payload small.

## Runtime inventory

| Asset | Runtime path |
| --- | --- |
| Basic shrine backdrop | `public/cyber-temple-background-v1.png` |
| Basic altar/censer | `public/basic-altar-censer-v1.png` |
| Remix backdrop and foreground | `public/remix-scene-v1-backdrop.png`, `public/remix-scene-v1-foreground.png` |
| Remix DJ altar and talisman | `public/remix-dj-altar-v1.png`, `public/remix-neon-talisman-v1.png` |
| Incense and bell | `public/incense-burning-sprite-v2.png`, `public/temple-bell-v1.png` |
| Offerings | `public/developer-offerings-v1/offering-1.png` through `offering-6.png` |
| Oracle cards | `public/oracle-cards-v1/oracle-card-1.png` through `oracle-card-6.png` |
| Social preview | `public/temple-og-preview-v1.png` |
| Developer avatars | `public/chibi-avatars-v1/avatar-1.png` through `avatar-6.png` |
| Project spirits | `public/project-spirits-v1/*.png` |
| Deity animations | `public/temple-deities/*/idle/sheet-transparent.png` |

`public/temple-deities/manifest.json` remains the runtime contract for sheet
dimensions, frame duration, and feet anchors. The typed adapter is
`src/features/halls/deity-visual-catalog.ts`.
