# THEMES.md — Weather Starter Visual Themes

This file documents all themes discussed and implemented for the Weather Starter app. Use it as the reference when adding or modifying themes.

---

## Theme system overview

Themes are driven entirely by CSS without modifying any React component logic.

- **Registry:** `frontend/src/theme/themes.ts` — exports the `Theme` interface and `themes` array. Each entry carries an `id`, `label`, `bodyBackground` (CSS gradient string), and `sidebarBg` (CSS color value).
- **Provider:** `frontend/src/theme/ThemeContext.tsx` — `ThemeProvider` writes `--body-bg` and `--sidebar-bg` CSS custom properties onto `<html>`, and sets `data-theme="<id>"` on the same element. Selection is persisted to `localStorage` under the key `weather-theme`.
- **Overrides:** `frontend/src/index.css` — each non-trivial theme has a `[data-theme='<id>']` block that overrides Tailwind's compiled alpha-white utility classes (text, border, bg, divide) and any structural properties (border-radius, font-family, backdrop-filter) specific to that theme.
- **Default:** `apple` (the original design).

### Adding a new theme

1. Add an entry to the `themes` array in `themes.ts`.
2. If the theme needs visual overrides beyond background and sidebar color (e.g. it is a light theme, or uses a different font), add a `[data-theme='<id>']` block in `index.css`.
3. The theme automatically appears in the `ThemeSelector` dropdown — no component changes needed.

### Light theme considerations

Light themes require overriding every `text-white/*`, `bg-white/*`, `border-white/*`, and `divide-white/*` Tailwind utility because those classes are invisible on a light background. The pattern used in Arctic Haze is the reference implementation: replace white `255 255 255` with a dark ink color (e.g. `30 42 58`) at matching alpha values, and replace translucent card backgrounds with solid white surfaces.

---

## Theme catalogue

### Status key

| Symbol | Meaning                                                            |
| ------ | ------------------------------------------------------------------ |
| ✅     | Fully implemented and in the selector                              |
| 🔲     | Designed, registered in `themes.ts`, CSS overrides not yet written |
| 📋     | Designed only (not yet in `themes.ts`)                             |

---

### 1. Arctic Haze ✅

**ID:** `arctic` · **Label:** Arctic Haze · **Default:** no

Near-white, cold-light aesthetic inspired by overcast Nordic skies.

| Property       | Value                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------- |
| **Color**      | Off-white body (`#e8edf4` → `#c8d8ea`), blue-grey sidebar, pale-indigo tints                |
| **Typography** | Unchanged (`font-light` / `font-extralight`) — contrast is achieved through color inversion |
| **Cards**      | Solid `rgba(255,255,255,0.72)` panels with slate-ink borders                                |
| **Corners**    | Unchanged (`rounded-2xl`)                                                                   |
| **Blur**       | Retained                                                                                    |
| **Density**    | Unchanged                                                                                   |
| **Theme type** | **Light**                                                                                   |

**Design notes:**

- All `text-white/*` classes are replaced with `rgb(30 42 58 / α)` slate ink at the same alpha steps so relative dimming still reads correctly.
- Card surfaces switch from the near-invisible `bg-white/[0.08]` to solid `rgba(255,255,255,0.72)`.
- The ThemeSelector dropdown inverts to a white panel with dark text.
- Submit buttons use a dark slate background with white text (reversed from the dark-theme white pill).
- Focus rings use a slate glow instead of the default white glow.
- Scrollbar thumb uses a translucent slate color.

---

### 2. Apple ✅

**ID:** `apple` · **Label:** Apple · **Default:** **yes**

The original design — Apple Weather-inspired frosted glass with a steel-blue radial gradient sky.

| Property       | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| **Color**      | Steel-blue gradient (`#6f8aa8` → `#3c5066`), white/alpha text, black/20 sidebar       |
| **Typography** | `font-extralight` hero temperature, `font-light` body, `font-semibold` labels         |
| **Cards**      | `bg-white/[0.08]` frosted glass, `border-white/15`, `rounded-2xl`, `backdrop-blur-xl` |
| **Corners**    | `rounded-2xl` throughout                                                              |
| **Blur**       | `backdrop-blur-xl` on cards, `backdrop-blur-2xl` on sidebar                           |
| **Density**    | Medium — 2–4 column tile grid, comfortable spacing                                    |
| **Theme type** | Dark                                                                                  |

**Design notes:**

- This is the baseline. No `[data-theme='apple']` block in `index.css` is needed — all Tailwind classes default to this appearance.
- The body background is the reference point for the CSS `--body-bg` fallback value.

---

### 3. Midnight Terminal ✅

