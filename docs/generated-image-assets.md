# Generated Image Assets

Inventory of images generated for the Cyber Temple experience. This document separates the approved assets from intermediate or superseded outputs so new work can reference the correct version.

## Approved and integrated

| Asset | Final file | Purpose | Runtime location |
|---|---|---|---|
| Cyber Temple background | `public/cyber-temple-background-v1.png` | Main Basic-theme shrine backdrop. | `src/screens/LiveAltarPage.tsx` |
| Basic altar and censer | `public/basic-altar-censer-v1.png` | Traditional red-lacquer altar with bronze censer. | `src/features/censer/CenserSection.tsx` |
| Remix DJ altar | `public/remix-dj-altar-v1.png` | Neon DJ console for Remix mode. | `src/features/censer/CenserSection.tsx` |
| Burning incense sprite | `public/incense-burning-sprite-v2.png` | 2x2 ember loop: unlit while held, ignition and burning after a successful drop. | `src/features/censer/CenserSection.tsx`, `src/app/globals.css` |
| Temple bell | `public/temple-bell-v1.png` | Shared room bell; CSS handles its swing while Web Audio supplies the chime. | `src/features/temple-bell/TempleBell.tsx` |
| Developer offering pack | `public/developer-offerings-v1/offering-1.png` through `offering-6.png` | Laptop, keyboard, coffee, rubber duck, config scroll, and CI lantern for the offering action. | `src/features/offerings/OfferingTray.tsx` |
| Oracle cards | `public/oracle-cards-v1/oracle-card-1.png` through `oracle-card-5.png` | Visual tier cards for the result page. Text and the oracle message remain HTML. | `src/app/oracle/[resultId]/OracleResultView.tsx` |
| OpenGraph room preview | `public/temple-og-preview-v1.png` | 1200×630 social-card background; the room title and ritual description are supplied dynamically in metadata. | `src/app/temple/[roomId]/page.tsx` |
| Temple depth foreground | `public/temple-scene-v1/cyber-temple-foreground-depth.png` | Alpha foreground cột/đèn near-camera, generated from the current Basic background to add 2.5D depth without replacing the existing altar/censer. | `src/features/temple-scene/TempleScene.tsx` |

| Remix Scene v1 | `public/remix-scene-v1-backdrop.png`, `public/remix-scene-v1-foreground.png` | Vinahouse electronic stage backdrop plus alpha speaker/light-rig frame. The empty center remains reserved for interactive HTML DJ altar and DJ cards. | `src/features/temple-scene/TempleScene.tsx` |
| Remix neon talisman | `public/remix-neon-talisman-v1.png` | Alpha vinyl/equalizer talisman. Its opacity and charged state represent persisted room energy and active sparklers. | `src/features/effects/RemixEnergyTalisman.tsx` |
| Chibi developer avatars v1 | `public/chibi-avatars-v1/avatar-1.png` through `avatar-6.png` | Six alpha developer avatars for per-room seat selection and live Presence rendering. They are distinct from deity and mascot assets. | `src/features/avatars/` |

### Oracle tier mapping

| Tier | Artwork | File |
|---|---|---|
| `dai_cat` (Đại Cát) | Emerald phoenix and deploy-check sigil | `oracle-card-1.png` |
| `cat` (Cát) | Teal koi and terminal lantern | `oracle-card-2.png` |
| `binh` (Bình) | Amber balance scales and moon | `oracle-card-3.png` |
| `hung` (Hung) | Cracked server pagoda and storm | `oracle-card-4.png` |
| `dai_hung` (Đại Hung) | Eclipsed moon and fractured rocket | `oracle-card-5.png` |
| Card back | Indigo circuit talisman | `oracle-card-6.png` |

The canonical mapping is also stored at `public/oracle-cards-v1/prop-manifest.json`.

## Scene environment

| Asset | Final file(s) | Intended placement |
|---|---|---|
| Cyber Temple prop pack v2 | `public/cyber-temple-props-v2/cyber-temple-1.png` through `cyber-temple-4.png` | Lantern, terminal pedestal, power node, and wall ornament around the shrine. See its `prop-manifest.json`. Gắn bằng `CyberTempleEnvironment.tsx`. |
| Cyber Temple server rack | `public/cyber-temple-server-rack-v1.png` | Side/background environmental prop for the shrine hall, gắn bằng `CyberTempleEnvironment.tsx`. |

## Animated deity sprites

