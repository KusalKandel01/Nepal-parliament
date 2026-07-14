# Immersive Rebuild — Phase Log

Design system: `public/assets/css/immersive.css` (tokens: ink/parchment/maroon/indigo/brass).
Vendor libs are self-hosted in `public/assets/vendor/` (three.min.js, gsap.min.js, ScrollTrigger.min.js, lenis.min.js) — not CDN-linked, so the site has no third-party runtime dependency.

## Phase 1 — DONE (superseded by Phase 1b)
First pass: homepage built around a flat SVG hemicycle with ambient Three.js particles behind it. Functional but not truly spatial — kept for reference, replaced below.

## Phase 1b — DONE
Homepage (`public/index.html`) rebuilt as an actual 3D environment (`assets/js/chamber3d.js`), not a page with effects bolted on:
- Real geometry: floor, a 28-column colonnade, a podium/dais, a back wall with a brass seal — and all 332 seats as physical 3D objects (`CylinderGeometry`), tiered by row (NA inner, HoR outer, back rows higher — like real stadium seating), colored and positioned from the actual `members.json` data
- **The canvas is the page background** (`position:fixed`, full viewport, not `pointer-events:none`) — content sections are glass panels (`backdrop-filter: blur`) floating over it, not opaque blocks stacked on top. `.wrap` and its children default to `pointer-events:none` so drag-to-look-around works everywhere except real controls (buttons/links/inputs) — see the `.wrap a, button, input...` rule in `immersive.css`.
- Cinematic entrance: camera starts high and far, flies down into the chamber over ~3.2s (GSAP tween on a plain state object, not fighting OrbitControls)
- OrbitControls: drag to look around, slow autoRotate when idle, zoom/pan disabled to protect the composition, polar angle clamped so you can't flip under the floor or into the ceiling
- Scroll-linked dolly: as the page scrolls, the camera pulls back along its current view direction (`animate()` in chamber3d.js) — reads as walking backward out of the chamber, not a jump cut. **Bug already hit and fixed once:** this dolly logic ran unconditionally in the render loop and fought the intro tween, permanently locking the camera at its far starting distance. Fixed with an `introDone` flag — the scroll-dolly only takes over once `flyIn()` finishes. If a future pass adds more camera behaviors, keep them behind the same kind of explicit phase flag rather than one always-on formula in `animate()`.
- Real raycasting (not DOM hover) — hovering a physical seat scales it up, brightens its emissive material, and shows the tooltip; click → `member.html?id=`
- UnrealBloomPass postprocessing so the emissive seats/podium/seal genuinely glow — this is what sells the "premium chamber" feel over flat color
- Vendor libs self-hosted in `assets/vendor/`: `three.min.js`, `three-addons.js` (OrbitControls + EffectComposer/RenderPass/UnrealBloomPass/ShaderPass + Copy/LuminosityHighPass shaders, concatenated from the `three@0.128` npm package — r128, matching what's used elsewhere in this project, so don't reach for `THREE.CapsuleGeometry` or anything r131+), `gsap.min.js`, `ScrollTrigger.min.js`. Lenis was dropped — native scroll now drives the camera dolly directly via ScrollTrigger, and mixing Lenis smoothing with a scroll-scrubbed camera path added complexity without a clear benefit.
- Verified headlessly (Playwright, software WebGL fallback): confirmed real party-colored pixels render at the seat cluster (sampled RGB matched RSP gold / NC maroon / UML indigo almost exactly) and that the visible seat cluster grew substantially after pulling the resting camera position in from `(0,15,42)` to `(0,7.5,21)` — the first pass technically worked but was too far back to feel like standing inside the chamber.
- Old `index.html` fully replaced. All other pages (`directory.html`, `member.html`, `leadership.html`, `committees.html`, `statistics.html`, `downloads.html`, `about.html`) are untouched and still function exactly as before — they just don't live in the 3D chamber yet.