**ID:** `midnight` · **Label:** Midnight Terminal · **Default:** no

Dark cyberpunk interface with monospace typography and neon green accents.

| Property       | Value                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------- |
| **Color**      | Pure `#0a0a0a` → `#111111` body, `#00ff88` neon-green accent, near-black sidebar             |
| **Typography** | `ui-monospace / Menlo / Consolas` cascaded onto all elements via `[data-theme='midnight'] *` |
| **Cards**      | Solid `#111111` panels, no blur, neon-tinted borders `rgba(0,255,136,0.18)`                  |
| **Corners**    | Collapsed to `rounded-md` / `0.25–0.375rem` (square feel)                                    |
| **Blur**       | **Removed** (`backdrop-filter: none`)                                                        |
| **Density**    | Compact — tight panels, monospace type naturally tighter                                     |
| **Theme type** | Dark                                                                                         |

**Design notes:**

- Dim/muted `text-white/55–70` values shift to neon green tints so they glow rather than fade.
- Tile header labels (`uppercase tracking-[0.14em]`) get the brightest neon treatment.
- Bright content (`text-white/85–95`) stays white for readable contrast.
- All `rounded-2xl`, `rounded-3xl`, `rounded-full`, and `rounded-lg` classes collapse to flat square corners.
- Submit/action buttons use neon green background with black text.
- Inputs use black background with green borders and green placeholder text.
- Scrollbar thumb is neon-tinted with square corners.
- Focus ring glows neon green.

---

### 4. Desert Sandstorm ✅

**ID:** `desert` · **Label:** Desert Sandstorm · **Default:** no

Warm earth tones evoking arid heat and dust — sunset oranges and deep terracotta.

| Property       | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| **Color**      | `#c97b3a` → `#7a3c1a` gradient body, cream-white text, amber accents      |
| **Typography** | Slightly heavier — `font-normal` body, wider letter-spacing on labels     |
| **Cards**      | `bg-orange-900/40` with `border-orange-400/20`, warm-tinted backdrop blur |
| **Corners**    | `rounded-2xl` unchanged                                                   |
| **Blur**       | Retained with warm tint                                                   |
| **Density**    | Medium — slightly larger tile padding to convey heat and space            |
| **Theme type** | Dark                                                                      |

**Design notes:**

- Body gradient runs `#c97b3a` → `#a05a28` → `#7a3c1a` at 170°.
- Card backgrounds should warm noticeably against the body.
- No CSS override block written yet — the dark body means white text classes remain readable without inversion, but card surfaces need warming.

---

### 5. Ocean Deep 🔲

**ID:** `ocean` · **Label:** Ocean Deep · **Default:** no

Rich blue-to-teal depths with bioluminescent cyan accents and fluid wave-like feel.

| Property       | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| **Color**      | `#0a1628` → `#0d3d56` body, `#22d3ee` (cyan-400) highlights, teal sidebar             |
| **Typography** | `font-extralight` display, `tracking-wide` uppercase labels in cyan                   |
| **Cards**      | `bg-cyan-950/60` with `border-cyan-400/15`, strong `backdrop-blur-2xl`, `rounded-3xl` |
| **Corners**    | Expanded to `rounded-3xl` for a fluid, immersive feel                                 |
| **Blur**       | Strong `backdrop-blur-2xl`                                                            |
| **Density**    | Medium-spacious                                                                       |
| **Theme type** | Dark                                                                                  |

**Design notes:**

- Accent color `#22d3ee` should tint label text, borders, and active states.
- Cards could use a subtle cyan glow via `box-shadow: 0 0 12px rgba(34,211,238,0.08)`.
- No CSS override block written yet.

---

### 6. Cherry Blossom 🔲

**ID:** `blossom` · **Label:** Cherry Blossom · **Default:** no

Soft Japanese spring palette — blush pinks, pale sakura whites, muted greens.

| Property       | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| **Color**      | `#fde8ef` → `#f0aec0` body (light), `#be185d` accent, grey-mauve sidebar         |
| **Typography** | `font-light` throughout; hero temp in `text-pink-900`                            |
| **Cards**      | `bg-white/70` frosted with `border-pink-200/50`, `rounded-3xl`, soft `shadow-md` |
| **Corners**    | `rounded-3xl` for soft, calm feel                                                |
| **Blur**       | Retained                                                                         |
| **Density**    | Spacious, generous padding                                                       |
| **Theme type** | **Light**                                                                        |

**Design notes:**

