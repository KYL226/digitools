# Task 8 — Image Tools

## Files built (all under `src/components/tools/`)

| File | Export | Notes |
|---|---|---|
| `image-compressor.tsx` | `ImageCompressor` | Quality slider 10-100 (default 80), format select (Keep original / JPEG / WebP / PNG), before/after side-by-side previews, size + reduction badge (green), DownloadButton. |
| `image-resizer.tsx` | `ImageResizer` | Numeric width/height inputs, lock-aspect Switch (default ON) with `Link2`/`Link2Off` icons, `lockRef`/`ratioRef` to avoid stale-state when recomputing the dependent dimension, live preview, DownloadButton. |
| `image-cropper.tsx` | `ImageCropper` | Custom interactive crop rectangle (pointer events + `setPointerCapture`), 5 aspect-ratio preset buttons (Free / 1:1 / 4:3 / 3:4 / 16:9), rotation slider -180..180, rule-of-thirds guides inside the rectangle, 4 corner resize handles, darkened overlay outside the selection, Crop button. On crop: draws to canvas with `ctx.rotate(rad)` + `ctx.translate` to produce rotated bounding box. |
| `image-converter.tsx` | `ImageConverter` | Target-format select (PNG/JPG/WebP), quality slider (only for JPG/WebP, default 90), before/after format + size, reduction badge. |
| `svg-optimizer.tsx` | `SvgOptimizer` | Two-column layout, regex-based optimizer (strips comments, XML decl, DOCTYPE, `<metadata>`, sodipodi/inkscape elements + namespaces, `id="..."` on non-`<svg>` tags, empty attributes, default values like `stroke="none"`/`fill="black"`/`opacity="1"`, collapses `>\s+<` and 2+ spaces). `Load example` button seeds a 16-line test SVG. |

## Verification

- `npx eslint src/components/tools/{image-compressor,image-resizer,image-cropper,image-converter,svg-optimizer}.tsx` → **0 errors, 0 warnings**.
- `npx tsc --noEmit --skipLibCheck` → 0 errors touching any of the 5 new files (only pre-existing & out-of-scope errors remain: `socket.io-client`/`socket.io` in `examples/`, `skills/image-edit` + `skills/stock-analysis-skill` typing, and missing-tool errors in `router.tsx` for color-converter/timestamp-converter/video-converter/video-compressor/audio-converter which are OUTSIDE this task).
- `dev.log` tail shows only `video-converter` "Module not found" errors — none of the 5 image tools appear in recent log entries.
- All 5 files start with `"use client"` and `export function <Name>`.

## Key technical decisions

1. **Canvas API only** — no external image libraries. `canvas.toBlob(callback, mime, quality/100)` is used everywhere; PNG ignores quality per spec.
2. **Object URL lifecycle** — every component creates `URL.createObjectURL` for the source preview and the output blob, and revokes the previous URL inside `setResult(prev => { if (prev) URL.revokeObjectURL(prev.url); return ...; })` plus a one-shot unmount `useEffect` cleanup.
3. **Next.js 16 `react-hooks/set-state-in-effect` rule compliance** — all derived-state recomputations are wrapped in `window.setTimeout(() => { ... }, 120)` so the `setState` calls happen inside the timeout callback rather than synchronously in the effect body. Early-return guards that previously called `setResult(null)` were replaced with simple `return`s (the synchronous-reset case is already covered by `handleReset`).
4. **Aspect-ratio math in `ImageCropper`** — crop rectangle is tracked in *normalized* coordinates `[0,1]×[0,1]` over the displayed image. `centeredRectForAspect()` accounts for the source's natural aspect ratio (`imageAspect = naturalWidth / naturalHeight`) so that a "1:1" preset produces a final pixel crop that is exactly 1:1 regardless of the source's shape — the *display-space* crop rect takes shape `ratio / imageAspect`. On crop, normalized coords are multiplied by `naturalWidth`/`naturalHeight` to get pixel coords, then drawn with `ctx.rotate` + appropriate `translate`s to land the rotated crop centered on the output canvas.
5. **Pointer events for crop interaction** — uses `onPointerDown`/`onPointerMove`/`onPointerUp` with `setPointerCapture`/`releasePointerCapture` (works for both mouse and touch). A `dragRef`/`dragStartRef` pair stores the active drag mode (`move` | `resize-nw/ne/sw/se`) and the initial pointer position + rect, then computes deltas relative to the image's `getBoundingClientRect()` to convert pixel deltas to normalized deltas.
6. **`SvgOptimizer` inline clear-on-empty** — replaced the initial `useEffect(() => { if (input.trim() === "") { setOutput(""); ... } }, [input])` (which triggered `react-hooks/set-state-in-effect`) with an `onInputChange()` handler invoked from the textarea's `onChange` and the "Load example" button, calling `setOutput("")` / `setError(null)` synchronously only when the input is empty.
7. **SVG optimizer safety** — post-optimization sanity check (`/<svg[\s>]/i` regex) rejects output that no longer looks like an SVG (e.g. malformed input).

## No packages installed

All 5 tools use only the existing stack: Canvas API, shadcn/ui components (Button, Input, Textarea, Label, Select, Slider, Switch, Badge, Separator), shared tool components (FileDropzone, CopyButton, DownloadButton, ResetButton, ClearButton, ErrorMessage, EmptyState, LoadingState), and `useI18n()` + sonner toast. No new npm packages were needed.

## No issues encountered

All 5 files compile, lint clean, type-check clean, and are wired correctly into the existing router (lines 28–32).