## Phase 2 — NEXT
Rebuild `directory.html` on `immersive.css`: keep existing filter/search/pagination logic in `filters.js`, restyle to match, and make the hemicycle a live filter surface (click a party bar → chamber highlights that party).

## Phase 3
Restyle `member.html`, `leadership.html`, `committees.html` to the new system. Reuse `.lead-card`, `.eyebrow`, `.wrap` patterns already established in Phase 1.

## Phase 4
Rebuild `statistics.html` charts (`charts.js`) as SVG data-viz matching the palette — replace generic donut/bar look with the same institutional register.

## Phase 5
Polish: prefers-reduced-motion audit (partially done — hemicycle and ambient canvas already respect it), Lighthouse pass, keyboard-nav sweep on the hemicycle, final Vercel deploy check.

## Photo quality — DONE (what was tried, what worked)
The 332 photo URLs in `members.json` point at `hr.parliament.gov.np` `_thumbnail` files — small and soft by nature, not a bug in this project.

**Tried and ruled out:** re-fetching higher-res originals or better photos.
- `hr.parliament.gov.np/robots.txt` disallows automated fetching — can't scrape it at all (not from this sandbox's tool, not from web_fetch).
- `na.parliament.gov.np` member directory loads its data client-side via JS; the static HTML has no photo data to scrape either.
- Wikipedia infobox photos (checked Dol Prasad Aryal and Pushpa Kamal Dahal) don't come through the page-fetch tool as usable image URLs — it strips image references from the extracted text entirely, even for a photo that definitely exists (3-time PM). Not a reliable source through these tools.
- Bulk-searching individual photos for 332 real people from arbitrary web sources was ruled out on purpose, not just difficulty: no reliable way to verify person-match at that scale, and most results would be third-party press photos not appropriate to rehost wholesale on an official-feeling directory.

**Shipped instead:**
1. **`assets/css/style.css`** — `.avatar img` and `.profile-avatar img` now carry `filter: url(#sharpen-photo) contrast(1.06) saturate(1.04)`. `#sharpen-photo` is an SVG `feConvolveMatrix` unsharp-mask kernel (`0 -0.55 0 / -0.55 3.2 -0.55 / 0 -0.55 0`, sums to 1 so brightness is preserved), injected as a hidden inline `<svg>` right after `<body>` in `directory.html` and `member.html` (the two pages that render `.avatar`/`.profile-avatar` — `leadership.html` only shows initials, no photos, so it didn't need it). Verified in a headless render: measured edge-contrast increase of ~34% vs. the unfiltered image. This is real, immediate, and needs no rebuild step — it's live the moment the CSS loads.
2. **`scripts/fetch_and_upscale_photos.py`** — a script for the user to run locally (their machine can reach `hr.parliament.gov.np`; this sandbox's tools can't). Downloads all 332 photos, upscales 3x with Lanczos + applies a real unsharp mask (Pillow), saves to `assets/images/members/{id}.jpg`, and writes `members.local-photos.json` with `photo` repointed at the local files — reviewed by the user before it overwrites the real `members.json`. Tested the core `upscale_and_sharpen()` function directly in-sandbox against a synthetic image (network calls untestable here); script compiles clean. Includes an honest note in its own docstring about the `robots.txt` situation and why running it personally/once is a different thing from crawling.

Neither of these invents detail that isn't in the source photo — a 96px face doesn't become a 400px face. They reduce the softness from upscaling a tiny source image, which is most of what reads as "blurry" at directory-listing size.
- Don't reuse cream/terracotta or near-black/single-neon — the maroon(HoR)/indigo(NA)/brass(accent) three-color logic is the whole point; keep it consistent everywhere.
- Fraunces + Noto Serif Devanagari for display, IBM Plex Sans + Noto Sans Devanagari for body, IBM Plex Mono for all data/numbers — keep this pairing on every subsequent page.
- Hemicycle seat ordering is by party_code sort within house — if that ever changes, re-check that visual blocs still read cleanly.