| Pack | Final runtime sheet | Animation / QC |
|---|---|---|
| Khai Triển deities | `public/temple-deities/{vercel,netlify,cloudflare}/idle/sheet-transparent.png` | Each pack has a six-frame 2×3 alpha idle sheet, extracted frames, GIF preview, raw source, prompt and `pipeline-meta.json`. Netlify passed default strict anchor QC; Cloudflare passed reviewed seated-anchor QC at `0.06`, with no empty, edge-touch or clamped frame. |
| Hợp Nhất deities | `public/temple-deities/{github,gitlab,bitbucket}/idle/sheet-transparent.png` | Six-frame 2×3 meditating emblem spirits. Strict QC passed: no empty, edge-touch or clamped frame; body-scale CV ranges from `0.0017` to `0.0053`. |
| Dữ Hải deities | `public/temple-deities/{supabase,firebase,postgresql}/idle/sheet-transparent.png` | Six-frame 2×3 meditating emblem spirits. Strict QC passed: no empty, edge-touch or clamped frame; body-scale CV ranges from `0.0031` to `0.0064`. |
| Trí Tuệ deities | `public/temple-deities/{openai,claude,gemini}/idle/sheet-transparent.png` | Six-frame 2×3 meditating emblem spirits. Strict QC and visual alpha review passed; no empty, edge-touch or clamped frame. |
| Thiên Vân deities | `public/temple-deities/{aws,google-cloud,azure}/idle/sheet-transparent.png` | Six-frame 2×3 meditating cloud-emblem spirits. Strict QC passed; Google Cloud received an additional all-component pass so its multicolor halo remains intact. |
| Minh Giám deities | `public/temple-deities/{sentry,datadog,grafana}/idle/sheet-transparent.png` | Six-frame 2×3 observability-emblem spirits. Strict QC passed; Sentry received an all-component pass to preserve its halo. Grafana has three visually reviewed harmless source-cell contacts on its seated robe, explicitly allowed after confirming zero output-edge contact and zero clamp. |

`public/temple-deities/manifest.json` is the generated-asset contract for sheet dimensions, frame duration and feet anchor. `src/features/halls/deity-visual-catalog.ts` maps all eighteen accepted deity sheets for scene use. Vercel is the accepted friendly chibi mascot; the other seventeen are meditating emblem spirits with no human face. All six Halls now have a complete three-deity visual roster.

## Generation and QC artifacts

Every generated asset keeps its prompt beside the final output when applicable. Animated/packed assets additionally contain the raw sheet, chroma-clean sheet, transparent sheet, extracted frames, GIF preview, and `pipeline-meta.json`.

| Pack | Source / prompt | QC summary |
|---|---|---|
| Incense v2 | `public/incense-burning-sprite-v2.raw.png`, `public/incense-burning-sprite-v2.prompt.txt` | 4 valid frames; no empty, source-edge, output-edge, or clamped frames. |
| Temple bell | `public/temple-bell-v1.raw.png`, `public/temple-bell-v1.prompt.txt` | One valid transparent prop; no empty, edge, or clamped frame. |
| Developer offerings v1 | `public/developer-offerings-v1.raw.png`, `public/developer-offerings-v1/prompt-used.txt` | 6 valid props; no empty, output-edge, or clamped frame. Laptop source edge was visually reviewed and accepted with source-edge allowance. |
| Oracle cards v1 | `public/oracle-cards-v1.raw.png`, `public/oracle-cards-v1/prompt-used.txt` | 6 valid frames; no empty, output-edge, or clamped frame. The three lower raw cells meet the row boundary but were visually confirmed complete and accepted with source-edge allowance. |
| Cyber Temple props v2 | `public/cyber-temple-props-v2/prompt-used.txt` | Canonical compact prop pack; see `pipeline-meta.json`. |

## Intermediate or superseded outputs — do not use for new UI

- `public/incense-burning-sprite-v1/` and `public/incense-burning-sprite-v1.raw.png`: first incense attempt. Use v2.
- `public/cyber-temple-props-v1/`: first prop-pack attempt. Use v2.
- `public/oracle-cards-qc-temp/`: non-strict diagnostic extraction used to explain the source-cell boundary result. Use `oracle-cards-v1/`.

All project-bound generated art was created with built-in image generation and processed locally with Sprite Forge (`generate2dsprite`) for chroma cleanup, extraction, alignment, and QC.
# Project Success Ritual spirits v1

| Asset | Path | Format | Use |
| --- | --- | --- | --- |
| Build Spirit | `public/project-spirits-v1/build-spirit.png` | PNG, alpha | Build/test readiness guardian. |
| Guardian Spirit | `public/project-spirits-v1/guardian-spirit.png` | PNG, alpha | Review and rollback protector. |
| Launch Spirit | `public/project-spirits-v1/launch-spirit.png` | PNG, alpha | Deploy/release celebration guardian. |

Generated with built-in ImageGen (`stylized-concept`), each on a flat chroma key and processed using `remove_chroma_key.py` with auto border-key, soft matte and despill. No text or UI is embedded. The three source prompts are recorded in the implementation history; runtime copies are the alpha PNG files above.
