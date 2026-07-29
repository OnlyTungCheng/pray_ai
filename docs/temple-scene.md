# Temple Scene v1

Basic mode uses a 1536×864 layered-raster stage. The current `cyber-temple-background-v1.png` remains the far environment and is never replaced by a generated altar image.

## Runtime order

Back-to-front stacking contract: current background → deity alcove → generated foreground depth → atmosphere → censer and controls.

Desktop anchors: plaque top-centre `y: 7%`; deity alcove centred at `y: 47%`; censer raised to `bottom: 14%` so it clears the bottom action bar. Major scene-object sizes use percentages of the scene/viewport rather than fixed rem caps.

1. Backdrop: existing Cyber Temple hall.
   - Deity alcove: three selectable existing deity statues, behind the censer.
2. Foreground depth: alpha cột/đèn generated from that same camera and palette.
3. CSS haze and room-energy halo.
4. Existing CenserSection: altar, incense interaction, smoke and front-rim occlusion.
5. Bell and transient offering feedback.
6. HUD/modal elements outside the scene.

## Adding layers

Animated deity sprites live under `public/temple-deities/`. Keep them as independent 2×3 alpha sheets behind the censer. `temple-deities/manifest.json` records the generated asset contract, while `src/features/halls/deity-visual-catalog.ts` is the typed runtime adapter; do not bake a deity into the background.

Add a typed layer in `src/features/temple-scene/scene-config.ts`, then add its art, prompt, alpha-QC metadata and an entry in `docs/generated-image-assets.md`. Preserve the 16:9 camera, leave the altar centre clear, use a single `requestAnimationFrame` parallax source, and honour `prefers-reduced-motion`.

## Asset ownership

- `cyber-temple-background-v1.png`: stable far environment.
- `temple-scene-v1/cyber-temple-foreground-depth.png`: runtime foreground occluder only.
- `basic-altar-censer-v1.png`, incense sprite and bell: existing interactive hero assets, not part of the background layer.