- The `[data-theme='blossom']` block in `index.css` currently only sets `color` on `body`. A full light-theme override (matching Arctic Haze's approach) still needs to be written.
- Text ink color should be `rgb(80 20 40)` — dark rose rather than neutral slate.
- Card surfaces need the same solid-white treatment as Arctic Haze.

---

### 7. Golden Hour 🔲

**ID:** `golden` · **Label:** Golden Hour · **Default:** no

Warm sunset photography palette — burnt gold, rose, and velvet dusk purple.

| Property       | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| **Color**      | `#1a0a1e` → `#3d1a08` gradient with `#f59e0b` gold and `#fb7185` rose accents |
| **Typography** | `font-extralight` hero, `text-amber-200` labels                               |
| **Cards**      | `bg-amber-950/50` with `border-amber-400/20`, warm blur, `rounded-2xl`        |
| **Corners**    | `rounded-2xl` unchanged                                                       |
| **Blur**       | Warm-tinted blur                                                              |
| **Density**    | Medium — cinematic without being cluttered                                    |
| **Theme type** | Dark                                                                          |

**Design notes:**

- Dim label text should shift toward amber/gold rather than neutral grey.
- No CSS override block written yet. Dark body means text is readable, but accent shifting needs implementation.

---

### 8. Storm Cell 🔲

**ID:** `storm` · **Label:** Storm Cell · **Default:** no

Threatening grey-green storm sky with electric yellow danger accents.

| Property       | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| **Color**      | `#1c2a1c` → `#141e14` dark olive body, `#d4f53c` (lime) accent, deep green sidebar |
| **Typography** | `font-semibold` display numerals, condensed label style                            |
| **Cards**      | `bg-green-950/60` with `border-lime-400/20`, moderate blur, `rounded-2xl`          |
| **Corners**    | `rounded-2xl` unchanged                                                            |
| **Blur**       | Moderate                                                                           |
| **Density**    | Compact — suggests urgency                                                         |
| **Theme type** | Dark                                                                               |

**Design notes:**

- Accent `#d4f53c` should be used for label text and active borders.
- No CSS override block written yet.

---

### 9. Neon Monsoon 🔲

**ID:** `neon` · **Label:** Neon Monsoon · **Default:** no

Rainy night in a neon-lit city — deep purple-black with electric magenta and cyan.

| Property       | Value                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------- |
| **Color**      | `#0f0520` body, dual neon `#e040fb` / `#40c8f4`, purple sidebar                          |
| **Typography** | `font-extralight` giant numerals, `text-fuchsia-300` labels                              |
| **Cards**      | Near-opaque `bg-purple-950/70` with glowing `border-fuchsia-400/30`, blur, `rounded-2xl` |
| **Corners**    | `rounded-2xl` unchanged                                                                  |
| **Blur**       | Retained — cards feel like glowing panels                                                |
| **Density**    | Medium with tighter gutter                                                               |
| **Theme type** | Dark                                                                                     |

**Design notes:**

- Dual-accent system: magenta for primary labels/headers, cyan for secondary values.
- A faint magenta `box-shadow` glow on cards would reinforce the neon-panel aesthetic.
- No CSS override block written yet.

---

## Proposed but not yet added

The following themes were discussed in the initial brainstorm but have not been added to `themes.ts`.

---

### High Alpine 📋

Clean mountain air — crisp whites and stone greys with a touch of glacier blue.

| Property       | Value                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| **Color**      | `#e8edf2` → `#d0dce8` body (light), `#1e3a5f` accent, white sidebar             |
| **Typography** | `font-light` with system serif stack (Georgia/Charter) for display, sans for UI |
| **Cards**      | `bg-white` solid, `border-slate-200`, no blur, `rounded-xl`, subtle `shadow`    |
| **Density**    | Airy and open — relaxed grid, large breathing room                              |
| **Theme type** | **Light**                                                                       |

**Implementation notes:** Light theme, requires full white-class inversion like Arctic Haze. Serif font stack adds complexity — needs a `font-family` cascade similar to Midnight Terminal but pointing at serif fonts.

---

### Volcanic Ash 📋

Dark charcoal + eruption orange — dramatic, high-contrast, bold headlines.

| Property       | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **Color**      | `#1a1209` body, `#f97316` (orange-500) accent, near-black sidebar           |
| **Typography** | `font-bold` 7xl hero temp, `uppercase tracking-widest` labels in orange     |
| **Cards**      | `bg-stone-900/80` with `border-orange-500/25`, no blur, hard square corners |
| **Density**    | Compact — dense grid with strong visual hierarchy                           |
| **Theme type** | Dark                                                                        |

---

### Paper & Ink 📋

Minimal flat newspaper layout — no gradients, no blur, pure ink-on-paper utility.

| Property       | Value                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| **Color**      | `#f5f0e8` warm paper body, `#1a1209` ink text, `#c8351a` accent red               |
| **Typography** | Serif display (Georgia / `ui-serif`) for hero and area name; sans-serif labels    |
| **Cards**      | Flat `bg-[#ede8de]` solid tiles, `border border-stone-300`, no blur, `rounded-sm` |
| **Density**    | High — tight grid like newspaper columns                                          |
| **Theme type** | **Light**                                                                         |

**Implementation notes:** Most complex light theme — requires both serif font cascade and full white-class inversion.

---

### Glacier Glass 📋

Hyper-translucent, ultra-minimal — nearly invisible cards, all content and no chrome.

| Property       | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| **Color**      | Pastel sky-to-ice gradient (`#c8e6f0` → `#e8f4fb`) body (light), `text-slate-800` content |
| **Typography** | `font-thin` — the thinnest available weights                                              |
| **Cards**      | `bg-white/20` with `border-white/30`, maximum `backdrop-blur-3xl`, `rounded-3xl`          |
| **Density**    | Very spacious — few tiles visible at once                                                 |
| **Theme type** | **Light**                                                                                 |

---

### Bioluminescent Night 📋

Dark sea-floor — black body with soft glowing teal and violet organic accents.

| Property       | Value                                                                   |
| -------------- | ----------------------------------------------------------------------- |
| **Color**      | `#020a10` body, `#0d9488` (teal-600) glow, `#7c3aed` (violet) secondary |
| **Typography** | `font-light` with `text-teal-300` numeric highlights                    |
| **Cards**      | `bg-teal-950/50` with `border-teal-400/20` + CSS `box-shadow` glow      |
| **Density**    | Medium — each tile feels like a deep-sea data panel                     |
| **Theme type** | Dark                                                                    |

---

### Retro Weather Map 📋

1980s TV weather broadcast — muted brown/beige with bold chunky type and iso-line accents.

| Property       | Value                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| **Color**      | `#2c1e14` body, `#c8a96e` gold-tan, `#4a8fe8` classic TV blue             |
| **Typography** | `font-bold` slab-serif (Georgia bold), `uppercase tracking-widest` labels |
| **Cards**      | `bg-stone-800/70` with `border-amber-700/30`, minimal blur, `rounded-lg`  |
| **Density**    | Medium-compact                                                            |
| **Theme type** | Dark                                                                      |

---

### Wildfire Smoke 📋

Eerie amber-grey haze of a smoke-filled sky — desaturated with unsettling orange cast.

| Property       | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| **Color**      | `#241408` → `#3d2a14` sepia gradient, `#d97706` amber accent    |
| **Typography** | `font-normal` (not ultra-light) for legibility through the haze |
| **Cards**      | `bg-orange-950/40` with `border-amber-600/20`, heavy blur       |
| **Density**    | Medium — oppressive but not cluttered                           |
| **Theme type** | Dark                                                            |

---

## Implementation checklist for remaining themes

When implementing a registered (`🔲`) or proposed (`📋`) theme:

1. **Dark theme** (Desert Sandstorm, Ocean Deep, Golden Hour, Storm Cell, Neon Monsoon, Volcanic Ash, Bioluminescent Night, Retro Weather Map, Wildfire Smoke):
   - Body and sidebar values are already in `themes.ts` for registered ones.
   - Write a `[data-theme='<id>']` block in `index.css`.
   - Shift muted `text-white/55–70` toward the accent color.
   - Adjust card `bg-white/*` values to match the surface tone.
   - Adjust border colors to use the accent hue.
   - Handle the ThemeSelector dropdown background if it clashes.

2. **Light theme** (Cherry Blossom, High Alpine, Paper & Ink, Glacier Glass):
   - Follow the Arctic Haze pattern exactly as the reference implementation.
   - Define an ink color (e.g. `rgb(80 20 40)` for blossom, `rgb(30 42 58)` for alpine).
   - Override all `text-white/*`, `bg-white/*`, `border-white/*`, `divide-white/*` alpha steps.
   - Replace translucent card backgrounds with solid white surfaces.
   - Invert the ThemeSelector dropdown to a white panel.
   - Invert the submit button pill to dark ink on white.
   - Adjust focus rings and scrollbar thumb.

3. **Font-changing themes** (Midnight Terminal pattern — Paper & Ink, Retro Weather Map, High Alpine):
   - Add `font-family` on `[data-theme='<id>'] body` and `[data-theme='<id>'] *`.
   - Verify monospace/serif renders correctly at all the font-weight steps used (`font-extralight`, `font-light`, `font-semibold`).
